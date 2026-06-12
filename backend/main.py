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

class NounFlagUpdate(BaseModel):
    noun_flagged: int

@app.patch("/vocab/{word_id}/noun_flag")
def update_noun_flag(word_id: int, body: NounFlagUpdate):
    conn = get_connection()
    try:
        conn.execute(
            "UPDATE vocab SET noun_flagged = ? WHERE id = ?",
            (body.noun_flagged, word_id)
        )
        conn.commit()
        return {"ok": True}
    finally:
        conn.close()

class VocabUpdate(BaseModel):
    word: str
    article: Optional[str] = None
    english: str
    word_type: str
    source: str
    chapter: int
    forms: Optional[str] = None
    plural: Optional[str] = None
    notes: Optional[str] = None
    example: Optional[str] = None

@app.delete("/vocab/{word_id}")
def delete_vocab(word_id: int):
    conn = get_connection()
    try:
        conn.execute("DELETE FROM vocab WHERE id = ?", (word_id,))
        conn.commit()
        return {"ok": True}
    finally:
        conn.close()

@app.put("/vocab/{word_id}")
def update_vocab(word_id: int, body: VocabUpdate):
    conn = get_connection()
    try:
        conn.execute(
            """UPDATE vocab SET
                word = ?, article = ?, english = ?, word_type = ?,
                source = ?, chapter = ?, forms = ?, plural = ?,
                notes = ?, example = ?
            WHERE id = ?""",
            (body.word, body.article, body.english, body.word_type,
             body.source, body.chapter, body.forms, body.plural,
             body.notes, body.example, word_id)
        )
        conn.commit()
        row = conn.execute("SELECT * FROM vocab WHERE id = ?", (word_id,)).fetchone()
        return dict(row)
    finally:
        conn.close()