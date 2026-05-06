'use client';

import { useState, useRef, useCallback } from 'react';
import { generateCurriculum, extractContent, uploadNotesFile } from '@/lib/api';
import { DOMAINS, type Domain } from '@/lib/domain-data';
import { getDiagnosticQuestions, computeLevel } from '@/lib/diagnostic-data';
import GeneratingSpinner from './GeneratingSpinner';
import { DOMAIN_ICONS, Brain, Document, ClipboardCheck, Zap, Telescope, FolderOpen, FileText } from '@/components/Icons';
import type { SessionData } from '@/types/session';
import type { Intent, DiagnosticQuestion, StudentLevel } from '@/types';

type Step = 'path' | 'domain' | 'topic' | 'intent' | 'diagnostic' | 'upload' | 'loading';

interface Props {
  onComplete: (data: SessionData) => void;
  onBack: () => void;
}

const INTENT_OPTIONS: { value: Intent; Icon: React.ComponentType<{ className?: string }>; label: string; desc: string }[] = [
  { value: 'exam_prep', Icon: ClipboardCheck, label: 'Exam Prep',  desc: 'Structured march through all key concepts' },
  { value: 'catch_up',  Icon: Zap,            label: 'Catch Up',   desc: 'Fill knowledge gaps fast and efficiently' },
  { value: 'curiosity', Icon: Telescope,      label: 'Curiosity',  desc: 'Open exploration — learn what fascinates you' },
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
    } catch (e: any) {
      if (abortRef.current) return;
      setError(e.message ?? 'Something went wrong generating your curriculum.');
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
    } catch (e: any) {
      if (abortRef.current) return;
      setError(e.message ?? 'Something went wrong extracting concepts.');
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
    <div className="min-h-screen flex flex-col items-center px-6 py-12 bg-white pt-24">
      {/* Back button */}
      <button
        onClick={goBack}
        className="self-start mb-8 text-[#4b6b50] hover:text-[#1a2e1c] text-sm transition-colors flex items-center gap-1"
      >
        <span>←</span> Back
      </button>

      {/* Error banner */}
      {error && (
        <div className="w-full max-w-2xl mb-6 rounded-xl border border-red-200 bg-red-50 px-5 py-3">
          <p className="text-red-600 text-sm">⚠ {error}</p>
          <button
            onClick={() => setError('')}
            className="text-red-400 text-xs mt-1 hover:text-red-600 transition-colors"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ─── Step: Choose Path ─────────────────────────────────────────────── */}
      {step === 'path' && (
        <div className="w-full max-w-2xl flex flex-col items-center">
          <h1 className="text-3xl font-bold mb-2 text-center text-[#1a2e1c]">How do you want to learn?</h1>
          <p className="text-[#4b6b50] mb-10 text-center">Choose the path that fits your situation</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
            {[
              { key: 'A' as const, Icon: Brain,    title: 'Teach me from scratch', desc: 'Pick any topic — AI builds a full curriculum tailored to your level.' },
              { key: 'B' as const, Icon: Document, title: 'I have my own notes',   desc: 'Upload a PDF or paste text — AI extracts concepts and quizzes you.' },
            ].map((p) => (
              <button
                key={p.key}
                id={`path-${p.key.toLowerCase()}-btn`}
                onClick={() => { setPath(p.key); setStep(p.key === 'A' ? 'domain' : 'upload'); }}
                className="text-left rounded-2xl border border-[#d1e0d3] bg-[#f4f7f4] p-6 hover:border-green-400 hover:bg-[#e8f0e8] transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] group"
              >
                <div className="w-12 h-12 rounded-xl bg-green-50 border border-green-200 flex items-center justify-center mb-3 group-hover:bg-green-100 transition-colors">
                  <p.Icon className="w-6 h-6 text-green-700" />
                </div>
                <h2 className="font-semibold text-[#1a2e1c] mb-1 text-lg">{p.title}</h2>
                <p className="text-sm text-[#4b6b50]">{p.desc}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ─── Step: Domain Grid ─────────────────────────────────────────────── */}
      {step === 'domain' && (
        <div className="w-full max-w-3xl flex flex-col items-center">
          <h1 className="text-3xl font-bold mb-2 text-center text-[#1a2e1c]">Pick a subject</h1>
          <p className="text-[#4b6b50] mb-10 text-center">Choose the domain you want to study</p>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 w-full">
            {DOMAINS.map((domain) => {
              const DomainIcon = DOMAIN_ICONS[domain.id];
              return (
              <button
                key={domain.id}
                id={`domain-${domain.id}`}
                onClick={() => selectDomain(domain)}
                className="flex flex-col items-center gap-2 rounded-2xl border border-[#d1e0d3] bg-[#f4f7f4] p-5 hover:bg-[#e8f0e8] transition-all duration-200 hover:scale-[1.04] active:scale-[0.97] group"
                style={{ borderColor: '#d1e0d3' }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = domain.color + '90';
                  (e.currentTarget as HTMLElement).style.boxShadow = `0 0 16px ${domain.color}20`;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = '#d1e0d3';
                  (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: domain.color + '18', border: `1px solid ${domain.color}30` }}
                >
                  {DomainIcon
                    ? <DomainIcon className="w-5 h-5" style={{ color: domain.color }} />
                    : <span className="text-xl">{domain.icon}</span>
                  }
                </div>
                <span className="text-sm font-medium text-[#4b6b50] group-hover:text-[#1a2e1c] transition-colors">{domain.name}</span>
              </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── Step: Topic Drill-Down ────────────────────────────────────────── */}
      {step === 'topic' && selectedDomain && (
        <div className="w-full max-w-lg flex flex-col items-center">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">{selectedDomain.icon}</span>
            <h1 className="text-3xl font-bold text-[#1a2e1c]">{selectedDomain.name}</h1>
          </div>
          <p className="text-[#4b6b50] mb-8 text-center">Choose a specific topic to study</p>

          <div className="w-full space-y-2 mb-6">
            {selectedDomain.topics.map((topic) => (
              <button
                key={topic}
                id={`topic-${topic.toLowerCase().replace(/\s+/g, '-')}`}
                onClick={() => selectTopic(topic)}
                className="w-full text-left px-5 py-4 rounded-xl border border-[#d1e0d3] bg-[#f4f7f4] hover:border-green-400 hover:bg-[#e8f0e8] transition-all duration-150 text-[#4b6b50] hover:text-[#1a2e1c] font-medium"
                style={{ borderLeftWidth: '3px', borderLeftColor: selectedDomain.color + '50' }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderLeftColor = selectedDomain.color;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderLeftColor = selectedDomain.color + '50';
                }}
              >
                {topic}
              </button>
            ))}
          </div>

          <div className="w-full">
            <p className="text-xs text-[#4b6b50]/60 mb-2 text-center">— or type your own —</p>
            <div className="flex gap-2">
              <input
                id="custom-topic-input"
                type="text"
                value={customTopic}
                onChange={(e) => setCustomTopic(e.target.value)}
                placeholder={`e.g. "Photosynthesis in C4 plants"`}
                className="flex-1 rounded-xl border border-[#d1e0d3] bg-white px-4 py-3 text-[#1a2e1c] placeholder-[#4b6b50]/50 outline-none focus:border-green-500 transition-colors text-sm"
              />
              <button
                onClick={() => { if (customTopic.trim()) selectTopic(customTopic.trim()); }}
                disabled={!customTopic.trim()}
                className="px-5 py-3 rounded-xl bg-green-600 hover:bg-green-500 disabled:opacity-30 disabled:cursor-not-allowed text-white font-medium text-sm transition-all"
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
          <h1 className="text-3xl font-bold mb-2 text-center text-[#1a2e1c]">What's your goal?</h1>
          <p className="text-[#4b6b50] mb-8 text-center">
            Studying <span className="text-green-600 font-medium">{selectedTopic || customTopic}</span>
          </p>

          <div className="w-full space-y-3">
            {INTENT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                id={`intent-${opt.value}`}
                onClick={() => selectIntent(opt.value)}
                className="w-full text-left px-5 py-4 rounded-xl border border-[#d1e0d3] bg-[#f4f7f4] hover:border-green-400 hover:bg-[#e8f0e8] transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-green-50 border border-green-200 flex items-center justify-center flex-shrink-0 group-hover:bg-green-100 transition-colors">
                    <opt.Icon className="w-4 h-4 text-green-700" />
                  </div>
                  <div>
                    <span className="font-semibold text-[#1a2e1c]">{opt.label}</span>
                    <p className="text-sm text-[#4b6b50] mt-0.5">{opt.desc}</p>
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
          <h1 className="text-2xl font-bold mb-1 text-center text-[#1a2e1c]">Quick Diagnostic</h1>
          <p className="text-[#4b6b50] mb-6 text-center text-sm">
            Answer questions to calibrate your level — skip ahead anytime
          </p>

          <div className="flex gap-1.5 mb-6">
            {diagnosticQuestions.map((_, i) => (
              <div
                key={i}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                  i === currentQIndex
                    ? 'bg-green-600 scale-125'
                    : answers[i] !== null
                    ? answers[i] === diagnosticQuestions[i].correctIndex
                      ? 'bg-green-500'
                      : 'bg-red-400'
                    : 'bg-[#d1e0d3]'
                }`}
              />
            ))}
          </div>

          <div className="w-full rounded-2xl border border-[#d1e0d3] bg-white p-6 mb-4 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs text-[#4b6b50]">
                Question {currentQIndex + 1} of {diagnosticQuestions.length}
              </span>
              <span className="text-xs text-[#4b6b50]">
                {currentQ.difficulty === 1 ? 'Easy' : currentQ.difficulty === 2 ? 'Medium' : 'Hard'}
                <span className={`ml-1 inline-block w-2 h-2 rounded-full ${currentQ.difficulty === 1 ? 'bg-green-500' : currentQ.difficulty === 2 ? 'bg-amber-400' : 'bg-red-400'}`} />
              </span>
            </div>
            <p className="text-[#1a2e1c] text-lg font-medium leading-relaxed mb-6">{currentQ.question}</p>

            <div className="space-y-2">
              {currentQ.options.map((option, i) => {
                let optionClass = 'border-[#d1e0d3] bg-[#f4f7f4] text-[#4b6b50] hover:border-green-400 hover:bg-[#e8f0e8]';

                if (showingFeedback) {
                  if (i === currentQ.correctIndex) {
                    optionClass = 'border-green-400 bg-green-50 text-green-700';
                  } else if (i === selectedOption && i !== currentQ.correctIndex) {
                    optionClass = 'border-red-300 bg-red-50 text-red-600';
                  } else {
                    optionClass = 'border-[#d1e0d3] bg-white text-[#4b6b50]/40';
                  }
                }

                return (
                  <button
                    key={i}
                    onClick={() => handleDiagnosticAnswer(i)}
                    disabled={showingFeedback}
                    className={`w-full text-left px-4 py-3 rounded-xl border transition-all duration-200 text-sm ${optionClass} disabled:cursor-default`}
                  >
                    <span className="font-medium mr-2 text-[#4b6b50]/60">{String.fromCharCode(65 + i)}.</span>
                    {option}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="w-full flex items-center justify-between">
            <div className="text-sm text-[#4b6b50]">
              {answeredCount > 0 && (
                <span>
                  {diagnosticResult.score}/{answeredCount} correct •{' '}
                  <span className={
                    diagnosticResult.level === 'advanced' ? 'text-green-600' :
                    diagnosticResult.level === 'intermediate' ? 'text-amber-600' :
                    'text-orange-500'
                  }>
                    {diagnosticResult.level}
                  </span>
                </span>
              )}
            </div>

            <div className="flex gap-2">
              {currentQIndex > 0 && (
                <button
                  onClick={() => { setCurrentQIndex(currentQIndex - 1); setShowingFeedback(false); setSelectedOption(null); }}
                  className="px-3 py-1.5 text-xs text-[#4b6b50] hover:text-[#1a2e1c] transition-colors"
                >
                  ← Prev
                </button>
              )}
              {currentQIndex < diagnosticQuestions.length - 1 && answers[currentQIndex] !== null && (
                <button
                  onClick={() => { setCurrentQIndex(currentQIndex + 1); setShowingFeedback(false); setSelectedOption(null); }}
                  className="px-3 py-1.5 text-xs text-[#4b6b50] hover:text-[#1a2e1c] transition-colors"
                >
                  Next →
                </button>
              )}
            </div>
          </div>

          {answeredCount >= 1 && (
            <button
              id="generate-curriculum-btn"
              onClick={handleGenerateCurriculum}
              className="w-full mt-6 py-4 rounded-2xl bg-green-600 hover:bg-green-500 text-white font-semibold text-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-md shadow-green-200"
            >
              Build My Learning Path →
            </button>
          )}

          {answeredCount === 0 && (
            <button
              onClick={() => {
                const topic = selectedTopic || customTopic;
                startGeneration(topic, intent, 'intermediate');
              }}
              className="mt-6 text-sm text-[#4b6b50] hover:text-[#1a2e1c] transition-colors"
            >
              Skip diagnostic (assume intermediate level)
            </button>
          )}
        </div>
      )}

      {/* ─── Step: Upload Notes (Path B) ───────────────────────────────────── */}
      {step === 'upload' && (
        <div className="w-full max-w-lg flex flex-col items-center">
          <h1 className="text-3xl font-bold mb-2 text-center text-[#1a2e1c]">Upload your notes</h1>
          <p className="text-[#4b6b50] mb-8 text-center">Upload a PDF or paste your study material</p>

          <div
            className="w-full rounded-2xl border-2 border-dashed border-[#d1e0d3] bg-[#f4f7f4] p-8 text-center mb-4 hover:border-green-400 transition-colors cursor-pointer"
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
              <div className="flex flex-col items-center">
                <FileText className="w-10 h-10 text-green-600 mb-2" />
                <p className="text-[#1a2e1c] font-medium">{file.name}</p>
                <p className="text-sm text-[#4b6b50] mt-1">{(file.size / 1024).toFixed(1)} KB</p>
                <button
                  onClick={(e) => { e.stopPropagation(); setFile(null); }}
                  className="text-xs text-red-500 hover:text-red-600 mt-2 transition-colors"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <FolderOpen className="w-10 h-10 text-[#4b6b50] mb-2" />
                <p className="text-[#4b6b50] mt-1">Click to upload a PDF or text file</p>
                <p className="text-xs text-[#4b6b50]/50 mt-1">Max 5MB • PDF or TXT</p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4 w-full my-4">
            <div className="flex-1 h-px bg-[#d1e0d3]" />
            <span className="text-xs text-[#4b6b50]/60">or paste text</span>
            <div className="flex-1 h-px bg-[#d1e0d3]" />
          </div>

          <textarea
            id="notes-input"
            value={notes}
            onChange={(e) => { setNotes(e.target.value); setFile(null); }}
            placeholder="Paste your class notes, textbook excerpt, or any study material here…"
            rows={8}
            className="w-full rounded-xl border border-[#d1e0d3] bg-white px-4 py-3 text-[#1a2e1c] placeholder-[#4b6b50]/50 outline-none focus:border-green-500 transition-colors resize-none mb-6 text-sm"
          />

          <button
            id="extract-notes-btn"
            onClick={handleNotesSubmit}
            disabled={!file && !notes.trim()}
            className="w-full py-4 rounded-2xl bg-green-600 hover:bg-green-500 disabled:opacity-30 disabled:cursor-not-allowed text-white font-semibold text-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-md shadow-green-200"
          >
            Extract Concepts →
          </button>
        </div>
      )}
    </div>
  );
}
