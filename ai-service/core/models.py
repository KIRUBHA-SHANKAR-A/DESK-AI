"""
Shared ML model loading and lifecycle management.

Models are loaded once at startup and shared across all modules via this
singleton-style module.  Every module imports from here instead of loading
its own copy.
"""
from __future__ import annotations

from core.config import logger, SBERT_MODEL_NAME, CLASSIFIER_MODEL_NAME

# ── Global Model References ─────────────────────────────────────────────────
classifier = None
embedder = None


def load_models() -> None:
    """Load ML models at startup.  Graceful fallback if unavailable."""
    global classifier, embedder

    # Sentence-BERT (embeddings for similarity search)
    try:
        logger.info("Loading Sentence-BERT model (%s)...", SBERT_MODEL_NAME)
        from sentence_transformers import SentenceTransformer
        embedder = SentenceTransformer(SBERT_MODEL_NAME)
        logger.info("Sentence-BERT model loaded successfully.")
    except Exception as e:
        logger.warning("Failed to load Sentence-BERT: %s. Embeddings will be unavailable.", e)
        embedder = None

    # Zero-shot classifier (optional fallback, Sentence-BERT is primary)
    classifier = None
    try:
        if CLASSIFIER_MODEL_NAME and CLASSIFIER_MODEL_NAME != "none":
            logger.info("Sentence-BERT semantic classifier is active.")
    except Exception as e:
        logger.warning("Classifier initialization note: %s", e)
        classifier = None


def get_embedder():
    """Return the Sentence-BERT embedder (may be None)."""
    return embedder


def get_classifier():
    """Return the zero-shot classifier pipeline (may be None)."""
    return classifier
