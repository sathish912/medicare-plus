from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app import models, schemas, auth

router = APIRouter(prefix="/api/feedback", tags=["Patient Feedback"])

@router.post("", response_model=schemas.FeedbackResponse)
def submit_feedback(
    feedback_in: schemas.FeedbackCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    if current_user.role != 'patient':
        raise HTTPException(status_code=403, detail="Only patients can submit feedback")

    if feedback_in.rating < 1 or feedback_in.rating > 5:
        raise HTTPException(status_code=400, detail="Rating must be between 1 and 5")

    feedback = models.PatientFeedback(
        patient_id=current_user.id,
        rating=feedback_in.rating,
        comments=feedback_in.comments
    )
    db.add(feedback)
    db.commit()
    db.refresh(feedback)
    return feedback

@router.get("", response_model=List[schemas.FeedbackResponse])
def get_all_feedback(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    if current_user.role not in ['admin', 'doctor']:
        raise HTTPException(status_code=403, detail="Not authorized to view all feedback")
        
    return db.query(models.PatientFeedback).order_by(models.PatientFeedback.created_at.desc()).all()

@router.get("/analytics", response_model=schemas.FeedbackAnalyticsResponse)
def get_feedback_analytics(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    if current_user.role not in ['admin', 'doctor']:
        raise HTTPException(status_code=403, detail="Not authorized to view analytics")

    all_feedback = db.query(models.PatientFeedback).all()
    total = len(all_feedback)
    
    if total == 0:
        return schemas.FeedbackAnalyticsResponse(
            average_rating=0.0,
            total_reviews=0,
            rating_distribution={"1": 0, "2": 0, "3": 0, "4": 0, "5": 0}
        )

    avg = sum(f.rating for f in all_feedback) / total
    
    distribution = {
        "1": sum(1 for f in all_feedback if f.rating == 1),
        "2": sum(1 for f in all_feedback if f.rating == 2),
        "3": sum(1 for f in all_feedback if f.rating == 3),
        "4": sum(1 for f in all_feedback if f.rating == 4),
        "5": sum(1 for f in all_feedback if f.rating == 5),
    }

    return schemas.FeedbackAnalyticsResponse(
        average_rating=round(avg, 1),
        total_reviews=total,
        rating_distribution=distribution
    )
