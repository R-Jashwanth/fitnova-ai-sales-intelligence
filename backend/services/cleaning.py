import re
from typing import List, Dict, Any

class CleaningService:
    """
    Cleans transcript and redacts PII.
    """

    @staticmethod
    def clean_transcript(utterances: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Normalizes transcript text and preserves timestamps and speaker names.
        """
        cleaned_utterances = []
        for utterance in utterances:
            text = utterance.get("text", "")
            # Basic normalization
            text = text.strip()
            text = re.sub(r'\s+', ' ', text)
            
            cleaned_utterances.append({
                **utterance,
                "text": text
            })
        return cleaned_utterances

    @staticmethod
    def redact_pii(utterances: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Redacts phone numbers, email addresses, and account numbers.
        """
        email_pattern = re.compile(r'[\w\.-]+@[\w\.-]+\.\w+')
        phone_pattern = re.compile(r'\b(?:\+?1[-. ]?)?\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})\b')
        account_pattern = re.compile(r'\b(?:account(?: number)?[:\s]*)?([0-9]{8,12})\b', re.IGNORECASE)

        redacted_utterances = []
        for utterance in utterances:
            text = utterance.get("text", "")
            
            # Redact email
            text = email_pattern.sub("[EMAIL REDACTED]", text)
            # Redact phone
            text = phone_pattern.sub("[PHONE REDACTED]", text)
            # Redact account
            text = account_pattern.sub("[ACCOUNT REDACTED]", text)

            redacted_utterances.append({
                **utterance,
                "text": text
            })
            
        return redacted_utterances

    @staticmethod
    def process(utterances: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        cleaned = CleaningService.clean_transcript(utterances)
        redacted = CleaningService.redact_pii(cleaned)
        return redacted
