from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
import os

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./data/srm.db")

# connect_args è necessario solo per SQLite:
# impedisce errori di thread quando FastAPI gestisce richieste concorrenti
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

class Base(DeclarativeBase):
    pass

def get_db():
    """
    Dependency FastAPI: apre una sessione DB per ogni request,
    la chiude automaticamente al termine (anche in caso di eccezione).
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
