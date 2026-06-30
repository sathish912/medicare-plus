"""
AI Healthcare Assistant.

This provides a lightweight, rule-based symptom/triage assistant out of the box
so the feature works with zero external dependencies or API keys.

To upgrade to a real LLM (e.g. Anthropic Claude or OpenAI), replace the body of
`generate_ai_reply()` with a call to that provider's API and return the text.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas, auth

router = APIRouter(prefix="/api/assistant", tags=["AI Assistant"])

KEYWORD_RESPONSES = {
    "fever": "Fevers can result from infections. Stay hydrated, rest, and monitor your temperature. Seek medical attention if it exceeds 103°F (39.4°C), lasts more than 3 days, or comes with severe symptoms like a stiff neck or confusion.",
    "headache": "Frequent headaches can stem from dehydration, stress, or eye strain. Try resting in a dark room and staying hydrated. If headaches are sudden and severe, or come with vision changes, seek emergency care.",
    "cough": "A persistent cough lasting more than 2 weeks, or one with blood or breathing difficulty, should be evaluated by a doctor. Warm fluids and rest can help mild coughs.",
    "chest pain": "Chest pain can be serious. If it's severe, spreading to your arm/jaw, or accompanied by shortness of breath or sweating, seek emergency care immediately.",
    "diabetes": "Managing diabetes involves monitoring blood sugar, a balanced diet, regular activity, and medication as prescribed. Consult your doctor for a personalized plan.",
    "allergy": "For mild allergies, antihistamines may help. If you experience swelling of the face/throat or difficulty breathing, this is an emergency — seek immediate care.",
    "stomach ache": "Stomach aches can be caused by indigestion, food poisoning, or infections. Stay hydrated and eat bland foods. If pain is severe or accompanied by a high fever, consult a doctor.",
    "nausea": "Nausea can be caused by various factors including diet, stress, or illness. Sip clear liquids and eat light foods. If it persists, please book a consultation.",
    "vomit": "Vomiting can lead to dehydration. Make sure to drink plenty of fluids in small sips. If you cannot keep fluids down for 24 hours, seek medical attention.",
    "back pain": "Back pain is common and often relates to muscle strain. Rest, apply heat or ice, and try gentle stretching. If the pain radiates down your leg or causes numbness, please see a specialist.",
    "burn": "For minor burns, run cool water over the area and apply a soothing ointment. If the burn is severe, large, or on your face/hands, seek emergency care immediately.",
    "rash": "Rashes can be allergic reactions or infections. Avoid scratching. If the rash spreads rapidly, or is accompanied by difficulty breathing, seek immediate help.",
    "blood pressure": "High blood pressure often has no symptoms. It's important to monitor it regularly and discuss any concerns with your doctor. Low sodium diets and exercise can help.",
    "pregnancy": "For pregnancy-related queries, it's best to consult an Obstetrician/Gynecologist directly. You can find specialists under the 'Find a Doctor' tab.",
    "covid": "If you suspect you have COVID-19, isolate yourself, rest, and monitor your symptoms. If you experience difficulty breathing, seek emergency care.",
    "anxiety": "Anxiety is common and treatable. Deep breathing and mindfulness can help in the moment. Please consider booking an appointment with a mental health professional.",
    "depression": "Depression is a serious but treatable condition. If you're feeling persistently sad or hopeless, please speak to a doctor. You are not alone.",
    "insomnia": "Difficulty sleeping can impact your health. Try establishing a regular sleep schedule and avoiding screens before bed. If it continues, consult a doctor.",
}

DEFAULT_RESPONSE = (
    "Thanks for sharing that. I'm a general healthcare assistant and can offer basic guidance, but I'm not a "
    "substitute for a licensed doctor. For a proper diagnosis, please book an appointment with one of our "
    "specialists through the platform. If this is urgent or an emergency, please contact local emergency "
    "services right away."
)

EMERGENCY_KEYWORDS = [
    "suicide", "self harm", "can't breathe", "cannot breathe", "severe bleeding", 
    "unconscious", "heart attack", "stroke", "overdose", "poison", "choking"
]


def generate_ai_reply(message: str, db: Session, current_user: models.User) -> str:
    text = message.lower()

    for kw in EMERGENCY_KEYWORDS:
        if kw in text:
            return (
                "**EMERGENCY WARNING**: This sounds like it could be a medical emergency. "
                "Please call your local emergency number immediately or go to the nearest emergency room. "
                "If you are in crisis, please reach out to a crisis helpline right away — you don't have to face this alone."
            )

    # Context awareness: Appointments
    if "next appointment" in text or "my appointment" in text or "when is my appointment" in text:
        appt = db.query(models.Appointment).filter(
            models.Appointment.patient_id == current_user.id,
            models.Appointment.status.in_(["pending", "confirmed"])
        ).order_by(models.Appointment.appointment_date.asc(), models.Appointment.appointment_time.asc()).first()
        
        if appt:
            return f"Your next appointment is with **Dr. {appt.doctor.full_name}** on **{appt.appointment_date.strftime('%B %d, %Y')}** at **{appt.appointment_time.strftime('%I:%M %p')}**. The status is currently '{appt.status}'."
        else:
            return "You don't have any upcoming appointments scheduled at the moment. You can book one from the 'Find a Doctor' page."

    # Context awareness: Other modules
    if "my lab tests" in text or "test results" in text:
        return "You can view your laboratory test results under the **Lab Tests** tab in the navigation menu."

    if "my records" in text or "medical records" in text:
        return "You can access your complete medical history and uploaded documents in the **Medical Records** section."
        
    if "my prescriptions" in text or "medication" in text:
        return "Your past and current prescriptions are available in the **Prescriptions** tab."
        
    if "bill" in text or "invoice" in text or "pay" in text:
        return "You can manage your payments and view outstanding invoices in the **Billing** section."

    for keyword, response in KEYWORD_RESPONSES.items():
        if keyword in text:
            return response

    return DEFAULT_RESPONSE


@router.post("/chat", response_model=schemas.ChatMessageOut)
def chat(
    payload: schemas.ChatRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    models.Base.metadata.create_all(bind=db.get_bind())
    user_msg = models.ChatMessage(
        user_id=current_user.id, sender="user", message=payload.message
    )
    db.add(user_msg)
    db.commit()

    try:
        reply_text = generate_ai_reply(payload.message, db, current_user)
    except Exception as e:
        reply_text = DEFAULT_RESPONSE

    ai_msg = models.ChatMessage(
        user_id=current_user.id, sender="ai", message=reply_text
    )
    db.add(ai_msg)
    db.commit()
    db.refresh(ai_msg)

    return ai_msg


@router.get("/history", response_model=list[schemas.ChatMessageOut])
def history(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    models.Base.metadata.create_all(bind=db.get_bind())
    return (
        db.query(models.ChatMessage)
        .filter(models.ChatMessage.user_id == current_user.id)
        .order_by(models.ChatMessage.created_at.asc())
        .all()
    )


@router.post("/symptom-check", response_model=schemas.SymptomCheckResponse)
def symptom_check(
    payload: schemas.SymptomCheckRequest,
    current_user: models.User = Depends(auth.get_current_user),
):
    combined_text = (payload.main_symptom + " " + " ".join(payload.other_symptoms)).lower()
    
    triage_level = "Routine"
    recommended_department = "Family_Medicine"
    advice = "Based on your symptoms, we recommend scheduling a routine consultation. Please rest and stay hydrated."

    # Emergency check
    for kw in EMERGENCY_KEYWORDS:
        if kw in combined_text:
            triage_level = "Emergency"
            recommended_department = "Emergency"
            advice = "EMERGENCY WARNING: Please call your local emergency number immediately or go to the nearest emergency room."
            return schemas.SymptomCheckResponse(
                triage_level=triage_level,
                recommended_department=recommended_department,
                advice=advice
            )

    # Department mapping
    if any(kw in combined_text for kw in ["heart", "chest pain", "palpitations"]):
        recommended_department = "Cardiology"
        triage_level = "Urgent"
        advice = "Chest and heart related symptoms should be evaluated promptly. Please book an urgent consultation."
    elif any(kw in combined_text for kw in ["headache", "dizzy", "dizziness", "numbness", "seizure"]):
        recommended_department = "Neurology"
        triage_level = "Urgent" if "numbness" in combined_text or "seizure" in combined_text else "Routine"
        advice = "For neurological symptoms, a specialist can help determine the root cause and provide a treatment plan."
    elif any(kw in combined_text for kw in ["bone", "joint", "muscle", "back pain", "knee"]):
        recommended_department = "Orthopedics"
        advice = "An orthopedic specialist can evaluate your musculoskeletal pain and suggest therapies or treatments."
    elif any(kw in combined_text for kw in ["skin", "rash", "acne", "mole", "itch"]):
        recommended_department = "Dermatology"
        advice = "A dermatologist can examine your skin condition and prescribe appropriate topical or oral treatments."
    elif any(kw in combined_text for kw in ["stomach", "nausea", "vomit", "diarrhea", "digestion", "acid"]):
        recommended_department = "Gastroenterology"
        advice = "For digestive issues, a gastroenterologist can provide specialized care and dietary recommendations."
    elif any(kw in combined_text for kw in ["eye", "vision", "blur", "blind"]):
        recommended_department = "Ophthalmology"
        advice = "Please see an ophthalmologist for a comprehensive eye examination."
    elif any(kw in combined_text for kw in ["ear", "nose", "throat", "swallow", "hearing", "sinus"]):
        recommended_department = "ENT (Otolaryngology)"
        advice = "An ENT specialist can address issues related to your ear, nose, or throat."
    elif any(kw in combined_text for kw in ["sugar", "diabetes", "thyroid", "hormone", "weight"]):
        recommended_department = "Endocrinology"
        advice = "For hormonal and metabolic concerns, an endocrinologist can help manage your condition."
    elif any(kw in combined_text for kw in ["cough", "breathe", "asthma", "lung", "wheeze"]):
        recommended_department = "Pulmonology"
        triage_level = "Urgent" if "breathe" in combined_text else "Routine"
        advice = "Respiratory symptoms should be assessed by a pulmonologist, especially if you have difficulty breathing."
    elif any(kw in combined_text for kw in ["urine", "bladder", "kidney"]):
        recommended_department = "Urology"
        advice = "A urologist can diagnose and treat urinary tract issues."
    elif any(kw in combined_text for kw in ["period", "pregnancy", "vagina", "menstruation"]):
        recommended_department = "Gynecology & Obstetrics"
        advice = "Please consult a gynecologist for women's health and reproductive concerns."
    elif any(kw in combined_text for kw in ["anxiety", "depression", "sad", "sleep", "stress"]):
        recommended_department = "Psychiatry"
        advice = "Mental health is incredibly important. Please consider speaking with a psychiatrist or counselor."
    elif any(kw in combined_text for kw in ["fever", "cold", "flu"]):
        recommended_department = "Family_Medicine"
        advice = "For general symptoms like fever or cold, a family medicine doctor can provide primary care and medication."

    # Duration context
    if "week" in payload.duration.lower() or "month" in payload.duration.lower():
        advice += " Since you have had these symptoms for a while, it's highly recommended to get evaluated soon."

    return schemas.SymptomCheckResponse(
        triage_level=triage_level,
        recommended_department=recommended_department,
        advice=advice
    )
