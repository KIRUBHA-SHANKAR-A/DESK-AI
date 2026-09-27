"""
Pydantic request / response models shared across all modules.
"""
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


# ── Common ───────────────────────────────────────────────────────────────────

class TicketRequest(BaseModel):
    """Base request for most AI endpoints – title + description."""
    title: str
    description: str


# ── Ticket Indexing ──────────────────────────────────────────────────────────

class TicketIndexItem(BaseModel):
    id: int
    title: str
    description: Optional[str] = ""
    status: Optional[str] = ""
    resolution: Optional[str] = ""
    priority: Optional[str] = ""
    created_at: Optional[str] = None
    resolved_at: Optional[str] = None


class IndexTicketsRequest(BaseModel):
    tickets: List[TicketIndexItem]


# ── Knowledge Base Indexing ──────────────────────────────────────────────────

class KBIndexItem(BaseModel):
    id: int
    title: str
    content: Optional[str] = ""
    summary: Optional[str] = ""


class IndexKBRequest(BaseModel):
    articles: List[KBIndexItem]


# ── SLA Breach Prediction ───────────────────────────────────────────────────

class SLATicket(BaseModel):
    """A ticket with SLA-relevant metadata for breach prediction."""
    ticket_id: int
    title: str
    description: Optional[str] = ""
    priority: str = "MEDIUM"
    status: str = "OPEN"
    created_at: str                    # ISO-8601 datetime string
    due_date: Optional[str] = None     # ISO-8601 deadline
    assigned_to: Optional[str] = None
    category: Optional[str] = ""


class SLAPredictionRequest(BaseModel):
    tickets: List[SLATicket]


# ── Multi-Channel Ingestion ─────────────────────────────────────────────────

class ChannelTicket(BaseModel):
    """Normalized ticket from any channel (email, chat, API, etc.)."""
    source: str = Field(..., description="Origin channel: email | chat | api | portal")
    sender: Optional[str] = None
    subject: Optional[str] = ""
    body: str
    timestamp: Optional[str] = None
    metadata: Optional[dict] = None


class ChannelIngestionRequest(BaseModel):
    messages: List[ChannelTicket]


# ── Auto KB Generation ──────────────────────────────────────────────────────

class KBGenerationRequest(BaseModel):
    """Resolved tickets to analyze for automatic KB article generation."""
    tickets: List[TicketIndexItem]
    min_cluster_size: Optional[int] = 3
