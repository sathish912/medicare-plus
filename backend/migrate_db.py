from sqlalchemy import text
from app.database import engine

def run_migration():
    try:
        with engine.connect() as conn:
            # Check if column exists first
            check_sql = text("""
                SELECT COUNT(*) 
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_SCHEMA = DATABASE() 
                AND TABLE_NAME = 'doctor_profiles' 
                AND COLUMN_NAME = 'department_id'
            """)
            result = conn.execute(check_sql).scalar()
            
            if result == 0:
                print("Adding department_id to doctor_profiles...")
                conn.execute(text("ALTER TABLE doctor_profiles ADD COLUMN department_id INT;"))
                print("Migration successful.")
            else:
                print("Column department_id already exists.")
    except Exception as e:
        print(f"Migration failed: {e}")

if __name__ == "__main__":
    run_migration()
