import os
import sys

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app.models import User, DoctorProfile, Department
from app.auth import hash_password

def seed_doctors():
    db = SessionLocal()
    try:
        names = [
            "Aarav Sharma", "Vihaan Singh", "Vivaan Gupta", "Ananya Patel", "Diya Kumar", 
            "Advik Desai", "Kavya Reddy", "Sai Joshi", "Ishaan Verma", "Riya Mehta",
            "Aryan Rao", "Dhruv Nair", "Kabir Chatterjee", "Neha Iyer", "Rohan Menon",
            "Pooja Mukherjee", "Siddharth Banerjee", "Karan Das", "Aditi Bose", "Rishi Sen",
            "Arjun Kulkarni", "Meera Pillai", "Rahul Nambiar", "Sneha Shetty", "Vikram Bhat",
            "Nisha Hegde", "Varun Kamath", "Priya Shenoy", "Amit Prabhu", "Sanya Mallya"
        ]

        # Get existing departments or create them if none
        departments = db.query(Department).all()
        if not departments:
            print("No departments found. Please create some departments first.")
            return

        dept_count = len(departments)
        created_count = 0

        for i in range(30):
            email = f"doctor{i+2}@medp.com"
            existing = db.query(User).filter(User.email == email).first()
            if not existing:
                user = User(
                    full_name=f"Dr. {names[i]}",
                    email=email,
                    hashed_password=hash_password("doctorpass"),
                    role="doctor" 
                )
                db.add(user)
                db.flush() # To get user.id
                
                # Assign to a department
                dept = departments[i % dept_count]
                
                profile = DoctorProfile(
                    user_id=user.id,
                    department_id=dept.id,
                    specialization=dept.name,
                    qualification="MBBS, MD",
                    experience_years=5 + (i % 15),
                    consultation_fee=500.0 + (i % 5)*100,
                    bio=f"Dr. {names[i]} is an expert in {dept.name}."
                )
                db.add(profile)
                created_count += 1
                
        db.commit()
        print(f"Successfully created {created_count} doctors.")
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_doctors()
