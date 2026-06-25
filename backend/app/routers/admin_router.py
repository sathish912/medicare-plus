from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models import User, UserRole, Appointment, Invoice
from app.schemas import DashboardStatsOut
from app.auth import get_current_user

router = APIRouter(prefix="/admin", tags=["Admin Dashboard"])

@router.get("/stats", response_model=DashboardStatsOut)
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != UserRole.admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
        
    total_patients = db.query(User).filter(User.role == UserRole.patient, User.is_active == True).count()
    total_doctors = db.query(User).filter(User.role == UserRole.doctor, User.is_active == True).count()
    total_appointments = db.query(Appointment).count()
    
    total_revenue_result = db.query(func.sum(Invoice.amount)).filter(Invoice.status == "paid").scalar()
    total_revenue = float(total_revenue_result) if total_revenue_result else 0.0
    
    return DashboardStatsOut(
        total_patients=total_patients,
        total_doctors=total_doctors,
        total_appointments=total_appointments,
        total_revenue=total_revenue
    )

@router.get("/audit-logs")
def get_audit_logs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    limit: int = 100
):
    if current_user.role != UserRole.admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
        
    from app.models import AuditLog
    
    # We join with User to get names, but return as dict to match schema easily
    logs = (
        db.query(AuditLog, User.full_name, User.role)
        .outerjoin(User, AuditLog.user_id == User.id)
        .order_by(AuditLog.created_at.desc())
        .limit(limit)
        .all()
    )
    
    result = []
    for log, name, role in logs:
        result.append({
            "id": log.id,
            "user_id": log.user_id,
            "action": log.action,
            "details": log.details,
            "ip_address": log.ip_address,
            "created_at": log.created_at,
            "user_name": name,
            "user_role": role.value if role else None
        })
        
    return result
