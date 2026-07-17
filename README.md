# FitNova AI Sales Intelligence System

An end-to-end AI-powered sales call intelligence system developed as part of the **FitNova AI Engineer Intern Take-Home Assignment**.

The application automatically processes uploaded sales call recordings, transcribes conversations using Faster-Whisper, evaluates call quality with Google Gemini, identifies coaching opportunities, and presents the results through an interactive dashboard.

---

## Features

### Audio Processing
- Upload MP3/WAV sales call recordings
- Background processing using FastAPI BackgroundTasks
- Faster-Whisper speech-to-text transcription
- Simplified speaker diarization
- Transcript generation and storage

### AI Evaluation
- Overall call quality score
- Strengths and improvement suggestions
- Issue detection with severity
- Structured AI analysis using Gemini 3.5 Flash

### Dashboard
- Call history
- Call details page
- Transcript viewer
- AI evaluation report
- Advisor performance analytics

### Database
- Organization → Team → Advisor hierarchy
- Call records
- Transcripts
- Scores
- Issue tags
- Appeals

---

# Architecture

```
                Audio Upload
                     │
                     ▼
             Upload & Validation
                     │
                     ▼
          Background Processing
                     │
        ┌────────────┼────────────┐
        ▼            ▼            ▼
  Faster-Whisper  Diarization  Metadata
  Transcription   (Simplified)
                     │
                     ▼
             Gemini 3.5 Flash
                     │
                     ▼
       Transcript • Scores • Tags
                     │
                     ▼
                  SQLite
                     │
                     ▼
            React Dashboard
```

---

# Tech Stack

## Backend

- FastAPI
- SQLAlchemy
- SQLite
- Pydantic

## AI

- Faster-Whisper
- Google Gemini 3.5 Flash

## Frontend

- React
- TypeScript
- Vite
- Material UI
- Axios

---

# Project Structure

```
backend/
├── api/
├── database/
├── models/
├── repositories/
├── schemas/
├── services/
│   ├── upload.py
│   ├── transcription.py
│   ├── diarization.py
│   ├── analysis.py
│   └── pipeline.py
└── main.py

frontend/
├── src/
├── components/
├── pages/
└── services/

uploads/
README.md
```

---

# Processing Pipeline

1. User uploads a sales call recording.
2. The file is validated and stored.
3. Background processing starts immediately.
4. Faster-Whisper generates the transcript.
5. A lightweight diarization step separates the conversation into speaker segments.
6. Gemini analyzes the transcript and returns:
   - Overall quality score
   - Coaching feedback
   - Strengths
   - Improvement suggestions
   - Issue tags
7. Results are stored in SQLite.
8. The dashboard displays the completed analysis.

---

# Design Decisions

### Faster-Whisper

I chose Faster-Whisper because it runs locally, is fast on CPU, and avoids external transcription costs.

### Gemini 3.5 Flash

Gemini is used only for transcript analysis. The model returns structured JSON that is parsed into scores, coaching feedback, and issue tags.

### Background Processing

Audio processing runs using FastAPI BackgroundTasks so uploads return immediately without waiting for AI processing to finish.

### SQLite

SQLite was selected to keep the project simple and easy to run without additional database setup.

---

# Setup

## Backend

```bash
cd backend

python -m venv venv

venv\Scripts\activate

pip install -r requirements.txt

uvicorn main:app --reload
```

Backend:

```
http://localhost:8000
```

---

## Frontend

```bash
cd frontend

npm install

npm run dev
```

Frontend:

```
http://localhost:3000
```

---

# API Endpoints

| Method | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/calls/upload` | Upload a sales call |
| GET | `/api/calls` | List all calls |
| GET | `/api/calls/{id}` | View call details |
| GET | `/api/dashboard` | Dashboard statistics |

---

# Current Limitations

This project is a functional prototype built for the assignment. A few areas can be improved:

- Speaker diarization uses a simplified implementation instead of Pyannote or WhisperX.
- Audio playback requires additional static file configuration.
- Audio duration metadata is not fully implemented for every upload.
- SQLite is used for development instead of PostgreSQL.

These limitations do not affect the end-to-end AI processing pipeline.

---

# Future Improvements

- Production-grade speaker diarization
- Automatic PII masking
- Multilingual transcription
- Real-time streaming analysis
- PostgreSQL support
- Docker deployment
- User authentication and role-based access

---

# Assignment Coverage

- ✅ Audio ingestion
- ✅ Automatic transcription
- ✅ Speaker diarization
- ✅ AI call evaluation
- ✅ Issue tagging
- ✅ Database storage
- ✅ Dashboard visualization
- ✅ Advisor hierarchy
- ✅ Background processing
- ✅ End-to-end working prototype

---

# Demo

1. Upload a sales call recording.
2. Wait for background processing.
3. Open the processed call.
4. Review the transcript.
5. View AI-generated score and coaching feedback.
6. Explore analytics from the dashboard.

---

# Author

**Jashwanth R**

B.E. Artificial Intelligence and Data Science

Don Bosco Institute of Technology, Bengaluru

GitHub: **<https://github.com/R-Jashwanth/fitnova-ai-sales-intelligence>**
