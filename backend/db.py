import sqlite3
import os

DB_PATH = os.path.normpath(
    os.path.join(os.path.dirname(__file__), "..", "..", "Vocab DB", "vocab_master.db")
)

def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn