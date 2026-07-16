import json
import logging
from typing import Dict, Any, List
from google import genai
from google.genai import types
from pydantic import BaseModel, Field

from backend.config import settings

logger = logging.getLogger(__name__)

# Pydantic models for structured output from Gemini
class IssueTagOutput(BaseModel):
    type: str = Field(description="The type of issue, e.g., 'No Needs Discovery', 'Pressure Selling', 'Compliance Violation'")
    severity: str = Field(description="Severity of the issue: LOW, MEDIUM, HIGH, CRITICAL")
    timestamp: str = Field(description="Timestamp in the transcript where the issue occurred, e.g., '02:15'")
    transcript_quote: str = Field(description="The exact quote from the transcript")
    reason: str = Field(description="Reason why this is an issue")
    recommendation: str = Field(description="Recommendation for the advisor to improve")
    confidence: float = Field(description="Confidence score between 0.0 and 1.0")

class ScoreBreakdown(BaseModel):
    needs_discovery: float = Field(description="Score out of 10.0")
    product_knowledge: float = Field(description="Score out of 10.0")
    rapport: float = Field(description="Score out of 10.0")
    empathy: float = Field(description="Score out of 10.0")
    objection_handling: float = Field(description="Score out of 10.0")
    compliance: float = Field(description="Score out of 10.0")
    closing: float = Field(description="Score out of 10.0")
    trial_booking: float = Field(description="Score out of 10.0")

class AnalysisResult(BaseModel):
    overall_score: float = Field(description="Overall quality score out of 10.0")
    score_breakdown: ScoreBreakdown
    issue_tags: list[IssueTagOutput]
    summary: str = Field(description="A brief summary of the call")
    follow_up_actions: list[str] = Field(description="List of suggested follow-up actions")

class AnalysisService:
    @staticmethod
    def analyze_transcript(transcript: str, utterances: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Analyzes the transcript using Google Gemini API to generate scores and issue tags.
        Expects strict JSON response.
        """
        if not settings.gemini_api_key:
            logger.warning("Gemini API key not set, using mock analysis result")
            return AnalysisService._mock_analysis()

        try:
            client = genai.Client(api_key=settings.gemini_api_key)
            
            # Format utterances for the prompt
            formatted_transcript = ""
            for u in utterances:
                formatted_transcript += f"[{u.get('start')}-{u.get('end')}] {u.get('speaker')}: {u.get('text')}\n"

            prompt = f"""
You are an expert AI Sales Intelligence Evaluator for FitNova, a fitness organization.
Analyze the following sales call transcript.

Transcript:
{formatted_transcript}

Evaluate the call based on standard sales metrics:
1. Needs Discovery
2. Product Knowledge
3. Rapport
4. Empathy
5. Objection Handling
6. Compliance
7. Closing
8. Trial Booking

Identify any issues (e.g., No Needs Discovery, Pressure Selling, Guaranteed Results, Talking Over Customer, Price Before Value, Weak Closing, No Trial Booking, Compliance Violation, Undisclosed Costs).
Provide a summary and follow-up actions.
"""

            response = client.models.generate_content(
                model='gemini-3.5-flash',
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=AnalysisResult,
                    temperature=0.2,
                ),
            )
            
            # Parse the JSON response
            result_json = json.loads(response.text)
            return result_json
            
        except Exception as e:
            logger.error(f"Failed to analyze transcript with Gemini: {e}")
            raise

    @staticmethod
    def _mock_analysis() -> Dict[str, Any]:
        return {
            "overall_score": 7.5,
            "score_breakdown": {
                "needs_discovery": 6.0,
                "product_knowledge": 9.0,
                "rapport": 8.0,
                "empathy": 7.5,
                "objection_handling": 7.0,
                "compliance": 10.0,
                "closing": 6.5,
                "trial_booking": 6.0
            },
            "issue_tags": [
                {
                    "type": "No Trial Booking",
                    "severity": "HIGH",
                    "timestamp": "00:00:18",
                    "transcript_quote": "Sure, the premium membership gives you access to all classes...",
                    "reason": "The advisor explained the features but did not attempt to book a trial.",
                    "recommendation": "Always conclude feature explanation with a call to action, such as offering a free trial.",
                    "confidence": 0.95
                }
            ],
            "summary": "Customer inquired about premium membership. Advisor explained features but missed the opportunity to book a trial.",
            "follow_up_actions": ["Call customer back to offer a free trial.", "Send premium membership brochure."]
        }
