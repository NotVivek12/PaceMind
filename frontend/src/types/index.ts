// ─── Domain Types ─────────────────────────────────────────────────────────────

export interface Concept {
  id: string;
  concept: string;
  prerequisites: string[];
  difficulty: number;
}

export type Intent = 'exam_prep' | 'catch_up' | 'curiosity';

export type MoodState = 'Flow' | 'Confused' | 'Frustrated' | 'Disengaged';

// ─── API Request / Response Types ─────────────────────────────────────────────

export interface CurriculumRequest {
  topic: string;
  intent: Intent;
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
