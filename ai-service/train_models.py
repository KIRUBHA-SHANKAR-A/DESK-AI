"""
Master ML Training Pipeline for DESK AI
────────────────────────────────────────
Trains and saves custom ML models on 'Helpdesk ticketing dataset.csv':
1. Category & Team Support Classifier -> 'custom_classifier.joblib'
2. Ticket Priority Predictor         -> 'custom_priority_model.joblib'
3. SBERT Semantic Embedding Model   -> 'custom-helpdesk-sbert'
"""
import os
import sys
import random
import pandas as pd
import numpy as np
import joblib

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score


def load_dataset() -> pd.DataFrame:
    """Load Helpdesk ticketing dataset CSV."""
    default_paths = [
        os.path.join(os.path.dirname(__file__), "Helpdesk ticketing dataset.csv"),
        "Helpdesk ticketing dataset.csv",
        "d:/PROJECTS/DESK AI/ai-service/Helpdesk ticketing dataset.csv",
        "d:/PROJECTS/DESK AI/Helpdesk ticketing dataset.csv",
    ]
    for path in default_paths:
        if os.path.exists(path):
            print(f"Loading dataset from: {path}")
            return pd.read_csv(path)
    raise FileNotFoundError("Could not locate 'Helpdesk ticketing dataset.csv'")


def train_category_classifier(df: pd.DataFrame, output_path: str = "custom_classifier.joblib"):
    """Train TF-IDF + LogisticRegression model for Category & Team routing."""
    print("\n==================================================")
    print("1. Training Ticket Category & Team Support Classifier...")
    print("==================================================")

    # Clean text features
    df["clean_text"] = (
        df["title"].fillna("") + ". " +
        df["description"].fillna("") + ". " +
        df["keywords"].fillna("")
    ).str.strip()

    X = df["clean_text"]

    # Standardize dataset category to the 8 official support teams
    def map_official_team(row):

        cat = str(row.get("category", "")).lower()
        subcat = str(row.get("subcategory", "")).lower()
        team = str(row.get("team", "")).lower()

        if "email" in cat or "mailbox" in cat or "email" in team:
            return "Email Support | Email Support"
        if "hardware" in cat or "keyboard" in subcat or "laptop" in subcat or "hardware" in team:
            return "Hardware Support | Hardware Support"
        if "software" in cat or "license" in subcat or "application" in team:
            return "Software Support | Software Support"
        if "network" in cat or "lan" in subcat or "vpn" in subcat or "network" in team:
            return "Network Support | Network Support"
        if "database" in cat or "sql" in subcat or "database" in team:
            return "Database Support | Database Support"
        if "server" in cat or "infrastructure" in team:
            return "Server Support | Server Support"
        if "security" in cat or "malware" in subcat or "security" in team:
            return "Security Support | Security Support"
        return "IT Support | IT Support"

    y_combined = df.apply(map_official_team, axis=1)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y_combined, test_size=0.2, random_state=42, stratify=y_combined
    )


    pipeline = Pipeline([
        ("tfidf", TfidfVectorizer(max_features=10000, ngram_range=(1, 2), stop_words="english")),
        ("clf", LogisticRegression(max_iter=1000, C=2.0))
    ])

    print("Fitting Category & Team Classifier on 80% training split...")
    pipeline.fit(X_train, y_train)

    y_pred = pipeline.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    print(f"[OK] Category & Team Classifier Accuracy: {acc * 100:.2f}%")

    model_file = os.path.join(os.path.dirname(__file__), output_path)
    joblib.dump(pipeline, model_file)
    print(f"[OK] Category Classifier saved to: {model_file}")
    return pipeline


def train_priority_predictor(df: pd.DataFrame, output_path: str = "custom_priority_model.joblib"):
    """Train TF-IDF + LogisticRegression model for Ticket Priority prediction."""
    print("\n==================================================")
    print("2. Training Ticket Priority Predictor Model...")
    print("==================================================")

    # Clean text features combining title, description, urgency, severity
    df["clean_priority_text"] = (
        df["title"].fillna("") + ". " +
        df["description"].fillna("") + ". Urgency: " +
        df["urgency"].fillna("") + ". Severity: " +
        df["severity"].fillna("") + ". Impact: " +
        df["impact"].fillna("")
    ).str.strip()

    X = df["clean_priority_text"]
    y = df["priority"].fillna("MEDIUM").str.upper()

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    pipeline = Pipeline([
        ("tfidf", TfidfVectorizer(max_features=8000, ngram_range=(1, 2), stop_words="english")),
        ("clf", LogisticRegression(max_iter=1000, C=3.0, class_weight="balanced"))
    ])

    print("Fitting Priority Predictor on 80% training split...")
    pipeline.fit(X_train, y_train)

    y_pred = pipeline.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    print(f"[OK] Priority Predictor Accuracy: {acc * 100:.2f}%")
    print(classification_report(y_test, y_pred))

    model_file = os.path.join(os.path.dirname(__file__), output_path)
    joblib.dump(pipeline, model_file)
    print(f"[OK] Priority Predictor saved to: {model_file}")
    return pipeline


def main():
    print("Starting DESK AI Master ML Model Training Pipeline...")
    df = load_dataset()
    print(f"Loaded dataset containing {len(df)} helpdesk tickets.")

    # 1. Train Category & Team Classifier
    train_category_classifier(df)

    # 2. Train Priority Predictor Model
    train_priority_predictor(df)

    print("\n==================================================")
    print("[OK] All ML Models Trained & Saved Successfully!")
    print("==================================================")



if __name__ == "__main__":
    main()
