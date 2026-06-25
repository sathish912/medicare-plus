from typing import List
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import TimeSlot, User, UserRole
from app.schemas import TimeSlotCreate, TimeSlotOut
from app.auth import get_current_user

router = APIRouter(prefix="/api/schedules", tags=["Schedules"])

@router.post("/", response_model=List[TimeSlotOut])
def create_time_slot(
    slot_in: TimeSlotCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != UserRole.doctor:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only doctors can create time slots")
    
    if slot_in.start_time >= slot_in.end_time:
        raise HTTPException(status_code=400, detail="Start time must be before end time")
        
    # Generate 30-minute intervals
    from datetime import datetime, timedelta
    
    start_dt = datetime.combine(slot_in.slot_date, slot_in.start_time)
    end_dt = datetime.combine(slot_in.slot_date, slot_in.end_time)
    
    created_slots = []
    current_time = start_dt
    
    while current_time + timedelta(minutes=30) <= end_dt:
        next_time = current_time + timedelta(minutes=30)
        
        # Check overlaps for this specific interval
        overlapping_slot = db.query(TimeSlot).filter(
            TimeSlot.doctor_id == current_user.id,
            TimeSlot.slot_date == slot_in.slot_date,
            TimeSlot.start_time < next_time.time(),
            TimeSlot.end_time > current_time.time()
        ).first()
        
        if not overlapping_slot:
            new_slot = TimeSlot(
                doctor_id=current_user.id,
                slot_date=slot_in.slot_date,
                start_time=current_time.time(),
                end_time=next_time.time(),
                is_booked=False
            )
            db.add(new_slot)
            created_slots.append(new_slot)
            
        current_time = next_time
        
    db.commit()
    for s in created_slots:
        db.refresh(s)
        
    return created_slots

@router.get("/{doctor_id}", response_model=List[TimeSlotOut])
def get_doctor_slots(
    doctor_id: int,
    slot_date: date = None,
    db: Session = Depends(get_db),
):
    query = db.query(TimeSlot).filter(TimeSlot.doctor_id == doctor_id)
    if slot_date:
        query = query.filter(TimeSlot.slot_date == slot_date)
        
    # Sort by date and time
    slots = query.order_by(TimeSlot.slot_date, TimeSlot.start_time).all()
    return slots

@router.delete("/{slot_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_time_slot(
    slot_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != UserRole.doctor:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only doctors can delete time slots")
        
    slot = db.query(TimeSlot).filter(TimeSlot.id == slot_id).first()
    if not slot:
        raise HTTPException(status_code=404, detail="Time slot not found")
        
    if slot.doctor_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your time slot")
        
    if slot.is_booked:
        raise HTTPException(status_code=400, detail="Cannot delete a booked time slot")
        
    db.delete(slot)
    db.commit()
    return
