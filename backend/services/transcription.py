import asyncio
from typing import List, Dict, Any

class TranscriptionService:
    """
    Interface for transcription services.
    Currently mocked to satisfy assignment requirements for a modular design
    without incurring costs/delays unless specific APIs (e.g., Whisper) are configured.
    """
    
    @staticmethod
    async def transcribe(audio_path: str) -> str:
        """
        Transcribe an audio file to text.
        """
        # In a real production scenario, you would upload the file to Google Cloud Speech-to-Text,
        # OpenAI Whisper, or another provider.
        
        # MOCK IMPLEMENTATION
        await asyncio.sleep(2) # Simulate processing time
        return "Thank you for calling FitNova. My name is Alex. How can I help you today? Hi Alex, I'm interested in the premium membership. Can you tell me more about it? Sure, the premium membership gives you access to all classes and personal training sessions."
