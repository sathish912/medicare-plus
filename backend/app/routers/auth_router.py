from fastapi import APIRouter, Depends, HTTPException, status, Header
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas, auth
from app.utils.audit_logger import log_action

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/register/patient", response_model=schemas.Token, status_code=status.HTTP_201_CREATED)
def register_patient(payload: schemas.PatientCreate, db: Session = Depends(get_db)):
    existing = db.query(models.User).filter(models.User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email is already registered")

    new_user = models.User(
        full_name=payload.full_name,
        email=payload.email,
        hashed_password=auth.hash_password(payload.password),
        phone=payload.phone,
        role=models.UserRole.patient,
        date_of_birth=payload.date_of_birth,
        gender=payload.gender,
        blood_group=payload.blood_group,
        address=payload.address,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    token = auth.create_access_token(
        {"user_id": new_user.id, "role": new_user.role.value, "email": new_user.email}
    )
    
    log_action(db, new_user.id, "REGISTER", f"Patient registered: {new_user.email}")
    
    return schemas.Token(
        access_token=token,
        role=new_user.role.value,
        user_id=new_user.id,
        full_name=new_user.full_name,
    )


@router.post("/register/doctor", response_model=schemas.Token, status_code=status.HTTP_201_CREATED)
def register_doctor(payload: schemas.DoctorCreate, db: Session = Depends(get_db)):
    existing = db.query(models.User).filter(models.User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email is already registered")

    new_user = models.User(
        full_name=payload.full_name,
        email=payload.email,
        hashed_password=auth.hash_password(payload.password),
        phone=payload.phone,
        role=models.UserRole.doctor,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    profile = models.DoctorProfile(
        user_id=new_user.id,
        specialization=payload.specialization,
        qualification=payload.qualification,
        experience_years=payload.experience_years or 0,
        consultation_fee=payload.consultation_fee or 0.0,
        bio=payload.bio,
    )
    db.add(profile)
    db.commit()

    token = auth.create_access_token(
        {"user_id": new_user.id, "role": new_user.role.value, "email": new_user.email}
    )
    
    log_action(db, new_user.id, "REGISTER", f"Doctor registered: {new_user.email}")
    return schemas.Token(
        access_token=token,
        role=new_user.role.value,
        user_id=new_user.id,
        full_name=new_user.full_name,
    )


@router.post("/register/admin", response_model=schemas.Token, status_code=status.HTTP_201_CREATED)
def register_admin(
    payload: schemas.AdminCreate, 
    admin_secret: str = Header(..., description="Secret key to register admin"),
    db: Session = Depends(get_db)
):
    if admin_secret != "medicare_admin_secret_2026":
        raise HTTPException(status_code=403, detail="Invalid admin secret key")

    existing = db.query(models.User).filter(models.User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email is already registered")

    new_user = models.User(
        full_name=payload.full_name,
        email=payload.email,
        hashed_password=auth.hash_password(payload.password),
        phone=payload.phone,
        role=models.UserRole.admin,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    token = auth.create_access_token(
        {"user_id": new_user.id, "role": new_user.role.value, "email": new_user.email}
    )
    
    log_action(db, new_user.id, "REGISTER", f"Admin registered: {new_user.email}")
    return schemas.Token(
        access_token=token,
        role=new_user.role.value,
        user_id=new_user.id,
        full_name=new_user.full_name,
    )


@router.post("/login", response_model=schemas.Token)
def login(payload: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == payload.username).first()
    if not user or not auth.verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is deactivated")

    token = auth.create_access_token(
        {"user_id": user.id, "role": user.role.value, "email": user.email}
    )
    
    log_action(db, user.id, "LOGIN", f"User logged in: {user.email}")
    return schemas.Token(
        access_token=token,
        role=user.role.value,
        user_id=user.id,
        full_name=user.full_name,
    )


@router.get("/me", response_model=schemas.UserOut)
def get_me(current_user: models.User = Depends(auth.get_current_user)):
    return current_user
