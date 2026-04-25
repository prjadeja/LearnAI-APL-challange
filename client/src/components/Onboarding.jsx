import { useState } from 'react';
import { api } from '../api.js';

const LEVELS = [
  { id: 'beginner', label: 'Beginner', icon: '🌱', desc: 'Starting from scratch' },
  { id: 'intermediate', label: 'Intermediate', icon: '⚡', desc: 'Know the basics' },
  { id: 'advanced', label: 'Advanced', icon: '🚀', desc: 'Going deep' },
];

const DAILY_TIMES = [
  { value: 5, label: '5 min', desc: 'Micro-sessions', icon: '⚡' },
  { value: 10, label: '10 min', desc: 'Daily habit', icon: '🎯' },
  { value: 20, label: '20 min', desc: 'Deep focus', icon: '🔥' },
];

const TOPIC_SUGGESTIONS = [
  'JavaScript', 'Python', 'Machine Learning', 'React',
  'Data Structures', 'System Design', 'Photography',
  'Music Theory', 'Public Speaking', 'Blockchain',
];

export function Onboarding({ onStart }) {
  const [step, setStep] = useState(0); // 0=topic, 1=level, 2=time
  const [topic, setTopic] = useState('');
  const [level, setLevel] = useState('');
  const [dailyMinutes, setDailyMinutes] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleStart() {
    if (!topic.trim() || !level || !dailyMinutes) return;
    setLoading(true);
    setError('');
    try {
      const data = await api.startLearning(topic.trim(), level, dailyMinutes);
      onStart(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-4 py-8 relative overflow-hidden">
      {/* Background orbs */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-600/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-pink-600/15 rounded-full blur-[100px]" />
      </div>

      <div className="w-full max-w-md relative z-10 animate-slide-up">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3 animate-bounce-in">🧠</div>
          <h1 className="text-3xl font-bold gradient-text mb-2">LearnAI</h1>
          <p className="text-gray-400 text-sm">Personalized learning, powered by AI</p>
        </div>

        {/* Step indicator */}
        <div className="flex gap-2 justify-center mb-8">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === step ? 'w-8 bg-brand-500' : i < step ? 'w-8 bg-brand-700' : 'w-4 bg-white/10'
              }`}
            />
          ))}
        </div>

        <div className="glass-strong rounded-3xl p-6">
          {/* Step 0: Topic */}
          {step === 0 && (
            <div className="animate-fade-in">
              <h2 className="text-xl font-semibold mb-1">What do you want to learn?</h2>
              <p className="text-gray-400 text-sm mb-5">Type any topic or pick a suggestion</p>

              <input
                id="topic-input"
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && topic.trim() && setStep(1)}
                placeholder="e.g. JavaScript, Cooking, Music Theory…"
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 text-white placeholder-gray-500 focus:outline-none focus:border-brand-500/60 focus:bg-white/8 transition-all text-sm"
                autoFocus
              />

              <div className="flex flex-wrap gap-2 mt-4">
                {TOPIC_SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    id={`suggestion-${s.toLowerCase().replace(/\s+/g, '-')}`}
                    onClick={() => { setTopic(s); setStep(1); }}
                    className="px-3 py-1.5 rounded-xl text-xs font-medium bg-white/5 hover:bg-brand-500/20 border border-white/8 hover:border-brand-500/40 text-gray-300 hover:text-white transition-all"
                  >
                    {s}
                  </button>
                ))}
              </div>

              <button
                id="next-to-level"
                onClick={() => topic.trim() && setStep(1)}
                disabled={!topic.trim()}
                className="btn-primary w-full mt-6 text-sm"
              >
                Continue →
              </button>
            </div>
          )}

          {/* Step 1: Level */}
          {step === 1 && (
            <div className="animate-fade-in">
              <button onClick={() => setStep(0)} className="text-gray-500 hover:text-gray-300 text-sm mb-4 transition-colors">
                ← Back
              </button>
              <h2 className="text-xl font-semibold mb-1">Your skill level?</h2>
              <p className="text-gray-400 text-sm mb-5">
                Learning <span className="text-brand-400 font-medium">"{topic}"</span>
              </p>

              <div className="flex flex-col gap-3">
                {LEVELS.map((l) => (
                  <button
                    key={l.id}
                    id={`level-${l.id}`}
                    onClick={() => { setLevel(l.id); setStep(2); }}
                    className={`option-card flex items-center gap-4 ${level === l.id ? 'selected' : ''}`}
                  >
                    <span className="text-2xl">{l.icon}</span>
                    <div className="text-left">
                      <div className="font-semibold text-sm">{l.label}</div>
                      <div className="text-gray-400 text-xs">{l.desc}</div>
                    </div>
                    {level === l.id && <span className="ml-auto text-brand-400">✓</span>}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Time */}
          {step === 2 && (
            <div className="animate-fade-in">
              <button onClick={() => setStep(1)} className="text-gray-500 hover:text-gray-300 text-sm mb-4 transition-colors">
                ← Back
              </button>
              <h2 className="text-xl font-semibold mb-1">Daily time commitment?</h2>
              <p className="text-gray-400 text-sm mb-5">Consistency beats intensity 💪</p>

              <div className="flex flex-col gap-3 mb-6">
                {DAILY_TIMES.map((t) => (
                  <button
                    key={t.value}
                    id={`time-${t.value}`}
                    onClick={() => setDailyMinutes(t.value)}
                    className={`option-card flex items-center gap-4 ${dailyMinutes === t.value ? 'selected' : ''}`}
                  >
                    <span className="text-2xl">{t.icon}</span>
                    <div className="text-left">
                      <div className="font-semibold text-sm">{t.label} / day</div>
                      <div className="text-gray-400 text-xs">{t.desc}</div>
                    </div>
                    {dailyMinutes === t.value && <span className="ml-auto text-brand-400">✓</span>}
                  </button>
                ))}
              </div>

              {error && (
                <p className="text-red-400 text-sm mb-3 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2">
                  ⚠️ {error}
                </p>
              )}

              <button
                id="start-learning-btn"
                onClick={handleStart}
                disabled={!dailyMinutes || loading}
                className="btn-primary w-full text-sm"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Building your curriculum…
                  </span>
                ) : (
                  '🚀 Start Learning'
                )}
              </button>
            </div>
          )}
        </div>

        {/* Creator credit */}
        <div className="mt-8 text-center animate-fade-in">
          <p className="text-gray-600 text-xs">
            Created by{' '}
            <span className="text-gray-400 font-medium">Pratipalsinh Jadeja</span>
          </p>
          <a
            href="https://www.linkedin.com/in/pratipalsinh"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 mt-1.5 text-xs font-medium text-brand-400 hover:text-brand-300 transition-colors group"
          >
            <svg
              className="w-3.5 h-3.5 flex-shrink-0"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
            </svg>
            LinkedIn
            <span className="group-hover:translate-x-0.5 transition-transform">→</span>
          </a>
        </div>
      </div>
    </div>
  );
}
