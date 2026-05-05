/**
 * Typed API client for the FastAPI backend.
 * All functions call http://localhost:8000 directly from the browser.
 */
import type {
  CurriculumRequest,
  CurriculumResponse,
  ContentExtractRequest,
  ContentExtractResponse,
  EvaluateSessionRequest,
  EvaluateSessionResponse,
  NextQuestionRequest,
  NextQuestionResponse,
} from '@/types';

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8000';

async function post<TReq, TRes>(path: string, body: TReq): Promise<TRes> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? 'API request failed');
  }

  return res.json() as Promise<TRes>;
}

// ─── API Methods ──────────────────────────────────────────────────────────────

/** Path A — AI builds a concept graph from topic + intent */
export const generateCurriculum = (req: CurriculumRequest) =>
  post<CurriculumRequest, CurriculumResponse>('/api/curriculum/generate', req);

/** Path B — extract concepts from uploaded notes text */
export const extractContent = (req: ContentExtractRequest) =>
  post<ContentExtractRequest, ContentExtractResponse>('/api/content/extract', req);

/** Mood Engine — infer student mood from timing + keystrokes */
export const evaluateSession = (req: EvaluateSessionRequest) =>
  post<EvaluateSessionRequest, EvaluateSessionResponse>('/api/session/evaluate', req);

/** Intervention Router — generate next question + coaching intervention */
export const getNextQuestion = (req: NextQuestionRequest) =>
  post<NextQuestionRequest, NextQuestionResponse>('/api/session/next-question', req);
