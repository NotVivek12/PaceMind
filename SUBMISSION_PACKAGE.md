# Submission Package

## Required Links

- Live URL: TODO after Vercel deploy
- Backend URL: TODO after FastAPI deploy
- Loom backup video: TODO after recording
- Repository: TODO

## Attachments

- README: `HACKATHON_README.md`
- Pitch deck: `PITCH_DECK.md`
- Demo script: `DEMO_SCRIPT.md`

## Final Demo Checklist

- Frontend production build passes.
- Backend compile check passes.
- No frontend lint errors.
- No hardcoded production API keys.
- `Open demo data` fallback works.
- Notes -> curriculum -> quiz -> frustration override -> coach reaction rehearsed 3 times.

## Vercel Deploy Steps

1. Deploy the backend to a FastAPI host.
2. In Vercel, import `frontend/` as the project root.
3. Set `NEXT_PUBLIC_BACKEND_URL` to the deployed backend URL.
4. Run the Vercel production deploy.
5. Paste the live URL above and into the hackathon submission form.
