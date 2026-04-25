import { useState, useEffect } from 'react';
import { api } from '../api.js';
import { ProgressRing, ProgressBar, LevelBadge, StreakBadge, LoadingSpinner } from './ui.jsx';

export function Dashboard({ sessionId, session, onContinue, onRestart }) {
  const [progress, setProgress] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');

  useEffect(() => {
    setLoading(true);
    api.getProgress(sessionId)
      .then(setProgress)
      .catch((e) => {
        console.error('getProgress:', e);
        setError('Could not load progress. Is the server running?');
      })
      .finally(() => setLoading(false));
  }, [sessionId]);

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <LoadingSpinner message="Loading your progress…" />
      </div>
    );
  }

  if (error || !progress) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center px-6 text-center">
        <div className="text-4xl mb-4">⚠️</div>
        <p className="text-red-400 font-semibold mb-2">Could not load dashboard</p>
        <p className="text-gray-400 text-sm mb-6">{error}</p>
        <button onClick={onContinue} className="btn-primary text-sm">Back to Lesson</button>
      </div>
    );
  }

  const {
    progressPercent,
    completedLessons,
    totalLessons,
    totalXp,
    streak,
    nextLesson,
    estimatedDays,
    isComplete,
    // BUG FIX: dailyMinutes now comes from /progress so it's always available
    dailyMinutes,
  } = progress;

  return (
    <div className="min-h-dvh flex flex-col max-w-lg mx-auto px-4 py-6 relative">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-600/15 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-pink-600/10 rounded-full blur-[80px]" />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl flex-shrink-0">{session.emoji}</span>
              <h1 className="text-xl font-bold text-white truncate">{session.topic}</h1>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <LevelBadge level={session.level} />
              <StreakBadge streak={streak} />
            </div>
          </div>
          <button
            id="restart-btn"
            onClick={onRestart}
            className="btn-secondary text-xs flex-shrink-0 ml-3"
          >
            New Topic
          </button>
        </div>

        {/* Progress ring hero card */}
        <div className="glass-strong rounded-3xl p-6 mb-4 text-center">
          <div className="flex items-center justify-center mb-4">
            <ProgressRing
              percent={progressPercent}
              size={100}
              stroke={7}
              gradientId="dashboard-ring"
            />
          </div>
          <h2 className="text-2xl font-bold text-white mb-1">{progressPercent}% Complete</h2>
          <p className="text-gray-400 text-sm">
            {completedLessons} of {totalLessons} lessons done
          </p>
          {!isComplete && estimatedDays > 0 && (
            <p className="text-xs text-gray-500 mt-1">
              ~{estimatedDays} days at {dailyMinutes ?? session.dailyMinutes} min/day
            </p>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="glass rounded-2xl p-4 text-center">
            <div className="text-2xl font-bold text-yellow-400">⚡ {totalXp}</div>
            <div className="text-xs text-gray-500 mt-1">Total XP</div>
          </div>
          <div className="glass rounded-2xl p-4 text-center">
            <div className="text-2xl font-bold text-orange-400">🔥 {streak}</div>
            <div className="text-xs text-gray-500 mt-1">Day Streak</div>
          </div>
          <div className="glass rounded-2xl p-4 text-center">
            <div className="text-2xl font-bold text-green-400">✅ {completedLessons}</div>
            <div className="text-xs text-gray-500 mt-1">Lessons Done</div>
          </div>
        </div>

        {/* Next lesson */}
        {!isComplete && nextLesson && (
          <div className="glass rounded-3xl p-5 mb-4">
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-2">Next Up</p>
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-white font-semibold text-sm truncate">{nextLesson.title}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  ~{nextLesson.estimatedMinutes} min · Lesson {completedLessons + 1}
                </p>
              </div>
              <button
                id="continue-btn"
                onClick={onContinue}
                className="btn-primary text-sm px-5 py-2.5 flex-shrink-0"
              >
                Continue →
              </button>
            </div>
            <ProgressBar percent={progressPercent} className="mt-4" />
          </div>
        )}

        {/* Completed banner */}
        {isComplete && (
          <div className="glass-strong rounded-3xl p-6 mb-4 text-center border border-green-500/20">
            <div className="text-5xl mb-3">🎉</div>
            <h3 className="text-xl font-bold text-white mb-2">Course Complete!</h3>
            <p className="text-gray-400 text-sm mb-4">
              You've mastered all {totalLessons} lessons in {session.topic}.
            </p>
            <div className="flex gap-3 justify-center">
              <div className="badge bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 text-sm px-4 py-2">
                ⚡ {totalXp} XP earned
              </div>
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="flex gap-3">
          {!isComplete ? (
            <button
              id="dashboard-continue-btn"
              onClick={onContinue}
              className="btn-primary flex-1 text-sm"
            >
              🚀 Continue Learning
            </button>
          ) : (
            <button
              id="new-topic-btn"
              onClick={onRestart}
              className="btn-primary flex-1 text-sm"
            >
              🎯 Learn Something New
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
