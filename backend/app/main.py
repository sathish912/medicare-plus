from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
from app.config import settings
from app.routers import (
    auth_router,
    users_router,
    doctors_router,
    appointments_router,
    records_router,
    prescriptions_router,
    notifications_router,
    assistant_router,
    billing_router,
    reviews_router,
    schedules_router,
    admin_router,
    departments_router,
    lab_tests_router,
    insurance_router,
    emergency_router,
    chat_router,
    pharmacy_router,
    analytics_router,
    reminder_router,
    bed_router,
    admission_router,
    emergency_router,
    feedback_router,
)
from fastapi.staticfiles import StaticFiles
import os
# Creates tables if they don't exist (for quick start; use Alembic migrations in production)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="MediCare Plus API",
    description="Hospital & Appointment Management Platform backend",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_ORIGIN, "http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router.router)
app.include_router(users_router.router)
app.include_router(doctors_router.router)
app.include_router(appointments_router.router)
app.include_router(records_router.router)
app.include_router(prescriptions_router.router)
app.include_router(notifications_router.router)
app.include_router(assistant_router.router)
app.include_router(billing_router.router)
app.include_router(reviews_router.router)
app.include_router(schedules_router.router)
app.include_router(admin_router.router)
app.include_router(departments_router.router)
app.include_router(lab_tests_router.router)
app.include_router(insurance_router.router)
app.include_router(emergency_router.router)
app.include_router(chat_router.router)
app.include_router(pharmacy_router.router)
app.include_router(analytics_router.router)
app.include_router(reminder_router.router)
app.include_router(bed_router.router)
app.include_router(admission_router.router)
app.include_router(emergency_router.router)
app.include_router(feedback_router.router)

# Ensure local_uploads directory exists
LOCAL_UPLOAD_DIR = os.path.join(os.getcwd(), "local_uploads")
os.makedirs(LOCAL_UPLOAD_DIR, exist_ok=True)
app.mount("/static/uploads", StaticFiles(directory=LOCAL_UPLOAD_DIR), name="uploads")

@app.get("/")
def root():
    return {"message": "MediCare Plus API is running", "docs": "/docs"}


@app.get("/health")
def health_check():
    return {"status": "ok"}
