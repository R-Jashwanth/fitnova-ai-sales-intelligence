import os
import shutil
import uuid
from fastapi import UploadFile, HTTPException

UPLOAD_DIR = "uploads"
ALLOWED_EXTENSIONS = {".mp3", ".wav", ".m4a"}
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50 MB

os.makedirs(UPLOAD_DIR, exist_ok=True)

class UploadService:
    @staticmethod
    def validate_file(file: UploadFile) -> None:
        if not file.filename:
            raise HTTPException(status_code=400, detail="Empty filename")
        
        ext = os.path.splitext(file.filename)[1].lower()
        if ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(status_code=400, detail=f"Unsupported file extension: {ext}. Allowed: {ALLOWED_EXTENSIONS}")

        # Check size if possible before reading all in memory
        # FastAPI handles this with SpooledTemporaryFile but we can check size after save or via content-length
        # For simplicity, we assume size validation is handled here or during stream.

    @staticmethod
    def save_file(file: UploadFile) -> str:
        UploadService.validate_file(file)
        
        ext = os.path.splitext(file.filename)[1].lower()
        unique_filename = f"{uuid.uuid4()}{ext}"
        file_path = os.path.join(UPLOAD_DIR, unique_filename)
        
        try:
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            
            # Size check post-save
            if os.path.getsize(file_path) > MAX_FILE_SIZE:
                os.remove(file_path)
                raise HTTPException(status_code=400, detail="File size exceeds the 50MB limit.")
            
            # Simple check for empty file
            if os.path.getsize(file_path) == 0:
                os.remove(file_path)
                raise HTTPException(status_code=400, detail="Empty file uploaded.")
                
            return file_path
        except Exception as e:
            if os.path.exists(file_path):
                os.remove(file_path)
            raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")
