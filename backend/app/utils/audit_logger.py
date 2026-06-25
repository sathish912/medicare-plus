from sqlalchemy.orm import Session
from app.models import AuditLog

def log_action(db: Session, user_id: int | None, action: str, details: str = None, ip_address: str = None):
    try:
        log_entry = AuditLog(
            user_id=user_id,
            action=action,
            details=details,
            ip_address=ip_address
        )
        db.add(log_entry)
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"Failed to log audit action '{action}': {e}")
