"""
Application-wide configuration and constants.
"""
import logging

# ── Logging ──────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s │ %(name)-20s │ %(levelname)-7s │ %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("desk-ai")

# ── Embedding Model ──────────────────────────────────────────────────────────
SBERT_MODEL_NAME = "all-MiniLM-L6-v2"
EMBEDDING_DIM = 384  # output dimension for all-MiniLM-L6-v2

# ── Zero-Shot Classifier ────────────────────────────────────────────────────
CLASSIFIER_MODEL_NAME = "facebook/bart-large-mnli"

# ── Ticket Categories / Support Teams ───────────────────────────────────────
CATEGORIES = [
    "IT Support",
    "Hardware Support",
    "Software Support",
    "Network Support",
    "Database Support",
    "Server Support",
    "Email Support",
    "Security Support",
]

# ── Similarity Thresholds ───────────────────────────────────────────────────
DUPLICATE_SIMILARITY_THRESHOLD = 0.3
KB_SIMILARITY_THRESHOLD = 0.2
TOP_K_RESULTS = 5

# ── SLA Defaults ────────────────────────────────────────────────────────────
DEFAULT_SLA_HOURS = {
    "CRITICAL": 4,
    "HIGH": 8,
    "MEDIUM": 24,
    "LOW": 72,
}

# ── KB Auto-Generation ──────────────────────────────────────────────────────
KB_CLUSTER_MIN_SIZE = 3          # minimum tickets in a cluster to generate an article
KB_CLUSTER_SIMILARITY = 0.70     # cosine similarity threshold for grouping tickets
