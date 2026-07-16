from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from datetime import datetime
from backend.models.models import CallStatus, Severity, AppealStatus

# --- Organizations ---
class OrganizationBase(BaseModel):
    name: str

class OrganizationCreate(OrganizationBase):
    pass

class Organization(OrganizationBase):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

# --- Teams ---
class TeamBase(BaseModel):
    name: str
    organization_id: int

class TeamCreate(TeamBase):
    pass

class Team(TeamBase):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

# --- Advisors ---
class AdvisorBase(BaseModel):
    name: str
    email: str
    team_id: int

class AdvisorCreate(AdvisorBase):
    pass

class Advisor(AdvisorBase):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

# --- Calls ---
class CallBase(BaseModel):
    advisor_id: int
    client_name: Optional[str] = None
    audio_url: Optional[str] = None
    status: Optional[str] = CallStatus.PENDING.value
    duration_seconds: Optional[int] = 0

class CallCreate(CallBase):
    pass

class Call(CallBase):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

# --- Issue Tags ---
class IssueTagBase(BaseModel):
    call_id: int
    type: str
    severity: str
    timestamp: Optional[str] = None
    transcript_quote: Optional[str] = None
    reason: Optional[str] = None
    recommendation: Optional[str] = None
    confidence: Optional[float] = 1.0

class IssueTagCreate(IssueTagBase):
    pass

class IssueTag(IssueTagBase):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

# --- Transcripts ---
class TranscriptBase(BaseModel):
    call_id: int
    full_text: str
    utterances_json: Optional[str] = None

class Transcript(TranscriptBase):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

# --- Scores ---
class ScoreBase(BaseModel):
    call_id: int
    needs_discovery: float = 0.0
    product_knowledge: float = 0.0
    rapport: float = 0.0
    empathy: float = 0.0
    objection_handling: float = 0.0
    compliance: float = 0.0
    closing: float = 0.0
    trial_booking: float = 0.0
    overall_score: float = 0.0

class Score(ScoreBase):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class CallDetail(Call):
    advisor: Optional[Advisor] = None
    transcript: Optional[Transcript] = None
    score: Optional[Score] = None
    issues: List[IssueTag] = []
    model_config = ConfigDict(from_attributes=True)


# --- Appeals ---
class AppealBase(BaseModel):
    issue_tag_id: int
    advisor_id: int
    justification: str

class AppealCreate(AppealBase):
    pass

class Appeal(AppealBase):
    id: int
    status: str
    resolution_notes: Optional[str] = None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)
