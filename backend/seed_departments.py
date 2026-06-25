from sqlalchemy import text
from app.database import engine
from app.models import Department
from sqlalchemy.orm import Session

departments_data = [
    {"name": "Cardiology", "description": "Deals with disorders of the heart and the cardiovascular system, including diagnosis and treatment of congenital heart defects, coronary artery disease, and heart failure."},
    {"name": "Neurology", "description": "Specializes in diagnosing and treating disorders of the nervous system, including the brain, spinal cord, and nerves (e.g., stroke, epilepsy, Parkinson's disease)."},
    {"name": "Orthopedics", "description": "Focuses on the musculoskeletal system, providing surgical and non-surgical treatments for bones, joints, ligaments, tendons, and muscles."},
    {"name": "Pediatrics", "description": "Provides medical care for infants, children, and adolescents, covering a wide range of developmental and health issues."},
    {"name": "Oncology", "description": "Dedicated to the prevention, diagnosis, and treatment of cancer, including chemotherapy, radiotherapy, and surgical oncology."},
    {"name": "Dermatology", "description": "Focuses on conditions related to the skin, hair, and nails, including acne, eczema, psoriasis, and skin cancer detection."},
    {"name": "Gastroenterology", "description": "Specializes in the digestive system and its disorders, treating conditions affecting the esophagus, stomach, intestines, liver, and pancreas."},
    {"name": "Psychiatry", "description": "Devoted to the diagnosis, prevention, and treatment of mental disorders, offering therapies, counseling, and psychiatric medication."},
    {"name": "Ophthalmology", "description": "Deals with the anatomy, physiology, and diseases of the eyeball and orbit, providing eye exams, surgeries like LASIK, and treating glaucoma."},
    {"name": "ENT (Otolaryngology)", "description": "Treats conditions of the ear, nose, and throat, as well as related areas of the head and neck, including hearing loss, sinusitis, and voice disorders."},
    {"name": "Endocrinology", "description": "Focuses on the endocrine system, diagnosing and treating hormone-related diseases like diabetes, thyroid disorders, and metabolic syndromes."},
    {"name": "Pulmonology", "description": "Deals with diseases involving the respiratory tract, providing care for asthma, COPD, pneumonia, and tuberculosis."},
    {"name": "Urology", "description": "Focuses on surgical and medical diseases of the male and female urinary-tract system and the male reproductive organs."},
    {"name": "Gynecology & Obstetrics", "description": "Provides care for women's reproductive health, including pregnancy, childbirth, and disorders of the reproductive system."},
    {"name": "General Surgery", "description": "Focuses on abdominal contents including esophagus, stomach, small intestine, large intestine, liver, pancreas, gallbladder, appendix and bile ducts."},
    {"name": "Radiology", "description": "Uses medical imaging (like X-rays, MRIs, and CT scans) to diagnose and treat diseases within the human body."},
    {"name": "Rheumatology", "description": "Devoted to the diagnosis and therapy of rheumatic diseases, involving joints, soft tissues, autoimmune diseases, and heritable connective tissue disorders."},
    {"name": "Family_Medicine", "description": "Provides continuing, comprehensive health care for the individual and family across all ages, genders, diseases, and parts of the body."}
]

def seed_db():
    try:
        with Session(engine) as session:
            for data in departments_data:
                existing = session.query(Department).filter(Department.name == data["name"]).first()
                if not existing:
                    dept = Department(name=data["name"], description=data["description"])
                    session.add(dept)
            session.commit()
            print(f"Successfully seeded {len(departments_data)} departments.")
    except Exception as e:
        print(f"Error seeding database: {e}")

if __name__ == "__main__":
    seed_db()
