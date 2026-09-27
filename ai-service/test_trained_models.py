"""
Test script for verifying Category Classification and Priority Prediction models trained on Helpdesk ticketing dataset.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

from modules.classifier import classify_ticket
from modules.priority_predictor import predict_priority
from schemas.schemas import TicketRequest
import asyncio


async def main():
    print("Testing ML Classification & Priority Prediction Models...")

    test_tickets = [
        TicketRequest(title="Spam emails received", description="Mailbox full and receiving suspicious spam emails."),
        TicketRequest(title="Keyboard not responding", description="Physical laptop keyboard keys stuck and mouse cursor not moving."),
        TicketRequest(title="Database connection failed", description="Unable to connect to PostgreSQL database server connection timeout."),
        TicketRequest(title="Critical server down outage", description="Production server completely down and security breach suspected."),
    ]

    print("\n-------------------------------------------------------------")
    for t in test_tickets:
        c_res = await classify_ticket(t)
        p_res = await predict_priority(t)

        print(f"\nTicket Title: '{t.title}'")
        print(f"  Description : {t.description}")
        print(f"  -> Category  : {c_res.get('category')} | Team: {c_res.get('team')} (Method: {c_res.get('method')}, Confidence: {c_res.get('confidence')})")
        print(f"  -> Priority  : {p_res.get('priority')} (Severity: {p_res.get('severity')}, Method: {p_res.get('method')}, Confidence: {p_res.get('confidence')})")


    print("-------------------------------------------------------------")
    print("[OK] Verification complete!")


if __name__ == "__main__":
    asyncio.run(main())
