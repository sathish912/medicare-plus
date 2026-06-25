from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime

from app.database import get_db
from app.models import User, UserRole, InsuranceDetails, InsuranceClaim, Invoice
from app.schemas import InsuranceDetailsCreate, InsuranceDetailsOut, InsuranceClaimCreate, InsuranceClaimOut
from app.auth import get_current_user, require_role

router = APIRouter(prefix="/api/insurance", tags=["Insurance"])

def _serialize_details(details: InsuranceDetails) -> InsuranceDetailsOut:
    return InsuranceDetailsOut(
        id=details.id,
        patient_id=details.patient_id,
        provider_name=details.provider_name,
        policy_number=details.policy_number,
        group_number=details.group_number,
        status=details.status,
        created_at=details.created_at,
        patient_name=details.patient.full_name if details.patient else None,
    )

def _serialize_claim(claim: InsuranceClaim) -> InsuranceClaimOut:
    return InsuranceClaimOut(
        id=claim.id,
        patient_id=claim.patient_id,
        invoice_id=claim.invoice_id,
        claim_amount=claim.claim_amount,
        status=claim.status,
        created_at=claim.created_at,
        resolved_at=claim.resolved_at,
        patient_name=claim.patient.full_name if claim.patient else None,
    )

# --- Patient Endpoints ---

@router.get("/details/my", response_model=InsuranceDetailsOut)
def get_my_insurance_details(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("patient"))
):
    details = db.query(InsuranceDetails).filter(InsuranceDetails.patient_id == current_user.id).first()
    if not details:
        raise HTTPException(status_code=404, detail="Insurance details not found")
    return _serialize_details(details)

@router.post("/details", response_model=InsuranceDetailsOut)
def create_or_update_my_insurance(
    payload: InsuranceDetailsCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("patient"))
):
    details = db.query(InsuranceDetails).filter(InsuranceDetails.patient_id == current_user.id).first()
    if details:
        details.provider_name = payload.provider_name
        details.policy_number = payload.policy_number
        details.group_number = payload.group_number
        details.status = "unverified" # reset status on update
    else:
        details = InsuranceDetails(
            patient_id=current_user.id,
            provider_name=payload.provider_name,
            policy_number=payload.policy_number,
            group_number=payload.group_number,
            status="unverified"
        )
        db.add(details)
    
    db.commit()
    db.refresh(details)
    return _serialize_details(details)


@router.get("/claims/my", response_model=List[InsuranceClaimOut])
def get_my_claims(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("patient"))
):
    claims = db.query(InsuranceClaim).filter(InsuranceClaim.patient_id == current_user.id).order_by(InsuranceClaim.created_at.desc()).all()
    return [_serialize_claim(c) for c in claims]

@router.post("/claims", response_model=InsuranceClaimOut)
def submit_claim(
    payload: InsuranceClaimCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("patient"))
):
    details = db.query(InsuranceDetails).filter(InsuranceDetails.patient_id == current_user.id).first()
    if not details or details.status != "verified":
        raise HTTPException(status_code=400, detail="Must have verified insurance details to submit a claim")

    invoice = db.query(Invoice).filter(Invoice.id == payload.invoice_id).first()
    if not invoice or invoice.patient_id != current_user.id:
        raise HTTPException(status_code=404, detail="Invoice not found or unauthorized")
        
    existing_claim = db.query(InsuranceClaim).filter(InsuranceClaim.invoice_id == invoice.id).first()
    if existing_claim:
        raise HTTPException(status_code=400, detail="Claim already submitted for this invoice")

    claim = InsuranceClaim(
        patient_id=current_user.id,
        invoice_id=payload.invoice_id,
        claim_amount=payload.claim_amount,
        status="submitted"
    )
    db.add(claim)
    db.commit()
    db.refresh(claim)
    return _serialize_claim(claim)


# --- Admin Endpoints ---

@router.get("/details/all", response_model=List[InsuranceDetailsOut])
def get_all_insurance_details(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin"))
):
    details = db.query(InsuranceDetails).all()
    return [_serialize_details(d) for d in details]

@router.put("/details/{id}/status", response_model=InsuranceDetailsOut)
def update_insurance_details_status(
    id: int,
    status: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin"))
):
    details = db.query(InsuranceDetails).filter(InsuranceDetails.id == id).first()
    if not details:
        raise HTTPException(status_code=404, detail="Insurance details not found")
    
    details.status = status
    db.commit()
    db.refresh(details)
    return _serialize_details(details)


@router.get("/claims/all", response_model=List[InsuranceClaimOut])
def get_all_claims(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin"))
):
    claims = db.query(InsuranceClaim).order_by(InsuranceClaim.created_at.desc()).all()
    return [_serialize_claim(c) for c in claims]

@router.put("/claims/{id}/status", response_model=InsuranceClaimOut)
def update_claim_status(
    id: int,
    status: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin"))
):
    claim = db.query(InsuranceClaim).filter(InsuranceClaim.id == id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    
    claim.status = status
    if status in ["approved", "rejected"]:
        claim.resolved_at = datetime.utcnow()
        
    db.commit()
    db.refresh(claim)
    return _serialize_claim(claim)
