from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app import models, schemas, auth

router = APIRouter(prefix="/api/wards", tags=["Bed Management"])

@router.post("", response_model=schemas.WardResponse)
def create_ward(
    ward_in: schemas.WardCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role("admin"))
):
    # Create the Ward
    ward = models.Ward(name=ward_in.name, capacity=ward_in.capacity)
    db.add(ward)
    db.commit()
    db.refresh(ward)
    
    # Automatically generate Beds
    for i in range(1, ward.capacity + 1):
        bed = models.HospitalBed(
            ward_id=ward.id,
            bed_number=f"{ward.name}-{i}",
            is_occupied=False
        )
        db.add(bed)
    
    db.commit()
    db.refresh(ward)
    return ward

@router.get("", response_model=List[schemas.WardResponse])
def get_wards(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    # Only admins and doctors can view wards
    if current_user.role not in ['admin', 'doctor']:
        raise HTTPException(status_code=403, detail="Not authorized to view wards")
        
    wards = db.query(models.Ward).all()
    
    # Calculate aggregates for the dashboard
    for ward in wards:
        ward.occupied_beds = sum(1 for bed in ward.beds if bed.is_occupied)
        ward.available_beds = ward.capacity - ward.occupied_beds
        
    return wards

@router.get("/{ward_id}/beds", response_model=List[schemas.HospitalBedResponse])
def get_ward_beds(
    ward_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    if current_user.role not in ['admin', 'doctor']:
        raise HTTPException(status_code=403, detail="Not authorized to view beds")
        
    ward = db.query(models.Ward).filter(models.Ward.id == ward_id).first()
    if not ward:
        raise HTTPException(status_code=404, detail="Ward not found")
        
    return ward.beds
