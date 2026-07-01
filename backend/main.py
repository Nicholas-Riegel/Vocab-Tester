from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
from db import get_connection
from pydantic import BaseModel

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite's default port
        "chrome-extension://*",   # Allow Chrome extension
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/vocab")
def get_vocab(
    source: Optional[str] = Query(None),
    word_type: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    level: Optional[str] = Query(None),
):
    conn = get_connection()
    try:
        sql = "SELECT * FROM vocab WHERE 1=1"
        params = []

        if status == 'flagged':
            sql += " AND flagged >= 1"
        elif status == 'superflagged':
            sql += " AND flagged = 2"
        # 'all' or any other status: no filter

        if source == 'Frequency List':
            sql += " AND frequency_rank IS NOT NULL"
        elif source:
            sql += " AND source = ?"
            params.append(source)
        if word_type:
            sql += " AND word_type = ?"
            params.append(word_type)
        if level:
            sql += " AND level = ?"
            params.append(level)

        if source == 'Frequency List':
            sql += " ORDER BY frequency_rank"
        else:
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

@app.get("/api/translate")
def translate_word(word: str = Query(...)):
    """Look up a German word in the database. Returns translation if found."""
    conn = get_connection()
    try:
        # Search for exact match (case-insensitive)
        row = conn.execute(
            "SELECT id, word, article, english, word_type, forms, plural FROM vocab WHERE LOWER(word) = LOWER(?)",
            (word,)
        ).fetchone()
        
        if row:
            return {
                "found": True,
                "word": row[1],
                "article": row[2],
                "english": row[3],
                "word_type": row[4],
                "forms": row[5],
                "plural": row[6],
                "id": row[0]
            }
        else:
            return {"found": False}
    finally:
        conn.close()

class QuickAddVocab(BaseModel):
    word: str
    english: str
    article: Optional[str] = None
    word_type: str = "other"

@app.post("/api/vocab/quick-add")
def quick_add_vocab(body: QuickAddVocab):
    """Quickly add a new vocabulary word from the browser extension."""
    conn = get_connection()
    try:
        conn.execute(
            """INSERT INTO vocab (word, article, english, word_type, source, chapter, flagged)
               VALUES (?, ?, ?, ?, 'Browser Extension', 0, 0)""",
            (body.word, body.article, body.english, body.word_type)
        )
        conn.commit()
        row_id = conn.execute("SELECT last_insert_rowid()").fetchone()[0]
        row = conn.execute("SELECT * FROM vocab WHERE id = ?", (row_id,)).fetchone()
        return {"ok": True, "word": dict(row)}
    finally:
        conn.close()