from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
from db import get_connection
from pydantic import BaseModel

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
    status: Optional[str] = Query(None),
):
    conn = get_connection()
    try:
        sql = "SELECT * FROM vocab WHERE 1=1"
        params = []

        if status == 'flagged':
            sql += " AND flagged = 1"
        elif status == 'all':
            pass  # no filter
        else:  # default: 'active'
            sql += " AND flagged != -1"

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
        
class FlagUpdate(BaseModel):
    flagged: int

@app.patch("/vocab/{word_id}/flag")
def update_flag(word_id: int, body: FlagUpdate):
    conn = get_connection()
    try:
        conn.execute(
            "UPDATE vocab SET flagged = ? WHERE id = ?",
            (body.flagged, word_id)
        )
        conn.commit()
        return {"ok": True}
    finally:
        conn.close()