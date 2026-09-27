"""
Shared embedding computation and FAISS index helpers.

Every module that needs vector search imports from here instead of
reimplementing FAISS logic.
"""
from __future__ import annotations

from typing import Optional, List, Dict, Any
import numpy as np

from core.config import logger
from core.models import get_embedder


def compute_embedding(text: str) -> Optional[np.ndarray]:
    """Compute a single embedding using Sentence-BERT.

    Returns a (1, dim) float32 array, or None if the model is unavailable.
    """
    embedder = get_embedder()
    if embedder is None:
        return None
    try:
        embedding = embedder.encode([text], normalize_embeddings=True)
        return np.array(embedding).astype("float32")
    except Exception as e:
        logger.error("Embedding computation failed: %s", e)
        return None


def compute_embeddings_batch(texts: List[str]) -> Optional[np.ndarray]:
    """Compute embeddings for a batch of texts.

    Returns an (N, dim) float32 array, or None if the model is unavailable.
    """
    embedder = get_embedder()
    if embedder is None:
        return None
    try:
        embeddings = embedder.encode(
            texts, normalize_embeddings=True, show_progress_bar=False,
        )
        return np.array(embeddings).astype("float32")
    except Exception as e:
        logger.error("Batch embedding computation failed: %s", e)
        return None


def build_faiss_index(embeddings: np.ndarray):
    """Build a FAISS inner-product index (cosine similarity for normalized vectors)."""
    import faiss
    dim = embeddings.shape[1]
    index = faiss.IndexFlatIP(dim)
    index.add(embeddings)
    return index


def search_faiss_index(
    index,
    query_embedding: np.ndarray,
    data: List[Dict[str, Any]],
    k: int = 5,
    threshold: float = 0.2,
    result_fields: Optional[List[str]] = None,
) -> List[Dict[str, Any]]:
    """Run a similarity search against a FAISS index and return filtered results.

    Args:
        index:           FAISS index to search.
        query_embedding: (1, dim) query vector.
        data:            List of dicts aligned with the index rows.
        k:               Max number of results.
        threshold:       Minimum cosine similarity to include.
        result_fields:   Which keys to include from each data dict.
                         If None, all keys are returned.

    Returns:
        List of result dicts sorted by descending similarity.
    """
    if index is None or len(data) == 0:
        return []

    k = min(k, len(data))
    scores, indices = index.search(query_embedding, k)

    results = []
    for score, idx in zip(scores[0], indices[0]):
        if idx < 0 or idx >= len(data):
            continue
        similarity = float(score)
        if similarity < threshold:
            continue

        item = data[idx]
        if result_fields:
            entry = {f: item.get(f, "") for f in result_fields}
        else:
            entry = dict(item)
        entry["similarity"] = round(similarity, 4)
        results.append(entry)

    results.sort(key=lambda x: x["similarity"], reverse=True)
    return results
