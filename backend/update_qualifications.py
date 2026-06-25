import os
import sys

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app.models import DoctorProfile

def update_qualifications():
    db = SessionLocal()
    try:
        qualifications_map = {
            "Cardiology": "MBBS, MD, DM (Cardiology)",
            "Neurology": "MBBS, MD, DM (Neurology)",
            "Orthopedics": "MBBS, MS (Orthopedics)",
            "Pediatrics": "MBBS, MD (Pediatrics)",
            "Oncology": "MBBS, MD, DM (Medical Oncology)",
            "Dermatology": "MBBS, MD (Dermatology)",
            "Gastroenterology": "MBBS, MD, DM (Gastroenterology)",
            "Psychiatry": "MBBS, MD (Psychiatry)",
            "Ophthalmology": "MBBS, MS (Ophthalmology)",
            "ENT (Otolaryngology)": "MBBS, MS (ENT)",
            "Endocrinology": "MBBS, MD, DM (Endocrinology)",
            "Pulmonology": "MBBS, MD (Pulmonary Medicine)",
            "Urology": "MBBS, MS, MCh (Urology)",
            "Gynecology & Obstetrics": "MBBS, MD (OB/GYN)",
            "General Surgery": "MBBS, MS (General Surgery)",
            "Radiology": "MBBS, MD (Radiodiagnosis)",
            "Rheumatology": "MBBS, MD, DM (Rheumatology)",
            "Family_Medicine": "MBBS, MD (Family Medicine)"
        }
        
        profiles = db.query(DoctorProfile).all()
        updated_count = 0
        for profile in profiles:
            if profile.department:
                dept_name = profile.department.name
                new_qual = qualifications_map.get(dept_name, "MBBS, MD")
                if profile.qualification != new_qual:
                    profile.qualification = new_qual
                    updated_count += 1
        
        db.commit()
        print(f"Successfully updated qualifications for {updated_count} doctors.")
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    update_qualifications()
