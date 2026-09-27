"""
Module 4 – Auto Knowledge Base Generation
──────────────────────────────────────────
Clusters frequently occurring resolved tickets by semantic similarity and
generates FAQ / knowledge articles from each cluster automatically.
"""
from __future__ import annotations

from typing import List, Dict, Any
from collections import Counter

import numpy as np
from fastapi import APIRouter, HTTPException

from core.config import (
    logger, KB_CLUSTER_MIN_SIZE, KB_CLUSTER_SIMILARITY,
)
from core.models import get_embedder
from schemas.schemas import KBGenerationRequest
from utils.embeddings import compute_embeddings_batch

router = APIRouter(tags=["Auto KB Generation"])


# ── Clustering Helper ───────────────────────────────────────────────────────

def _cluster_tickets(
    embeddings: np.ndarray,
    tickets: List[Dict[str, Any]],
    similarity_threshold: float,
    min_cluster_size: int,
) -> List[List[Dict[str, Any]]]:
    """Group tickets into clusters using greedy cosine-similarity merging.

    Each ticket is assigned to the first cluster whose centroid is within
    `similarity_threshold`.  If none match, a new cluster is created.
    Only clusters with at least `min_cluster_size` members are returned.
    """
    clusters: List[List[int]] = []
    centroids: List[np.ndarray] = []

    for i in range(len(embeddings)):
        vec = embeddings[i]
        placed = False

        for ci, centroid in enumerate(centroids):
            sim = float(np.dot(vec, centroid))
            if sim >= similarity_threshold:
                clusters[ci].append(i)
                # Update centroid as running mean (stays normalized enough)
                centroids[ci] = (centroid * (len(clusters[ci]) - 1) + vec) / len(clusters[ci])
                centroids[ci] /= np.linalg.norm(centroids[ci])
                placed = True
                break

        if not placed:
            clusters.append([i])
            centroids.append(vec.copy())

    # Filter to clusters meeting minimum size
    valid_clusters = []
    for group in clusters:
        if len(group) >= min_cluster_size:
            valid_clusters.append([tickets[idx] for idx in group])

    return valid_clusters


def _generate_article_from_cluster(cluster: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Synthesize a KB article from a cluster of similar resolved tickets.

    Picks the most common resolution, builds a composite title, and
    compiles a summary from the cluster members.
    """
    # Most common resolution
    resolutions = [
        t.get("resolution", "").strip()
        for t in cluster
        if t.get("resolution", "").strip()
    ]
    resolution_counts = Counter(resolutions)
    best_resolution = resolution_counts.most_common(1)[0][0] if resolution_counts else "See related tickets."

    # Composite title from the most representative ticket (first in cluster)
    representative = cluster[0]
    title = f"FAQ: {representative['title']}"

    # Build content body
    ticket_summaries = []
    for t in cluster[:10]:  # cap at 10 examples
        desc = t.get("description", "")[:200]
        ticket_summaries.append(f"• [{t.get('id', '?')}] {t['title']}: {desc}")

    content = (
        f"## Problem\n\n"
        f"Multiple users have reported issues similar to: **{representative['title']}**\n\n"
        f"This issue has occurred {len(cluster)} times.\n\n"
        f"## Related Tickets\n\n"
        + "\n".join(ticket_summaries)
        + f"\n\n## Recommended Solution\n\n{best_resolution}"
    )

    summary = (
        f"Auto-generated article from {len(cluster)} similar resolved tickets. "
        f"Resolution: {best_resolution[:150]}"
    )

    return {
        "title": title,
        "content": content,
        "summary": summary,
        "source_ticket_count": len(cluster),
        "source_ticket_ids": [t.get("id") for t in cluster],
    }


# ── API Endpoint ────────────────────────────────────────────────────────────

@router.post("/generate-kb")
async def generate_kb_articles(request: KBGenerationRequest):
    """Analyze resolved tickets, cluster by similarity, and generate KB articles.

    Accepts a list of resolved tickets and returns auto-generated knowledge
    base articles for frequently recurring issues.
    """
    if get_embedder() is None:
        raise HTTPException(status_code=503, detail="Sentence-BERT model not loaded")

    tickets = [t.dict() for t in request.tickets]

    # Filter to resolved tickets only
    resolved = [
        t for t in tickets
        if t.get("status", "").upper() in ("RESOLVED", "CLOSED")
        and t.get("resolution", "").strip()
    ]

    if len(resolved) < request.min_cluster_size:
        return {
            "status": "ok",
            "articles": [],
            "message": f"Not enough resolved tickets ({len(resolved)}) to form clusters "
                       f"(min_cluster_size={request.min_cluster_size})",
        }

    # Compute embeddings
    texts = [
        f"{t['title']} {t.get('description', '')}".strip()
        for t in resolved
    ]
    embeddings = compute_embeddings_batch(texts)
    if embeddings is None:
        raise HTTPException(status_code=503, detail="Embedding computation failed")

    # Cluster
    clusters = _cluster_tickets(
        embeddings, resolved,
        similarity_threshold=KB_CLUSTER_SIMILARITY,
        min_cluster_size=request.min_cluster_size,
    )

    # Generate articles
    articles = [_generate_article_from_cluster(c) for c in clusters]

    logger.info(
        "Auto KB generation: %d resolved tickets → %d clusters → %d articles",
        len(resolved), len(clusters), len(articles),
    )

    return {
        "status": "ok",
        "articles": articles,
        "clusters_found": len(clusters),
        "resolved_tickets_analyzed": len(resolved),
    }
