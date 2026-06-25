from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas, auth

router = APIRouter(prefix="/api/records", tags=["Medical Records"])


@router.post("", response_model=schemas.MedicalRecordOut, status_code=201)
def create_record(
    payload: schemas.MedicalRecordCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role("doctor", "admin")),
):
    patient = db.query(models.User).filter(models.User.id == payload.patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    record = models.MedicalRecord(
        patient_id=payload.patient_id,
        doctor_id=current_user.id if current_user.role == models.UserRole.doctor else None,
        title=payload.title,
        description=payload.description,
        record_type=payload.record_type or "report",
        file_url=payload.file_url,
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    note = models.Notification(
        user_id=patient.id,
        title="New Medical Record Added",
        message=f"A new record '{record.title}' has been added to your profile.",
    )
    db.add(note)
    
    if record.record_type == "report":
        fallback_doc = db.query(models.User).filter(models.User.role == models.UserRole.doctor).first()
        doc_id = record.doctor_id or (fallback_doc.id if fallback_doc else 1)
        lab_test = models.LabTest(
            patient_id=record.patient_id,
            doctor_id=doc_id,
            test_name=record.title,
            status=models.LabTestStatus.completed,
            result_notes=record.description,
            file_url=record.file_url
        )
        db.add(lab_test)
        
    db.commit()

    return record


@router.get("/my", response_model=list[schemas.MedicalRecordOut])
def my_records(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role("patient")),
):
    return (
        db.query(models.MedicalRecord)
        .filter(models.MedicalRecord.patient_id == current_user.id)
        .order_by(models.MedicalRecord.created_at.desc())
        .all()
    )


@router.get("/patient/{patient_id}", response_model=list[schemas.MedicalRecordOut])
def patient_records(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role("doctor", "admin")),
):
    return (
        db.query(models.MedicalRecord)
        .filter(models.MedicalRecord.patient_id == patient_id)
        .order_by(models.MedicalRecord.created_at.desc())
        .all()
    )


@router.delete("/{record_id}")
def delete_record(
    record_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role("doctor", "admin")),
):
    record = db.query(models.MedicalRecord).filter(models.MedicalRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    db.delete(record)
    db.commit()
    return {"detail": "Record deleted successfully"}
