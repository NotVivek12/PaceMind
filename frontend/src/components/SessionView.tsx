'use client';

import { useState, useEffect, useRef, KeyboardEvent } from 'react';
import { evaluateSession, getNextQuestion } from '@/lib/api';
import type { SessionData } from '@/app/page';
import type { MoodState, Concept, Intervention } from '@/types';

interface Props {
  session: SessionData;
  onEnd: () => void;
}

const MOOD_CONFIG: Record<MoodState, { emoji: string; label: string; color: string }> = {
  Flow:       { emoji: '⚡', label: 'Flow',       color: 'text-emerald-400' },
  Confused:   { emoji: '😕', label: 'Confused',   color: 'text-yellow-400' },
  Frustrated: { emoji: '😤', label: 'Frustrated', color: 'text-orange-400' },
  Disengaged: { emoji: '😴', label: 'Disengaged', color: 'text-red-400' },
};

export default function SessionView({ session, onEnd }: Props) {
  const [conceptIndex, setConceptIndex] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [intervention, setIntervention] = useState<Intervention | null>(null);
  const [mood, setMood] = useState<MoodState>('Flow');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(true);
  const [correct, setCorrect] = useState(0);
  const [total, setTotal] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [backspaceCount, setBackspaceCount] = useState(0);
  const [pauseCount, setPauseCount] = useState(0);
  const startTimeRef = useRef(Date.now());
  const pauseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const answerRef = useRef<HTMLTextAreaElement>(null);

  const currentConcept: Concept | undefined = session.concepts[conceptIndex];

  // Load first question on mount
  useEffect(() => {
    loadNextQuestion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadNextQuestion() {
    if (!currentConcept) return;
    setLoading(true);
    setAnswer('');
    setShowFeedback(false);
    setIsCorrect(null);
    setBackspaceCount(0);
    setPauseCount(0);
    startTimeRef.current = Date.now();
    try {
      const res = await getNextQuestion({
        current_mood: mood,
        concept_id: currentConcept.concept,
        previous_performance: { correct, total },
      });
      setCurrentQuestion(res.questionText);
      setIntervention(res.intervention);
    } catch (e) {
      setCurrentQuestion('Describe the key characteristics of this concept.');
      setIntervention(null);
    } finally {
      setLoading(false);
      setTimeout(() => answerRef.current?.focus(), 100);
    }
  }

  function trackKeystroke(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Backspace') {
      setBackspaceCount((c) => c + 1);
    }
    // Reset pause timer
    if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
    pauseTimerRef.current = setTimeout(() => {
      setPauseCount((c) => c + 1);
    }, 2000); // 2s without typing = a pause
  }

  async function handleSubmit() {
    if (!answer.trim() || showFeedback) return;
    const responseTimeMs = Date.now() - startTimeRef.current;
    const charCount = answer.length;
    const keystrokeSpeed = responseTimeMs > 0 ? charCount / (responseTimeMs / 1000) : 0;

    // Simple correctness heuristic for demo: answer > 10 chars = valid attempt
    const answeredCorrectly = answer.trim().length > 10;
    setIsCorrect(answeredCorrectly);
    setShowFeedback(true);

    const newCorrect = answeredCorrectly ? correct + 1 : correct;
    const newTotal = total + 1;
    setCorrect(newCorrect);
    setTotal(newTotal);

    // Infer mood
    try {
      const evalRes = await evaluateSession({
        answer_correct: answeredCorrectly,
        response_time_ms: responseTimeMs,
        keystroke_speed_chars_per_sec: keystrokeSpeed,
        backspace_count: backspaceCount,
        pause_count: pauseCount,
      });
      setMood(evalRes.mood);
    } catch (e) {
      // Keep current mood on error
    }
  }

  async function handleNext() {
    const nextIndex = conceptIndex + 1;
    if (nextIndex >= session.concepts.length) {
      // Session complete
      onEnd();
      return;
    }
    setConceptIndex(nextIndex);
    // Load question for new concept
    setLoading(true);
    setAnswer('');
    setShowFeedback(false);
    setIsCorrect(null);
    setBackspaceCount(0);
    setPauseCount(0);
    startTimeRef.current = Date.now();
    try {
      const nextConcept = session.concepts[nextIndex];
      const res = await getNextQuestion({
        current_mood: mood,
        concept_id: nextConcept.concept,
        previous_performance: { correct, total },
      });
      setCurrentQuestion(res.questionText);
      setIntervention(res.intervention);
    } catch (e) {
      setCurrentQuestion('Describe the key characteristics of this concept.');
      setIntervention(null);
    } finally {
      setLoading(false);
      setTimeout(() => answerRef.current?.focus(), 100);
    }
  }

  const moodCfg = MOOD_CONFIG[mood];
  const progress = ((conceptIndex) / session.concepts.length) * 100;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-white/10 bg-[#0a0a0f]/80 backdrop-blur px-6 py-3 flex items-center justify-between">
        <div>
          <span className="text-sm text-white/40">Studying: </span>
          <span className="text-sm font-medium text-white">{session.topic}</span>
        </div>
        <div className="flex items-center gap-6">
          {/* Mood badge */}
          <div className={`flex items-center gap-1.5 text-sm font-medium ${moodCfg.color}`}>
            <span>{moodCfg.emoji}</span>
            <span>{moodCfg.label}</span>
          </div>
          {/* Score */}
          <span className="text-sm text-white/40">{correct}/{total} correct</span>
          <button
            id="end-session-btn"
            onClick={onEnd}
            className="text-sm text-white/30 hover:text-white/70 transition-colors"
          >
            End Session
          </button>
        </div>
      </header>

      {/* Progress bar */}
      <div className="h-1 bg-white/5">
        <div
          className="h-full bg-gradient-to-r from-purple-600 to-purple-400 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12 max-w-2xl mx-auto w-full">

        {/* Concept label */}
        {currentConcept && (
          <div className="self-start mb-6">
            <span className="text-xs text-white/40 uppercase tracking-wider">Concept {conceptIndex + 1} of {session.concepts.length}</span>
            <h2 className="text-xl font-semibold text-white mt-1">{currentConcept.concept}</h2>
            <div className="flex gap-1 mt-2">
              {Array.from({ length: currentConcept.difficulty }).map((_, i) => (
                <span key={i} className="w-2 h-2 rounded-full bg-purple-500" />
              ))}
              {Array.from({ length: Math.max(0, 5 - currentConcept.difficulty) }).map((_, i) => (
                <span key={i} className="w-2 h-2 rounded-full bg-white/10" />
              ))}
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center gap-4 py-20">
            <div className="w-10 h-10 rounded-full border-4 border-purple-500 border-t-transparent animate-spin" />
            <p className="text-white/40">Generating question…</p>
          </div>
        ) : (
          <>
            {/* Coach intervention */}
            {intervention && intervention.coachMessage && (
              <div className="w-full mb-6 rounded-xl border border-purple-500/30 bg-purple-500/10 px-5 py-4">
                <p className="text-sm text-purple-300 leading-relaxed">
                  <span className="font-semibold">🤖 Coach: </span>
                  {intervention.coachMessage}
                </p>
              </div>
            )}

            {/* Question */}
            <div className="w-full mb-6 rounded-2xl border border-white/10 bg-white/5 p-6">
              <p className="text-white text-lg leading-relaxed">{currentQuestion}</p>
            </div>

            {/* Answer */}
            <textarea
              id="answer-input"
              ref={answerRef}
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              onKeyDown={trackKeystroke}
              disabled={showFeedback}
              placeholder="Type your answer here…"
              rows={4}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/30 outline-none focus:border-purple-500/60 transition-colors resize-none mb-4 disabled:opacity-50"
            />

            {/* Feedback */}
            {showFeedback && (
              <div className={`w-full mb-4 rounded-xl border px-5 py-3 text-sm ${
                isCorrect
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                  : 'border-orange-500/30 bg-orange-500/10 text-orange-300'
              }`}>
                {isCorrect ? '✓ Good answer! Mood: ' : '✗ Keep going! Mood: '}
                <span className={`font-semibold ${moodCfg.color}`}>{moodCfg.emoji} {moodCfg.label}</span>
              </div>
            )}

            {/* Actions */}
            {!showFeedback ? (
              <button
                id="submit-answer-btn"
                onClick={handleSubmit}
                disabled={!answer.trim()}
                className="w-full py-4 rounded-2xl bg-purple-600 hover:bg-purple-500 disabled:opacity-30 disabled:cursor-not-allowed text-white font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              >
                Submit Answer
              </button>
            ) : (
              <button
                id="next-question-btn"
                onClick={handleNext}
                className="w-full py-4 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              >
                {conceptIndex + 1 < session.concepts.length ? 'Next Question →' : 'Complete Session 🎉'}
              </button>
            )}
          </>
        )}
      </main>
    </div>
  );
}
