from app.database import engine, SessionLocal
from app.models import Medicine, Base

medicines_data = [
    {
        "name": "Paracetamol 500mg",
        "description": "Pain reliever and fever reducer.",
        "price": 5.99,
        "stock": 100,
        "requires_prescription": False,
        "image_url": "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&q=80"
    },
    {
        "name": "Amoxicillin 250mg",
        "description": "Antibiotic used to treat bacterial infections.",
        "price": 12.50,
        "stock": 50,
        "requires_prescription": True,
        "image_url": "https://images.unsplash.com/photo-1550572017-edb92138e6df?w=400&q=80"
    },
    {
        "name": "Vitamin C 1000mg",
        "description": "Immune system support.",
        "price": 8.99,
        "stock": 200,
        "requires_prescription": False,
        "image_url": "https://images.unsplash.com/photo-1550572017-edb92138e6df?w=400&q=80"
    },
    {
        "name": "Ibuprofen 400mg",
        "description": "Nonsteroidal anti-inflammatory drug (NSAID).",
        "price": 6.50,
        "stock": 150,
        "requires_prescription": False,
        "image_url": "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&q=80"
    },
    {
        "name": "Lisinopril 10mg",
        "description": "Used to treat high blood pressure and heart failure.",
        "price": 15.00,
        "stock": 80,
        "requires_prescription": True,
        "image_url": "https://images.unsplash.com/photo-1550572017-edb92138e6df?w=400&q=80"
    },
    {
        "name": "Cough Syrup",
        "description": "Relieves cough and throat irritation.",
        "price": 9.20,
        "stock": 120,
        "requires_prescription": False,
        "image_url": "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&q=80"
    }
]

def seed_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        for item in medicines_data:
            existing = db.query(Medicine).filter(Medicine.name == item["name"]).first()
            if not existing:
                med = Medicine(**item)
                db.add(med)
        db.commit()
        print("Successfully seeded medicines data.")
    except Exception as e:
        print(f"Error seeding database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_db()
