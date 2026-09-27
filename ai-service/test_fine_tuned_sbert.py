"""
Test script for loading custom fine-tuned SBERT model and testing similarity predictions.
"""
import os
import sys
import numpy as np

sys.path.insert(0, os.path.dirname(__file__))

from core.config import SBERT_MODEL_NAME
from sentence_transformers import SentenceTransformer


def main():
    print(f"Loading Sentence-BERT model from: {SBERT_MODEL_NAME}")
    model = SentenceTransformer(SBERT_MODEL_NAME)
    print("✓ Model loaded successfully!")

    # Test Helpdesk Query Comparisons
    s1 = "Employee reported a mailbox issue and requested IT support."
    s2 = "Outlook email mailbox full error receiving spam messages"
    s3 = "Database connection failed access issue on server"

    embs = model.encode([s1, s2, s3], normalize_embeddings=True)

    sim_1_2 = float(np.dot(embs[0], embs[1]))
    sim_1_3 = float(np.dot(embs[0], embs[2]))

    print("\n--- Helpdesk Ticket Cosine Similarity Results ---")
    print(f"Query 1: '{s1}'")
    print(f"Query 2: '{s2}'")
    print(f"Query 3: '{s3}'")
    print(f"\nSimilarity (Email Mailbox vs Email Mailbox): {sim_1_2:.4f}")
    print(f"Similarity (Email Mailbox vs Database Server): {sim_1_3:.4f}")

    print("\n✓ Embedding dimension:", embs.shape[1])
    print("✓ Test completed successfully!")


if __name__ == "__main__":
    main()
