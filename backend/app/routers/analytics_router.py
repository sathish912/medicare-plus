from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app import models, schemas, auth

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])

@router.post("/metrics", response_model=schemas.HealthMetricResponse)
def log_metric(
    metric_in: schemas.HealthMetricCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role("patient"))
):
    metric = models.HealthMetric(**metric_in.model_dump(), patient_id=current_user.id)
    db.add(metric)
    db.commit()
    db.refresh(metric)
    return metric

@router.get("/metrics/my", response_model=List[schemas.HealthMetricResponse])
def get_my_metrics(
    metric_type: str = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role("patient"))
):
    query = db.query(models.HealthMetric).filter(models.HealthMetric.patient_id == current_user.id)
    if metric_type:
        query = query.filter(models.HealthMetric.metric_type == metric_type)
    return query.order_by(models.HealthMetric.recorded_at.asc()).all()

@router.post("/sync-wearable")
def sync_wearable_data(
    provider: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role("patient"))
):
    import random
    from datetime import datetime, timedelta
    
    # Generate mock data for the past 3 days
    now = datetime.utcnow()
    new_metrics = []
    
    for day_offset in range(3, -1, -1):
        target_date = now - timedelta(days=day_offset)
        
        # Random Steps (between 4000 and 12000)
        steps = random.randint(4000, 12000)
        new_metrics.append(models.HealthMetric(
            patient_id=current_user.id,
            metric_type="steps",
            value=steps,
            unit="steps",
            recorded_at=target_date
        ))
        
        # Random Average Heart Rate (between 65 and 85)
        hr = random.randint(65, 85)
        new_metrics.append(models.HealthMetric(
            patient_id=current_user.id,
            metric_type="heart_rate",
            value=hr,
            unit="bpm",
            recorded_at=target_date
        ))
        
        # Random active calories (between 300 and 800)
        cals = random.randint(300, 800)
        new_metrics.append(models.HealthMetric(
            patient_id=current_user.id,
            metric_type="active_calories",
            value=cals,
            unit="kcal",
            recorded_at=target_date
        ))
        
    for metric in new_metrics:
        db.add(metric)
        
    db.commit()
    
    return {"message": f"Successfully synced {len(new_metrics)} records from {provider}"}
