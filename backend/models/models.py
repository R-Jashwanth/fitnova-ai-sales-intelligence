from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from backend.database import Base

class CallStatus(str, enum.Enum):
    PENDING = "PENDING"
    PROCESSING = "PROCESSING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"

class Severity(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class AppealStatus(str, enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"

class Organization(Base):
    __tablename__ = "organizations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    teams = relationship("Team", back_populates="organization", cascade="all, delete-orphan")

class Team(Base):
    __tablename__ = "teams"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    organization = relationship("Organization", back_populates="teams")
    advisors = relationship("Advisor", back_populates="team", cascade="all, delete-orphan")

class Advisor(Base):
    __tablename__ = "advisors"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    team_id = Column(Integer, ForeignKey("teams.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    team = relationship("Team", back_populates="advisors")
    calls = relationship("Call", back_populates="advisor", cascade="all, delete-orphan")

class Call(Base):
    __tablename__ = "calls"

    id = Column(Integer, primary_key=True, index=True)
    advisor_id = Column(Integer, ForeignKey("advisors.id"), nullable=False)
    client_name = Column(String)
    audio_url = Column(String) # Path to uploaded file
    status = Column(String, default=CallStatus.PENDING.value)
    duration_seconds = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    advisor = relationship("Advisor", back_populates="calls")
    transcript = relationship("Transcript", back_populates="call", uselist=False, cascade="all, delete-orphan")
    score = relationship("Score", back_populates="call", uselist=False, cascade="all, delete-orphan")
    issues = relationship("IssueTag", back_populates="call", cascade="all, delete-orphan")

class Transcript(Base):
    __tablename__ = "transcripts"

    id = Column(Integer, primary_key=True, index=True)
    call_id = Column(Integer, ForeignKey("calls.id"), nullable=False, unique=True)
    full_text = Column(Text, nullable=False)
    utterances_json = Column(Text) # Stored as JSON string to handle complex diarization arrays
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    call = relationship("Call", back_populates="transcript")

class Score(Base):
    __tablename__ = "scores"

    id = Column(Integer, primary_key=True, index=True)
    call_id = Column(Integer, ForeignKey("calls.id"), nullable=False, unique=True)
    needs_discovery = Column(Float, default=0.0)
    product_knowledge = Column(Float, default=0.0)
    rapport = Column(Float, default=0.0)
    empathy = Column(Float, default=0.0)
    objection_handling = Column(Float, default=0.0)
    compliance = Column(Float, default=0.0)
    closing = Column(Float, default=0.0)
    trial_booking = Column(Float, default=0.0)
    overall_score = Column(Float, default=0.0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    call = relationship("Call", back_populates="score")

class IssueTag(Base):
    __tablename__ = "issue_tags"

    id = Column(Integer, primary_key=True, index=True)
    call_id = Column(Integer, ForeignKey("calls.id"), nullable=False)
    type = Column(String, nullable=False) # e.g. "No Needs Discovery", "Compliance Violation"
    severity = Column(String, nullable=False)
    timestamp = Column(String) # E.g., "02:15"
    transcript_quote = Column(Text)
    reason = Column(Text)
    recommendation = Column(Text)
    confidence = Column(Float, default=1.0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    call = relationship("Call", back_populates="issues")
    appeals = relationship("Appeal", back_populates="issue_tag", cascade="all, delete-orphan")

class Appeal(Base):
    __tablename__ = "appeals"

    id = Column(Integer, primary_key=True, index=True)
    issue_tag_id = Column(Integer, ForeignKey("issue_tags.id"), nullable=False)
    advisor_id = Column(Integer, ForeignKey("advisors.id"), nullable=False)
    status = Column(String, default=AppealStatus.PENDING.value)
    justification = Column(Text, nullable=False)
    resolution_notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    issue_tag = relationship("IssueTag", back_populates="appeals")
    advisor = relationship("Advisor")
