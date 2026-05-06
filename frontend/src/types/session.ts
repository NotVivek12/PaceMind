import type { Concept, StudentLevel } from './index';

export interface SessionData {
  topic: string;
  concepts: Concept[];
  level?: StudentLevel;
}
