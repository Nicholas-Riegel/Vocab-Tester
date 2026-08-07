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

def ensure_realm_column():
    """Ensure realm column exists in vocab table. Called on startup."""
    conn = get_connection()
    try:
        # Check if realm column exists
        cursor = conn.execute("PRAGMA table_info(vocab)")
        columns = [row[1] for row in cursor.fetchall()]
        if 'realm' not in columns:
            # Add realm column as JSON array (stored as TEXT)
            conn.execute("ALTER TABLE vocab ADD COLUMN realm TEXT DEFAULT '[]'")
            conn.commit()
            print("Added realm column to vocab table")
    except Exception as e:
        print(f"Error checking/creating realm column: {e}")
    finally:
        conn.close()

def ensure_realms_table():
    """Ensure realms table exists and seed with default realms."""
    conn = get_connection()
    try:
        from datetime import datetime
        # Check if realms table exists
        cursor = conn.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='realms'")
        if not cursor.fetchone():
            # Create realms table
            now = datetime.utcnow().isoformat()
            conn.execute("""
                CREATE TABLE realms (
                    id INTEGER PRIMARY KEY,
                    name TEXT UNIQUE NOT NULL,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                )
            """)
            
            # Seed with default realms
            default_realms = [
                ('home',),
                ('family',),
                ('work',),
                ('food',),
                ('travel',),
                ('environment',),
                ('health',),
                ('education',),
                ('technology',),
            ]
            # Insert with timestamps
            for realm_name in default_realms:
                conn.execute(
                    "INSERT INTO realms (name, created_at, updated_at) VALUES (?, ?, ?)",
                    (realm_name[0], now, now)
                )
            conn.commit()
            print("Created realms table and seeded with default realms")
    except Exception as e:
        print(f"Error checking/creating realms table: {e}")
    finally:
        conn.close()

def ensure_realm_ids_column():
    """Ensure realm_ids column exists (comma-separated realm IDs)."""
    conn = get_connection()
    try:
        cursor = conn.execute("PRAGMA table_info(vocab)")
        columns = [row[1] for row in cursor.fetchall()]
        if 'realm_ids' not in columns:
            conn.execute("ALTER TABLE vocab ADD COLUMN realm_ids TEXT DEFAULT ''")
            conn.commit()
            print("Added realm_ids column to vocab table")
    except Exception as e:
        print(f"Error checking/creating realm_ids column: {e}")
    finally:
        conn.close()

def migrate_realm_names_to_ids():
    """Convert realm names (JSON array) to realm IDs (comma-separated)."""
    conn = get_connection()
    try:
        import json
        
        # Check if old realm column still exists
        cursor = conn.execute("PRAGMA table_info(vocab)")
        columns = [row[1] for row in cursor.fetchall()]
        has_old_realm_column = 'realm' in columns
        
        if not has_old_realm_column:
            return  # Already cleaned up
        
        # Get all realm mappings (name -> id)
        realm_map = {}
        for row in conn.execute("SELECT id, name FROM realms").fetchall():
            realm_map[row[1]] = str(row[0])
        
        # Find all vocab entries with realm data
        rows = conn.execute("SELECT id, realm, realm_ids FROM vocab WHERE realm IS NOT NULL AND realm != '[]'").fetchall()
        
        updated = 0
        for row in rows:
            word_id, realm_value, realm_ids = row[0], row[1], row[2]
            
            # Skip if already migrated (has realm_ids)
            if realm_ids:
                continue
            
            realm_names = []
            try:
                # Try parsing as JSON array (current format)
                realm_names = json.loads(realm_value)
            except:
                # Fallback: treat as comma-separated names
                realm_names = [name.strip() for name in str(realm_value).split(',')]
            
            # Convert names to IDs
            realm_ids_list = []
            for name in realm_names:
                if name in realm_map:
                    realm_ids_list.append(realm_map[name])
            
            # Update if we found valid realms
            if realm_ids_list:
                realm_ids_str = ','.join(realm_ids_list)
                conn.execute("UPDATE vocab SET realm_ids = ? WHERE id = ?", (realm_ids_str, word_id))
                updated += 1
        
        if updated > 0:
            conn.commit()
            print(f"Migrated {updated} vocab entries from realm names to realm IDs")
        
        # Drop the old realm column now that migration is complete
        # SQLite doesn't support DROP COLUMN directly, so we need to recreate the table
        # But since this is a one-time migration and the old column is harmless, we'll leave it
        # (Removing it would require recreating the entire table which is risky)
        
    except Exception as e:
        print(f"Error migrating realm names to IDs: {e}")
    finally:
        conn.close()