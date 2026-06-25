import os
import sys

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app.models import User
from app.auth import hash_password

def seed_users():
    db = SessionLocal()
    try:
        created_count = 0
        for i in range(2, 22):  # user2 to user21
            email = f"user{i}@medp.com"
            existing = db.query(User).filter(User.email == email).first()
            if not existing:
                user = User(
                    full_name=f"User {i} Test",
                    email=email,
                    hashed_password=hash_password("userpass"),
                    role="patient" 
                )
                db.add(user)
                created_count += 1
        db.commit()
        print(f"Successfully created {created_count} users.")
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_users()
