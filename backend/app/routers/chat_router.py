from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from jose import jwt, JWTError

from app.database import get_db, SessionLocal
from app import models, schemas, auth
from app.utils.chat_manager import manager

router = APIRouter(prefix="/api/chat", tags=["Chat Messaging"])


@router.get("/history/{appointment_id}", response_model=list[schemas.ConsultationMessageOut])
def get_chat_history(
    appointment_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    appt = db.query(models.Appointment).filter(models.Appointment.id == appointment_id).first()
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")
        
    if current_user.id not in (appt.patient_id, appt.doctor_id) and current_user.role != models.UserRole.admin:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    messages = (
        db.query(models.ConsultationMessage)
        .filter(models.ConsultationMessage.appointment_id == appointment_id)
        .order_by(models.ConsultationMessage.created_at.asc())
        .all()
    )
    
    # Manually populate sender_name to match schema
    result = []
    for msg in messages:
        result.append(schemas.ConsultationMessageOut(
            id=msg.id,
            appointment_id=msg.appointment_id,
            sender_id=msg.sender_id,
            content=msg.content,
            created_at=msg.created_at,
            sender_name=msg.sender.full_name if msg.sender else None
        ))
        
    return result


@router.websocket("/ws/{appointment_id}")
async def websocket_endpoint(websocket: WebSocket, appointment_id: int, token: str):
    # Authenticate token
    try:
        payload = jwt.decode(token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
        user_id = payload.get("user_id")
        if not user_id:
            await websocket.close(code=1008)
            return
    except JWTError:
        await websocket.close(code=1008)
        return

    # Check database constraints in a separate session
    db = SessionLocal()
    try:
        user = db.query(models.User).filter(models.User.id == user_id).first()
        appt = db.query(models.Appointment).filter(models.Appointment.id == appointment_id).first()
        
        if not user or not appt:
            await websocket.close(code=1008)
            return
            
        if user.id not in (appt.patient_id, appt.doctor_id) and user.role != models.UserRole.admin:
            await websocket.close(code=1008)
            return
            
    finally:
        db.close()

    await manager.connect(websocket, appointment_id)
    try:
        while True:
            data = await websocket.receive_text()
            
            # Save to db
            db = SessionLocal()
            try:
                # We need to fetch appt again inside loop or rely on previous state, better to fetch to check status
                current_appt = db.query(models.Appointment).filter(models.Appointment.id == appointment_id).first()
                if current_appt.status in (models.AppointmentStatus.completed, models.AppointmentStatus.cancelled):
                    # Refuse to send if closed
                    await websocket.send_json({"error": "Chat is closed because the appointment is completed or cancelled."})
                    continue

                msg = models.ConsultationMessage(
                    appointment_id=appointment_id,
                    sender_id=user.id,
                    content=data
                )
                db.add(msg)
                db.commit()
                db.refresh(msg)
                
                # Broadcast the message
                out_msg = schemas.ConsultationMessageOut(
                    id=msg.id,
                    appointment_id=msg.appointment_id,
                    sender_id=msg.sender_id,
                    content=msg.content,
                    created_at=msg.created_at,
                    sender_name=user.full_name
                )
                
                # We need dict for broadcast
                await manager.broadcast(out_msg.model_dump(mode='json'), appointment_id)
                
            finally:
                db.close()

    except WebSocketDisconnect:
        manager.disconnect(websocket, appointment_id)
