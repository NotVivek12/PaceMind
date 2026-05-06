'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { evaluateMoodSignals, evaluateSession, getNextQuestion, gradeAnswer, getIntervention } from '@/lib/api';
import { MoodFlow, MoodConfused, MoodFrustrated, MoodDisengaged, RefreshCw } from '@/components/Icons';
import type { SessionData } from '@/types/session';
import type { MoodState, Concept, Intervention, FaceExpressionScores, KeystrokeSignals } from '@/types';

interface Props {
  session: SessionData;
  onEnd: () => void;
}

const MOOD_CONFIG: Record<MoodState, { Icon: React.ComponentType<{ className?: string }>; label: string; color: string; dotColor: string }> = {
  Flow:       { Icon: MoodFlow,       label: 'Flow',       color: 'text-emerald-500', dotColor: '#10b981' },
  Confused:   { Icon: MoodConfused,   label: 'Confused',   color: 'text-yellow-500',  dotColor: '#eab308' },
  Frustrated: { Icon: MoodFrustrated, label: 'Frustrated', color: 'text-orange-500',  dotColor: '#f97316' },
  Disengaged: { Icon: MoodDisengaged, label: 'Disengaged', color: 'text-red-400',     dotColor: '#f87171' },
};

const MOOD_COACH_STYLE: Record<MoodState, { border: string; bg: string; glow: string }> = {
  Flow:       { border: 'border-emerald-300', bg: 'from-emerald-50',  glow: 'shadow-emerald-100' },
  Confused:   { border: 'border-yellow-300',  bg: 'from-yellow-50',   glow: 'shadow-yellow-100'  },
  Frustrated: { border: 'border-orange-300',  bg: 'from-orange-50',   glow: 'shadow-orange-100'  },
  Disengaged: { border: 'border-gray-300',    bg: 'from-gray-50',     glow: 'shadow-gray-100'    },
};

export default function SessionView({ session, onEnd }: Props) {
  const [conceptIndex, setConceptIndex] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [intervention, setIntervention] = useState<Intervention | null>(null);
  const [mood, setMood] = useState<MoodState>('Flow');
  const [overrideMood, setOverrideMood] = useState<MoodState | null>(null);
  const [answer, setAnswer] = useState('');
  const [options, setOptions] = useState<string[]>([]);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);
  const [correctIndex, setCorrectIndex] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(30);
  const [timerActive, setTimerActive] = useState(false);
  const [wrongStreak, setWrongStreak] = useState(0);
  const [coachPulse, setCoachPulse] = useState(0);
  const [conceptCorrectStreak, setConceptCorrectStreak] = useState(0);
  const [difficultyBanner, setDifficultyBanner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [correct, setCorrect] = useState(0);
  const [total, setTotal] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [isGrading, setIsGrading] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [keystrokeSignals, setKeystrokeSignals] = useState<KeystrokeSignals>({
    typing_speed_cps: 0,
    backspace_count: 0,
    pause_count: 0,
    input_events: 0,
    elapsed_ms: 0,
  });
  const [expressionScores, setExpressionScores] = useState<FaceExpressionScores | null>(null);
  const [expressionMood, setExpressionMood] = useState<MoodState | null>(null);
  const [cameraState, setCameraState] = useState<'off' | 'requesting' | 'active' | 'denied' | 'error'>('off');
  const [showCamConsent, setShowCamConsent] = useState(false);
  const startTimeRef = useRef(Date.now());
  const pauseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const keystrokeRef = useRef({
    charCount: 0,
    backspaceCount: 0,
    pauseCount: 0,
    inputEvents: 0,
    startMs: Date.now(),
  });
  const lastLogRef = useRef(0);
  const isPostingMoodRef = useRef(false);
  const lastMoodRef = useRef<MoodState>('Flow');
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const faceApiRef = useRef<typeof import('face-api.js') | null>(null);
  const detectTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const answerRef = useRef<HTMLTextAreaElement>(null);

  const currentConcept: Concept | undefined = session.concepts[conceptIndex];

  function resetKeystrokeStats() {
    keystrokeRef.current = {
      charCount: 0,
      backspaceCount: 0,
      pauseCount: 0,
      inputEvents: 0,
      startMs: Date.now(),
    };
    setKeystrokeSignals({
      typing_speed_cps: 0,
      backspace_count: 0,
      pause_count: 0,
      input_events: 0,
      elapsed_ms: 0,
    });
  }

  function getKeystrokeSignals(): KeystrokeSignals {
    const elapsedMs = Date.now() - keystrokeRef.current.startMs;
    const elapsedSeconds = Math.max(1, elapsedMs / 1000);
    const typingSpeed = keystrokeRef.current.charCount / elapsedSeconds;
    return {
      typing_speed_cps: Number(typingSpeed.toFixed(2)),
      backspace_count: keystrokeRef.current.backspaceCount,
      pause_count: keystrokeRef.current.pauseCount,
      input_events: keystrokeRef.current.inputEvents,
      elapsed_ms: elapsedMs,
    };
  }

  function isTrackableTarget(target: EventTarget | null): target is HTMLElement {
    if (!target || !(target instanceof HTMLElement)) return false;
    if (target.isContentEditable) return true;
    const tag = target.tagName.toLowerCase();
    return tag === 'input' || tag === 'textarea';
  }

  function mapExpressionsToMood(scores: FaceExpressionScores | null): MoodState | null {
    if (!scores) return null;
    const entries = Object.entries(scores) as [keyof FaceExpressionScores, number][];
    const [top, value] = entries.reduce(
      (best, current) => (current[1] > best[1] ? current : best),
      entries[0],
    );
    if (value < 0.2) return null;
    switch (top) {
      case 'happy':
      case 'surprised':
        return 'Flow';
      case 'angry':
        return 'Frustrated';
      case 'sad':
        return 'Disengaged';
      default:
        return 'Confused';
    }
  }

  function normalizeOptions(raw?: string[]): string[] {
    const cleaned = (raw ?? []).map((item) => item.trim()).filter(Boolean);
    const base = cleaned.slice(0, 4);
    const fillers = ['Option A', 'Option B', 'Option C', 'Option D'];
    while (base.length < 4) {
      base.push(fillers[base.length]);
    }
    return base;
  }

  async function loadFaceModels() {
    if (faceApiRef.current) return faceApiRef.current;
    const faceapi = await import('face-api.js');
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri('/face-models'),
      faceapi.nets.faceExpressionNet.loadFromUri('/face-models'),
    ]);
    faceApiRef.current = faceapi;
    return faceapi;
  }

  function stopCamera() {
    if (detectTimerRef.current) {
      clearInterval(detectTimerRef.current);
      detectTimerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraState('off');
    setExpressionScores(null);
    setExpressionMood(null);
  }

  async function startCamera() {
    setCameraState('requesting');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      const faceapi = await loadFaceModels();
      if (detectTimerRef.current) clearInterval(detectTimerRef.current);
      detectTimerRef.current = setInterval(async () => {
        if (!videoRef.current) return;
        try {
          const result = await faceapi
            .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
            .withFaceExpressions();
          if (result?.expressions) {
            const scores: FaceExpressionScores = {
              neutral: result.expressions.neutral ?? 0,
              happy: result.expressions.happy ?? 0,
              sad: result.expressions.sad ?? 0,
              angry: result.expressions.angry ?? 0,
              fearful: result.expressions.fearful ?? 0,
              disgusted: result.expressions.disgusted ?? 0,
              surprised: result.expressions.surprised ?? 0,
            };
            setExpressionScores(scores);
            setExpressionMood(mapExpressionsToMood(scores));
          }
        } catch {
          // Keep last successful expression if a frame fails
        }
      }, 1000);

      setCameraState('active');
    } catch (err) {
      console.error('Webcam init failed', err);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      if (err instanceof DOMException && err.name === 'NotAllowedError') {
        setCameraState('denied');
      } else {
        setCameraState('error');
      }
    }
  }

  // Load first question on mount
  useEffect(() => {
    loadNextQuestion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (!isTrackableTarget(event.target)) return;
      if (event.key === 'Backspace') {
        keystrokeRef.current.backspaceCount += 1;
      }
      if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
      pauseTimerRef.current = setTimeout(() => {
        keystrokeRef.current.pauseCount += 1;
      }, 2000);
    }

    function handleInput(event: Event) {
      if (!isTrackableTarget(event.target)) return;
      const inputEvent = event as InputEvent;
      if (inputEvent.inputType?.startsWith('insert')) {
        const delta = inputEvent.data?.length ?? 1;
        keystrokeRef.current.charCount += delta;
      }
      keystrokeRef.current.inputEvents += 1;
    }

    document.addEventListener('keydown', handleKeyDown, true);
    document.addEventListener('input', handleInput, true);

    const interval = setInterval(() => {
      const next = getKeystrokeSignals();
      setKeystrokeSignals(next);

      if (next.input_events > 0 && Date.now() - lastLogRef.current > 2000) {
        const errorRate = next.backspace_count / Math.max(1, next.input_events);
        console.log(
          `[keystrokes] speed=${next.typing_speed_cps} cps, errorRate=${(errorRate * 100).toFixed(1)}%`,
        );
        lastLogRef.current = Date.now();
      }
    }, 1000);

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('input', handleInput, true);
      if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (overrideMood) setMood(overrideMood);
  }, [overrideMood]);

  useEffect(() => {
    if (mood !== lastMoodRef.current) {
      const prevMood = lastMoodRef.current;
      lastMoodRef.current = mood;
      setCoachPulse((value) => value + 1);

      // Fetch fresh intervention when mood changes mid-question
      if (currentConcept && !loading) {
        getIntervention({
          topic: currentConcept.concept,
          mood,
          history_correct: correct,
          history_total: total,
          wrong_streak: wrongStreak,
        })
          .then((res) => {
            setIntervention({
              coachMessage: res.coachMessage || res.message,
              difficultyAdjustment: res.difficultyAdjustment,
              formatSwitch: res.formatSwitch as any,
              tone: res.tone,
            });
          })
          .catch(() => {
            // Keep existing intervention on error
          });
      }
    }
  }, [mood]);

  useEffect(() => {
    if (intervention?.coachMessage) {
      setCoachPulse((value) => value + 1);
    }
  }, [intervention?.coachMessage]);

  useEffect(() => {
    if (!timerActive) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [timerActive]);

  useEffect(() => {
    if (!timerActive) return;
    if (timeLeft <= 0) {
      handleTimeout();
    }
  }, [timeLeft, timerActive]);

  useEffect(() => {
    const interval = setInterval(async () => {
      if (isPostingMoodRef.current) return;
      if (keystrokeSignals.input_events === 0 && !expressionScores) return;

      isPostingMoodRef.current = true;
      try {
        const res = await evaluateMoodSignals({
          keystroke: keystrokeSignals,
          expressions: expressionScores ?? undefined,
          override_mood: overrideMood,
        });
        if (!overrideMood) setMood(res.mood);
      } catch {
        // Keep last mood on error
      } finally {
        isPostingMoodRef.current = false;
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [expressionScores, keystrokeSignals, overrideMood]);

  useEffect(() => () => stopCamera(), []);

  function handleTimeout() {
    if (showFeedback || isGrading) return;
    setTimerActive(false);
    setTimeLeft(0);
    setIsCorrect(false);
    setFeedbackText('Time is up. Try the next one.');
    setShowFeedback(true);
    setTotal((value) => value + 1);
    setWrongStreak((value) => value + 1);
  }

  async function loadNextQuestion() {
    if (!currentConcept) return;
    setLoading(true);
    setAnswer('');
    setShowFeedback(false);
    setFeedbackText('');
    setIsCorrect(null);
    setOptions([]);
    setSelectedOptionIndex(null);
    setCorrectIndex(null);
    setTimerActive(false);
    setTimeLeft(30);
    resetKeystrokeStats();
    startTimeRef.current = Date.now();
    try {
      const res = await getNextQuestion({
        current_mood: mood,
        concept_id: currentConcept.concept,
        previous_performance: { correct, total },
        wrong_streak: wrongStreak,
      });
      setCurrentQuestion(res.questionText);
      setIntervention(res.intervention);
      setOptions(normalizeOptions(res.options));
      setCorrectIndex(
        typeof res.correctIndex === 'number' ? res.correctIndex : null,
      );
      setSelectedOptionIndex(null);
      setTimeLeft(30);
      setTimerActive(true);
    } catch (e) {
      setCurrentQuestion('Describe the key characteristics of this concept.');
      setIntervention(null);
      setOptions(normalizeOptions());
      setCorrectIndex(null);
      setSelectedOptionIndex(null);
      setTimeLeft(30);
      setTimerActive(true);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit() {
    if (selectedOptionIndex === null || showFeedback || isGrading) return;
    setIsGrading(true);
    setTimerActive(false);

    try {
      const selectedText = options[selectedOptionIndex] ?? '';
      let answeredCorrectly = false;
      let feedback = '';

      if (typeof correctIndex === 'number' && options[correctIndex]) {
        answeredCorrectly = selectedOptionIndex === correctIndex;
        feedback = answeredCorrectly
          ? 'Correct. Nice work.'
          : `Not quite. Correct answer: ${options[correctIndex]}`;
      } else {
        const gradeRes = await gradeAnswer({
          question_text: currentQuestion,
          answer_text: selectedText,
        });
        answeredCorrectly = gradeRes.is_correct;
        feedback = gradeRes.feedback;
      }

      const responseTimeMs = Date.now() - startTimeRef.current;
      const signals = getKeystrokeSignals();
      const keystrokeSpeed = signals.typing_speed_cps;
      setIsCorrect(answeredCorrectly);
      setFeedbackText(feedback);
      setShowFeedback(true);

      const newCorrect = answeredCorrectly ? correct + 1 : correct;
      const newTotal = total + 1;
      const newWrongStreak = answeredCorrectly ? 0 : wrongStreak + 1;
      const newConceptStreak = answeredCorrectly ? conceptCorrectStreak + 1 : 0;
      setCorrect(newCorrect);
      setTotal(newTotal);
      setWrongStreak(newWrongStreak);
      setConceptCorrectStreak(newConceptStreak);

      // Show difficulty banner when streak triggers easier questions
      if (newWrongStreak >= 3) {
        setDifficultyBanner(true);
      } else {
        setDifficultyBanner(false);
      }

      // Infer mood
      try {
        const evalRes = await evaluateSession({
          answer_correct: answeredCorrectly,
          response_time_ms: responseTimeMs,
          keystroke_speed_chars_per_sec: keystrokeSpeed,
          backspace_count: signals.backspace_count,
          pause_count: signals.pause_count,
        });
        if (!overrideMood) setMood(evalRes.mood);
      } catch (e) {
        // Keep current mood on error
      }
    } catch (e) {
      console.error('Failed to grade answer:', e);
      setFeedbackText('Failed to evaluate answer. Please try again.');
      setShowFeedback(true);
      setIsCorrect(false);
    } finally {
      setIsGrading(false);
    }
  }

  async function handleNext() {
    // If last answer was correct AND we have 2+ correct in a row on this concept → advance
    const shouldAdvanceConcept = isCorrect && conceptCorrectStreak >= 2;

    if (shouldAdvanceConcept) {
      const nextIndex = conceptIndex + 1;
      if (nextIndex >= session.concepts.length) {
        onEnd();
        return;
      }
      setConceptIndex(nextIndex);
      setConceptCorrectStreak(0);
      setDifficultyBanner(false);
    }
    // Otherwise: stay on same concept (retry with potentially easier question)

    // Load next question for current or next concept
    const targetIndex = shouldAdvanceConcept ? conceptIndex + 1 : conceptIndex;
    const targetConcept = session.concepts[targetIndex];
    if (!targetConcept) { onEnd(); return; }

    setLoading(true);
    setAnswer('');
    setShowFeedback(false);
    setFeedbackText('');
    setIsCorrect(null);
    setOptions([]);
    setSelectedOptionIndex(null);
    setCorrectIndex(null);
    setTimerActive(false);
    setTimeLeft(30);
    resetKeystrokeStats();
    startTimeRef.current = Date.now();
    try {
      const res = await getNextQuestion({
        current_mood: mood,
        concept_id: targetConcept.concept,
        previous_performance: { correct, total },
        wrong_streak: wrongStreak,
      });
      setCurrentQuestion(res.questionText);
      setIntervention(res.intervention);
      setOptions(normalizeOptions(res.options));
      setCorrectIndex(
        typeof res.correctIndex === 'number' ? res.correctIndex : null,
      );
      setSelectedOptionIndex(null);
      setTimeLeft(30);
      setTimerActive(true);
    } catch (e) {
      setCurrentQuestion('Describe the key characteristics of this concept.');
      setIntervention(null);
      setOptions(normalizeOptions());
      setCorrectIndex(null);
      setSelectedOptionIndex(null);
      setTimeLeft(30);
      setTimerActive(true);
    } finally {
      setLoading(false);
    }
  }

  const moodCfg = MOOD_CONFIG[mood];
  const progress = ((conceptIndex) / session.concepts.length) * 100;
  const timePct = Math.max(0, Math.min(100, (timeLeft / 30) * 100));
  const accuracyPct = total > 0 ? Math.round((correct / total) * 100) : 0;

  return (
    /* Full viewport, no scroll on the outer shell */
    <div className="h-screen flex flex-col bg-[#f4f7f4] overflow-hidden">

      {/* ── Slim header ──────────────────────────────────────────────────── */}
      <header className="flex-none border-b border-[#d1e0d3] bg-white px-5 py-2.5 flex items-center justify-between gap-4">
        {/* Left: topic */}
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-xs text-[#4b6b50] shrink-0">Studying</span>
          <span className="text-sm font-semibold text-[#1a2e1c] truncate">{session.topic}</span>
          <span className="text-xs text-[#4b6b50] shrink-0">{conceptIndex + 1}/{session.concepts.length}</span>
        </div>

        {/* Centre: progress bar */}
        <div className="flex-1 max-w-xs h-1.5 rounded-full bg-[#d1e0d3] overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-green-600 to-green-400 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Right: score + override + end */}
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs text-[#4b6b50]">{correct}/{total} correct</span>
          <select
            value={overrideMood ?? 'Auto'}
            onChange={(e) => {
              const v = e.target.value as MoodState | 'Auto';
              setOverrideMood(v === 'Auto' ? null : v);
            }}
            className="rounded-lg border border-[#d1e0d3] bg-white px-2 py-1 text-xs text-[#1a2e1c] outline-none"
          >
            <option value="Auto">Mood: Auto</option>
            <option value="Flow">Flow</option>
            <option value="Confused">Confused</option>
            <option value="Frustrated">Frustrated</option>
            <option value="Disengaged">Disengaged</option>
          </select>
          <button
            id="end-session-btn"
            onClick={onEnd}
            className="text-xs text-[#4b6b50] hover:text-red-500 transition-colors border border-[#d1e0d3] rounded-lg px-3 py-1 hover:border-red-300"
          >
            End Session
          </button>
        </div>
      </header>

      {/* ── Body: left (questions) + right (webcam + coach) ──────────────── */}
      <div className="flex-1 flex overflow-hidden">

        {/* ── LEFT: concept + question + options + submit ──────────────── */}
        <main className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3">

          {/* Concept card */}
          {currentConcept && (
            <div className="rounded-2xl border border-[#d1e0d3] bg-white px-4 py-3 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[10px] text-[#4b6b50] uppercase tracking-wider">
                  Concept {conceptIndex + 1} of {session.concepts.length}
                </span>
                <h2 className="text-base font-semibold text-[#1a2e1c] mt-0.5">{currentConcept.concept}</h2>
              </div>
              <div className="flex gap-1 shrink-0 ml-4">
                {Array.from({ length: currentConcept.difficulty }).map((_, i) => (
                  <span key={i} className="w-2 h-2 rounded-full bg-green-500" />
                ))}
                {Array.from({ length: Math.max(0, 5 - currentConcept.difficulty) }).map((_, i) => (
                  <span key={i} className="w-2 h-2 rounded-full bg-[#d1e0d3]" />
                ))}
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 rounded-full border-4 border-green-500 border-t-transparent animate-spin" />
              <p className="text-sm text-[#4b6b50]">Generating question…</p>
            </div>
          ) : (
            <>
              {/* Question */}
              <div className="rounded-2xl border border-[#d1e0d3] bg-white px-5 py-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] uppercase tracking-wider text-[#4b6b50]">Question</span>
                  <div className="flex items-center gap-2 text-xs text-[#4b6b50]">
                    <div className="h-1.5 w-20 rounded-full bg-[#d1e0d3] overflow-hidden">
                      <div
                        className={`h-full transition-all duration-1000 ${timePct <= 25 ? 'bg-red-400' : 'bg-green-500'}`}
                        style={{ width: `${timePct}%` }}
                      />
                    </div>
                    <span className="tabular-nums">{timeLeft}s</span>
                  </div>
                </div>
                <p className="text-[#1a2e1c] text-base leading-relaxed">{currentQuestion}</p>
              </div>

              {/* Options */}
              <div className="grid gap-2">
                {options.map((option, index) => {
                  const selected = selectedOptionIndex === index;
                  const revealCorrect = showFeedback && typeof correctIndex === 'number';
                  const isCorrectChoice = revealCorrect && correctIndex === index;
                  const isWrongChoice = revealCorrect && selected && correctIndex !== index;
                  return (
                    <button
                      key={`${option}-${index}`}
                      onClick={() => setSelectedOptionIndex(index)}
                      disabled={showFeedback}
                      className={`w-full rounded-xl border px-4 py-2.5 text-left transition-all text-sm ${
                        isCorrectChoice
                          ? 'border-green-500 bg-green-50'
                          : isWrongChoice
                          ? 'border-red-300 bg-red-50'
                          : selected
                          ? 'border-green-500 bg-green-50'
                          : 'border-[#d1e0d3] bg-white hover:border-green-400 hover:bg-[#f4f7f4]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="h-7 w-7 rounded-full bg-[#e8f0e8] text-xs text-[#4b6b50] flex items-center justify-center font-semibold shrink-0">
                          {String.fromCharCode(65 + index)}
                        </span>
                        <span className="text-[#1a2e1c]">{option}</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Notes textarea */}
              <textarea
                id="notes-input"
                ref={answerRef}
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                disabled={showFeedback}
                placeholder="Optional: jot quick notes or reasoning…"
                rows={2}
                className="w-full rounded-xl border border-[#d1e0d3] bg-white px-4 py-2.5 text-[#1a2e1c] placeholder-[#4b6b50]/40 outline-none focus:border-green-500 transition-colors resize-none disabled:opacity-40 text-sm"
              />

              {/* Feedback */}
              {showFeedback && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.97 }}
                  animate={wrongStreak >= 3 ? 'frustrated' : { opacity: 1, y: 0, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 400 }}
                  className={`rounded-xl border px-4 py-3 text-sm ${
                    isCorrect
                      ? 'border-green-300 bg-green-50 text-green-700'
                      : wrongStreak >= 3
                      ? 'border-red-300 bg-red-50 text-red-600 animate-pulse'
                      : 'border-orange-200 bg-orange-50 text-orange-600'
                  }`}
                  variants={{
                    frustrated: { x: [-8, 8, -4, 4, 0], opacity: 1, y: 0, scale: 1, transition: { duration: 0.4 } },
                  }}
                >
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-semibold">{isCorrect ? 'Correct!' : 'Keep trying!'}</span>
                    <span className={`ml-auto text-xs font-medium ${moodCfg.color}`}>{moodCfg.label}</span>
                  </div>
                  {feedbackText && <p className="opacity-90 leading-relaxed">{feedbackText}</p>}
                </motion.div>
              )}

              {/* Difficulty banner */}
              {difficultyBanner && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-700 flex items-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 shrink-0 animate-spin" />
                  <span><span className="font-medium">Difficulty adjusted</span> — serving an easier question</span>
                </div>
              )}

              {/* Submit / Next */}
              {!showFeedback ? (
                <button
                  id="submit-answer-btn"
                  onClick={handleSubmit}
                  disabled={selectedOptionIndex === null || isGrading}
                  className="w-full py-3 rounded-2xl bg-green-600 hover:bg-green-500 disabled:opacity-30 disabled:cursor-not-allowed text-white font-semibold transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] flex justify-center items-center gap-2 shadow-sm"
                >
                  {isGrading ? (
                    <>
                      <div className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                      Grading…
                    </>
                  ) : 'Submit Answer'}
                </button>
              ) : (
                <button
                  id="next-question-btn"
                  onClick={handleNext}
                  className={`w-full py-3 rounded-2xl text-white font-semibold transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] shadow-sm ${
                    isCorrect && conceptCorrectStreak >= 1
                      ? 'bg-green-600 hover:bg-green-500'
                      : 'bg-[#1a2e1c] hover:bg-[#2d4a30]'
                  }`}
                >
                  {conceptIndex + 1 >= session.concepts.length && isCorrect && conceptCorrectStreak >= 2
                    ? 'Complete Session ✓'
                    : isCorrect && conceptCorrectStreak >= 2
                    ? 'Mastered! Next Concept →'
                    : isCorrect
                    ? 'Next Question →'
                    : wrongStreak >= 3
                    ? 'Try Easier Question'
                    : 'Try Again'}
                </button>
              )}
            </>
          )}
        </main>

        {/* ── RIGHT: webcam + mood + coach + signals ────────────────────── */}
        <aside className="w-72 flex-none border-l border-[#d1e0d3] bg-white flex flex-col overflow-y-auto">

          {/* Webcam feed */}
          <div className="p-3 border-b border-[#d1e0d3]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase tracking-wider text-[#4b6b50] font-medium">Webcam</span>
              <div className="flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${
                  cameraState === 'active' ? 'bg-green-500 animate-pulse'
                  : cameraState === 'requesting' ? 'bg-yellow-400 animate-pulse'
                  : cameraState === 'denied' || cameraState === 'error' ? 'bg-red-400'
                  : 'bg-[#d1e0d3]'
                }`} />
                <span className="text-[10px] text-[#4b6b50]">
                  {cameraState === 'active' ? 'Live' : cameraState === 'requesting' ? 'Starting…' : cameraState === 'error' ? 'Error' : cameraState === 'denied' ? 'Denied' : 'Off'}
                </span>
                <button
                  onClick={() => cameraState === 'active' ? stopCamera() : setShowCamConsent(true)}
                  className="text-[10px] text-[#4b6b50] hover:text-[#1a2e1c] border border-[#d1e0d3] rounded px-1.5 py-0.5 hover:bg-[#f4f7f4] transition-colors"
                >
                  {cameraState === 'active' ? 'Stop' : 'Enable'}
                </button>
              </div>
            </div>

            {/* Video frame */}
            <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-[#f4f7f4] border border-[#d1e0d3]">
              <video
                ref={videoRef}
                muted
                playsInline
                className={`w-full h-full object-cover ${cameraState === 'active' ? 'opacity-100' : 'opacity-0'}`}
              />
              {cameraState !== 'active' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5">
                  <div className="w-9 h-9 rounded-full bg-[#e8f0e8] flex items-center justify-center">
                    <svg className="w-4 h-4 text-[#4b6b50]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
                    </svg>
                  </div>
                  <span className="text-[10px] text-[#4b6b50]">Camera off</span>
                  <button
                    onClick={() => setShowCamConsent(true)}
                    className="text-[10px] text-green-600 hover:text-green-700 font-medium"
                  >
                    Enable →
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Mood detection */}
          <div className="p-3 border-b border-[#d1e0d3]">
            <span className="text-[10px] uppercase tracking-wider text-[#4b6b50] font-medium block mb-2">Mood Detection</span>
            <motion.div
              key={`mood-${mood}-${coachPulse}`}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 12 }}
              className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 ${MOOD_COACH_STYLE[mood].border} bg-gradient-to-r ${MOOD_COACH_STYLE[mood].bg} to-transparent`}
            >
              <moodCfg.Icon className={`w-5 h-5 shrink-0 ${moodCfg.color}`} />
              <div className="flex-1 min-w-0">
                <div className={`text-sm font-semibold ${moodCfg.color}`}>{moodCfg.label}</div>
                {expressionMood && (
                  <div className="text-[10px] text-[#4b6b50] truncate">Face: {expressionMood}</div>
                )}
                {overrideMood && (
                  <div className="text-[10px] text-[#4b6b50]">Manual override</div>
                )}
              </div>
            </motion.div>

            {/* Live signal mini-stats */}
            <div className="grid grid-cols-2 gap-1.5 mt-2">
              <div className="rounded-lg bg-[#f4f7f4] px-2 py-1.5">
                <div className="text-[10px] text-[#4b6b50]/70">Accuracy</div>
                <div className="text-xs font-semibold text-[#1a2e1c]">{accuracyPct}%</div>
              </div>
              <motion.div
                className="rounded-lg bg-[#f4f7f4] px-2 py-1.5"
                animate={{ scale: wrongStreak >= 3 ? [1, 1.08, 1] : 1 }}
                transition={{ duration: 0.3, repeat: wrongStreak >= 3 ? Infinity : 0 }}
              >
                <div className="text-[10px] text-[#4b6b50]/70">Streak</div>
                <div className={`text-xs font-semibold ${wrongStreak >= 3 ? 'text-red-500' : 'text-[#1a2e1c]'}`}>
                  {wrongStreak > 0 ? `${wrongStreak} wrong` : '—'}
                </div>
              </motion.div>
              <div className="rounded-lg bg-[#f4f7f4] px-2 py-1.5">
                <div className="text-[10px] text-[#4b6b50]/70">Speed</div>
                <div className="text-xs font-semibold text-[#1a2e1c]">{keystrokeSignals.typing_speed_cps} cps</div>
              </div>
              <div className="rounded-lg bg-[#f4f7f4] px-2 py-1.5">
                <div className="text-[10px] text-[#4b6b50]/70">Pauses</div>
                <div className="text-xs font-semibold text-[#1a2e1c]">{keystrokeSignals.pause_count}</div>
              </div>
            </div>
          </div>

          {/* AI Coach */}
          <div className="flex-1 p-3">
            <span className="text-[10px] uppercase tracking-wider text-[#4b6b50] font-medium block mb-2">AI Coach</span>
            <motion.div
              key={`coach-${coachPulse}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, type: 'spring', stiffness: 300, damping: 20 }}
              className={`rounded-2xl border ${MOOD_COACH_STYLE[mood].border} bg-gradient-to-br ${MOOD_COACH_STYLE[mood].bg} to-transparent p-3 shadow-sm`}
            >
              <motion.p
                key={intervention?.coachMessage}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="text-xs text-[#4b6b50] leading-relaxed"
              >
                {intervention?.coachMessage || 'Stay focused. Your next step is coming.'}
              </motion.p>
              <div className="flex flex-wrap gap-1 mt-2.5">
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                  intervention?.difficultyAdjustment === 'easier'
                    ? 'bg-amber-100 text-amber-700'
                    : intervention?.difficultyAdjustment === 'harder'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-[#e8f0e8] text-[#4b6b50]'
                }`}>
                  {intervention?.difficultyAdjustment ?? 'same'}
                </span>
                <span className="rounded-full bg-[#e8f0e8] px-2 py-0.5 text-[10px] text-[#4b6b50]">
                  {intervention?.tone ?? 'encouraging'}
                </span>
              </div>
            </motion.div>
          </div>

        </aside>
      </div>

      {/* Webcam consent modal */}
      {showCamConsent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6">
          <div className="w-full max-w-sm rounded-2xl border border-[#d1e0d3] bg-white p-6 shadow-xl">
            <h3 className="text-base font-semibold text-[#1a2e1c] mb-1.5">Enable webcam?</h3>
            <p className="text-sm text-[#4b6b50] mb-5">
              We use the camera locally to estimate your facial expressions. Nothing is uploaded or stored.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowCamConsent(false)}
                className="rounded-xl border border-[#d1e0d3] bg-[#f4f7f4] px-4 py-2 text-sm text-[#4b6b50] hover:bg-[#e8f0e8]"
              >
                Not now
              </button>
              <button
                onClick={() => { setShowCamConsent(false); startCamera(); }}
                className="rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-500"
              >
                Allow
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
