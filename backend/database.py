import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DEFAULT_DB_PATH = os.path.join(BASE_DIR, "fantasy_cricket.db").replace("\\", "/")
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{DEFAULT_DB_PATH}")

# Fix for Render / Supabase / Railway / Heroku postgres:// URLs
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# SQLite specific argument
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
    echo=False
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def run_migrations():
    """
    Ensures newly added columns exist in SQLite database without requiring a drop.
    """
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE matches ADD COLUMN is_locked BOOLEAN DEFAULT 0"))
            conn.commit()
        except Exception:
            pass
        try:
            conn.execute(text("ALTER TABLE users ADD COLUMN avatar_url VARCHAR"))
            conn.commit()
        except Exception:
            pass
        try:
            conn.execute(text("ALTER TABLE users ADD COLUMN is_verified BOOLEAN DEFAULT 1"))
            conn.commit()
        except Exception:
            pass

# Run migrations on module load
try:
    run_migrations()
except Exception:
    pass

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

