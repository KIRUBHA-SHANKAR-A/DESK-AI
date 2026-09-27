"""
Fine-Tuning Sentence-BERT (SBERT) on Helpdesk Dataset for DESK AI
──────────────────────────────────────────────────────────────────
Dataset: Helpdesk ticketing dataset.csv (10,000 tickets)

Steps:
1. Load Helpdesk ticketing dataset.csv from ai-service or custom path.
2. Combine 'title' and 'description' into full text representation.
3. Group tickets by 'category' and 'subcategory'.
4. Construct balanced positive (score=0.9) and negative (score=0.1) sentence pairs.
5. Create PyTorch DataLoader with InputExample instances.
6. Fine-tune 'all-MiniLM-L6-v2' with CosineSimilarityLoss for 3 epochs.
7. Save fine-tuned model to 'custom-helpdesk-sbert'.
"""
import os
import sys
import argparse
import random
import pandas as pd
import torch
from torch.utils.data import DataLoader
from sentence_transformers import SentenceTransformer, InputExample, losses


def load_helpdesk_dataset(csv_path: str = None) -> pd.DataFrame:
    """Locate and load the 10,000 row Helpdesk ticketing dataset CSV."""
    if csv_path and os.path.exists(csv_path):
        print(f"Loading dataset from specified path: {csv_path}")
        return pd.read_csv(csv_path)

    default_paths = [
        os.path.join(os.path.dirname(__file__), "Helpdesk ticketing dataset.csv"),
        "Helpdesk ticketing dataset.csv",
        "../Helpdesk ticketing dataset.csv",
        "d:/PROJECTS/DESK AI/ai-service/Helpdesk ticketing dataset.csv",
        "d:/PROJECTS/DESK AI/Helpdesk ticketing dataset.csv",
    ]

    for path in default_paths:
        if os.path.exists(path):
            print(f"Found Helpdesk dataset at: {path}")
            return pd.read_csv(path)

    raise FileNotFoundError("Could not locate 'Helpdesk ticketing dataset.csv'. Please check path.")


def create_training_pairs(df: pd.DataFrame, max_pairs: int = 15000) -> pd.DataFrame:
    """Convert dataset into sentence pairs with similarity scores.
    Combines title + description for richer semantic embeddings.
    Uses balanced sampling for memory efficiency.
    """
    print(f"\nProcessing {len(df)} dataset records into semantic sentence pairs...")

    # Normalize text fields
    records = []
    for idx, row in df.iterrows():
        title = str(row.get("title", "")).strip()
        desc = str(row.get("description", "")).strip()
        cat = str(row.get("category", "")).strip()
        subcat = str(row.get("subcategory", "")).strip()

        # Combine title and description into a clean text representation
        if title and desc and title.lower() not in desc.lower():
            text = f"{title}. {desc}"
        elif title:
            text = title
        else:
            text = desc

        records.append({
            "text": text,
            "category": cat if cat else "General",
            "subcategory": subcat if subcat else "General"
        })

    clean_df = pd.DataFrame(records)

    # Group texts by category for positive/negative pair extraction
    category_map = {}
    for _, row in clean_df.iterrows():
        cat = row["category"]
        text = row["text"]
        if cat not in category_map:
            category_map[cat] = []
        category_map[cat].append(text)

    positive_pairs = []
    negative_pairs = []

    # 1. Generate Positive Pairs (Same category → score = 0.9)
    pairs_per_cat = max(100, max_pairs // (len(category_map) * 2))
    for cat, texts in category_map.items():
        n = len(texts)
        if n < 2:
            continue
        count = 0
        for i in range(n):
            for j in range(i + 1, n):
                positive_pairs.append((texts[i], texts[j], 0.9))
                count += 1
                if count >= pairs_per_cat:
                    break
            if count >= pairs_per_cat:
                break

    # 2. Generate Negative Pairs (Different category → score = 0.1)
    cat_keys = list(category_map.keys())
    target_neg = len(positive_pairs)
    attempts = 0
    while len(negative_pairs) < target_neg and attempts < target_neg * 10:
        attempts += 1
        c1, c2 = random.sample(cat_keys, 2)
        t1 = random.choice(category_map[c1])
        t2 = random.choice(category_map[c2])
        negative_pairs.append((t1, t2, 0.1))

    all_pairs = positive_pairs + negative_pairs
    random.shuffle(all_pairs)

    pairs_df = pd.DataFrame(all_pairs, columns=["sentence1", "sentence2", "score"])
    print(f"✓ Generated {len(pairs_df)} balanced sentence pairs ({len(positive_pairs)} similar, {len(negative_pairs)} dissimilar).")
    return pairs_df


def train_sbert(csv_path: str = None, output_dir: str = "custom-helpdesk-sbert", epochs: int = 3, batch_size: int = 16):
    """Fine-tune SBERT model on Helpdesk dataset."""
    df = load_helpdesk_dataset(csv_path)
    pairs_df = create_training_pairs(df)

    print("\nCreating DataLoader with InputExample instances...")
    examples = [
        InputExample(texts=[row["sentence1"], row["sentence2"]], label=float(row["score"]))
        for _, row in pairs_df.iterrows()
    ]
    loader = DataLoader(examples, batch_size=batch_size, shuffle=True)

    base_model = "all-MiniLM-L6-v2"
    print(f"\nLoading SentenceTransformer base model '{base_model}'...")
    model = SentenceTransformer(base_model)

    train_loss = losses.CosineSimilarityLoss(model)

    print(f"\nStarting SBERT Fine-Tuning ({epochs} epochs, batch size {batch_size})...")
    model.fit(
        train_objectives=[(loader, train_loss)],
        epochs=epochs,
        warmup_steps=100,
        show_progress_bar=True
    )

    save_path = os.path.join(os.path.dirname(__file__), output_dir)
    print(f"\nSaving fine-tuned SBERT model to: {save_path}")
    model.save(save_path)
    print("✓ SBERT Fine-Tuning finished successfully!")
    return save_path


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Fine-tune SBERT on Helpdesk Dataset")
    parser.add_argument("--dataset", type=str, default=None, help="Path to CSV dataset")
    parser.add_argument("--output", type=str, default="custom-helpdesk-sbert", help="Output model directory")
    parser.add_argument("--epochs", type=int, default=3, help="Training epochs")
    parser.add_argument("--batch-size", type=int, default=16, help="Batch size")
    args = parser.parse_args()

    train_sbert(
        csv_path=args.dataset,
        output_dir=args.output,
        epochs=args.epochs,
        batch_size=args.batch_size
    )
