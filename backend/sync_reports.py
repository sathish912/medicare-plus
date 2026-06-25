import os
import sys

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app.models import MedicalRecord, LabTest, LabTestStatus, User, UserRole

def sync_existing_reports():
    db = SessionLocal()
    try:
        fallback_doc = db.query(User).filter(User.role == UserRole.doctor).first()
        fallback_id = fallback_doc.id if fallback_doc else 1
        
        reports = db.query(MedicalRecord).filter(MedicalRecord.record_type == "report").all()
        synced_count = 0
        for r in reports:
            existing = db.query(LabTest).filter(
                LabTest.patient_id == r.patient_id,
                LabTest.test_name == r.title
            ).first()
            if not existing:
                lab_test = LabTest(
                    patient_id=r.patient_id,
                    doctor_id=r.doctor_id or fallback_id,
                    test_name=r.title,
                    status=LabTestStatus.completed,
                    result_notes=r.description,
                    file_url=r.file_url
                )
                db.add(lab_test)
                synced_count += 1
        db.commit()
        print(f"Successfully synced {synced_count} reports to Lab Tests.")
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    sync_existing_reports()
