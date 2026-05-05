# PaceMind Pitch Deck

## Slide 1 - Problem

Students do not get stuck only because content is hard. They get stuck because frustration, hesitation, and disengagement compound before a normal quiz system notices.

Current ed-tech mostly adapts to right or wrong answers. Human tutors adapt to emotional state, confidence, pace, and confusion signals.

## Slide 2 - Solution

PaceMind is a mood-aware AI tutor.

Students upload notes or pick a topic. The app generates a curriculum, quizzes them, reads learning signals, and adapts the next question and coaching tone in real time.

Core loop: notes -> concepts -> question -> mood/performance signals -> coach intervention -> next question.

## Slide 3 - Demo Screenshot

Use this shot in the final deck:

1. Student quiz screen with the AI Coach visible.
2. Mood override set to `Frustrated`.
3. Coach message showing supportive tone and easier difficulty.
4. Teacher dashboard showing mood timeline and mastery heatmap.

Screenshot checklist:

- No DevTools open.
- Backend and frontend running.
- Use seeded data if the live run is not visually rich enough.

## Slide 4 - Architecture

```text
Next.js student app
  - notes upload/paste
  - quiz UI
  - face-api.js local expression scoring
  - mood override backup

FastAPI backend
  - curriculum/content APIs
  - next-question and grading APIs
  - session event logging
  - analytics aggregation

LLM provider
  - coaching interventions
  - generated questions
  - post-session recap
  - deterministic fallbacks for demo safety

Teacher dashboard
  - class overview
  - mood timeline
  - concept mastery heatmap
  - 3-sentence recap
```

## Slide 5 - Team

Built for the hackathon by the PaceMind team.

Suggested roles:

- Product/demo lead: owns the two-minute script.
- Frontend lead: owns student loop and teacher dashboard.
- Backend/AI lead: owns session events, analytics, and LLM fallbacks.
- Deployment lead: owns Vercel/backend URL, README, and Loom backup.

Close:

"PaceMind brings the missing human signal back into AI tutoring: not just what a student knows, but how learning feels in the moment."
