'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { evaluateMoodSignals, evaluateSession, getNextQuestion, gradeAnswer } from '@/lib/api';
import type { SessionData } from '@/app/page';
import type { MoodState, Concept, Intervention, FaceExpressionScores, KeystrokeSignals } from '@/types';

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
  const [overrideMood, setOverrideMood] = useState<MoodState | null>(null);
  const [answer, setAnswer] = useState('');
  const [options, setOptions] = useState<string[]>([]);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);
  const [correctIndex, setCorrectIndex] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(30);
  const [timerActive, setTimerActive] = useState(false);
  const [wrongStreak, setWrongStreak] = useState(0);
  const [coachPulse, setCoachPulse] = useState(0);
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
      lastMoodRef.current = mood;
      setCoachPulse((value) => value + 1);
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
      setCorrect(newCorrect);
      setTotal(newTotal);
      setWrongStreak(newWrongStreak);

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
      const nextConcept = session.concepts[nextIndex];
      const res = await getNextQuestion({
        current_mood: mood,
        concept_id: nextConcept.concept,
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
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-white/10 bg-[#0a0a0f]/80 backdrop-blur px-6 py-3 flex items-center justify-between">
        <div>
          <span className="text-sm text-white/40">Studying: </span>
          <span className="text-sm font-medium text-white">{session.topic}</span>
        </div>
        <div className="flex items-center gap-4">
          {/* Mood badge - animated pulse on change */}
          <motion.div
            key={`mood-${mood}-${coachPulse}`}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
            className={`flex items-center gap-1.5 text-sm font-medium ${moodCfg.color} drop-shadow-lg`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <motion.span
              animate={{ scale: [1, 1.2, 1], opacity: [1, 0.8, 1] }}
              transition={{ duration: 1, repeat: Infinity, repeatType: "reverse" }}
            >
              {moodCfg.emoji}
            </motion.span>
            <span>{moodCfg.label}</span>
            {overrideMood && <span className="text-xs text-white/40">Manual</span>}
          </motion.div>

          {/* Webcam badge */}
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/60">
            <span
              className={`h-2 w-2 rounded-full ${
                cameraState === 'active'
                  ? 'bg-emerald-400'
                  : cameraState === 'requesting'
                    ? 'bg-yellow-400'
                    : cameraState === 'denied'
                      ? 'bg-red-400'
                      : cameraState === 'error'
                        ? 'bg-red-400'
                        : 'bg-white/20'
              }`}
            />
            <div className="h-5 w-8 overflow-hidden rounded bg-black/30">
              <video
                ref={videoRef}
                muted
                playsInline
                className={`h-full w-full object-cover ${cameraState === 'active' ? 'opacity-100' : 'opacity-40'}`}
              />
            </div>
            <span>
              Webcam {cameraState === 'active' ? 'On' : cameraState === 'requesting' ? 'Starting' : cameraState === 'error' ? 'Error' : 'Off'}
            </span>
            {expressionMood && <span className="text-white/80">({expressionMood})</span>}
            <button
              onClick={() => {
                if (cameraState === 'active') {
                  stopCamera();
                } else {
                  setShowCamConsent(true);
                }
              }}
              className="ml-1 rounded-full border border-white/10 bg-white/10 px-2 py-0.5 text-[10px] text-white/70 hover:bg-white/20"
            >
              {cameraState === 'active' ? 'Stop' : 'Enable'}
            </button>
          </div>

          {/* Manual override */}
          <div className="flex items-center gap-2 text-xs text-white/60">
            <span>Override</span>
            <select
              value={overrideMood ?? 'Auto'}
              onChange={(event) => {
                const value = event.target.value as MoodState | 'Auto';
                setOverrideMood(value === 'Auto' ? null : value);
              }}
              className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-white/80 outline-none"
            >
              <option value="Auto">Auto</option>
              <option value="Flow">Flow</option>
              <option value="Confused">Confused</option>
              <option value="Frustrated">Frustrated</option>
              <option value="Disengaged">Disengaged</option>
            </select>
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
      <main className="flex-1 px-6 py-12">
        <div className="mx-auto w-full max-w-5xl grid gap-6 lg:grid-cols-[1.3fr,0.7fr]">
          <section className="space-y-6">
            {currentConcept && (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <span className="text-xs text-white/40 uppercase tracking-wider">Concept {conceptIndex + 1} of {session.concepts.length}</span>
                <h2 className="text-xl font-semibold text-white mt-1">{currentConcept.concept}</h2>
                <div className="flex items-center gap-3 mt-3">
                  <div className="flex gap-1">
                    {Array.from({ length: currentConcept.difficulty }).map((_, i) => (
                      <span key={i} className="w-2 h-2 rounded-full bg-purple-500" />
                    ))}
                    {Array.from({ length: Math.max(0, 5 - currentConcept.difficulty) }).map((_, i) => (
                      <span key={i} className="w-2 h-2 rounded-full bg-white/10" />
                    ))}
                  </div>
                  <span className="text-xs text-white/50">Difficulty {currentConcept.difficulty}/5</span>
                </div>
              </div>
            )}

            {loading ? (
              <div className="flex flex-col items-center gap-4 py-20">
                <div className="w-10 h-10 rounded-full border-4 border-purple-500 border-t-transparent animate-spin" />
                <p className="text-white/40">Generating question...</p>
              </div>
            ) : (
              <>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs uppercase tracking-wider text-white/40">Question</span>
                    <div className="flex items-center gap-2 text-xs text-white/60">
                      <div className="h-2 w-24 rounded-full bg-white/10 overflow-hidden">
                        <div
                          className={`h-full ${timePct <= 25 ? 'bg-red-400' : 'bg-emerald-400'}`}
                          style={{ width: `${timePct}%` }}
                        />
                      </div>
                      <span>{timeLeft}s</span>
                    </div>
                  </div>
                  <p className="text-white text-lg leading-relaxed">{currentQuestion}</p>
                </div>

                <div className="grid gap-3">
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
                        className={`w-full rounded-xl border px-4 py-3 text-left transition-all ${
                          selected
                            ? 'border-purple-400/70 bg-purple-500/20'
                            : 'border-white/10 bg-white/5 hover:border-white/30'
                        } ${
                          isCorrectChoice
                            ? 'border-emerald-400/70 bg-emerald-500/10'
                            : isWrongChoice
                              ? 'border-orange-400/70 bg-orange-500/10'
                              : ''
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="h-8 w-8 rounded-full bg-white/10 text-sm text-white/70 flex items-center justify-center">
                            {String.fromCharCode(65 + index)}
                          </span>
                          <span className="text-sm text-white/80">{option}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <textarea
                  id="notes-input"
                  ref={answerRef}
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  disabled={showFeedback}
                  placeholder="Optional: jot quick notes or reasoning..."
                  rows={3}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/30 outline-none focus:border-purple-500/60 transition-colors resize-none disabled:opacity-50"
                />

                {showFeedback && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ type: "spring", stiffness: 400 }}
                    className={`w-full rounded-xl border px-5 py-4 text-sm shadow-lg ${
                       isCorrect
                         ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300 drop-shadow-emerald-500/50'
                         : wrongStreak >= 3
                         ? 'border-red-500/40 bg-red-500/10 text-red-300 drop-shadow-red-500/50 animate-pulse'
                         : 'border-orange-500/30 bg-orange-500/10 text-orange-300 drop-shadow-orange-500/50'
                      }`}
                    variants={{
                      frustrated: { x: [-10, 10, -5, 5, 0], transition: { duration: 0.5 } }
                    }}
                    animate={wrongStreak >= 3 ? "frustrated" : false}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold text-base">{isCorrect ? 'Correct!' : 'Keep trying!'}</span>
                      <span className={`font-semibold ml-auto ${moodCfg.color}`}>Mood: {moodCfg.emoji} {moodCfg.label}</span>
                    </div>
                    {feedbackText && <p className="leading-relaxed opacity-90">{feedbackText}</p>}
                  </motion.div>
                )}

                {!showFeedback ? (
                  <button
                    id="submit-answer-btn"
                    onClick={handleSubmit}
                    disabled={selectedOptionIndex === null || isGrading}
                    className="w-full py-4 rounded-2xl bg-purple-600 hover:bg-purple-500 disabled:opacity-30 disabled:cursor-not-allowed text-white font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] flex justify-center items-center gap-2"
                  >
                    {isGrading ? (
                      <>
                        <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                        Grading...
                      </>
                    ) : (
                      'Submit Answer'
                    )}
                  </button>
                ) : (
                  <button
                    id="next-question-btn"
                    onClick={handleNext}
                    className="w-full py-4 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    {conceptIndex + 1 < session.concepts.length ? 'Next Question' : 'Complete Session'}
                  </button>
                )}
              </>
            )}
          </section>

          <aside className="space-y-4">
            <motion.div
              key={`coach-${coachPulse}`}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.4, type: "spring", stiffness: 400 }}
              className="rounded-2xl border border-purple-500/30 bg-gradient-to-br from-purple-500/15 via-transparent to-transparent p-5 shadow-2xl drop-shadow-purple-500/50"
              whileHover={{ scale: 1.02, y: -2 }}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-purple-200">Coach response</span>
                <span className={`text-xs font-semibold ${moodCfg.color}`}>Mood: {moodCfg.label}</span>
              </div>
              <p className="text-sm text-white/80 leading-relaxed">
                {intervention?.coachMessage || 'Stay focused and keep experimenting. Your next step is coming.'}
              </p>
              <div className="flex flex-wrap gap-2 mt-4">
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/70">
                  Difficulty: {intervention?.difficultyAdjustment ?? 'same'}
                </span>
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/70">
                  Tone: {intervention?.tone ?? 'encouraging'}
                </span>
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/70">
                  Format: {intervention?.formatSwitch ?? 'text'}
                </span>
              </div>
            </motion.div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="text-xs uppercase tracking-wider text-white/40 mb-3">Live Signals</div>
              <div className="grid grid-cols-2 gap-3 text-xs text-white/70">
                <div className="rounded-xl bg-white/5 px-3 py-2">
                  <div className="text-white/40">Accuracy</div>
                  <div className="text-sm text-white">{accuracyPct}%</div>
                </div>
                <motion.div 
                  className="rounded-xl bg-white/5 px-3 py-2"
                  animate={{ scale: wrongStreak >= 3 ? [1, 1.1, 1] : 1 }}
                  transition={{ duration: 0.3, repeat: wrongStreak >= 3 ? Infinity : 0 }}
                >
                  <div className="text-white/40">Wrong streak</div>
                  <div className={`text-sm font-bold ${wrongStreak >= 3 ? 'text-red-400 drop-shadow-lg' : 'text-white'}`}>
                    {wrongStreak}{wrongStreak >= 3 ? ' → Easier next!' : ''}
                  </div>
                </motion.div>
                <div className="rounded-xl bg-white/5 px-3 py-2">
                  <div className="text-white/40">Typing speed</div>
                  <div className="text-sm text-white">{keystrokeSignals.typing_speed_cps} cps</div>
                </div>
                <div className="rounded-xl bg-white/5 px-3 py-2">
                  <div className="text-white/40">Pauses</div>
                  <div className="text-sm text-white">{keystrokeSignals.pause_count}</div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>

      {showCamConsent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-6">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0f0f16] p-6">
            <h3 className="text-lg font-semibold text-white mb-2">Enable webcam mood badge?</h3>
            <p className="text-sm text-white/60 mb-6">
              We use the camera in-browser to estimate facial expressions. Nothing is uploaded.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowCamConsent(false)}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70 hover:bg-white/10"
              >
                Not now
              </button>
              <button
                onClick={() => {
                  setShowCamConsent(false);
                  startCamera();
                }}
                className="rounded-xl bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-500"
              >
                Allow webcam
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
