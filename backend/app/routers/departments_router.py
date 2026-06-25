from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List

from app.database import get_db
from app.models import Department, User, UserRole, DoctorProfile, Appointment, Invoice
from app.schemas import DepartmentCreate, DepartmentUpdate, DepartmentOut, DepartmentStatsOut
from app.auth import get_current_user

router = APIRouter(prefix="/api/departments", tags=["Departments"])


@router.post("/", response_model=DepartmentOut, status_code=status.HTTP_201_CREATED)
def create_department(
    data: DepartmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != UserRole.admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    existing = db.query(Department).filter(Department.name == data.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Department with this name already exists")
    
    new_dept = Department(name=data.name, description=data.description)
    db.add(new_dept)
    db.commit()
    db.refresh(new_dept)
    return new_dept


@router.get("/", response_model=List[DepartmentOut])
def get_departments(db: Session = Depends(get_db)):
    return db.query(Department).all()


@router.get("/stats", response_model=List[DepartmentStatsOut])
def get_department_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != UserRole.admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    departments = db.query(Department).all()
    stats = []
    
    for dept in departments:
        # Number of doctors in this department
        total_doctors = db.query(DoctorProfile).filter(DoctorProfile.department_id == dept.id).count()
        
        # Total appointments for doctors in this department
        # We join Appointment and DoctorProfile
        total_appointments = db.query(Appointment).join(
            DoctorProfile, Appointment.doctor_id == DoctorProfile.user_id
        ).filter(DoctorProfile.department_id == dept.id).count()
        
        # Total revenue for doctors in this department
        # We join Invoice -> Appointment -> DoctorProfile
        total_revenue_result = db.query(func.sum(Invoice.amount)).join(
            Appointment, Invoice.appointment_id == Appointment.id
        ).join(
            DoctorProfile, Appointment.doctor_id == DoctorProfile.user_id
        ).filter(
            DoctorProfile.department_id == dept.id,
            Invoice.status == "paid"
        ).scalar()
        
        total_revenue = float(total_revenue_result) if total_revenue_result else 0.0
        
        stats.append(DepartmentStatsOut(
            department_id=dept.id,
            department_name=dept.name,
            total_doctors=total_doctors,
            total_appointments=total_appointments,
            total_revenue=total_revenue
        ))
        
    return stats


@router.put("/{dept_id}", response_model=DepartmentOut)
def update_department(
    dept_id: int,
    data: DepartmentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != UserRole.admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    dept = db.query(Department).filter(Department.id == dept_id).first()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
        
    if data.name:
        existing = db.query(Department).filter(Department.name == data.name, Department.id != dept_id).first()
        if existing:
            raise HTTPException(status_code=400, detail="Department with this name already exists")
        dept.name = data.name
        
    if data.description is not None:
        dept.description = data.description
        
    db.commit()
    db.refresh(dept)
    return dept


@router.delete("/{dept_id}")
def delete_department(
    dept_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != UserRole.admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    dept = db.query(Department).filter(Department.id == dept_id).first()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
        
    # Optional: check if there are doctors assigned and prevent deletion, or they get ON DELETE SET NULL
    db.delete(dept)
    db.commit()
    return {"detail": "Department deleted"}
