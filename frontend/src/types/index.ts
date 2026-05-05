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
}

export interface GradeAnswerRequest {
  question_text: string;
  answer_text: string;
}

export interface GradeAnswerResponse {
  is_correct: boolean;
  feedback: string;
}
