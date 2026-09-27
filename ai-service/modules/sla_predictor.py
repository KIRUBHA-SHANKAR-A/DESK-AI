"""
Module 6 – SLA Breach Prediction
─────────────────────────────────
Predicts which open tickets are likely to exceed their resolution deadline
based on priority, elapsed time, category complexity, and assignment status.
"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import List, Dict, Any

from fastapi import APIRouter

from core.config import logger, DEFAULT_SLA_HOURS
from schemas.schemas import SLAPredictionRequest, SLATicket

router = APIRouter(tags=["SLA Breach Prediction"])


# ── Risk Factors ────────────────────────────────────────────────────────────

# Categories that historically take longer to resolve
COMPLEX_CATEGORIES = {"Security", "Database", "Server", "Network"}

# Status progression weights (how "done" a ticket is)
STATUS_PROGRESS: Dict[str, float] = {
    "OPEN": 0.0,
    "IN_PROGRESS": 0.3,
    "WAITING_ON_USER": 0.4,
    "UNDER_REVIEW": 0.6,
    "TESTING": 0.8,
    "RESOLVED": 1.0,
    "CLOSED": 1.0,
}


def _parse_datetime(dt_str: str | None) -> datetime | None:
    """Parse an ISO-8601 datetime string, returning None on failure."""
    if not dt_str:
        return None
    try:
        dt = datetime.fromisoformat(dt_str.replace("Z", "+00:00"))
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt
    except (ValueError, TypeError):
        return None


def _compute_breach_risk(ticket: SLATicket, now: datetime) -> Dict[str, Any]:
    """Score a single ticket's SLA breach risk (0.0 – 1.0).

    Risk factors:
      1. Time elapsed vs. SLA deadline (dominant factor)
      2. Category complexity
      3. Assignment status
      4. Status progress
    """
    priority = ticket.priority.upper() if ticket.priority else "MEDIUM"
    sla_hours = DEFAULT_SLA_HOURS.get(priority, 24)

    created = _parse_datetime(ticket.created_at)
    deadline = _parse_datetime(ticket.due_date)

    if created is None:
        # Can't compute without creation time
        return {
            "ticket_id": ticket.ticket_id,
            "risk_score": 0.5,
            "risk_level": "MEDIUM",
            "reason": "Missing creation timestamp; defaulting to medium risk",
            "hours_remaining": None,
        }

    # If explicit deadline exists, use it; otherwise derive from SLA hours
    if deadline is None:
        from datetime import timedelta
        deadline = created + timedelta(hours=sla_hours)

    elapsed = (now - created).total_seconds() / 3600
    total_window = (deadline - created).total_seconds() / 3600
    hours_remaining = max(0, (deadline - now).total_seconds() / 3600)

    # ── Factor 1: Time ratio (0.0 = just created, 1.0+ = overdue)
    if total_window > 0:
        time_ratio = elapsed / total_window
    else:
        time_ratio = 1.0

    # ── Factor 2: Status progress
    status_key = ticket.status.upper().replace(" ", "_") if ticket.status else "OPEN"
    progress = STATUS_PROGRESS.get(status_key, 0.0)

    # If the ticket is already resolved/closed, no breach risk
    if progress >= 1.0:
        return {
            "ticket_id": ticket.ticket_id,
            "risk_score": 0.0,
            "risk_level": "NONE",
            "reason": "Ticket already resolved/closed",
            "hours_remaining": round(hours_remaining, 1),
        }

    # ── Factor 3: Category complexity (+0.1 for complex categories)
    category_penalty = 0.1 if ticket.category in COMPLEX_CATEGORIES else 0.0

    # ── Factor 4: Unassigned penalty (+0.15 if nobody owns it)
    unassigned_penalty = 0.15 if not ticket.assigned_to else 0.0

    # ── Composite risk score
    #   Base risk from time consumption adjusted by how much progress was made
    effective_time_risk = time_ratio * (1.0 - progress * 0.7)

    risk_score = min(1.0, max(0.0,
        effective_time_risk * 0.65
        + category_penalty
        + unassigned_penalty
    ))

    # Already overdue? Clamp to high risk
    if hours_remaining <= 0:
        risk_score = max(risk_score, 0.95)

    # Classify risk level
    if risk_score >= 0.80:
        risk_level = "CRITICAL"
    elif risk_score >= 0.60:
        risk_level = "HIGH"
    elif risk_score >= 0.35:
        risk_level = "MEDIUM"
    else:
        risk_level = "LOW"

    # Build reason
    reasons = []
    if time_ratio >= 1.0:
        reasons.append("SLA deadline exceeded")
    elif time_ratio >= 0.75:
        reasons.append(f"{round(time_ratio * 100)}% of SLA window consumed")
    if not ticket.assigned_to:
        reasons.append("Ticket is unassigned")
    if ticket.category in COMPLEX_CATEGORIES:
        reasons.append(f"Complex category: {ticket.category}")
    if progress < 0.3 and time_ratio > 0.5:
        reasons.append("Minimal progress with significant time elapsed")

    return {
        "ticket_id": ticket.ticket_id,
        "title": ticket.title,
        "priority": priority,
        "risk_score": round(risk_score, 4),
        "risk_level": risk_level,
        "hours_remaining": round(hours_remaining, 1),
        "sla_hours": sla_hours,
        "progress": round(progress, 2),
        "reasons": reasons if reasons else ["Within normal parameters"],
    }


# ── API Endpoint ────────────────────────────────────────────────────────────

@router.post("/predict-sla-breach")
async def predict_sla_breach(request: SLAPredictionRequest):
    """Predict SLA breach risk for a batch of tickets.

    Returns each ticket scored with a risk level (CRITICAL / HIGH / MEDIUM /
    LOW / NONE) and hours remaining before deadline.
    """
    now = datetime.now(timezone.utc)

    predictions = [_compute_breach_risk(t, now) for t in request.tickets]

    # Sort by risk score descending (most at-risk first)
    predictions.sort(key=lambda p: p["risk_score"], reverse=True)

    # Summary stats
    at_risk = [p for p in predictions if p["risk_level"] in ("CRITICAL", "HIGH")]

    logger.info(
        "SLA breach prediction: %d tickets analyzed, %d at high/critical risk",
        len(predictions), len(at_risk),
    )

    return {
        "status": "ok",
        "total_tickets": len(predictions),
        "at_risk_count": len(at_risk),
        "predictions": predictions,
    }
