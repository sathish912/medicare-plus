from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import uuid
from datetime import datetime
from pydantic import BaseModel

from app.database import get_db
from app.models import Invoice, Appointment, User, UserRole
from app.schemas import InvoiceCreate, InvoiceOut, InvoiceUpdate
from app.auth import get_current_user
from app.utils.audit_logger import log_action

router = APIRouter(prefix="/api/billing", tags=["Billing"])

class DirectBillCreate(BaseModel):
    patient_id: int
    amount: float
    description: Optional[str] = "Hospital Stay Charges"

@router.post("/direct", response_model=InvoiceOut)
def create_direct_invoice(
    bill_in: DirectBillCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role not in [UserRole.admin, UserRole.doctor]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough privileges")
    
    doc_id = current_user.id if current_user.role == UserRole.doctor else 1
    
    appt = Appointment(
        patient_id=bill_in.patient_id,
        doctor_id=doc_id,
        appointment_date=datetime.utcnow().date(),
        appointment_time=datetime.utcnow().time(),
        reason=bill_in.description or "Hospital Stay Charges",
        status="completed"
    )
    db.add(appt)
    db.commit()
    db.refresh(appt)
    
    new_inv = Invoice(
        appointment_id=appt.id,
        patient_id=bill_in.patient_id,
        amount=bill_in.amount,
        status="pending"
    )
    db.add(new_inv)
    db.commit()
    db.refresh(new_inv)
    return new_inv

@router.post("/", response_model=InvoiceOut)
def create_invoice(
    invoice_in: InvoiceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role not in [UserRole.admin, UserRole.doctor]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough privileges")
    
    appointment = db.query(Appointment).filter(Appointment.id == invoice_in.appointment_id).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
        
    existing_invoice = db.query(Invoice).filter(Invoice.appointment_id == appointment.id).first()
    if existing_invoice:
        raise HTTPException(status_code=400, detail="Invoice already exists for this appointment")
        
    new_invoice = Invoice(
        appointment_id=appointment.id,
        patient_id=appointment.patient_id,
        amount=invoice_in.amount,
        status="pending"
    )
    db.add(new_invoice)
    db.commit()
    db.refresh(new_invoice)
    return new_invoice

@router.get("/my-invoices", response_model=List[InvoiceOut])
def get_my_invoices(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != UserRole.patient:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only patients can view their bills here")
        
    invoices = db.query(Invoice).filter(Invoice.patient_id == current_user.id).all()
    return invoices

@router.get("/", response_model=List[InvoiceOut])
def get_all_invoices(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != UserRole.admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough privileges")
        
    invoices = db.query(Invoice).all()
    return invoices

@router.put("/{invoice_id}/pay", response_model=InvoiceOut)
def pay_invoice(
    invoice_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Mock payment endpoint
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
        
    if invoice.patient_id != current_user.id and current_user.role != UserRole.admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough privileges")
        
    if invoice.status == "paid":
        raise HTTPException(status_code=400, detail="Invoice is already paid")
        
    invoice.status = "paid"
    invoice.transaction_id = f"txn_{uuid.uuid4().hex[:12]}"
    db.commit()
    db.refresh(invoice)
    
    log_action(db, current_user.id, "PAY_INVOICE", f"Paid invoice {invoice.id} for amount {invoice.amount}")
    
    return invoice

@router.get("/{id}/download")
def download_invoice(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from fastapi.responses import Response
    from app.utils.pdf_generator import generate_invoice_pdf
    
    invoice = db.query(Invoice).filter(Invoice.id == id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
        
    if invoice.patient_id != current_user.id and current_user.role != UserRole.admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough privileges")
        
    pdf_bytes = generate_invoice_pdf(
        invoice, 
        invoice.appointment, 
        invoice.patient
    )
    
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=invoice_{id}.pdf"
        }
    )
