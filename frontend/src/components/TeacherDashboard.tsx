'use client';

import { useEffect, useMemo, useState } from 'react';
import { getSessionAnalytics } from '@/lib/api';
import type {
  ConceptMastery,
  MoodState,
  MoodTimelinePoint,
  SessionAnalyticsResponse,
  StudentSessionSummary,
} from '@/types';

interface Props {
  sessionId: string;
  onBackHome: () => void;
}

const MOOD_COLORS: Record<MoodState, string> = {
  Flow: '#10b981',
  Confused: '#f59e0b',
  Frustrated: '#ef4444',
  Disengaged: '#64748b',
};

const MASTERY_STYLES: Record<ConceptMastery['status'], string> = {
  green: 'border-emerald-400/40 bg-emerald-500/15 text-emerald-200',
  amber: 'border-amber-400/40 bg-amber-500/15 text-amber-200',
  red: 'border-rose-400/40 bg-rose-500/15 text-rose-200',
};

function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

function MoodTimeline({ points }: { points: MoodTimelinePoint[] }) {
  const plotted = points.length > 0 ? points : [];
  const moodRows: MoodState[] = ['Flow', 'Confused', 'Frustrated', 'Disengaged'];
  const width = 680;
  const height = 190;
  const padding = 28;
  const rowGap = (height - padding * 2) / Math.max(1, moodRows.length - 1);
  const xFor = (index: number) =>
    padding + (index / Math.max(1, plotted.length - 1)) * (width - padding * 2);
  const yFor = (mood: MoodState) => padding + moodRows.indexOf(mood) * rowGap;
  const path = plotted
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${xFor(index)} ${yFor(point.mood)}`)
    .join(' ');

  return (
    <div className="overflow-hidden rounded-lg border border-white/10 bg-[#10131a] p-4">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-56 w-full" role="img" aria-label="Mood timeline">
        {moodRows.map((row) => (
          <g key={row}>
            <line
              x1={padding}
              x2={width - padding}
              y1={yFor(row)}
              y2={yFor(row)}
              stroke="rgba(255,255,255,0.08)"
            />
            <text x={padding} y={yFor(row) - 8} fill="rgba(255,255,255,0.55)" fontSize="12">
              {row}
            </text>
          </g>
        ))}
        {path && <path d={path} fill="none" stroke="#38bdf8" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />}
        {plotted.map((point, index) => (
          <circle
            key={`${point.timestamp}-${index}`}
            cx={xFor(index)}
            cy={yFor(point.mood)}
            r="6"
            fill={MOOD_COLORS[point.mood]}
            stroke="#0a0a0f"
            strokeWidth="2"
          />
        ))}
      </svg>
      <div className="mt-2 flex flex-wrap gap-3 text-xs text-white/60">
        {moodRows.map((mood) => (
          <span key={mood} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: MOOD_COLORS[mood] }} />
            {mood}
          </span>
        ))}
      </div>
    </div>
  );
}

function MasteryHeatmap({ items }: { items: ConceptMastery[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.concept_id}
          className={`min-h-28 rounded-lg border p-4 ${MASTERY_STYLES[item.status]}`}
        >
          <div className="text-xs font-semibold uppercase tracking-wide opacity-70">{item.status}</div>
          <div className="mt-2 text-sm font-semibold leading-snug text-white">{item.concept}</div>
          <div className="mt-4 flex items-center justify-between text-xs">
            <span>{item.correct}/{item.total} correct</span>
            <span>{formatPercent(item.accuracy)}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function ClassOverview({ student }: { student: StudentSessionSummary }) {
  const moodEntries = Object.entries(student.mood_counts) as [MoodState, number][];

  return (
    <div className="grid gap-4 lg:grid-cols-4">
      <div className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
        <div className="text-xs uppercase tracking-wide text-white/40">Student</div>
        <div className="mt-2 text-xl font-semibold text-white">{student.student_name}</div>
        <div className="mt-1 text-sm text-white/45">{student.topic}</div>
      </div>
      <div className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
        <div className="text-xs uppercase tracking-wide text-white/40">Accuracy</div>
        <div className="mt-2 text-3xl font-semibold text-emerald-300">{formatPercent(student.accuracy)}</div>
        <div className="mt-1 text-sm text-white/45">{student.answers_correct}/{student.answers_total} answers</div>
      </div>
      <div className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
        <div className="text-xs uppercase tracking-wide text-white/40">Dominant Mood</div>
        <div className="mt-2 text-2xl font-semibold" style={{ color: MOOD_COLORS[student.dominant_mood] }}>
          {student.dominant_mood}
        </div>
        <div className="mt-1 text-sm text-white/45">{student.total_events} tracked events</div>
      </div>
      <div className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
        <div className="text-xs uppercase tracking-wide text-white/40">Mood Mix</div>
        <div className="mt-3 space-y-2">
          {moodEntries.map(([mood, count]) => (
            <div key={mood} className="grid grid-cols-[82px,1fr,28px] items-center gap-2 text-xs text-white/60">
              <span>{mood}</span>
              <div className="h-2 rounded-full bg-white/10">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.min(100, count * 24)}%`,
                    backgroundColor: MOOD_COLORS[mood],
                  }}
                />
              </div>
              <span className="text-right">{count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function TeacherDashboard({ sessionId, onBackHome }: Props) {
  const [analytics, setAnalytics] = useState<SessionAnalyticsResponse | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getSessionAnalytics(sessionId)
      .then(setAnalytics)
      .catch((err: Error) => setError(err.message));
  }, [sessionId]);

  const student = useMemo(() => analytics?.student_summary ?? analytics?.class_overview[0], [analytics]);

  return (
    <main className="min-h-screen bg-[#0a0a0f] px-6 pb-12 pt-28">
      <div className="mx-auto w-full max-w-7xl">
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-sm font-medium uppercase tracking-wide text-sky-300">Teacher Dashboard</div>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">Session analytics</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/55">
              Class overview, mood timeline, concept mastery heatmap, and the post-session AI recap from the latest student loop.
            </p>
          </div>
          <button
            onClick={onBackHome}
            className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white/70 transition hover:bg-white/10 hover:text-white"
          >
            Back home
          </button>
        </div>

        {error && (
          <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-5 py-4 text-sm text-rose-200">
            {error}
          </div>
        )}

        {!student && !error && (
          <div className="rounded-lg border border-white/10 bg-white/[0.04] p-8 text-center text-white/50">
            Loading analytics...
          </div>
        )}

        {student && (
          <div className="space-y-6">
            <ClassOverview student={student} />

            <section className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-white">Mood timeline</h2>
                  <p className="text-sm text-white/45">Emotional state across the session.</p>
                </div>
              </div>
              <MoodTimeline points={student.mood_timeline} />
            </section>

            <section className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-white">Concept mastery</h2>
                <p className="text-sm text-white/45">Green, amber, and red status from quiz history.</p>
              </div>
              <MasteryHeatmap items={student.concept_mastery} />
            </section>

            <section className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
              <h2 className="text-lg font-semibold text-white">Session summary</h2>
              <p className="mt-3 text-base leading-7 text-white/75">
                {student.llm_summary ?? 'Summary is still being generated. Refresh the dashboard after the session settles.'}
              </p>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
