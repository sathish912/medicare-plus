import os
import sys
from datetime import date, time, timedelta

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app.models import User, UserRole, Appointment, AppointmentStatus

def seed_appointments():
    db = SessionLocal()
    try:
        patients = db.query(User).filter(User.role == UserRole.patient).all()
        doctors = db.query(User).filter(User.role == UserRole.doctor).all()
        
        if not doctors or not patients:
            print("Missing doctors or patients.")
            return

        reasons = [
            "General Consultation & Checkup",
            "Follow-up visit for routine tests",
            "Mild fever and body ache consult",
            "Blood pressure monitoring review",
            "Seasonal allergies consultation",
            "Post-medication health review",
            "Annual wellness physical checkup"
        ]
        
        times = [
            time(9, 30), time(10, 0), time(10, 30), time(11, 0),
            time(11, 30), time(14, 0), time(14, 30), time(15, 0),
            time(15, 30), time(16, 0)
        ]
        
        created_count = 0
        for i, p in enumerate(patients):
            doc = doctors[i % len(doctors)]
            
            existing = db.query(Appointment).filter(
                Appointment.patient_id == p.id,
                Appointment.doctor_id == doc.id
            ).first()
            
            if not existing:
                appt_date = date.today() + timedelta(days=(i % 7) + 1)
                appt_time = times[i % len(times)]
                reason_text = reasons[i % len(reasons)]
                status_val = AppointmentStatus.confirmed if (i % 2 == 0) else AppointmentStatus.pending
                
                appt = Appointment(
                    patient_id=p.id,
                    doctor_id=doc.id,
                    appointment_date=appt_date,
                    appointment_time=appt_time,
                    reason=reason_text,
                    status=status_val,
                    consultation_type="online" if (i % 3 != 0) else "in-person"
                )
                db.add(appt)
                created_count += 1
                
        db.commit()
        print(f"Successfully seeded {created_count} individual appointments!")
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_appointments()
