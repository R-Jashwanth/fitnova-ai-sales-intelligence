import os
import json
import logging
from sqlalchemy.orm import Session
from backend.models.models import Call, CallStatus, Transcript, Score, IssueTag
from backend.services.diarization import DiarizationService
from backend.services.transcription import TranscriptionService
from backend.services.cleaning import CleaningService
from backend.services.analysis import AnalysisService

logger = logging.getLogger(__name__)

class PipelineService:
    @staticmethod
    async def process_call(call_id: int):
        from backend.database import SessionLocal
        db = SessionLocal()
        try:
            """
            End-to-end pipeline for processing a call audio file.
            """
            call = db.query(Call).filter(Call.id == call_id).first()
            if not call:
                logger.error(f"Call with ID {call_id} not found for processing.")
                return

            # 1. Update status to PROCESSING
            call.status = CallStatus.PROCESSING.value
            db.commit()

            # 2. Transcription (Mocked/Interface)
            full_text = await TranscriptionService.transcribe(call.audio_url)
            
            # 3. Speaker Diarization
            raw_utterances = await DiarizationService.diarize(
                 call.audio_url,
                 full_text
            )
            
            # 4 & 5. Transcript Cleaning & PII Redaction
            clean_utterances = CleaningService.process(raw_utterances)
            
            # Generate full clean text from utterances
            clean_full_text = " ".join([u.get("text", "") for u in clean_utterances])

            # Save Transcript to DB
            transcript_record = Transcript(
                call_id=call.id,
                full_text=clean_full_text,
                utterances_json=json.dumps(clean_utterances)
            )
            db.add(transcript_record)

            # 6. Gemini Analysis (Run in thread to prevent blocking event loop)
            import asyncio
            analysis_result = await asyncio.to_thread(
                AnalysisService.analyze_transcript, clean_full_text, clean_utterances
            )

            # 7. Database Storage for Analysis
            score_data = analysis_result.get("score_breakdown", {})
            score_record = Score(
                call_id=call.id,
                overall_score=analysis_result.get("overall_score", 0.0),
                needs_discovery=score_data.get("needs_discovery", 0.0),
                product_knowledge=score_data.get("product_knowledge", 0.0),
                rapport=score_data.get("rapport", 0.0),
                empathy=score_data.get("empathy", 0.0),
                objection_handling=score_data.get("objection_handling", 0.0),
                compliance=score_data.get("compliance", 0.0),
                closing=score_data.get("closing", 0.0),
                trial_booking=score_data.get("trial_booking", 0.0),
            )
            db.add(score_record)

            for issue in analysis_result.get("issue_tags", []):
                issue_record = IssueTag(
                    call_id=call.id,
                    type=issue.get("type"),
                    severity=issue.get("severity"),
                    timestamp=issue.get("timestamp"),
                    transcript_quote=issue.get("transcript_quote"),
                    reason=issue.get("reason"),
                    recommendation=issue.get("recommendation"),
                    confidence=issue.get("confidence", 1.0)
                )
                db.add(issue_record)

            # Update call status to COMPLETED
            call.status = CallStatus.COMPLETED.value
            db.commit()
            logger.info(f"Successfully processed call ID {call_id}")

        except Exception as e:
            logger.error(f"Error processing call ID {call_id}: {e}", exc_info=True)
            db.rollback()
            # Update call status to FAILED
            call = db.query(Call).filter(Call.id == call_id).first()
            if call:
                call.status = CallStatus.FAILED.value
                db.commit()
        finally:
            db.close()
