from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, date

from app.database import get_db
from app import models, schemas, auth

router = APIRouter(prefix="/api/reminders", tags=["Reminders"])

@router.post("", response_model=schemas.ReminderResponse)
def create_reminder(
    reminder_in: schemas.ReminderCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    reminder = models.MedicineReminder(**reminder_in.model_dump(), patient_id=current_user.id)
    db.add(reminder)
    db.commit()
    db.refresh(reminder)
    return reminder

@router.get("", response_model=List[schemas.ReminderResponse])
def get_reminders(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    query = db.query(models.MedicineReminder).filter(models.MedicineReminder.is_active == True)
    if current_user.role != models.UserRole.admin:
        query = query.filter(models.MedicineReminder.patient_id == current_user.id)
    return query.all()

@router.post("/{reminder_id}/log", response_model=schemas.ReminderLogResponse)
def log_reminder(
    reminder_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    query = db.query(models.MedicineReminder).filter(models.MedicineReminder.id == reminder_id)
    if current_user.role != models.UserRole.admin:
        query = query.filter(models.MedicineReminder.patient_id == current_user.id)
    reminder = query.first()
    
    if not reminder:
        raise HTTPException(status_code=404, detail="Reminder not found")
        
    today_start = datetime.combine(date.today(), datetime.min.time())
    existing_log = db.query(models.ReminderLog).filter(
        models.ReminderLog.reminder_id == reminder_id,
        models.ReminderLog.taken_at >= today_start
    ).first()
    
    if existing_log:
        raise HTTPException(status_code=400, detail="Already marked as taken today")
        
    log = models.ReminderLog(reminder_id=reminder_id, patient_id=reminder.patient_id)
    db.add(log)
    db.commit()
    db.refresh(log)
    return log

@router.get("/logs", response_model=List[schemas.ReminderLogResponse])
def get_reminder_logs(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    query = db.query(models.ReminderLog)
    if current_user.role != models.UserRole.admin:
        query = query.filter(models.ReminderLog.patient_id == current_user.id)
    return query.order_by(models.ReminderLog.taken_at.desc()).all()
