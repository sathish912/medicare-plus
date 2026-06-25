from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models import DoctorReview, Appointment, User, UserRole, DoctorProfile
from app.schemas import ReviewCreate, ReviewOut
from app.auth import get_current_user

router = APIRouter(prefix="/reviews", tags=["Reviews"])

@router.post("/", response_model=ReviewOut)
def create_review(
    review_in: ReviewCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != UserRole.patient:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only patients can write reviews")
    
    appointment = db.query(Appointment).filter(Appointment.id == review_in.appointment_id).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
        
    if appointment.patient_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your appointment")
        
    if appointment.status != "completed":
        raise HTTPException(status_code=400, detail="Can only review completed appointments")
        
    existing_review = db.query(DoctorReview).filter(DoctorReview.appointment_id == appointment.id).first()
    if existing_review:
        raise HTTPException(status_code=400, detail="You already reviewed this appointment")
        
    if not (1.0 <= review_in.rating <= 5.0):
        raise HTTPException(status_code=400, detail="Rating must be between 1.0 and 5.0")
        
    new_review = DoctorReview(
        patient_id=current_user.id,
        doctor_id=appointment.doctor_id,
        appointment_id=appointment.id,
        rating=review_in.rating,
        comment=review_in.comment
    )
    db.add(new_review)
    db.commit()
    db.refresh(new_review)
    
    # Recalculate doctor rating
    avg_rating = db.query(func.avg(DoctorReview.rating)).filter(DoctorReview.doctor_id == appointment.doctor_id).scalar()
    doctor_profile = db.query(DoctorProfile).filter(DoctorProfile.user_id == appointment.doctor_id).first()
    if doctor_profile and avg_rating is not None:
        doctor_profile.rating = round(float(avg_rating), 1)
        db.commit()
        
    return new_review

@router.get("/doctor/{doctor_id}", response_model=List[ReviewOut])
def get_doctor_reviews(
    doctor_id: int,
    db: Session = Depends(get_db),
):
    reviews = db.query(DoctorReview).filter(DoctorReview.doctor_id == doctor_id).all()
    return reviews
