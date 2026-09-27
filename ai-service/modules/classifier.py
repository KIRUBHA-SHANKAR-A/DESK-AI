"""
Module 1 – Ticket Classification & Department Routing via Sentence-BERT
────────────────────────────────────────────────────────────────────────
Uses Sentence-BERT (all-MiniLM-L6-v2) semantic embeddings to understand
incoming tickets and route them to the correct support team department:
  • Human Resources
  • Finance
  • Sales
  • Marketing
  • Administration
  • Information Technology
  • Operations
  • Customer Support
"""
from __future__ import annotations

from typing import Dict, Any, List
import numpy as np
from fastapi import APIRouter

from core.config import logger, CATEGORIES
from core.models import get_embedder
from schemas.schemas import TicketRequest
from utils.embeddings import compute_embedding

router = APIRouter(tags=["Classification"])


# ── Support Team Prototypes for Sentence-BERT Semantic Matching ────────────────

DEPARTMENT_PROTOTYPES: Dict[str, List[str]] = {
    "IT Support": [
        "Computer hardware issues, general IT helpdesk request, password resets, account lock, SSO login issue, access permissions, general IT help.",
        "General IT helpdesk request, password reset, account lock, or software access issue.",
    ],
    "Hardware Support": [
        "Laptop not turning on, monitor screen flickering, keyboard keys stuck, mouse cursor not moving, hard drive clicking, printer paper jam, physical device damage.",
        "Broken laptop screen, keyboard replacement, mouse faulty, or monitor display issue.",
    ],
    "Software Support": [
        "Software crashes, application error messages, Excel freezing, Teams video call lag, PDF reader error, license activation issue, software bug.",
        "Software application crash, license key invalid, or application privilege request.",
    ],
    "Network Support": [
        "Router issues, LAN connectivity, Wi-Fi dropping, network switch configuration, DNS errors, IP address conflict, ethernet cable failure, firewall routing.",
        "Cannot connect to corporate Wi-Fi or VPN, network outage, or slow network browsing speed.",
    ],
    "Database Support": [
        "Database connection timeout, PostgreSQL deadlock error, MySQL access denied, SQL query optimization, database disk space full, DB backup restore.",
        "Database connection failed, query execution slow, or database privilege issue.",
    ],
    "Server Support": [
        "Server downtime, Linux high CPU alert, Windows Server BSOD, Docker container crashing, Nginx 502 bad gateway, cloud VM storage low.",
        "Server reboot, cloud infrastructure failure, or web server gateway error.",
    ],
    "Email Support": [
        "Outlook setup, mailbox full error, spam email filtering, email delivery failures, email exchange server issue.",
        "Mailbox full, receiving spam emails, or Outlook email access issue.",
    ],
    "Security Support": [
        "Suspicious login attempt, spam emails received, phishing attempt, malware alert, ransomware, security policy violation, unauthorized access.",
        "Mailbox receiving spam, security breach warning, or suspicious email attachment.",
    ],
}


# Cache for pre-computed Department Embeddings
_dept_embeddings_cache: Dict[str, np.ndarray] = {}


def _get_department_embeddings() -> Dict[str, np.ndarray]:
    """Compute and cache Sentence-BERT embeddings for each support department prototype."""
    global _dept_embeddings_cache
    embedder = get_embedder()
    if embedder is None:
        return {}

    if not _dept_embeddings_cache:
        try:
            for dept, prototypes in DEPARTMENT_PROTOTYPES.items():
                # Compute normalized embedding for prototype text
                embs = embedder.encode(prototypes, normalize_embeddings=True)
                # Take average vector across prototype sentences and normalize
                avg_emb = np.mean(embs, axis=0)
                avg_emb = avg_emb / np.linalg.norm(avg_emb)
                _dept_embeddings_cache[dept] = avg_emb.astype("float32")
        except Exception as e:
            logger.error("Failed to pre-compute department Sentence-BERT embeddings: %s", e)
            return {}

    return _dept_embeddings_cache


# ── Keyword Fallback ────────────────────────────────────────────────────────

KEYWORD_MAP: Dict[str, list] = {
    "Email Support": ["email", "mailbox", "outlook", "spam", "inbox", "mail", "exchange", "delivery"],
    "Hardware Support": ["hardware", "laptop", "keyboard", "mouse", "monitor", "display", "screen", "printer", "hard drive", "disk"],
    "Network Support": ["network", "wifi", "vpn", "lan", "router", "ethernet", "ip address", "connectivity", "internet"],
    "Database Support": ["database", "sql", "postgresql", "mysql", "oracle", "db", "query", "deadlock", "backup"],
    "Security Support": ["security", "virus", "malware", "firewall", "phishing", "breach", "suspicious", "antivirus", "policy violation"],
    "Software Support": ["software", "application", "app", "excel", "teams", "pdf", "install", "license", "update", "browser"],
    "Server Support": ["server", "linux", "windows server", "docker", "nginx", "apache", "cloud", "aws", "azure", "vm"],
    "IT Support": ["access", "password", "reset", "login", "permission", "sso", "authentication", "account locked", "helpdesk"],
}



def keyword_classify(text: str) -> Dict[str, Any]:
    """Fallback keyword-based classification when ML model is unavailable."""
    text_lower = text.lower()

    scores: Dict[str, int] = {}
    for category, keywords in KEYWORD_MAP.items():
        score = sum(1 for kw in keywords if kw in text_lower)
        if score > 0:
            scores[category] = score

    if not scores:
        return {"category": "IT Support", "confidence": 0.40, "method": "default"}

    best_category = max(scores, key=scores.get)
    total_keywords = sum(scores.values())
    confidence = min(0.95, 0.50 + (scores[best_category] / max(total_keywords, 1)) * 0.45)

    return {"category": best_category, "confidence": round(confidence, 4), "method": "keyword"}


import os
import joblib

# Load custom trained ML Classifier model if available
CUSTOM_CLASSIFIER_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "custom_classifier.joblib")
_custom_classifier_pipeline = None

def get_custom_classifier():
    global _custom_classifier_pipeline
    if os.path.exists(CUSTOM_CLASSIFIER_PATH):
        try:
            _custom_classifier_pipeline = joblib.load(CUSTOM_CLASSIFIER_PATH)
            logger.info("Custom ML Ticket Classifier model loaded from: %s", CUSTOM_CLASSIFIER_PATH)
        except Exception as e:
            logger.warning("Failed to load custom ML classifier: %s", e)
    return _custom_classifier_pipeline



# ── Sentence-BERT Classifier Endpoint ───────────────────────────────────────

@router.post("/classify")
async def classify_ticket(request: TicketRequest):
    """Classify and route ticket to support team/department using ML model or Sentence-BERT."""
    text = f"{request.title} {request.description}".strip()

    # Step 1: Try Custom ML Model (trained on Helpdesk dataset)
    clf = get_custom_classifier()
    if clf is not None:
        try:
            probs = clf.predict_proba([text])[0]
            classes = clf.classes_
            best_idx = int(np.argmax(probs))
            predicted_label = classes[best_idx]
            confidence = round(float(probs[best_idx]), 4)

            # Extract category and team from combined label "Category | Team"
            if " | " in predicted_label:
                cat, team = predicted_label.split(" | ", 1)
            else:
                cat, team = predicted_label, "IT Support"

            logger.info(
                "Custom ML Classification: '%s...' → Category: %s | Team: %s (confidence=%.4f)",
                text[:50], cat, team, confidence,
            )
            return {
                "category": cat,
                "team": team,
                "confidence": max(0.50, confidence),
                "method": "trained_ml_model",
            }
        except Exception as e:
            logger.warning("Custom ML classification failed: %s", e)

    # Step 2: Try Sentence-BERT Semantic Classification
    dept_embs = _get_department_embeddings()
    query_emb = compute_embedding(text)

    if query_emb is not None and dept_embs:
        try:
            best_dept = "Information Technology"
            best_sim = -1.0

            # Calculate cosine similarity with each support department embedding
            for dept, dept_vector in dept_embs.items():
                sim = float(np.dot(query_emb[0], dept_vector))
                if sim > best_sim:
                    best_sim = sim
                    best_dept = dept

            # Map raw cosine similarity score to a confidence score (0.50 - 0.98)
            confidence = min(0.98, max(0.50, round((best_sim + 1) / 2, 4)))

            logger.info(
                "Sentence-BERT classification: '%s...' → %s (similarity=%.4f, confidence=%.4f)",
                text[:50], best_dept, best_sim, confidence,
            )
            return {
                "category": best_dept,
                "team": best_dept,
                "confidence": confidence,
                "similarity_score": round(best_sim, 4),
                "method": "sentence-bert",
            }
        except Exception as e:
            logger.warning("Sentence-BERT classification failed, falling back to keyword: %s", e)

    # Step 3: Fallback to keyword matching if Sentence-BERT is unavailable
    result = keyword_classify(text)
    result["team"] = result.get("category", "IT Support")
    logger.info("Keyword classification: '%s...' → %s (%.4f)", text[:50], result["category"], result["confidence"])
    return result

