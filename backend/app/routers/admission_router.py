from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from app.database import get_db
from app import models, schemas, auth

router = APIRouter(prefix="/api/admissions", tags=["Admissions"])

@router.post("", response_model=schemas.AdmissionResponse)
def admit_patient(
    admission_in: schemas.AdmissionCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    if current_user.role not in ['admin', 'doctor']:
        raise HTTPException(status_code=403, detail="Not authorized to admit patients")

    # Verify patient exists
    patient = db.query(models.User).filter(models.User.id == admission_in.patient_id, models.User.role == "patient").first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    # Verify bed is available
    bed = db.query(models.HospitalBed).filter(models.HospitalBed.id == admission_in.bed_id).first()
    if not bed:
        raise HTTPException(status_code=404, detail="Bed not found")
    if bed.is_occupied:
        raise HTTPException(status_code=400, detail="Bed is already occupied")

    # Create Admission
    admission = models.Admission(
        patient_id=admission_in.patient_id,
        doctor_id=current_user.id if current_user.role == 'doctor' else None,
        bed_id=admission_in.bed_id,
        reason_for_admission=admission_in.reason_for_admission,
        status="active"
    )
    db.add(admission)
    
    # Update Bed
    bed.is_occupied = True
    bed.current_patient_id = admission_in.patient_id
    bed.admission_date = datetime.utcnow()
    
    db.commit()
    db.refresh(admission)
    return admission

@router.post("/{admission_id}/discharge", response_model=schemas.AdmissionResponse)
def discharge_patient(
    admission_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    if current_user.role not in ['admin', 'doctor']:
        raise HTTPException(status_code=403, detail="Not authorized to discharge patients")

    admission = db.query(models.Admission).filter(models.Admission.id == admission_id).first()
    if not admission:
        raise HTTPException(status_code=404, detail="Admission not found")
        
    if admission.status == "discharged":
        raise HTTPException(status_code=400, detail="Patient already discharged")

    # Update Admission
    admission.status = "discharged"
    admission.discharge_date = datetime.utcnow()
    
    # Free the Bed
    bed = db.query(models.HospitalBed).filter(models.HospitalBed.id == admission.bed_id).first()
    if bed:
        bed.is_occupied = False
        bed.current_patient_id = None
        bed.admission_date = None
        
    db.commit()
    db.refresh(admission)
    return admission

@router.get("", response_model=List[schemas.AdmissionResponse])
def get_admissions(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    if current_user.role not in ['admin', 'doctor']:
        raise HTTPException(status_code=403, detail="Not authorized to view admissions")
        
    return db.query(models.Admission).order_by(models.Admission.admission_date.desc()).all()
