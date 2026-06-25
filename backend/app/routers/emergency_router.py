from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from app.database import get_db
from app import models, schemas, auth

router = APIRouter(prefix="/api/emergencies", tags=["Emergency Services"])

@router.post("", response_model=schemas.EmergencyResponse)
def create_emergency(
    emergency_in: schemas.EmergencyCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    if current_user.role != 'patient':
        raise HTTPException(status_code=403, detail="Only patients can request emergency services directly here")

    req = models.EmergencyRequest(
        patient_id=current_user.id,
        emergency_type=emergency_in.emergency_type,
        location=emergency_in.location,
        contact_number=emergency_in.contact_number,
        status="Pending"
    )
    db.add(req)
    db.commit()
    db.refresh(req)
    return req

@router.get("", response_model=List[schemas.EmergencyResponse])
def get_emergencies(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    if current_user.role == 'patient':
        # Patients only see their own
        return db.query(models.EmergencyRequest).filter(models.EmergencyRequest.patient_id == current_user.id).order_by(models.EmergencyRequest.created_at.desc()).all()
    else:
        # Admins and Doctors see all
        return db.query(models.EmergencyRequest).order_by(models.EmergencyRequest.created_at.desc()).all()

@router.put("/{emergency_id}/status", response_model=schemas.EmergencyResponse)
def update_emergency_status(
    emergency_id: int,
    update_in: schemas.EmergencyUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role("admin", "doctor"))
):
    req = db.query(models.EmergencyRequest).filter(models.EmergencyRequest.id == emergency_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Emergency request not found")

    req.status = update_in.status
    if update_in.status == "Resolved":
        req.resolved_at = datetime.utcnow()
        
    db.commit()
    db.refresh(req)
    return req
