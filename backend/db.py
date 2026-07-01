import sqlite3
import os

# Development: use shared database outside project root
# Production: use database in backend folder (copied during deployment)
if os.getenv("ENVIRONMENT") == "production":
    DB_PATH = os.path.join(os.path.dirname(__file__), "vocab_master.db")
else:
    DB_PATH = os.path.normpath(
        os.path.join(os.path.dirname(__file__), "..", "..", "Vocab DB", "vocab_master.db")
    )

def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn