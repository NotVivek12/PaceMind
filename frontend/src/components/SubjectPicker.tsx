'use client';

import { useState, useRef, useCallback } from 'react';
import { generateCurriculum, extractContent, uploadNotesFile } from '@/lib/api';
import { DOMAINS, type Domain } from '@/lib/domain-data';
import { getDiagnosticQuestions, computeLevel } from '@/lib/diagnostic-data';
import GeneratingSpinner from './GeneratingSpinner';
import type { SessionData } from '@/app/page';
import type { Intent, DiagnosticQuestion, StudentLevel } from '@/types';

type Step = 'path' | 'domain' | 'topic' | 'intent' | 'diagnostic' | 'upload' | 'loading';

interface Props {
  onComplete: (data: SessionData) => void;
  onBack: () => void;
}

const INTENT_OPTIONS: { value: Intent; icon: string; label: string; desc: string }[] = [
  { value: 'exam_prep', icon: '📝', label: 'Exam Prep', desc: 'Structured march through all key concepts' },
  { value: 'catch_up', icon: '⚡', label: 'Catch Up', desc: 'Fill knowledge gaps fast and efficiently' },
  { value: 'curiosity', icon: '🔭', label: 'Curiosity', desc: 'Open exploration — learn what fascinates you' },
];

export default function SubjectPicker({ onComplete, onBack }: Props) {
  // Navigation
  const [step, setStep] = useState<Step>('path');
  const [path, setPath] = useState<'A' | 'B' | null>(null);

  // Path A state
  const [selectedDomain, setSelectedDomain] = useState<Domain | null>(null);
  const [selectedTopic, setSelectedTopic] = useState('');
  const [customTopic, setCustomTopic] = useState('');
  const [intent, setIntent] = useState<Intent>('exam_prep');

  // Diagnostic state
  const [diagnosticQuestions, setDiagnosticQuestions] = useState<DiagnosticQuestion[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [showingFeedback, setShowingFeedback] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  // Path B state
  const [notes, setNotes] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Shared
  const [error, setError] = useState('');
  const abortRef = useRef(false);

  // ─── Navigation Helpers ─────────────────────────────────────────────────────
  function goBack() {
    switch (step) {
      case 'path': onBack(); break;
      case 'domain': setStep('path'); break;
      case 'topic': setStep('domain'); break;
      case 'intent': setStep('topic'); break;
      case 'diagnostic': setStep('intent'); break;
      case 'upload': setStep('path'); break;
      case 'loading':
        abortRef.current = true;
        setStep(path === 'A' ? 'diagnostic' : 'upload');
        break;
    }
  }

  // ─── Path A: Domain Selected ────────────────────────────────────────────────
  function selectDomain(domain: Domain) {
    setSelectedDomain(domain);
    setSelectedTopic('');
    setCustomTopic('');
    // Pre-load diagnostic questions
    const qs = getDiagnosticQuestions(domain.id);
    setDiagnosticQuestions(qs);
    setCurrentQIndex(0);
    setAnswers(new Array(qs.length).fill(null));
    setStep('topic');
  }

  function selectTopic(topic: string) {
    setSelectedTopic(topic);
    setStep('intent');
  }

  function selectIntent(i: Intent) {
    setIntent(i);
    setStep('diagnostic');
  }

  // ─── Diagnostic Quiz ───────────────────────────────────────────────────────
  function handleDiagnosticAnswer(optionIndex: number) {
    if (showingFeedback) return;
    setSelectedOption(optionIndex);
    setShowingFeedback(true);

    // Record answer
    const newAnswers = [...answers];
    newAnswers[currentQIndex] = optionIndex;
    setAnswers(newAnswers);

    // Auto-advance after 1s
    setTimeout(() => {
      setShowingFeedback(false);
      setSelectedOption(null);
      if (currentQIndex < diagnosticQuestions.length - 1) {
        setCurrentQIndex(currentQIndex + 1);
      }
    }, 1000);
  }

  function handleGenerateCurriculum() {
    const { level } = computeLevel(diagnosticQuestions, answers);
    const topic = selectedTopic || customTopic;
    startGeneration(topic, intent, level);
  }

  // ─── Generation ─────────────────────────────────────────────────────────────
  const startGeneration = useCallback(async (topic: string, intent: Intent, level: StudentLevel) => {
    setError('');
    setStep('loading');
    abortRef.current = false;

    try {
      const res = await generateCurriculum({ topic, intent, level });
      if (abortRef.current) return;
      onComplete({ topic, concepts: res.concepts, level });
    } catch (e: unknown) {
      if (abortRef.current) return;
      setError(e instanceof Error ? e.message : 'Something went wrong generating your curriculum.');
      setStep('diagnostic');
    }
  }, [onComplete]);

  // ─── Path B: Notes ──────────────────────────────────────────────────────────
  async function handleNotesSubmit() {
    setError('');
    setStep('loading');
    abortRef.current = false;

    try {
      let concepts;
      if (file) {
        const res = await uploadNotesFile(file);
        concepts = res.concepts;
      } else {
        const res = await extractContent({ text: notes, type: 'notes' });
        concepts = res.concepts;
      }
      if (abortRef.current) return;
      onComplete({ topic: file?.name ?? 'My Notes', concepts, level: 'intermediate' });
    } catch (e: unknown) {
      if (abortRef.current) return;
      setError(e instanceof Error ? e.message : 'Something went wrong extracting concepts.');
      setStep('upload');
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setNotes('');
    }
  }

  // ─── Computed values ────────────────────────────────────────────────────────
  const answeredCount = answers.filter((a) => a !== null).length;
  const diagnosticResult = computeLevel(diagnosticQuestions, answers);
  const currentQ = diagnosticQuestions[currentQIndex];

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════

  // ─── Loading ────────────────────────────────────────────────────────────────
  if (step === 'loading') {
    return (
      <GeneratingSpinner
        topic={selectedTopic || customTopic || 'your notes'}
        onCancel={goBack}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center px-6 pt-28 pb-12">
      {/* Back button */}
      <button
        onClick={goBack}
        className="self-start mb-8 text-white/40 hover:text-white text-sm transition-colors flex items-center gap-1"
      >
        <span>←</span> Back
      </button>

      {/* Error banner */}
      {error && (
        <div className="w-full max-w-2xl mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-3">
          <p className="text-red-400 text-sm">⚠ {error}</p>
          <button
            onClick={() => setError('')}
            className="text-red-400/60 text-xs mt-1 hover:text-red-400 transition-colors"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ─── Step: Choose Path ─────────────────────────────────────────────── */}
      {step === 'path' && (
        <div className="w-full max-w-2xl flex flex-col items-center">
          <h1 className="text-3xl font-bold mb-2 text-center">How do you want to learn?</h1>
          <p className="text-white/50 mb-10 text-center">Choose the path that fits your situation</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
            {[
              { key: 'A' as const, icon: '🧠', title: 'Teach me from scratch', desc: 'Pick any topic — AI builds a full curriculum tailored to your level.' },
              { key: 'B' as const, icon: '📄', title: 'I have my own notes', desc: 'Upload a PDF or paste text — AI extracts concepts and quizzes you.' },
            ].map((p) => (
              <button
                key={p.key}
                id={`path-${p.key.toLowerCase()}-btn`}
                onClick={() => { setPath(p.key); setStep(p.key === 'A' ? 'domain' : 'upload'); }}
                className="text-left rounded-2xl border border-white/10 bg-white/5 p-6 hover:border-purple-500/50 hover:bg-white/[0.08] transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] group"
              >
                <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">{p.icon}</div>
                <h2 className="font-semibold text-white mb-1 text-lg">{p.title}</h2>
                <p className="text-sm text-white/50">{p.desc}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ─── Step: Domain Grid ─────────────────────────────────────────────── */}
      {step === 'domain' && (
        <div className="w-full max-w-3xl flex flex-col items-center">
          <h1 className="text-3xl font-bold mb-2 text-center">Pick a subject</h1>
          <p className="text-white/50 mb-10 text-center">Choose the domain you want to study</p>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 w-full">
            {DOMAINS.map((domain) => (
              <button
                key={domain.id}
                id={`domain-${domain.id}`}
                onClick={() => selectDomain(domain)}
                className="flex flex-col items-center gap-2 rounded-2xl border border-white/10 bg-white/5 p-5 hover:bg-white/[0.08] transition-all duration-200 hover:scale-[1.04] active:scale-[0.97] group"
                style={{
                  borderColor: 'rgba(255,255,255,0.1)',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = domain.color + '60';
                  (e.currentTarget as HTMLElement).style.boxShadow = `0 0 20px ${domain.color}15`;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.1)';
                  (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                }}
              >
                <span className="text-3xl group-hover:scale-110 transition-transform">{domain.icon}</span>
                <span className="text-sm font-medium text-white/80">{domain.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ─── Step: Topic Drill-Down ────────────────────────────────────────── */}
      {step === 'topic' && selectedDomain && (
        <div className="w-full max-w-lg flex flex-col items-center">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">{selectedDomain.icon}</span>
            <h1 className="text-3xl font-bold">{selectedDomain.name}</h1>
          </div>
          <p className="text-white/50 mb-8 text-center">Choose a specific topic to study</p>

          <div className="w-full space-y-2 mb-6">
            {selectedDomain.topics.map((topic) => (
              <button
                key={topic}
                id={`topic-${topic.toLowerCase().replace(/\s+/g, '-')}`}
                onClick={() => selectTopic(topic)}
                className="w-full text-left px-5 py-4 rounded-xl border border-white/10 bg-white/5 hover:border-purple-500/40 hover:bg-white/[0.08] transition-all duration-150 text-white/80 hover:text-white font-medium"
                style={{
                  borderLeftWidth: '3px',
                  borderLeftColor: selectedDomain.color + '40',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderLeftColor = selectedDomain.color;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderLeftColor = selectedDomain.color + '40';
                }}
              >
                {topic}
              </button>
            ))}
          </div>

          {/* Custom topic input */}
          <div className="w-full">
            <p className="text-xs text-white/40 mb-2 text-center">— or type your own —</p>
            <div className="flex gap-2">
              <input
                id="custom-topic-input"
                type="text"
                value={customTopic}
                onChange={(e) => setCustomTopic(e.target.value)}
                placeholder={`e.g. "Photosynthesis in C4 plants"`}
                className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/30 outline-none focus:border-purple-500/60 transition-colors text-sm"
              />
              <button
                onClick={() => { if (customTopic.trim()) selectTopic(customTopic.trim()); }}
                disabled={!customTopic.trim()}
                className="px-5 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-30 disabled:cursor-not-allowed text-white font-medium text-sm transition-all"
              >
                Go →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Step: Intent Selector ─────────────────────────────────────────── */}
      {step === 'intent' && (
        <div className="w-full max-w-lg flex flex-col items-center">
          <h1 className="text-3xl font-bold mb-2 text-center">What is your goal?</h1>
          <p className="text-white/50 mb-8 text-center">
            Studying <span className="text-purple-400 font-medium">{selectedTopic || customTopic}</span>
          </p>

          <div className="w-full space-y-3">
            {INTENT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                id={`intent-${opt.value}`}
                onClick={() => selectIntent(opt.value)}
                className="w-full text-left px-5 py-4 rounded-xl border border-white/10 bg-white/5 hover:border-purple-500/40 hover:bg-white/[0.08] transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] group"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl group-hover:scale-110 transition-transform">{opt.icon}</span>
                  <div>
                    <span className="font-semibold text-white">{opt.label}</span>
                    <p className="text-sm text-white/50 mt-0.5">{opt.desc}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ─── Step: Diagnostic Quiz ─────────────────────────────────────────── */}
      {step === 'diagnostic' && currentQ && (
        <div className="w-full max-w-lg flex flex-col items-center">
          <h1 className="text-2xl font-bold mb-1 text-center">Quick Diagnostic</h1>
          <p className="text-white/50 mb-6 text-center text-sm">
            Answer questions to calibrate your level — skip ahead anytime
          </p>

          {/* Progress dots */}
          <div className="flex gap-1.5 mb-6">
            {diagnosticQuestions.map((_, i) => (
              <div
                key={i}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                  i === currentQIndex
                    ? 'bg-purple-500 scale-125'
                    : answers[i] !== null
                    ? answers[i] === diagnosticQuestions[i].correctIndex
                      ? 'bg-emerald-500'
                      : 'bg-red-400'
                    : 'bg-white/15'
                }`}
              />
            ))}
          </div>

          {/* Question card */}
          <div className="w-full rounded-2xl border border-white/10 bg-white/5 p-6 mb-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs text-white/40">
                Question {currentQIndex + 1} of {diagnosticQuestions.length}
              </span>
              <span className="text-xs text-white/40">
                {['🟢 Easy', '🟡 Medium', '🔴 Hard'][currentQ.difficulty - 1]}
              </span>
            </div>
            <p className="text-white text-lg font-medium leading-relaxed mb-6">{currentQ.question}</p>

            <div className="space-y-2">
              {currentQ.options.map((option, i) => {
                let optionClass = 'border-white/10 bg-white/5 text-white/70 hover:border-white/25 hover:bg-white/[0.08]';

                if (showingFeedback) {
                  if (i === currentQ.correctIndex) {
                    optionClass = 'border-emerald-500/60 bg-emerald-500/15 text-emerald-300';
                  } else if (i === selectedOption && i !== currentQ.correctIndex) {
                    optionClass = 'border-red-500/60 bg-red-500/15 text-red-300';
                  } else {
                    optionClass = 'border-white/5 bg-white/[0.02] text-white/30';
                  }
                }

                return (
                  <button
                    key={i}
                    onClick={() => handleDiagnosticAnswer(i)}
                    disabled={showingFeedback}
                    className={`w-full text-left px-4 py-3 rounded-xl border transition-all duration-200 text-sm ${optionClass} disabled:cursor-default`}
                  >
                    <span className="font-medium mr-2 text-white/40">{String.fromCharCode(65 + i)}.</span>
                    {option}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Score + navigate */}
          <div className="w-full flex items-center justify-between">
            <div className="text-sm text-white/40">
              {answeredCount > 0 && (
                <span>
                  {diagnosticResult.score}/{answeredCount} correct •{' '}
                  <span className={
                    diagnosticResult.level === 'advanced' ? 'text-emerald-400' :
                    diagnosticResult.level === 'intermediate' ? 'text-yellow-400' :
                    'text-orange-400'
                  }>
                    {diagnosticResult.level}
                  </span>
                </span>
              )}
            </div>

            {/* Navigation between questions */}
            <div className="flex gap-2">
              {currentQIndex > 0 && (
                <button
                  onClick={() => { setCurrentQIndex(currentQIndex - 1); setShowingFeedback(false); setSelectedOption(null); }}
                  className="px-3 py-1.5 text-xs text-white/40 hover:text-white/70 transition-colors"
                >
                  ← Prev
                </button>
              )}
              {currentQIndex < diagnosticQuestions.length - 1 && answers[currentQIndex] !== null && (
                <button
                  onClick={() => { setCurrentQIndex(currentQIndex + 1); setShowingFeedback(false); setSelectedOption(null); }}
                  className="px-3 py-1.5 text-xs text-white/40 hover:text-white/70 transition-colors"
                >
                  Next →
                </button>
              )}
            </div>
          </div>

          {/* Generate button — appears after at least 1 answer */}
          {answeredCount >= 1 && (
            <button
              id="generate-curriculum-btn"
              onClick={handleGenerateCurriculum}
              className="w-full mt-6 py-4 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-purple-500/20"
            >
              Build My Learning Path →
            </button>
          )}

          {/* Skip diagnostic */}
          {answeredCount === 0 && (
            <button
              onClick={() => {
                const topic = selectedTopic || customTopic;
                startGeneration(topic, intent, 'intermediate');
              }}
              className="mt-6 text-sm text-white/30 hover:text-white/60 transition-colors"
            >
              Skip diagnostic (assume intermediate level)
            </button>
          )}
        </div>
      )}

      {/* ─── Step: Upload Notes (Path B) ───────────────────────────────────── */}
      {step === 'upload' && (
        <div className="w-full max-w-lg flex flex-col items-center">
          <h1 className="text-3xl font-bold mb-2 text-center">Upload your notes</h1>
          <p className="text-white/50 mb-8 text-center">Upload a PDF or paste your study material</p>

          {/* File upload zone */}
          <div
            className="w-full rounded-2xl border-2 border-dashed border-white/15 bg-white/[0.03] p-8 text-center mb-4 hover:border-purple-500/40 transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.txt"
              onChange={handleFileSelect}
              className="hidden"
            />
            {file ? (
              <div>
                <span className="text-3xl">📄</span>
                <p className="text-white font-medium mt-2">{file.name}</p>
                <p className="text-sm text-white/40 mt-1">{(file.size / 1024).toFixed(1)} KB</p>
                <button
                  onClick={(e) => { e.stopPropagation(); setFile(null); }}
                  className="text-xs text-red-400/60 hover:text-red-400 mt-2 transition-colors"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div>
                <span className="text-3xl">📁</span>
                <p className="text-white/60 mt-2">Click to upload a PDF or text file</p>
                <p className="text-xs text-white/30 mt-1">Max 5MB • PDF or TXT</p>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4 w-full my-4">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-xs text-white/30">or paste text</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {/* Text area */}
          <textarea
            id="notes-input"
            value={notes}
            onChange={(e) => { setNotes(e.target.value); setFile(null); }}
            placeholder="Paste your class notes, textbook excerpt, or any study material here…"
            rows={8}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/30 outline-none focus:border-purple-500/60 transition-colors resize-none mb-6 text-sm"
          />

          <button
            id="extract-notes-btn"
            onClick={handleNotesSubmit}
            disabled={!file && !notes.trim()}
            className="w-full py-4 rounded-2xl bg-purple-600 hover:bg-purple-500 disabled:opacity-30 disabled:cursor-not-allowed text-white font-semibold text-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-purple-500/20"
          >
            Extract Concepts →
          </button>
        </div>
      )}
    </div>
  );
}
