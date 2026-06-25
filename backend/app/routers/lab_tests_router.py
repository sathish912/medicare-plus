from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
import json

from app.database import get_db
from app.models import LabTest, User, UserRole, LabTestStatus
from app.schemas import LabTestCreate, LabTestUpdate, LabTestOut
from app.auth import get_current_user
from app.utils.s3 import upload_file_to_s3

router = APIRouter(prefix="/api/lab-tests", tags=["Lab Tests"])

@router.post("/", response_model=LabTestOut, status_code=status.HTTP_201_CREATED)
def request_lab_test(
    data: LabTestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != UserRole.doctor:
        raise HTTPException(status_code=403, detail="Only doctors can request lab tests")
        
    new_test = LabTest(
        patient_id=data.patient_id,
        doctor_id=current_user.id,
        appointment_id=data.appointment_id,
        test_name=data.test_name,
        status=LabTestStatus.pending
    )
    db.add(new_test)
    db.commit()
    db.refresh(new_test)
    
    return _format_lab_test(new_test)


@router.get("/", response_model=List[LabTestOut])
def get_lab_tests(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(LabTest)
    
    if current_user.role == UserRole.patient:
        query = query.filter(LabTest.patient_id == current_user.id)
    elif current_user.role == UserRole.doctor:
        query = query.filter(LabTest.doctor_id == current_user.id)
        
    tests = query.order_by(LabTest.created_at.desc()).all()
    return [_format_lab_test(t) for t in tests]


@router.put("/{test_id}", response_model=LabTestOut)
def update_lab_test(
    test_id: int,
    status: str = Form(...),
    result_notes: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role not in [UserRole.doctor, UserRole.admin]:
        raise HTTPException(status_code=403, detail="Not authorized to update test results")
        
    test = db.query(LabTest).filter(LabTest.id == test_id).first()
    if not test:
        raise HTTPException(status_code=404, detail="Lab test not found")
        
    test.status = status
    if result_notes is not None:
        test.result_notes = result_notes
        
    if file:
        file_url = upload_file_to_s3(file)
        test.file_url = file_url
        
    db.commit()
    db.refresh(test)
    return _format_lab_test(test)


@router.delete("/{test_id}")
def delete_lab_test(
    test_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role not in [UserRole.doctor, UserRole.admin]:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    test = db.query(LabTest).filter(LabTest.id == test_id).first()
    if not test:
        raise HTTPException(status_code=404, detail="Lab test not found")
        
    db.delete(test)
    db.commit()
    return {"detail": "Lab test deleted successfully"}


def _format_lab_test(test: LabTest) -> dict:
    return {
        "id": test.id,
        "patient_id": test.patient_id,
        "doctor_id": test.doctor_id,
        "appointment_id": test.appointment_id,
        "test_name": test.test_name,
        "status": test.status,
        "result_notes": test.result_notes,
        "file_url": test.file_url,
        "created_at": test.created_at,
        "updated_at": test.updated_at,
        "patient_name": test.patient.full_name if test.patient else None,
        "doctor_name": test.doctor.full_name if test.doctor else None,
    }
