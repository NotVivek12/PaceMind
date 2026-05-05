/**
 * Typed API client for the FastAPI backend.
 * Includes request timeouts and structured error handling.
 */
import type {
  CurriculumRequest,
  CurriculumResponse,
  ContentExtractRequest,
  ContentExtractResponse,
  NotesUploadResponse,
  EvaluateSessionRequest,
  EvaluateSessionResponse,
  MoodSignalRequest,
  MoodSignalResponse,
  NextQuestionRequest,
  NextQuestionResponse,
  GradeAnswerRequest,
  GradeAnswerResponse,
  SessionActivityRequest,
  SessionAnalyticsResponse,
  SessionStartRequest,
  SessionStartResponse,
  EndSessionResponse,
} from '@/types';

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8000';

/** Default timeout for fast endpoints (ms) */
const SHORT_TIMEOUT = 5_000;
/** Extended timeout for LLM-backed endpoints (ms) */
const LLM_TIMEOUT = 120_000;

function isAbortError(err: unknown): err is DOMException {
  return err instanceof DOMException && err.name === 'AbortError';
}

async function post<TReq, TRes>(
  path: string,
  body: TReq,
  timeoutMs: number = SHORT_TIMEOUT,
): Promise<TRes> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!res.ok) {
      if (res.status === 429) {
        throw new Error('Too many requests — please wait a moment and try again.');
      }
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail ?? `Request failed (${res.status})`);
    }

    return res.json() as Promise<TRes>;
  } catch (err: unknown) {
    if (isAbortError(err)) {
      throw new Error(
        'The request timed out. The AI is taking longer than expected — please try again.',
      );
    }
    // Re-throw fetch network errors with a friendlier message
    if (err instanceof TypeError && err.message === 'Failed to fetch') {
      throw new Error(
        'Cannot reach the server. Make sure the backend is running.',
      );
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

async function get<TRes>(
  path: string,
  timeoutMs: number = SHORT_TIMEOUT,
): Promise<TRes> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: 'GET',
      signal: controller.signal,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail ?? `Request failed (${res.status})`);
    }

    return res.json() as Promise<TRes>;
  } catch (err: unknown) {
    if (isAbortError(err)) {
      throw new Error('The request timed out. Please try again.');
    }
    if (err instanceof TypeError && err.message === 'Failed to fetch') {
      throw new Error('Cannot reach the server. Make sure the backend is running.');
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

// ─── API Methods ──────────────────────────────────────────────────────────────

/** Path A — AI builds a concept graph from topic + intent + level */
export const generateCurriculum = (req: CurriculumRequest) =>
  post<CurriculumRequest, CurriculumResponse>(
    '/api/curriculum/generate',
    req,
    LLM_TIMEOUT,
  );

/** Path B — extract concepts from uploaded notes text */
export const extractContent = (req: ContentExtractRequest) =>
  post<ContentExtractRequest, ContentExtractResponse>(
    '/api/content/extract',
    req,
    LLM_TIMEOUT,
  );

/** Path B — upload a PDF/text file for concept extraction */
export async function uploadNotesFile(file: File): Promise<NotesUploadResponse> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), LLM_TIMEOUT);

  const formData = new FormData();
  formData.append('file', file);

  try {
    const res = await fetch(`${BASE_URL}/api/curriculum/upload-notes`, {
      method: 'POST',
      body: formData,
      signal: controller.signal,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail ?? `Upload failed (${res.status})`);
    }

    return res.json() as Promise<NotesUploadResponse>;
  } catch (err: unknown) {
    if (isAbortError(err)) {
      throw new Error('Upload timed out. The file may be too large or the AI is busy.');
    }
    if (err instanceof TypeError && err.message === 'Failed to fetch') {
      throw new Error('Cannot reach the server. Make sure the backend is running.');
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

/** Mood Engine — infer student mood from timing + keystrokes */
export const evaluateSession = (req: EvaluateSessionRequest) =>
  post<EvaluateSessionRequest, EvaluateSessionResponse>(
    '/api/session/evaluate',
    req,
    SHORT_TIMEOUT,
  );

/** Mood Signals - fuse keystroke + expression scores */
export const evaluateMoodSignals = (req: MoodSignalRequest) =>
  post<MoodSignalRequest, MoodSignalResponse>(
    '/api/mood',
    req,
    SHORT_TIMEOUT,
  );

/** Intervention Router — generate next question + coaching intervention */
export const getNextQuestion = (req: NextQuestionRequest) =>
  post<NextQuestionRequest, NextQuestionResponse>(
    '/api/session/next-question',
    req,
    LLM_TIMEOUT,
  );

/** Grade Answer — ask LLM to evaluate answer correctness */
export const gradeAnswer = (req: GradeAnswerRequest) =>
  post<GradeAnswerRequest, GradeAnswerResponse>(
    '/api/session/grade',
    req,
    LLM_TIMEOUT,
  );

/** Intervention — fetch fresh coach message based on mood + performance */
export interface InterventionRequest {
  topic: string;
  mood: string;
  history_correct: number;
  history_total: number;
  wrong_streak: number;
}

export interface InterventionResponse {
  message: string;
  coachMessage: string;
  difficultyAdjustment: 'easier' | 'same' | 'harder';
  formatSwitch: string;
  tone: string;
}

export const getIntervention = (req: InterventionRequest) =>
  post<InterventionRequest, InterventionResponse>(
    '/api/intervention',
    req,
    LLM_TIMEOUT,
  );

export const startLearningSession = (req: SessionStartRequest) =>
  post<SessionStartRequest, SessionStartResponse>(
    '/api/session/start',
    req,
    SHORT_TIMEOUT,
  );

export const submitSessionActivity = (sessionId: string, req: SessionActivityRequest) =>
  post<SessionActivityRequest, { status: string }>(
    `/api/session/${sessionId}/activity`,
    req,
    SHORT_TIMEOUT,
  );

export const endLearningSession = (sessionId: string) =>
  post<Record<string, never>, EndSessionResponse>(
    `/api/session/${sessionId}/end`,
    {},
    LLM_TIMEOUT,
  );

export const getSessionAnalytics = (sessionId: string) =>
  get<SessionAnalyticsResponse>(
    `/api/session/${sessionId}/analytics`,
    SHORT_TIMEOUT,
  );

export const getDemoSession = () =>
  get<{ session_id: string }>('/api/demo/session', SHORT_TIMEOUT);
