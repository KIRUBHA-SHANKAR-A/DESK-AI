"""
DESK AI – AI Service
────────────────────
Thin FastAPI entry point that wires together all feature modules.

Modules:
  1. classifier           – Zero-shot ticket classification
  2. duplicate_detector    – Sentence-BERT duplicate detection
  3. kb_recommender        – Knowledge Base article recommendation
  4. kb_generator          – Auto KB generation from recurring tickets
  5. priority_predictor    – Ticket priority prediction (P1–P4)
  6. sla_predictor         – SLA breach risk prediction
  7. channel_ingestion     – Multi-channel unified ticket ingestion
"""
from fastapi import FastAPI

from core.config import logger
from core.models import load_models, get_classifier, get_embedder

# ── Module routers ──────────────────────────────────────────────────────────
from modules.classifier import router as classifier_router
from modules.duplicate_detector import (
    router as duplicate_router,
    get_ticket_index_info,
)
from modules.kb_recommender import (
    router as kb_router,
    get_kb_index_info,
)
from modules.kb_generator import router as kb_gen_router
from modules.priority_predictor import router as priority_router
from modules.sla_predictor import router as sla_router
from modules.channel_ingestion import router as channel_router

# ── App ─────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="DESK AI – AI Service",
    description="Modular AI backend for intelligent IT helpdesk operations",
    version="2.0.0",
)

# Register all module routers
app.include_router(classifier_router)
app.include_router(duplicate_router)
app.include_router(kb_router)
app.include_router(kb_gen_router)
app.include_router(priority_router)
app.include_router(sla_router)
app.include_router(channel_router)


# ── Lifecycle ───────────────────────────────────────────────────────────────

@app.on_event("startup")
async def startup_event():
    load_models()
    logger.info("All module routers registered. AI Service is ready.")


# ── Health ──────────────────────────────────────────────────────────────────

@app.get("/health")
async def health_check():
    """Aggregate health from all modules."""
    info = {
        "status": "healthy",
        "classifier_loaded": get_classifier() is not None,
        "embedder_loaded": get_embedder() is not None,
    }
    info.update(get_ticket_index_info())
    info.update(get_kb_index_info())
    return info


# ── Entry Point ─────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
