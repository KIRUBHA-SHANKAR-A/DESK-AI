"""
Module 5 – Ticket Priority Prediction
──────────────────────────────────────
Predicts ticket priority (CRITICAL / HIGH / MEDIUM / LOW) and maps to
P1–P4 severity levels based on issue content analysis.

Uses a two-layer approach:
  1. Keyword urgency scoring
  2. Sentence-BERT similarity to known priority exemplars (when available)
"""
from __future__ import annotations

from typing import Dict, Any, List

from fastapi import APIRouter

from core.config import logger
from core.models import get_embedder
from schemas.schemas import TicketRequest
from utils.embeddings import compute_embedding

router = APIRouter(tags=["Priority Prediction"])


# ── Priority Keyword Rules ──────────────────────────────────────────────────

PRIORITY_RULES: List[Dict[str, Any]] = [
    {
        "priority": "CRITICAL",
        "severity": "P1",
        "keywords": [
            "server down", "system down", "outage", "data loss",
            "security breach", "ransomware", "production down",
            "critical", "emergency", "urgent", "all users affected",
            "service unavailable", "complete failure", "data breach",
        ],
        "base_confidence": 0.92,
    },
    {
        "priority": "HIGH",
        "severity": "P2",
        "keywords": [
            "cannot login", "cannot access", "network down", "email down",
            "vpn down", "not working", "blocked", "broken", "failed",
            "error", "multiple users", "department affected",
            "deadline", "time sensitive", "degraded performance",
        ],
        "base_confidence": 0.85,
    },
    {
        "priority": "LOW",
        "severity": "P4",
        "keywords": [
            "question", "how to", "request", "new", "setup", "training",
            "nice to have", "enhancement", "feature request", "cosmetic",
            "minor", "when possible", "low priority", "informational",
        ],
        "base_confidence": 0.80,
    },
]

# Known high-priority exemplar sentences for SBERT similarity boost
PRIORITY_EXEMPLARS = {
    "CRITICAL": [
        "Production server is completely down and all users are affected",
        "Critical security breach detected with data exfiltration",
        "Complete system outage affecting all business operations",
    ],
    "HIGH": [
        "Multiple users cannot login to the system since this morning",
        "Email service is down for the entire department",
        "VPN connection failing for remote workers blocking their tasks",
    ],
    "LOW": [
        "How do I change my desktop wallpaper",
        "Request for a new software license for a future project",
        "Can we add a nice-to-have feature to the internal dashboard",
    ],
}


def _keyword_priority(text: str) -> Dict[str, Any]:
    """Determine priority using keyword matching rules."""
    text_lower = text.lower()

    for rule in PRIORITY_RULES:
        matched = [kw for kw in rule["keywords"] if kw in text_lower]
        if matched:
            # Boost confidence slightly when multiple keywords match
            hit_ratio = len(matched) / len(rule["keywords"])
            confidence = min(0.98, rule["base_confidence"] + hit_ratio * 0.05)
            return {
                "priority": rule["priority"],
                "severity": rule["severity"],
                "confidence": round(confidence, 4),
                "matched_keywords": matched,
                "method": "keyword",
            }

    return {
        "priority": "MEDIUM",
        "severity": "P3",
        "confidence": 0.70,
        "matched_keywords": [],
        "method": "default",
    }


def _sbert_priority_boost(text: str, keyword_result: Dict[str, Any]) -> Dict[str, Any]:
    """Optional SBERT similarity boost against known priority exemplars.

    If the embedding is very close to a known priority exemplar that differs
    from the keyword result, we adjust confidence accordingly.
    """
    import numpy as np

    query_emb = compute_embedding(text)
    if query_emb is None:
        return keyword_result

    embedder = get_embedder()
    best_priority = keyword_result["priority"]
    best_sim = 0.0

    for priority, exemplars in PRIORITY_EXEMPLARS.items():
        exemplar_embs = embedder.encode(exemplars, normalize_embeddings=True)
        sims = np.dot(query_emb, exemplar_embs.T).flatten()
        max_sim = float(sims.max())
        if max_sim > best_sim:
            best_sim = max_sim
            best_priority = priority

    # Only override if SBERT match is strong and disagrees with keyword result
    if best_priority != keyword_result["priority"] and best_sim > 0.65:
        severity_map = {"CRITICAL": "P1", "HIGH": "P2", "MEDIUM": "P3", "LOW": "P4"}
        return {
            "priority": best_priority,
            "severity": severity_map.get(best_priority, "P3"),
            "confidence": round(best_sim, 4),
            "matched_keywords": keyword_result.get("matched_keywords", []),
            "method": "sbert_override",
        }

    # Strengthen confidence if SBERT agrees
    if best_priority == keyword_result["priority"] and best_sim > 0.5:
        boosted = min(0.98, keyword_result["confidence"] + 0.05)
        keyword_result["confidence"] = round(boosted, 4)
        keyword_result["method"] = "keyword+sbert"

    return keyword_result


import os
import joblib
import numpy as np

# Load custom trained Priority Predictor model if available
CUSTOM_PRIORITY_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "custom_priority_model.joblib")
_custom_priority_pipeline = None

def get_custom_priority_model():
    global _custom_priority_pipeline
    if _custom_priority_pipeline is None and os.path.exists(CUSTOM_PRIORITY_PATH):
        try:
            _custom_priority_pipeline = joblib.load(CUSTOM_PRIORITY_PATH)
            logger.info("Custom ML Priority Predictor model loaded from: %s", CUSTOM_PRIORITY_PATH)
        except Exception as e:
            logger.warning("Failed to load custom priority model: %s", e)
    return _custom_priority_pipeline


# ── API Endpoint ────────────────────────────────────────────────────────────

@router.post("/predict-priority")
async def predict_priority(request: TicketRequest):
    """Predict ticket priority (CRITICAL/HIGH/MEDIUM/LOW → P1–P4).

    Uses trained ML model if available, falling back to keyword and SBERT analysis.
    """
    text = f"{request.title} {request.description}".strip()
    severity_map = {"CRITICAL": "P1", "HIGH": "P2", "MEDIUM": "P3", "LOW": "P4"}

    # Step 1: Try Custom ML Model (trained on Helpdesk dataset)
    p_clf = get_custom_priority_model()
    if p_clf is not None:
        try:
            probs = p_clf.predict_proba([text])[0]
            classes = p_clf.classes_
            best_idx = int(np.argmax(probs))
            predicted_priority = str(classes[best_idx]).upper()
            confidence = round(float(probs[best_idx]), 4)

            logger.info(
                "Custom ML Priority Prediction: '%s...' → %s (confidence=%.4f)",
                text[:50], predicted_priority, confidence,
            )
            return {
                "priority": predicted_priority,
                "severity": severity_map.get(predicted_priority, "P3"),
                "confidence": max(0.50, confidence),
                "method": "trained_ml_model",
            }
        except Exception as e:
            logger.warning("Custom ML priority prediction failed: %s", e)

    # Step 2: keyword-based prediction
    result = _keyword_priority(text)

    # Step 3: SBERT similarity boost (if model is available)
    if get_embedder() is not None:
        try:
            result = _sbert_priority_boost(text, result)
        except Exception as e:
            logger.warning("SBERT priority boost failed: %s", e)

    logger.info(
        "Priority prediction: '%s...' → %s (%s) confidence=%.4f method=%s",
        text[:50], result["priority"], result["severity"],
        result["confidence"], result["method"],
    )
    return result

