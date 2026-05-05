# PaceMind - Mood-Aware AI Tutor

PaceMind is an adaptive learning loop that changes the next question and coaching tone based on what a student knows and how they seem to feel. The demo focus is simple: upload notes, generate a curriculum, answer questions, simulate frustration, and watch the coach react.

## Demo Run

Target time: under 2 minutes.

1. Open the app at `http://localhost:3000`.
2. Click `Get Started`.
3. Choose `I have my own notes`.
4. Paste the sample notes from [DEMO_SCRIPT.md](./DEMO_SCRIPT.md).
5. Click `Extract Concepts`.
6. Answer the first question correctly.
7. Use the mood override dropdown and choose `Frustrated`.
8. Answer incorrectly or wait for the timer.
9. Point out the coach message, difficulty adjustment, and teacher dashboard after ending.

Backup path: click `Open demo data` from the home screen to show a pre-seeded student session with rich mood history, mastery heatmap, and recap.

## Architecture

```text
Student browser
  |  Next.js UI
  |  - notes upload/paste
  |  - quiz loop
  |  - webcam expression scoring with face-api.js
  |  - manual mood override backup
  v
FastAPI backend
  |  /api/content/extract
  |  /api/curriculum/generate
  |  /api/session/next-question
  |  /api/session/{id}/activity
  |  /api/session/{id}/analytics
  v
AI services
  |  OpenRouter/Gemini compatible LLM calls
  |  fallback curriculum/questions/summaries if keys or network fail
  v
Analytics layer
  |  mood timeline
  |  concept mastery green/amber/red
  |  3-sentence session recap
  v
Teacher dashboard
```

## Local Setup

Backend:

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000`.

## Environment

The app runs without external keys using deterministic fallbacks. For live AI generation, set one provider:

```env
LLM_PROVIDER=openrouter
OPENROUTER_API_KEY=...
LLM_MODEL=anthropic/claude-3.5-sonnet
```

or:

```env
LLM_PROVIDER=gemini
GEMINI_API_KEY=...
LLM_MODEL=gemini-1.5-flash
```

## Submission Checklist

- README: this file
- Pitch deck: [PITCH_DECK.md](./PITCH_DECK.md)
- Demo script: [DEMO_SCRIPT.md](./DEMO_SCRIPT.md)
- Live URL: add the Vercel URL after deploy
- Loom backup: add the recording URL after capture
- Backup demo: home screen `Open demo data`

## Deployment Notes

Frontend target: Vercel from `frontend/`.

Backend target: any FastAPI host such as Render, Railway, Fly.io, or a Vercel-compatible serverless adapter. Set `NEXT_PUBLIC_BACKEND_URL` in Vercel to the deployed backend URL.

Before recording or submitting:

```bash
cd frontend
npm.cmd run build
```

```bash
cd ..
python -m compileall backend\app
```
