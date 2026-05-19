from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
from db import get_connection

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Vite's default port
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/vocab")
def get_vocab(
    source: Optional[str] = Query(None),
    word_type: Optional[str] = Query(None),
):
    conn = get_connection()
    try:
        sql = "SELECT * FROM vocab WHERE flagged != -1"
        params = []
        if source:
            sql += " AND source = ?"
            params.append(source)
        if word_type:
            sql += " AND word_type = ?"
            params.append(word_type)
        sql += " ORDER BY id"
        rows = conn.execute(sql, params).fetchall()
        return [dict(row) for row in rows]
    finally:
        conn.close()