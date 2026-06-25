import os
import uuid
import boto3
from fastapi import UploadFile
from botocore.exceptions import NoCredentialsError, ClientError

from app.config import settings

# Setup local fallback directory
LOCAL_UPLOAD_DIR = os.path.join(os.getcwd(), "local_uploads")
os.makedirs(LOCAL_UPLOAD_DIR, exist_ok=True)

def get_s3_client():
    if not settings.AWS_ACCESS_KEY_ID or not settings.AWS_SECRET_ACCESS_KEY:
        return None
    
    return boto3.client(
        "s3",
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        region_name=settings.AWS_REGION_NAME
    )

def upload_file_to_s3(file: UploadFile) -> str:
    """
    Uploads a file to AWS S3 and returns the public URL.
    If S3 is not configured, it saves the file locally and returns the local URL.
    """
    file_extension = file.filename.split(".")[-1]
    unique_filename = f"{uuid.uuid4()}.{file_extension}"
    
    s3_client = get_s3_client()
    
    if s3_client:
        try:
            s3_client.upload_fileobj(
                file.file,
                settings.AWS_BUCKET_NAME,
                unique_filename,
                ExtraArgs={"ContentType": file.content_type}
            )
            return f"https://{settings.AWS_BUCKET_NAME}.s3.{settings.AWS_REGION_NAME}.amazonaws.com/{unique_filename}"
        except (NoCredentialsError, ClientError) as e:
            print(f"S3 Upload failed: {e}. Falling back to local disk.")
            file.file.seek(0)  # Reset file pointer for local save
            
    # Fallback: Save locally
    local_path = os.path.join(LOCAL_UPLOAD_DIR, unique_filename)
    with open(local_path, "wb") as buffer:
        buffer.write(file.file.read())
    
    # Return local static URL
    return f"http://localhost:8000/static/uploads/{unique_filename}"
