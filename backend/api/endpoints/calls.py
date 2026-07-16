import os
import logging
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, BackgroundTasks
from sqlalchemy.orm import Session
from backend.api import deps
from backend.repositories import crud
from backend.schemas import schemas
from backend.services.upload import UploadService
from backend.services.pipeline import PipelineService

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/upload", response_model=schemas.Call)
async def upload_call(
    background_tasks: BackgroundTasks,
    advisor_id: int = Form(...),
    client_name: str = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(deps.get_db)
):
    """
    Upload an audio file and start the AI processing pipeline.
    """
    # Verify advisor exists
    advisor = crud.advisor.get(db=db, id=advisor_id)
    if not advisor:
        raise HTTPException(status_code=400, detail="Advisor not found")

    # 1. Validate and save file
    # UploadService handles validation (extension, size, empty file)
    # and duplicate uploads can be prevented if we check hash, but for now
    # it saves as UUID to avoid filename collisions.
    try:
        file_path = UploadService.save_file(file)
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Upload failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to upload file")

    # 2. Create Call record in DB
    call_in = schemas.CallCreate(
        advisor_id=advisor_id,
        client_name=client_name,
        audio_url=file_path,
        status="PENDING"
    )
    
    try:
        call = crud.call.create(db=db, obj_in=call_in)
    except Exception as e:
        # Cleanup file if DB insert fails
        if os.path.exists(file_path):
            os.remove(file_path)
        logger.error(f"Failed to create call record: {e}")
        raise HTTPException(status_code=500, detail="Failed to create call record")

    # 3. Start processing pipeline in background
    # This prevents blocking the HTTP response while LLM/Transcription runs
    background_tasks.add_task(PipelineService.process_call, db, call.id)

    return call

@router.get("", response_model=list[schemas.Call])
@router.get("/", response_model=list[schemas.Call], include_in_schema=False)
def read_calls(skip: int = 0, limit: int = 100, db: Session = Depends(deps.get_db)):
    try:
        return crud.call.get_multi(db=db, skip=skip, limit=limit)
    except Exception as e:
        logger.error(f"Failed to read calls: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
