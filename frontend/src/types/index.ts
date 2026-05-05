// ─── Domain Types ─────────────────────────────────────────────────────────────

export interface Concept {
  id: string;
  concept: string;
  prerequisites: string[];
  difficulty: number;
  questionTypes?: string[];
  estimatedMinutes?: number;
}

export type Intent = 'exam_prep' | 'catch_up' | 'curiosity';
export type StudentLevel = 'beginner' | 'intermediate' | 'advanced';
export type MoodState = 'Flow' | 'Confused' | 'Frustrated' | 'Disengaged';

// ─── Diagnostic Types ─────────────────────────────────────────────────────────

export interface DiagnosticQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  difficulty: 1 | 2 | 3;
}

export interface DiagnosticResult {
  level: StudentLevel;
  score: number;
  total: number;
}

// ─── API Request / Response Types ─────────────────────────────────────────────

export interface CurriculumRequest {
  topic: string;
  intent: Intent;
  level: StudentLevel;
}

export interface CurriculumResponse {
  concepts: Concept[];
}

export interface ContentExtractRequest {
  text: string;
  type?: string;
}

export interface ContentExtractResponse {
  concepts: Concept[];
}

export interface NotesUploadResponse {
  extracted_text_preview: string;
  concepts: Concept[];
}

export interface EvaluateSessionRequest {
  answer_correct: boolean;
  response_time_ms: number;
  keystroke_speed_chars_per_sec: number;
  backspace_count: number;
  pause_count: number;
}

export interface EvaluateSessionResponse {
  mood: MoodState;
}

export interface KeystrokeSignals {
  typing_speed_cps: number;
  backspace_count: number;
  pause_count: number;
  input_events: number;
  elapsed_ms: number;
}

export interface FaceExpressionScores {
  neutral: number;
  happy: number;
  sad: number;
  angry: number;
  fearful: number;
  disgusted: number;
  surprised: number;
}

export interface MoodSignalRequest {
  keystroke: KeystrokeSignals;
  expressions?: FaceExpressionScores;
  override_mood?: MoodState | null;
}

export interface MoodSignalResponse {
  mood: MoodState;
  confidence: number;
  source: 'aggregate' | 'override';
  dominant_expression?: string | null;
}

export interface PerformanceHistory {
  correct: number;
  total: number;
}

export interface NextQuestionRequest {
  current_mood: MoodState;
  concept_id: string;
  previous_performance?: PerformanceHistory;
  wrong_streak?: number;
}

export interface Intervention {
  coachMessage: string;
  difficultyAdjustment: 'easier' | 'same' | 'harder';
  formatSwitch: 'text' | 'visual' | 'interactive' | 'none';
  tone: string;
}

export interface NextQuestionResponse {
  questionText: string;
  intervention: Intervention;
  options?: string[];
  correctIndex?: number | null;
}

export interface GradeAnswerRequest {
  question_text: string;
  answer_text: string;
}

export interface GradeAnswerResponse {
  is_correct: boolean;
  feedback: string;
}

export interface SessionStartRequest {
  topic: string;
  concepts: Concept[];
}

export interface SessionStartResponse {
  session_id: string;
  topic: string;
}

export interface SessionActivityRequest {
  event_type: 'answer_submission' | 'answer_timeout' | 'mood_signal' | string;
  data: Record<string, unknown>;
}

export type MasteryStatus = 'green' | 'amber' | 'red';

export interface ConceptMastery {
  concept_id: string;
  concept: string;
  correct: number;
  total: number;
  accuracy: number;
  status: MasteryStatus;
}

export interface MoodTimelinePoint {
  timestamp: string;
  mood: MoodState;
  confidence: number;
  concept?: string | null;
}

export interface StudentSessionSummary {
  student_id: string;
  student_name: string;
  session_id: string;
  topic: string;
  status: string;
  started_at: string;
  ended_at?: string | null;
  total_events: number;
  answers_total: number;
  answers_correct: number;
  accuracy: number;
  mood_counts: Partial<Record<MoodState, number>>;
  dominant_mood: MoodState;
  mood_timeline: MoodTimelinePoint[];
  concept_mastery: ConceptMastery[];
  llm_summary?: string | null;
}

export interface SessionAnalyticsResponse {
  session_id: string;
  topic: string;
  status: string;
  total_events: number;
  class_overview: StudentSessionSummary[];
  student_summary?: StudentSessionSummary | null;
}

export interface EndSessionResponse {
  status: string;
  summary?: string | null;
}
