"""
Module 2 – Duplicate Ticket Detection (Sentence-BERT Similarity)
────────────────────────────────────────────────────────────────
Indexes existing tickets into FAISS and finds semantically similar
duplicates for incoming tickets using cosine similarity.
"""
from __future__ import annotations

import time
from typing import List, Dict, Any

import numpy as np
from fastapi import APIRouter, HTTPException

from core.config import (
    logger, DUPLICATE_SIMILARITY_THRESHOLD, TOP_K_RESULTS,
)
from core.models import get_embedder
from schemas.schemas import TicketRequest, IndexTicketsRequest
from utils.embeddings import (
    compute_embedding, compute_embeddings_batch,
    build_faiss_index, search_faiss_index,
)

router = APIRouter(tags=["Duplicate Detection"])

# ── Module State ────────────────────────────────────────────────────────────
ticket_index = None
ticket_data: List[Dict[str, Any]] = []


def get_ticket_index_info() -> Dict[str, Any]:
    """Return current index stats (used by health endpoint)."""
    return {"tickets_indexed": len(ticket_data)}


# ── API Endpoints ───────────────────────────────────────────────────────────

@router.post("/duplicate-check")
async def check_duplicates(request: TicketRequest):
    """Check for semantically similar existing tickets using FAISS."""
    global ticket_index, ticket_data

    text = f"{request.title} {request.description}".strip()

    if get_embedder() is None or ticket_index is None or len(ticket_data) == 0:
        logger.info("Duplicate check: no index available or embedder not loaded")
        return []

    try:
        query_embedding = compute_embedding(text)
        if query_embedding is None:
            return []

        results = search_faiss_index(
            index=ticket_index,
            query_embedding=query_embedding,
            data=ticket_data,
            k=TOP_K_RESULTS,
            threshold=DUPLICATE_SIMILARITY_THRESHOLD,
            result_fields=["id", "title", "status", "resolution"],
        )

        logger.info(
            "Duplicate check for '%s...' → %d similar tickets found",
            text[:50], len(results),
        )
        return results

    except Exception as e:
        logger.error("Duplicate check failed: %s", e)
        return []


@router.post("/index-tickets")
async def index_tickets(request: IndexTicketsRequest):
    """Build / rebuild the FAISS index for existing tickets."""
    global ticket_index, ticket_data

    if get_embedder() is None:
        raise HTTPException(status_code=503, detail="Sentence-BERT model not loaded")

    try:
        start_time = time.time()
        ticket_data = [t.dict() for t in request.tickets]

        if len(ticket_data) == 0:
            ticket_index = None
            return {"status": "ok", "indexed": 0}

        texts = [
            f"{t['title']} {t.get('description', '')}".strip()
            for t in ticket_data
        ]
        embeddings = compute_embeddings_batch(texts)
        if embeddings is None:
            raise HTTPException(status_code=503, detail="Embedding computation failed")

        ticket_index = build_faiss_index(embeddings)
        elapsed = round(time.time() - start_time, 2)

        logger.info("Indexed %d tickets in %.2fs", len(ticket_data), elapsed)
        return {"status": "ok", "indexed": len(ticket_data), "time_seconds": elapsed}

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Ticket indexing failed: %s", e)
        raise HTTPException(status_code=500, detail=str(e))
