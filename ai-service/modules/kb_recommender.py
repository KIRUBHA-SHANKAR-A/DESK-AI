"""
Module 3 – Knowledge Base Recommendation
─────────────────────────────────────────
Suggests relevant KB articles before the user creates a new ticket, using
semantic similarity between the issue description and indexed articles.
"""
from __future__ import annotations

import time
from typing import List, Dict, Any

from fastapi import APIRouter, HTTPException

from core.config import logger, KB_SIMILARITY_THRESHOLD, TOP_K_RESULTS
from core.models import get_embedder
from schemas.schemas import TicketRequest, IndexKBRequest
from utils.embeddings import (
    compute_embedding, compute_embeddings_batch,
    build_faiss_index, search_faiss_index,
)

router = APIRouter(tags=["KB Recommendation"])

# ── Module State ────────────────────────────────────────────────────────────
kb_index = None
kb_data: List[Dict[str, Any]] = []


def get_kb_index_info() -> Dict[str, Any]:
    """Return current index stats (used by health endpoint)."""
    return {"kb_articles_indexed": len(kb_data)}


# ── API Endpoints ───────────────────────────────────────────────────────────

@router.post("/recommend-kb")
async def recommend_kb(request: TicketRequest):
    """Recommend relevant Knowledge Base articles using semantic similarity."""
    global kb_index, kb_data

    text = f"{request.title} {request.description}".strip()

    if get_embedder() is None or kb_index is None or len(kb_data) == 0:
        logger.info("KB recommendation: no index available or embedder not loaded")
        return []

    try:
        query_embedding = compute_embedding(text)
        if query_embedding is None:
            return []

        results = search_faiss_index(
            index=kb_index,
            query_embedding=query_embedding,
            data=kb_data,
            k=TOP_K_RESULTS,
            threshold=KB_SIMILARITY_THRESHOLD,
            result_fields=["id", "title", "summary"],
        )

        logger.info(
            "KB recommendation for '%s...' → %d articles found",
            text[:50], len(results),
        )
        return results

    except Exception as e:
        logger.error("KB recommendation failed: %s", e)
        return []


@router.post("/index-kb")
async def index_kb(request: IndexKBRequest):
    """Build / rebuild the FAISS index for Knowledge Base articles."""
    global kb_index, kb_data

    if get_embedder() is None:
        raise HTTPException(status_code=503, detail="Sentence-BERT model not loaded")

    try:
        start_time = time.time()
        kb_data = [a.dict() for a in request.articles]

        if len(kb_data) == 0:
            kb_index = None
            return {"status": "ok", "indexed": 0}

        texts = [
            f"{a['title']} {a.get('summary', '')} {a.get('content', '')}".strip()
            for a in kb_data
        ]
        embeddings = compute_embeddings_batch(texts)
        if embeddings is None:
            raise HTTPException(status_code=503, detail="Embedding computation failed")

        kb_index = build_faiss_index(embeddings)
        elapsed = round(time.time() - start_time, 2)

        logger.info("Indexed %d KB articles in %.2fs", len(kb_data), elapsed)
        return {"status": "ok", "indexed": len(kb_data), "time_seconds": elapsed}

    except HTTPException:
        raise
    except Exception as e:
        logger.error("KB indexing failed: %s", e)
        raise HTTPException(status_code=500, detail=str(e))
