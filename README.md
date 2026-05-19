# Vocab Tester

## Backend

**Activate the virtual environment** (do this first, every time):
```bash
cd backend
source venv/bin/activate
```

**Start the backend server:**
```bash
uvicorn main:app --reload
```
Runs at `http://127.0.0.1:8000`  
API docs at `http://127.0.0.1:8000/docs`

**Deactivate the venv when done:**
```bash
deactivate
```

---

## Frontend

**Start the frontend dev server** (in a separate terminal):
```bash
cd frontend
npm run dev
```
Runs at `http://localhost:5173`

---

## Database

**Location:** `../Vocab DB/vocab_master.db` (relative to this folder)

**Open the DB directly:**
```bash
sqlite3 "../Vocab DB/vocab_master.db"
```
