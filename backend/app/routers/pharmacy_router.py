from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app import models, schemas, auth

router = APIRouter(prefix="/api/pharmacy", tags=["Pharmacy"])


@router.get("/medicines", response_model=List[schemas.MedicineOut])
def get_medicines(
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(models.Medicine)
    if search:
        query = query.filter(models.Medicine.name.ilike(f"%{search}%"))
    return query.order_by(models.Medicine.name.asc()).all()


@router.post("/medicines", response_model=schemas.MedicineOut)
def create_medicine(
    medicine_in: schemas.MedicineCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role("admin"))
):
    medicine = models.Medicine(**medicine_in.model_dump())
    db.add(medicine)
    db.commit()
    db.refresh(medicine)
    return medicine


@router.post("/orders", response_model=schemas.PharmacyOrderOut)
def place_order(
    order_in: schemas.PharmacyOrderCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    if not order_in.items:
        raise HTTPException(status_code=400, detail="Order must contain at least one item")

    # Verify stock and calculate total
    total_amount = 0.0
    order_items = []
    
    for item_in in order_in.items:
        medicine = db.query(models.Medicine).filter(models.Medicine.id == item_in.medicine_id).first()
        if not medicine:
            raise HTTPException(status_code=404, detail=f"Medicine ID {item_in.medicine_id} not found")
        if medicine.stock < item_in.quantity:
            raise HTTPException(status_code=400, detail=f"Insufficient stock for {medicine.name}")
            
        # Deduct stock
        medicine.stock -= item_in.quantity
        
        # Calculate cost
        item_cost = medicine.price * item_in.quantity
        total_amount += item_cost
        
        order_items.append({
            "medicine_id": medicine.id,
            "quantity": item_in.quantity,
            "unit_price": medicine.price
        })

    # Create Order
    new_order = models.PharmacyOrder(
        patient_id=current_user.id,
        total_amount=total_amount,
        shipping_address=order_in.shipping_address,
        status="pending"
    )
    db.add(new_order)
    db.flush()  # to get new_order.id
    
    # Create Order Items
    for i_data in order_items:
        db_item = models.PharmacyOrderItem(
            order_id=new_order.id,
            medicine_id=i_data["medicine_id"],
            quantity=i_data["quantity"],
            unit_price=i_data["unit_price"]
        )
        db.add(db_item)

    db.commit()
    db.refresh(new_order)
    return new_order


@router.get("/orders/my", response_model=List[schemas.PharmacyOrderOut])
def get_my_orders(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    return (
        db.query(models.PharmacyOrder)
        .filter(models.PharmacyOrder.patient_id == current_user.id)
        .order_by(models.PharmacyOrder.created_at.desc())
        .all()
    )


@router.put("/orders/{order_id}/status", response_model=schemas.PharmacyOrderOut)
def update_order_status(
    order_id: int,
    status: str = Query(..., description="pending, paid, shipped, delivered, cancelled"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role("admin"))
):
    order = db.query(models.PharmacyOrder).filter(models.PharmacyOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
        
    order.status = status
    db.commit()
    db.refresh(order)
    return order
