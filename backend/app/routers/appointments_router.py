from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas, auth
from app.utils.audit_logger import log_action

router = APIRouter(prefix="/api/appointments", tags=["Appointments"])


def _serialize(appt: models.Appointment) -> schemas.AppointmentOut:
    return schemas.AppointmentOut(
        id=appt.id,
        patient_id=appt.patient_id,
        doctor_id=appt.doctor_id,
        appointment_date=appt.appointment_date,
        appointment_time=appt.appointment_time,
        reason=appt.reason,
        status=appt.status.value,
        consultation_type=appt.consultation_type,
        notes=appt.notes,
        created_at=appt.created_at,
        patient_name=appt.patient.full_name if appt.patient else None,
        doctor_name=appt.doctor.full_name if appt.doctor else None,
    )


@router.post("", response_model=schemas.AppointmentOut, status_code=201)
def book_appointment(
    payload: schemas.AppointmentCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role("patient")),
):
    doctor = (
        db.query(models.User)
        .filter(models.User.id == payload.doctor_id, models.User.role == models.UserRole.doctor)
        .first()
    )
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")

    clash = (
        db.query(models.Appointment)
        .filter(
            models.Appointment.doctor_id == payload.doctor_id,
            models.Appointment.appointment_date == payload.appointment_date,
            models.Appointment.appointment_time == payload.appointment_time,
            models.Appointment.status.in_(
                [models.AppointmentStatus.pending, models.AppointmentStatus.confirmed]
            ),
        )
        .first()
    )
    if clash:
        raise HTTPException(status_code=409, detail="This time slot is already booked")

    appt = models.Appointment(
        patient_id=current_user.id,
        doctor_id=payload.doctor_id,
        appointment_date=payload.appointment_date,
        appointment_time=payload.appointment_time,
        reason=payload.reason,
        consultation_type=payload.consultation_type or "online",
        status=models.AppointmentStatus.pending,
    )
    db.add(appt)
    db.commit()
    db.refresh(appt)

    note = models.Notification(
        user_id=doctor.id,
        title="New Appointment Request",
        message=f"{current_user.full_name} requested an appointment on {payload.appointment_date} at {payload.appointment_time}.",
    )
    db.add(note)
    db.commit()

    log_action(db, current_user.id, "CREATE_APPOINTMENT", f"Booked appointment with Doctor {doctor.id} on {payload.appointment_date}")

    return _serialize(appt)


@router.get("/my", response_model=list[schemas.AppointmentOut])
def my_appointments(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    if current_user.role == models.UserRole.patient:
        appts = (
            db.query(models.Appointment)
            .filter(models.Appointment.patient_id == current_user.id)
            .order_by(models.Appointment.appointment_date.desc())
            .all()
        )
    elif current_user.role == models.UserRole.doctor:
        appts = (
            db.query(models.Appointment)
            .filter(models.Appointment.doctor_id == current_user.id)
            .order_by(models.Appointment.appointment_date.desc())
            .all()
        )
    else:
        appts = db.query(models.Appointment).order_by(models.Appointment.appointment_date.desc()).all()
    return [_serialize(a) for a in appts]


@router.put("/{appointment_id}/status", response_model=schemas.AppointmentOut)
def update_appointment_status(
    appointment_id: int,
    payload: schemas.AppointmentUpdateStatus,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    appt = db.query(models.Appointment).filter(models.Appointment.id == appointment_id).first()
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")

    if current_user.role == models.UserRole.doctor and appt.doctor_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized for this appointment")
    if current_user.role == models.UserRole.patient:
        if appt.patient_id != current_user.id or payload.status != models.AppointmentStatus.cancelled:
            raise HTTPException(status_code=403, detail="Patients may only cancel their own appointment")

    appt.status = payload.status
    if payload.notes:
        appt.notes = payload.notes
    db.commit()
    db.refresh(appt)

    notify_user_id = appt.patient_id if current_user.role == models.UserRole.doctor else appt.doctor_id
    note = models.Notification(
        user_id=notify_user_id,
        title="Appointment Update",
        message=f"Appointment on {appt.appointment_date} is now '{appt.status.value}'.",
    )
    db.add(note)
    db.commit()

    log_action(db, current_user.id, "UPDATE_APPOINTMENT_STATUS", f"Updated appointment {appt.id} status to {payload.status.value}")

    return _serialize(appt)


@router.put("/{appointment_id}/notes", response_model=schemas.AppointmentOut)
def update_appointment_notes(
    appointment_id: int,
    payload: schemas.AppointmentUpdateNotes,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_role("doctor")),
):
    appt = db.query(models.Appointment).filter(models.Appointment.id == appointment_id).first()
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")

    if appt.doctor_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized for this appointment")

    appt.notes = payload.notes
    db.commit()
    db.refresh(appt)

    return _serialize(appt)


@router.get("/{appointment_id}", response_model=schemas.AppointmentOut)
def get_appointment(
    appointment_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    appt = db.query(models.Appointment).filter(models.Appointment.id == appointment_id).first()
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")
    if current_user.role not in (models.UserRole.admin,) and current_user.id not in (
        appt.patient_id,
        appt.doctor_id,
    ):
        raise HTTPException(status_code=403, detail="Not authorized")
    return _serialize(appt)
