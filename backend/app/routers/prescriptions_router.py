import json

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas, auth

router = APIRouter(prefix="/api/prescriptions", tags=["Prescriptions"])


@router.post("", response_model=schemas.PrescriptionOut, status_code=201)
def create_prescription(
    payload: schemas.PrescriptionCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role("doctor")),
):
    appt = (
        db.query(models.Appointment)
        .filter(models.Appointment.id == payload.appointment_id)
        .first()
    )
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")
    if appt.doctor_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your appointment")
    if appt.prescription:
        raise HTTPException(status_code=400, detail="Prescription already exists for this appointment")

    prescription = models.Prescription(
        appointment_id=appt.id,
        patient_id=appt.patient_id,
        doctor_id=current_user.id,
        medicines=json.dumps([m.dict() for m in payload.medicines]),
        instructions=payload.instructions,
    )
    db.add(prescription)

    appt.status = models.AppointmentStatus.completed
    db.commit()
    db.refresh(prescription)

    note = models.Notification(
        user_id=appt.patient_id,
        title="New Prescription Available",
        message="Your doctor has issued a new prescription. Check your prescriptions tab.",
    )
    db.add(note)
    db.commit()

    return prescription


@router.get("/my", response_model=list[schemas.PrescriptionOut])
def my_prescriptions(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role("patient")),
):
    return (
        db.query(models.Prescription)
        .filter(models.Prescription.patient_id == current_user.id)
        .order_by(models.Prescription.created_at.desc())
        .all()
    )


@router.get("/appointment/{appointment_id}", response_model=schemas.PrescriptionOut)
def get_by_appointment(
    appointment_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    prescription = (
        db.query(models.Prescription)
        .filter(models.Prescription.appointment_id == appointment_id)
        .first()
    )
    if not prescription:
        raise HTTPException(status_code=404, detail="Prescription not found")
    if current_user.id not in (prescription.patient_id, prescription.doctor_id) and current_user.role != models.UserRole.admin:
        raise HTTPException(status_code=403, detail="Not authorized")
    return prescription


@router.get("/{id}/download")
def download_prescription(
    id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    from fastapi.responses import Response
    from app.utils.pdf_generator import generate_prescription_pdf
    
    prescription = db.query(models.Prescription).filter(models.Prescription.id == id).first()
    if not prescription:
        raise HTTPException(status_code=404, detail="Prescription not found")
        
    if current_user.id not in (prescription.patient_id, prescription.doctor_id) and current_user.role != models.UserRole.admin:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    pdf_bytes = generate_prescription_pdf(
        prescription, 
        prescription.appointment, 
        prescription.patient, 
        prescription.doctor
    )
    
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=prescription_{id}.pdf"
        }
    )
