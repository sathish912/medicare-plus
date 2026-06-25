from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas, auth

router = APIRouter(prefix="/api/doctors", tags=["Doctors"])


@router.get("", response_model=list[schemas.DoctorOut])
def list_doctors(specialization: str | None = None, db: Session = Depends(get_db)):
    query = (
        db.query(models.User)
        .join(models.DoctorProfile)
        .filter(models.User.role == models.UserRole.doctor, models.User.is_active == True)
    )
    if specialization:
        query = query.filter(models.DoctorProfile.specialization.ilike(f"%{specialization}%"))
    return query.all()


@router.get("/{doctor_id}", response_model=schemas.DoctorOut)
def get_doctor(doctor_id: int, db: Session = Depends(get_db)):
    doctor = (
        db.query(models.User)
        .filter(models.User.id == doctor_id, models.User.role == models.UserRole.doctor)
        .first()
    )
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
    return doctor


@router.put("/profile", response_model=schemas.DoctorProfileOut)
def update_doctor_profile(
    payload: schemas.DoctorProfileUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role("doctor")),
):
    profile = (
        db.query(models.DoctorProfile)
        .filter(models.DoctorProfile.user_id == current_user.id)
        .first()
    )
    if not profile:
        raise HTTPException(status_code=404, detail="Doctor profile not found")
    for field, value in payload.dict(exclude_unset=True).items():
        setattr(profile, field, value)
    db.commit()
    db.refresh(profile)
    return profile

@router.put("/{doctor_id}/profile", response_model=schemas.DoctorProfileOut)
def admin_update_doctor_profile(
    doctor_id: int,
    payload: schemas.DoctorProfileUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role("admin")),
):
    profile = (
        db.query(models.DoctorProfile)
        .filter(models.DoctorProfile.user_id == doctor_id)
        .first()
    )
    if not profile:
        raise HTTPException(status_code=404, detail="Doctor profile not found")
    for field, value in payload.dict(exclude_unset=True).items():
        setattr(profile, field, value)
    db.commit()
    db.refresh(profile)
    return profile
