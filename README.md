# MediCare Plus – Hospital & Appointment Management Platform

A full-stack hospital and appointment management platform.

**Backend:** FastAPI · MySQL · SQLAlchemy ORM · JWT Authentication · Pydantic
**Frontend:** React (Vite) · Tailwind CSS · Axios

## Features

- Role-based auth (Patient / Doctor / Admin) with JWT
- Doctor directory + search by specialization
- Appointment booking, confirmation, cancellation, rejection, completion
- Prescriptions issued by doctors (linked to appointments)
- Medical records management
- In-app notifications
- AI healthcare assistant (rule-based out of the box, pluggable into a real LLM API)
- Admin panel for user management

## Project Structure

```
medicare-plus/
├── backend/
│   ├── app/
│   │   ├── main.py            # FastAPI app entrypoint
│   │   ├── config.py          # Settings / env vars
│   │   ├── database.py        # SQLAlchemy engine/session
│   │   ├── models.py          # ORM models
│   │   ├── schemas.py         # Pydantic schemas
│   │   ├── auth.py            # JWT + password hashing + role guards
│   │   └── routers/
│   │       ├── auth_router.py
│   │       ├── users_router.py
│   │       ├── doctors_router.py
│   │       ├── appointments_router.py
│   │       ├── records_router.py
│   │       ├── prescriptions_router.py
│   │       ├── notifications_router.py
│   │       └── assistant_router.py
│   ├── requirements.txt
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── api/                # axios client + endpoint functions
    │   ├── context/AuthContext.jsx
    │   ├── components/         # Navbar, ProtectedRoute
    │   ├── pages/               # Landing, Login, Register, Dashboard, Doctors,
    │   │                         # Appointments, MedicalRecords, Prescriptions,
    │   │                         # Notifications, Assistant, DoctorProfile, Admin
    │   ├── App.jsx
    │   └── main.jsx
    ├── package.json
    ├── tailwind.config.js
    └── .env.example
```

## 1. Backend Setup

### 1.1 Create the MySQL database

```sql
CREATE DATABASE medicare_plus CHARACTER SET utf8mb4;
CREATE USER 'medicare_user'@'%' IDENTIFIED BY 'medicare_pass';
GRANT ALL PRIVILEGES ON medicare_plus.* TO 'medicare_user'@'%';
FLUSH PRIVILEGES;
```

### 1.2 Configure environment

```bash
cd backend
cp .env.example .env
# edit .env with your real DATABASE_URL and a strong SECRET_KEY
```

### 1.3 Install dependencies & run

```bash
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

uvicorn app.main:app --reload --port 8000
```

The API will be live at `http://localhost:8000`. Interactive docs at `http://localhost:8000/docs`.

Tables are auto-created on first run via `Base.metadata.create_all()`. For production, switch to Alembic migrations.

## 2. Frontend Setup

```bash
cd frontend
cp .env.example .env     # set VITE_API_URL if backend isn't on localhost:8000
npm install
npm run dev
```

The app will be live at `http://localhost:5173`.

## 3. Default Flow to Test

1. Register a **doctor** account (role = doctor) with a specialization.
2. Register a **patient** account.
3. As the patient: go to "Find a Doctor" → book an appointment with the doctor.
4. As the doctor: go to "Appointments" → confirm it.
5. As the doctor: issue a prescription → appointment auto-marks as completed.
6. As the patient: check "Prescriptions", "Medical Records", and "Notifications".
7. Try the "AI Assistant" chat as a patient (e.g. "I have a fever").
8. To test the **admin** role, manually update a user's `role` column to `admin` in MySQL (no public admin signup is exposed, by design), then log in.

## 4. Upgrading the AI Assistant to a Real LLM

`backend/app/routers/assistant_router.py` contains a rule-based `generate_ai_reply()` function with zero external dependencies. To connect it to Claude or another LLM provider, replace its body with an API call to that provider and return the response text — the rest of the chat plumbing (history storage, endpoints) stays the same.

## 5. Security Notes

- Change `SECRET_KEY` in `.env` before deploying.
- Tighten CORS (`FRONTEND_ORIGIN`) to your real frontend domain in production.
- Add HTTPS, rate limiting, and request logging before going to production.
- Consider Alembic for schema migrations instead of `create_all()`.
