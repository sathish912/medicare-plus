from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database import Base
from app.models import User, UserRole
from app.auth import hash_password, create_access_token
from datetime import date

engine = create_engine('sqlite:///./sql_app.db')
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()

try:
    new_user = User(
        full_name="vijay",
        email="user1@example.com",
        hashed_password=hash_password("userpass"),
        phone="8945784510",
        role=UserRole.patient,
        date_of_birth=date(1996, 6, 22),
        gender="male",
        blood_group="o+",
        address="108, kubhera vilas"
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    print("User role:", new_user.role)
    print("User role type:", type(new_user.role))
    token = create_access_token({"user_id": new_user.id, "role": new_user.role.value, "email": new_user.email})
    print("Success")
except Exception as e:
    import traceback
    traceback.print_exc()
finally:
    db.rollback()
