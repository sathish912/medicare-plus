import enum
from datetime import datetime

from sqlalchemy import (
    Column,
    Integer,
    String,
    Boolean,
    DateTime,
    Text,
    ForeignKey,
    Enum,
    Float,
    Date,
    Time,
)
from sqlalchemy.orm import relationship

from app.database import Base


class UserRole(str, enum.Enum):
    patient = "patient"
    doctor = "doctor"
    admin = "admin"


class AppointmentStatus(str, enum.Enum):
    pending = "pending"
    confirmed = "confirmed"
    completed = "completed"
    cancelled = "cancelled"
    rejected = "rejected"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(150), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    phone = Column(String(20), nullable=True)
    role = Column(Enum(UserRole), default=UserRole.patient, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Patient-specific fields
    date_of_birth = Column(Date, nullable=True)
    gender = Column(String(20), nullable=True)
    blood_group = Column(String(10), nullable=True)
    address = Column(String(255), nullable=True)

    doctor_profile = relationship(
        "DoctorProfile", back_populates="user", uselist=False, cascade="all, delete"
    )

    patient_appointments = relationship(
        "Appointment",
        foreign_keys="Appointment.patient_id",
        back_populates="patient",
    )
    doctor_appointments = relationship(
        "Appointment",
        foreign_keys="Appointment.doctor_id",
        back_populates="doctor",
    )

    medical_records = relationship(
        "MedicalRecord",
        foreign_keys="MedicalRecord.patient_id",
        back_populates="patient",
        cascade="all, delete",
    )

    notifications = relationship(
        "Notification", back_populates="user", cascade="all, delete"
    )


class Department(Base):
    __tablename__ = "departments"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    doctors = relationship("DoctorProfile", back_populates="department")


class DoctorProfile(Base):
    __tablename__ = "doctor_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=True)
    specialization = Column(String(100), nullable=False)
    qualification = Column(String(150), nullable=True)
    experience_years = Column(Integer, default=0)
    consultation_fee = Column(Float, default=0.0)
    bio = Column(Text, nullable=True)
    available_days = Column(String(100), nullable=True)  # e.g. "Mon,Tue,Wed"
    available_from = Column(Time, nullable=True)
    available_to = Column(Time, nullable=True)
    rating = Column(Float, default=0.0)

    user = relationship("User", back_populates="doctor_profile")
    department = relationship("Department", back_populates="doctors")


class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    doctor_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    appointment_date = Column(Date, nullable=False)
    appointment_time = Column(Time, nullable=False)
    reason = Column(String(255), nullable=True)
    status = Column(Enum(AppointmentStatus), default=AppointmentStatus.pending)
    consultation_type = Column(String(20), default="online")  # online / in-person
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    patient = relationship(
        "User", foreign_keys=[patient_id], back_populates="patient_appointments"
    )
    doctor = relationship(
        "User", foreign_keys=[doctor_id], back_populates="doctor_appointments"
    )

    prescription = relationship(
        "Prescription", back_populates="appointment", uselist=False, cascade="all, delete"
    )


class MedicalRecord(Base):
    __tablename__ = "medical_records"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    doctor_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    title = Column(String(150), nullable=False)
    description = Column(Text, nullable=True)
    record_type = Column(String(50), default="report")  # report / diagnosis / lab-result
    file_url = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    patient = relationship(
        "User", foreign_keys=[patient_id], back_populates="medical_records"
    )
    doctor = relationship("User", foreign_keys=[doctor_id])


class Prescription(Base):
    __tablename__ = "prescriptions"

    id = Column(Integer, primary_key=True, index=True)
    appointment_id = Column(Integer, ForeignKey("appointments.id"), unique=True, nullable=False)
    patient_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    doctor_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    medicines = Column(Text, nullable=False)  # JSON string: [{name, dosage, duration}]
    instructions = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    appointment = relationship("Appointment", back_populates="prescription")
    patient = relationship("User", foreign_keys=[patient_id])
    doctor = relationship("User", foreign_keys=[doctor_id])


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(150), nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="notifications")


class ChatMessage(Base):
    """Stores AI healthcare assistant chat history."""
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    sender = Column(String(10), nullable=False)  # "user" or "ai"
    message = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(Integer, primary_key=True, index=True)
    appointment_id = Column(Integer, ForeignKey("appointments.id"), unique=True, nullable=False)
    patient_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    amount = Column(Float, nullable=False)
    status = Column(String(20), default="pending")  # pending / paid
    transaction_id = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    appointment = relationship("Appointment")
    patient = relationship("User", foreign_keys=[patient_id])

    @property
    def patient_name(self):
        return self.patient.full_name if self.patient else f"Patient #{self.patient_id}"

    @property
    def doctor_name(self):
        if self.appointment and self.appointment.doctor:
            return self.appointment.doctor.full_name
        return "Hospital Administration"

    @property
    def reason(self):
        if self.appointment and self.appointment.reason:
            return self.appointment.reason
        return "Hospital Care & Medical Bill"


class DoctorReview(Base):
    __tablename__ = "doctor_reviews"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    doctor_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    appointment_id = Column(Integer, ForeignKey("appointments.id"), unique=True, nullable=False)
    rating = Column(Float, nullable=False)
    comment = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    patient = relationship("User", foreign_keys=[patient_id])
    doctor = relationship("User", foreign_keys=[doctor_id])
    appointment = relationship("Appointment")


class TimeSlot(Base):
    __tablename__ = "time_slots"

    id = Column(Integer, primary_key=True, index=True)
    doctor_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    slot_date = Column(Date, nullable=False)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    is_booked = Column(Boolean, default=False)

    doctor = relationship("User", foreign_keys=[doctor_id])


class LabTestStatus(str, enum.Enum):
    pending = "pending"
    completed = "completed"
    cancelled = "cancelled"


class LabTest(Base):
    __tablename__ = "lab_tests"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    doctor_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    appointment_id = Column(Integer, ForeignKey("appointments.id"), nullable=True)
    test_name = Column(String(150), nullable=False)
    status = Column(Enum(LabTestStatus), default=LabTestStatus.pending)
    result_notes = Column(Text, nullable=True)
    file_url = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    patient = relationship("User", foreign_keys=[patient_id])
    doctor = relationship("User", foreign_keys=[doctor_id])
    appointment = relationship("Appointment")


class InsuranceDetails(Base):
    __tablename__ = "insurance_details"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    provider_name = Column(String(150), nullable=False)
    policy_number = Column(String(100), nullable=False)
    group_number = Column(String(100), nullable=True)
    status = Column(String(50), default="unverified")  # unverified / verified / rejected
    created_at = Column(DateTime, default=datetime.utcnow)

    patient = relationship("User")


class InsuranceClaim(Base):
    __tablename__ = "insurance_claims"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    invoice_id = Column(Integer, ForeignKey("invoices.id"), unique=True, nullable=False)
    claim_amount = Column(Float, nullable=False)
    status = Column(String(50), default="submitted")  # submitted / processing / approved / rejected
    created_at = Column(DateTime, default=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)

    patient = relationship("User")
    invoice = relationship("Invoice")


class EmergencyContact(Base):
    __tablename__ = "emergency_contacts"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String(150), nullable=False)
    relation = Column(String(100), nullable=False)
    phone = Column(String(20), nullable=False)
    email = Column(String(150), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    patient = relationship("User")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    action = Column(String(100), nullable=False)
    details = Column(Text, nullable=True)
    ip_address = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")


class ConsultationMessage(Base):
    __tablename__ = "consultation_messages"

    id = Column(Integer, primary_key=True, index=True)
    appointment_id = Column(Integer, ForeignKey("appointments.id"))
    sender_id = Column(Integer, ForeignKey("users.id"))
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    appointment = relationship("Appointment", backref="messages")
    sender = relationship("User")


class Medicine(Base):
    __tablename__ = "medicines"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    description = Column(Text, nullable=True)
    price = Column(Float, nullable=False)
    stock = Column(Integer, default=0)
    requires_prescription = Column(Boolean, default=False)
    image_url = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class PharmacyOrder(Base):
    __tablename__ = "pharmacy_orders"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    total_amount = Column(Float, nullable=False)
    status = Column(String(50), default="pending")  # pending / paid / shipped / delivered / cancelled
    shipping_address = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    patient = relationship("User")
    items = relationship("PharmacyOrderItem", back_populates="order", cascade="all, delete-orphan")


class PharmacyOrderItem(Base):
    __tablename__ = "pharmacy_order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("pharmacy_orders.id"), nullable=False)
    medicine_id = Column(Integer, ForeignKey("medicines.id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Float, nullable=False)

    order = relationship("PharmacyOrder", back_populates="items")
    medicine = relationship("Medicine")


class HealthMetric(Base):
    __tablename__ = "health_metrics"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    metric_type = Column(String(50), nullable=False)  # heart_rate, weight, blood_sugar, blood_pressure_systolic, blood_pressure_diastolic
    value = Column(Float, nullable=False)
    unit = Column(String(20), nullable=False)
    recorded_at = Column(DateTime, default=datetime.utcnow)

    patient = relationship("User")

class MedicineReminder(Base):
    __tablename__ = "medicine_reminders"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    medicine_name = Column(String(100), nullable=False)
    dosage = Column(String(50), nullable=False)
    time = Column(String(10), nullable=False)  # HH:MM format
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    patient = relationship("User")
    logs = relationship("ReminderLog", back_populates="reminder", cascade="all, delete-orphan")

class ReminderLog(Base):
    __tablename__ = "reminder_logs"

    id = Column(Integer, primary_key=True, index=True)
    reminder_id = Column(Integer, ForeignKey("medicine_reminders.id"), nullable=False)
    patient_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    taken_at = Column(DateTime, default=datetime.utcnow)

    reminder = relationship("MedicineReminder", back_populates="logs")
    patient = relationship("User")

class Ward(Base):
    __tablename__ = "wards"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    capacity = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    beds = relationship("HospitalBed", back_populates="ward", cascade="all, delete-orphan")

class HospitalBed(Base):
    __tablename__ = "hospital_beds"

    id = Column(Integer, primary_key=True, index=True)
    ward_id = Column(Integer, ForeignKey("wards.id"), nullable=False)
    bed_number = Column(String(50), nullable=False)
    is_occupied = Column(Boolean, default=False)
    current_patient_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    admission_date = Column(DateTime, nullable=True)

    ward = relationship("Ward", back_populates="beds")
    current_patient = relationship("User")

class Admission(Base):
    __tablename__ = "admissions"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    doctor_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    bed_id = Column(Integer, ForeignKey("hospital_beds.id"), nullable=False)
    reason_for_admission = Column(Text, nullable=False)
    admission_date = Column(DateTime, default=datetime.utcnow)
    discharge_date = Column(DateTime, nullable=True)
    status = Column(String(50), default="active")  # 'active', 'discharged'

    patient = relationship("User", foreign_keys=[patient_id])
    doctor = relationship("User", foreign_keys=[doctor_id])
    bed = relationship("HospitalBed")

class EmergencyRequest(Base):
    __tablename__ = "emergency_requests"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    emergency_type = Column(String(100), nullable=False) # e.g. Ambulance, Urgent Care
    location = Column(Text, nullable=False)
    contact_number = Column(String(50), nullable=False)
    status = Column(String(50), default="Pending") # Pending, Dispatched, Resolved
    created_at = Column(DateTime, default=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)

    patient = relationship("User")

class PatientFeedback(Base):
    __tablename__ = "patient_feedback"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    rating = Column(Integer, nullable=False) # 1 to 5
    comments = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    patient = relationship("User")
