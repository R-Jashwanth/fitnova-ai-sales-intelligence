import asyncio
from faster_whisper import WhisperModel

# Load the model once when the application starts
model = WhisperModel(
    "base",
    device="cpu",
    compute_type="int8"
)

class TranscriptionService:
    """
    Transcribes audio files using Faster-Whisper.
    """

    @staticmethod
    async def transcribe(audio_path: str) -> str:
        def _transcribe():
            segments, info = model.transcribe(
                audio_path,
                beam_size=5
            )

            transcript = " ".join(segment.text.strip() for segment in segments)
            return transcript

        # Run blocking Whisper inference in a background thread
        return await asyncio.to_thread(_transcribe)