from datetime import datetime, date, time
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field

from app.models import UserRole, AppointmentStatus


# ---------- Auth ----------
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    user_id: int
    full_name: str


class TokenData(BaseModel):
    user_id: Optional[int] = None
    role: Optional[str] = None


# ---------- User ----------
class UserBase(BaseModel):
    full_name: str
    email: EmailStr
    phone: Optional[str] = None


class PatientCreate(UserBase):
    password: str = Field(min_length=6)
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    blood_group: Optional[str] = None
    address: Optional[str] = None


class DoctorCreate(UserBase):
    password: str = Field(min_length=6)
    specialization: str
    qualification: Optional[str] = None
    experience_years: Optional[int] = 0
    consultation_fee: Optional[float] = 0.0
    bio: Optional[str] = None


class AdminCreate(UserBase):
    password: str = Field(min_length=6)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(UserBase):
    id: int
    role: str
    is_active: bool
    created_at: datetime
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    blood_group: Optional[str] = None
    address: Optional[str] = None

    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    blood_group: Optional[str] = None
    address: Optional[str] = None


# ---------- Department ----------
class DepartmentBase(BaseModel):
    name: str
    description: Optional[str] = None


class DepartmentCreate(DepartmentBase):
    pass


class DepartmentUpdate(DepartmentBase):
    name: Optional[str] = None


class DepartmentOut(DepartmentBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class DepartmentStatsOut(BaseModel):
    department_id: int
    department_name: str
    total_doctors: int
    total_appointments: int
    total_revenue: float


# ---------- Doctor ----------
class DoctorProfileOut(BaseModel):
    id: int
    department_id: Optional[int] = None
    department: Optional[DepartmentOut] = None
    specialization: str
    qualification: Optional[str] = None
    experience_years: int
    consultation_fee: float
    bio: Optional[str] = None
    available_days: Optional[str] = None
    rating: float

    class Config:
        from_attributes = True


class DoctorOut(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    phone: Optional[str] = None
    doctor_profile: Optional[DoctorProfileOut] = None

    class Config:
        from_attributes = True


class DoctorProfileUpdate(BaseModel):
    department_id: Optional[int] = None
    specialization: Optional[str] = None
    qualification: Optional[str] = None
    experience_years: Optional[int] = None
    consultation_fee: Optional[float] = None
    bio: Optional[str] = None
    available_days: Optional[str] = None
    available_from: Optional[time] = None
    available_to: Optional[time] = None


# ---------- Appointment ----------
class AppointmentCreate(BaseModel):
    doctor_id: int
    appointment_date: date
    appointment_time: time
    reason: Optional[str] = None
    consultation_type: Optional[str] = "online"


class AppointmentUpdateStatus(BaseModel):
    status: AppointmentStatus
    notes: Optional[str] = None


class AppointmentUpdateNotes(BaseModel):
    notes: str


class AppointmentOut(BaseModel):
    id: int
    patient_id: int
    doctor_id: int
    appointment_date: date
    appointment_time: time
    reason: Optional[str] = None
    status: str
    consultation_type: str
    notes: Optional[str] = None
    created_at: datetime
    patient_name: Optional[str] = None
    doctor_name: Optional[str] = None

    class Config:
        from_attributes = True


# ---------- Medical Records ----------
class MedicalRecordCreate(BaseModel):
    patient_id: int
    title: str
    description: Optional[str] = None
    record_type: Optional[str] = "report"
    file_url: Optional[str] = None


class MedicalRecordOut(BaseModel):
    id: int
    patient_id: int
    doctor_id: Optional[int] = None
    title: str
    description: Optional[str] = None
    record_type: str
    file_url: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ---------- Prescription ----------
class MedicineItem(BaseModel):
    name: str
    dosage: str
    duration: str


class PrescriptionCreate(BaseModel):
    appointment_id: int
    medicines: List[MedicineItem]
    instructions: Optional[str] = None


class PrescriptionOut(BaseModel):
    id: int
    appointment_id: int
    patient_id: int
    doctor_id: int
    medicines: str
    instructions: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ---------- Notifications ----------
class NotificationOut(BaseModel):
    id: int
    title: str
    message: str
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ---------- AI Chat & Symptom Checker ----------
class ChatRequest(BaseModel):
    message: str


class ChatMessageOut(BaseModel):
    id: int
    sender: str
    message: str
    created_at: datetime

    class Config:
        from_attributes = True

class ConsultationMessageOut(BaseModel):
    id: int
    appointment_id: int
    sender_id: int
    content: str
    created_at: datetime
    sender_name: Optional[str] = None

    class Config:
        from_attributes = True


class SymptomCheckRequest(BaseModel):
    main_symptom: str
    other_symptoms: List[str] = []
    duration: str


class SymptomCheckResponse(BaseModel):
    triage_level: str
    recommended_department: str
    advice: str


# ---------- Billing ----------
class InvoiceCreate(BaseModel):
    appointment_id: int
    amount: float


class InvoiceUpdate(BaseModel):
    status: str
    transaction_id: Optional[str] = None


class InvoiceOut(BaseModel):
    id: int
    appointment_id: int
    patient_id: int
    amount: float
    status: str
    transaction_id: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ---------- Reviews ----------
class ReviewCreate(BaseModel):
    appointment_id: int
    rating: float
    comment: Optional[str] = None


class ReviewOut(BaseModel):
    id: int
    patient_id: int
    doctor_id: int
    appointment_id: int
    rating: float
    comment: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ---------- Scheduling ----------
class TimeSlotCreate(BaseModel):
    slot_date: date
    start_time: time
    end_time: time


class TimeSlotOut(BaseModel):
    id: int
    doctor_id: int
    slot_date: date
    start_time: time
    end_time: time
    is_booked: bool

    class Config:
        from_attributes = True


# ---------- Dashboard Analytics ----------
class DashboardStatsOut(BaseModel):
    total_patients: int
    total_doctors: int
    total_appointments: int
    total_revenue: float

# ---------- Lab Tests ----------
class LabTestCreate(BaseModel):
    patient_id: int
    appointment_id: Optional[int] = None
    test_name: str


class LabTestUpdate(BaseModel):
    status: str
    result_notes: Optional[str] = None
    file_url: Optional[str] = None


class LabTestOut(BaseModel):
    id: int
    patient_id: int
    doctor_id: int
    appointment_id: Optional[int] = None
    test_name: str
    status: str
    result_notes: Optional[str] = None
    file_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    patient_name: Optional[str] = None
    doctor_name: Optional[str] = None

    class Config:
        from_attributes = True


# ---------- Insurance ----------
class InsuranceDetailsCreate(BaseModel):
    provider_name: str
    policy_number: str
    group_number: Optional[str] = None


class InsuranceDetailsOut(BaseModel):
    id: int
    patient_id: int
    provider_name: str
    policy_number: str
    group_number: Optional[str] = None
    status: str
    created_at: datetime
    
    patient_name: Optional[str] = None

    class Config:
        from_attributes = True


class InsuranceClaimCreate(BaseModel):
    invoice_id: int
    claim_amount: float


class InsuranceClaimOut(BaseModel):
    id: int
    patient_id: int
    invoice_id: int
    claim_amount: float
    status: str
    created_at: datetime
    resolved_at: Optional[datetime] = None

    patient_name: Optional[str] = None

    class Config:
        from_attributes = True


# ---------- Emergency Contacts ----------
class EmergencyContactCreate(BaseModel):
    name: str
    relation: str
    phone: str
    email: Optional[str] = None


class EmergencyContactOut(BaseModel):
    id: int
    patient_id: int
    name: str
    relation: str
    phone: str
    email: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# ---------- Audit Logs ----------
class AuditLogOut(BaseModel):
    id: int
    user_id: Optional[int] = None
    action: str
    details: Optional[str] = None
    ip_address: Optional[str] = None
    created_at: datetime
    
    user_name: Optional[str] = None
    user_role: Optional[str] = None

    class Config:
        from_attributes = True

# ---------- Chat Messaging ----------
class ChatMessageOut(BaseModel):
    id: int
    appointment_id: int
    sender_id: int
    content: str
    created_at: datetime
    
    sender_name: Optional[str] = None

    class Config:
        from_attributes = True


# ---------- Pharmacy & E-Commerce ----------
class MedicineBase(BaseModel):
    name: str
    description: Optional[str] = None
    price: float
    stock: int
    requires_prescription: bool = False
    image_url: Optional[str] = None


class MedicineCreate(MedicineBase):
    pass


class MedicineOut(MedicineBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class PharmacyOrderItemCreate(BaseModel):
    medicine_id: int
    quantity: int


class PharmacyOrderCreate(BaseModel):
    shipping_address: str
    items: List[PharmacyOrderItemCreate]


class PharmacyOrderItemOut(BaseModel):
    id: int
    medicine_id: int
    quantity: int
    unit_price: float
    medicine: MedicineOut

    class Config:
        from_attributes = True


class PharmacyOrderOut(BaseModel):
    id: int
    patient_id: int
    total_amount: float
    status: str
    shipping_address: str
    created_at: datetime
    items: List[PharmacyOrderItemOut]

    class Config:
        from_attributes = True

# --- Analytics ---

class HealthMetricBase(BaseModel):
    metric_type: str
    value: float
    unit: str

class HealthMetricCreate(HealthMetricBase):
    pass

class HealthMetricResponse(HealthMetricBase):
    id: int
    patient_id: int
    recorded_at: datetime

    class Config:
        from_attributes = True

# --- Reminders ---

class ReminderCreate(BaseModel):
    medicine_name: str
    dosage: str
    time: str

class ReminderResponse(ReminderCreate):
    id: int
    patient_id: int
    is_active: bool
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class ReminderLogResponse(BaseModel):
    id: int
    reminder_id: int
    patient_id: int
    taken_at: Optional[datetime] = None
    reminder: Optional[ReminderResponse] = None

    class Config:
        from_attributes = True

# --- Bed Management ---

class WardCreate(BaseModel):
    name: str
    capacity: int

class HospitalBedResponse(BaseModel):
    id: int
    ward_id: int
    bed_number: str
    is_occupied: bool
    current_patient_id: Optional[int] = None
    admission_date: Optional[datetime] = None

    class Config:
        from_attributes = True

class WardResponse(WardCreate):
    id: int
    created_at: datetime
    beds: List[HospitalBedResponse] = []
    
    # Aggregates for dashboard
    available_beds: Optional[int] = None
    occupied_beds: Optional[int] = None

    class Config:
        from_attributes = True

# --- Admissions ---

class AdmissionCreate(BaseModel):
    patient_id: int
    bed_id: int
    reason_for_admission: str

class AdmissionResponse(BaseModel):
    id: int
    patient_id: int
    doctor_id: Optional[int] = None
    bed_id: int
    reason_for_admission: str
    admission_date: datetime
    discharge_date: Optional[datetime] = None
    status: str
    
    patient: Optional[UserOut] = None
    bed: HospitalBedResponse

    class Config:
        from_attributes = True

# --- Emergency Services ---

class EmergencyCreate(BaseModel):
    emergency_type: str
    location: str
    contact_number: str

class EmergencyUpdate(BaseModel):
    status: str

class EmergencyResponse(BaseModel):
    id: int
    patient_id: int
    emergency_type: str
    location: str
    contact_number: str
    status: str
    created_at: datetime
    resolved_at: Optional[datetime] = None
    
    patient: Optional[UserOut] = None

    class Config:
        from_attributes = True

# --- Patient Feedback ---

class FeedbackCreate(BaseModel):
    rating: int
    comments: Optional[str] = None

class FeedbackResponse(BaseModel):
    id: int
    patient_id: int
    rating: int
    comments: Optional[str] = None
    created_at: datetime
    
    patient: Optional[UserOut] = None

    class Config:
        from_attributes = True

class FeedbackAnalyticsResponse(BaseModel):
    average_rating: float
    total_reviews: int
    rating_distribution: dict
