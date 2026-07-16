import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse

from backend.database import Base, engine
from backend.api import deps
from backend.repositories import crud
from backend.schemas import schemas
from backend.config import settings
from backend.api.endpoints import calls

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database
    logger.info("Initializing database...")
    Base.metadata.create_all(bind=engine)
    logger.info("Database initialized.")
    yield
    # Clean up resources if needed
    logger.info("Shutting down...")

app = FastAPI(title=settings.app_name, lifespan=lifespan)

# Exception handling middleware
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"message": "An unexpected error occurred. Please try again later."},
    )

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Endpoints
@app.get("/api/health")
def health_check():
    return {"status": "ok", "message": f"{settings.app_name} API is running"}

# Organizations
app.include_router(calls.router, prefix="/api/calls", tags=["calls"])

@app.post("/api/organizations", response_model=schemas.Organization)
def create_organization(org: schemas.OrganizationCreate, db: Session = Depends(deps.get_db)):
    try:
        return crud.organization.create(db=db, obj_in=org)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Organization already exists or invalid data.")

@app.get("/api/organizations", response_model=list[schemas.Organization])
def read_organizations(skip: int = 0, limit: int = 100, db: Session = Depends(deps.get_db)):
    try:
        return crud.organization.get_multi(db=db, skip=skip, limit=limit)
    except Exception as e:
        logger.error(f"Error reading organizations: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

# Teams
@app.post("/api/teams", response_model=schemas.Team)
def create_team(team: schemas.TeamCreate, db: Session = Depends(deps.get_db)):
    try:
        return crud.team.create(db=db, obj_in=team)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Invalid data or organization does not exist.")

@app.get("/api/teams", response_model=list[schemas.Team])
def read_teams(skip: int = 0, limit: int = 100, db: Session = Depends(deps.get_db)):
    try:
        return crud.team.get_multi(db=db, skip=skip, limit=limit)
    except Exception as e:
        logger.error(f"Error reading teams: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

# Advisors
@app.post("/api/advisors", response_model=schemas.Advisor)
def create_advisor(advisor: schemas.AdvisorCreate, db: Session = Depends(deps.get_db)):
    try:
        return crud.advisor.create(db=db, obj_in=advisor)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Advisor email already exists or team does not exist.")

@app.get("/api/advisors", response_model=list[schemas.Advisor])
def read_advisors(skip: int = 0, limit: int = 100, db: Session = Depends(deps.get_db)):
    try:
        return crud.advisor.get_multi(db=db, skip=skip, limit=limit)
    except Exception as e:
        logger.error(f"Error reading advisors: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

# If running in production (or standalone), serve the React app
dist_path = os.path.join(os.getcwd(), 'dist')
if os.path.exists(dist_path):
    app.mount("/assets", StaticFiles(directory=os.path.join(dist_path, "assets")), name="assets")
    
    @app.get("/{full_path:path}")
    def serve_frontend(full_path: str):
        # We serve index.html for any unhandled path so React Router works
        return FileResponse(os.path.join(dist_path, 'index.html'))
