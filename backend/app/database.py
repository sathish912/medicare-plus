from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.config import settings

engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=3600,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


_tables_created = False

def get_db():
    global _tables_created
    if not _tables_created:
        from app import models
        Base.metadata.create_all(bind=engine)
        _tables_created = True
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
