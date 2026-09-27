"""
Module 7 – Multi-Channel Unified Ticket Ingestion
──────────────────────────────────────────────────
Accepts messages from multiple channels (email, chatbot, API, portal) and
normalizes them into a unified ticket format with automatic classification,
priority prediction, duplicate detection, and KB recommendation.
"""
from __future__ import annotations

import re
import hashlib
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional

from fastapi import APIRouter

from core.config import logger
from schemas.schemas import ChannelIngestionRequest, ChannelTicket

router = APIRouter(tags=["Multi-Channel Ingestion"])


# ── Channel-Specific Parsers ────────────────────────────────────────────────

def _parse_email(msg: ChannelTicket) -> Dict[str, Any]:
    """Extract ticket fields from an email message."""
    subject = msg.subject or ""
    body = msg.body or ""

    # Attempt to strip common email reply prefixes
    clean_body = re.sub(r"(?i)^(re:|fw:|fwd:)\s*", "", body).strip()

    # Extract sender name from email address
    sender = msg.sender or "unknown"
    sender_name = sender.split("@")[0].replace(".", " ").title() if "@" in sender else sender

    return {
        "title": subject if subject else clean_body[:80],
        "description": clean_body,
        "reporter_name": sender_name,
        "reporter_email": msg.sender,
    }


def _parse_chat(msg: ChannelTicket) -> Dict[str, Any]:
    """Extract ticket fields from a chatbot conversation."""
    body = msg.body or ""

    # For chat, first line is often the issue summary
    lines = body.strip().split("\n")
    title = lines[0][:100] if lines else "Chat support request"
    description = body

    return {
        "title": title,
        "description": description,
        "reporter_name": msg.sender or "Chat User",
        "reporter_email": None,
    }


def _parse_api(msg: ChannelTicket) -> Dict[str, Any]:
    """Extract ticket fields from a direct API submission."""
    return {
        "title": msg.subject or msg.body[:80],
        "description": msg.body,
        "reporter_name": msg.sender or "API Client",
        "reporter_email": None,
    }


def _parse_portal(msg: ChannelTicket) -> Dict[str, Any]:
    """Extract ticket fields from a self-service portal submission."""
    return {
        "title": msg.subject or msg.body[:80],
        "description": msg.body,
        "reporter_name": msg.sender or "Portal User",
        "reporter_email": msg.metadata.get("email") if msg.metadata else None,
    }


CHANNEL_PARSERS = {
    "email": _parse_email,
    "chat": _parse_chat,
    "api": _parse_api,
    "portal": _parse_portal,
}


def _generate_dedup_key(source: str, sender: Optional[str], title: str) -> str:
    """Generate a deterministic dedup key to avoid processing the same message twice."""
    raw = f"{source}|{sender or ''}|{title}".lower()
    return hashlib.sha256(raw.encode()).hexdigest()[:16]


def _normalize_message(msg: ChannelTicket) -> Dict[str, Any]:
    """Normalize a channel message into a unified ticket dict."""
    parser = CHANNEL_PARSERS.get(msg.source.lower(), _parse_api)
    parsed = parser(msg)

    timestamp = msg.timestamp or datetime.now(timezone.utc).isoformat()

    return {
        "source_channel": msg.source.lower(),
        "title": parsed["title"],
        "description": parsed["description"],
        "reporter_name": parsed.get("reporter_name"),
        "reporter_email": parsed.get("reporter_email"),
        "received_at": timestamp,
        "dedup_key": _generate_dedup_key(
            msg.source, msg.sender, parsed["title"],
        ),
        "raw_metadata": msg.metadata,
    }


# ── API Endpoint ────────────────────────────────────────────────────────────

@router.post("/ingest")
async def ingest_messages(request: ChannelIngestionRequest):
    """Ingest messages from multiple channels and normalize into tickets.

    The endpoint:
      1. Parses each message according to its source channel
      2. Normalizes into a unified ticket format
      3. Deduplicates by content hash
      4. Returns normalized tickets ready for creation in the backend

    The Java backend can then call /classify, /predict-priority,
    /duplicate-check, and /recommend-kb on each normalized ticket.
    """
    seen_keys: set = set()
    normalized: List[Dict[str, Any]] = []
    duplicates_skipped = 0

    for msg in request.messages:
        try:
            ticket = _normalize_message(msg)

            # Skip duplicates within this batch
            if ticket["dedup_key"] in seen_keys:
                duplicates_skipped += 1
                continue
            seen_keys.add(ticket["dedup_key"])

            normalized.append(ticket)

        except Exception as e:
            logger.warning(
                "Failed to parse message from channel '%s': %s",
                msg.source, e,
            )
            continue

    # Channel breakdown for logging
    channel_counts: Dict[str, int] = {}
    for t in normalized:
        ch = t["source_channel"]
        channel_counts[ch] = channel_counts.get(ch, 0) + 1

    logger.info(
        "Channel ingestion: %d messages → %d tickets (channels: %s, duplicates skipped: %d)",
        len(request.messages), len(normalized), channel_counts, duplicates_skipped,
    )

    return {
        "status": "ok",
        "tickets": normalized,
        "total_ingested": len(normalized),
        "duplicates_skipped": duplicates_skipped,
        "channel_breakdown": channel_counts,
    }
