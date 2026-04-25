import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../api.js';
import { ProgressBar, LevelBadge, XpFlash } from './ui.jsx';

const ANSWER_STATE = { IDLE: 'idle', SUBMITTING: 'submitting', CORRECT: 'correct', WRONG: 'wrong' };

export function LessonView({ sessionId, session, onComplete, onProgressUpdate }) {
  const [lesson, setLesson]               = useState(null);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState('');
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [answerState, setAnswerState]     = useState(ANSWER_STATE.IDLE);
  const [feedback, setFeedback]           = useState(null);
  const [xpFlash, setXpFlash]             = useState(0);
  const [altExplanation, setAltExplanation] = useState(null);
  const [confusedMode, setConfusedMode]   = useState(null);
  const [currentXp, setCurrentXp]         = useState(session.totalXp || 0);
  const [lessonProgress, setLessonProgress] = useState({
    // "current" tracks the number of COMPLETED lessons (0-based count, not index)
    current: session.currentLessonIndex || 0,
    total:   session.totalLessons,
  });

  // Prevent double-navigation when course completes
  const completedRef = useRef(false);

  const fetchLesson = useCallback(async () => {
    setLoading(true);
    setError('');
    setSelectedAnswer(null);
    setAnswerState(ANSWER_STATE.IDLE);
    setFeedback(null);
    setAltExplanation(null);
    setConfusedMode(null);
    try {
      const data = await api.getNextLesson(sessionId);
      if (data.completed && !completedRef.current) {
        completedRef.current = true;
        onComplete({ totalXp: data.totalXp, streak: data.streak });
      } else {
        setLesson(data.lesson);
      }
    } catch (e) {
      setError('Failed to load lesson. Please check the server is running.');
      console.error('fetchLesson:', e);
    } finally {
      setLoading(false);
    }
  }, [sessionId, onComplete]);

  useEffect(() => { fetchLesson(); }, [fetchLesson]);

  async function handleSelectAnswer(optionId) {
    // BUG FIX: guard against SUBMITTING state too (prevents double-click during in-flight request)
    if (answerState !== ANSWER_STATE.IDLE) return;
    setSelectedAnswer(optionId);
    setAnswerState(ANSWER_STATE.SUBMITTING);

    try {
      const result = await api.submitAnswer(sessionId, lesson.id, optionId);

      if (result.correct) {
        setAnswerState(ANSWER_STATE.CORRECT);
        setFeedback({ type: 'success', message: result.message, explanation: result.explanation });
        setXpFlash(result.xpEarned);
        setCurrentXp(result.totalXp);
        // BUG FIX: lessonProgress.current = number of completed lessons, not the lesson display index
        setLessonProgress((p) => ({ ...p, current: result.nextLessonIndex }));
        onProgressUpdate({ totalXp: result.totalXp, currentLessonIndex: result.nextLessonIndex });
        setTimeout(() => setXpFlash(0), 900);

        if (result.courseComplete && !completedRef.current) {
          completedRef.current = true;
          // BUG FIX: delay long enough for the user to read the feedback before navigating away
          setTimeout(() => onComplete({ totalXp: result.totalXp, streak: result.streak }), 2200);
        }
      } else {
        setAnswerState(ANSWER_STATE.WRONG);
        setFeedback({
          type: 'error',
          message: result.message,
          explanation: result.explanation,
          correctAnswer: result.correctAnswer,
        });
        // BUG FIX: await the confused call so state updates are sequenced, not racing
        if (result.simplify) {
          await handleConfused();
        }
      }
    } catch (e) {
      // Reset so the user can try again
      setAnswerState(ANSWER_STATE.IDLE);
      setSelectedAnswer(null);
      setError('Could not submit answer. Please try again.');
      console.error('submitAnswer:', e);
    }
  }

  async function handleExplainDifferently() {
    try {
      const data = await api.explainDifferently(sessionId);
      setAltExplanation(data);
      setConfusedMode(null);
    } catch (e) {
      console.error('explainDifferently:', e);
    }
  }

  async function handleConfused() {
    try {
      const data = await api.imConfused(sessionId);
      setConfusedMode(data);
      setAltExplanation(null);
    } catch (e) {
      console.error('imConfused:', e);
    }
  }

  function handleTryAgain() {
    setSelectedAnswer(null);
    setAnswerState(ANSWER_STATE.IDLE);
    setFeedback(null);
  }

  function getOptionClass(option) {
    if (answerState === ANSWER_STATE.IDLE || answerState === ANSWER_STATE.SUBMITTING) {
      return selectedAnswer === option.id ? 'selected' : '';
    }
    if (option.correct) return 'correct';
    if (option.id === selectedAnswer && !option.correct) return 'wrong';
    return 'opacity-40';
  }

  // BUG FIX: progress % is based on completed count (lessonProgress.current) out of total
  const progressPercent = Math.round((lessonProgress.current / lessonProgress.total) * 100);
  // The lesson being displayed is always lessonProgress.current + 1 (1-indexed for humans)
  const displayLessonNumber = lessonProgress.current + 1;

  if (loading) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-gray-400 text-sm">Preparing your lesson…</p>
      </div>
    );
  }

  if (error && !lesson) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center px-6 text-center">
        <div className="text-4xl mb-4">⚠️</div>
        <p className="text-red-400 font-semibold mb-2">Something went wrong</p>
        <p className="text-gray-400 text-sm mb-6">{error}</p>
        <button onClick={fetchLesson} className="btn-primary text-sm">Retry</button>
      </div>
    );
  }

  if (!lesson) return null;

  const isAnswered = answerState === ANSWER_STATE.CORRECT || answerState === ANSWER_STATE.WRONG;

  return (
    <div className="min-h-dvh flex flex-col max-w-lg mx-auto px-4 py-6 relative">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-0 right-0 w-80 h-80 bg-brand-600/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-pink-600/8 rounded-full blur-[80px]" />
      </div>

      <XpFlash amount={xpFlash} />

      {/* Top bar */}
      <div className="relative z-10 mb-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xl flex-shrink-0">{session.emoji}</span>
            <span className="text-sm font-medium text-gray-300 truncate">{session.topic}</span>
            <LevelBadge level={session.level} />
          </div>
          <div className="text-right flex-shrink-0 ml-2">
            <div className="text-xs text-gray-500">XP</div>
            <div className="text-sm font-bold text-yellow-400">⚡ {currentXp}</div>
          </div>
        </div>
        <ProgressBar percent={progressPercent} />
        <div className="flex justify-between mt-1.5">
          <span className="text-xs text-gray-500">
            Lesson {displayLessonNumber} of {lessonProgress.total}
          </span>
          <span className="text-xs text-gray-500">{progressPercent}% complete</span>
        </div>
      </div>

      {/* Content area */}
      <div className="relative z-10 flex-1 flex flex-col gap-4 animate-slide-up">

        {/* Title card */}
        <div className="glass rounded-3xl p-5">
          <div className="text-xs text-brand-400 font-semibold uppercase tracking-wider mb-1">
            Lesson {displayLessonNumber}
          </div>
          <h2 className="text-lg font-bold text-white mb-2">{lesson.title}</h2>
          <div className="flex items-center gap-3 text-xs flex-wrap">
            <span className="text-gray-500">~{lesson.estimatedMinutes} min</span>
            <span className="text-yellow-500 font-medium">+{lesson.xpReward} XP</span>
            {lesson.simplifiedMode  && <span className="text-blue-400">💙 Simplified</span>}
            {lesson.challengeBonus  && <span className="text-orange-400">🔥 Bonus XP active</span>}
          </div>
        </div>

        {/* Explanation */}
        <div className="glass rounded-3xl p-5">
          {confusedMode ? (
            <div className="animate-fade-in">
              <div className="flex items-center gap-2 mb-3">
                <span aria-hidden="true">💙</span>
                <span className="text-sm font-semibold text-blue-400">Simplified Explanation</span>
              </div>
              <p className="text-gray-200 text-sm leading-relaxed mb-3">
                {confusedMode.simpleExplanation}
              </p>
              <p className="text-xs text-gray-400 italic border-t border-white/5 pt-3">
                {confusedMode.encouragement}
              </p>
              <button
                onClick={() => setConfusedMode(null)}
                className="mt-3 text-xs text-brand-400 hover:text-brand-300 transition-colors"
              >
                ← Show original
              </button>
            </div>
          ) : altExplanation ? (
            <div className="animate-fade-in">
              <div className="flex items-center gap-2 mb-3">
                <span aria-hidden="true">🔄</span>
                <span className="text-sm font-semibold text-purple-400">Different Angle</span>
              </div>
              <p className="text-gray-200 text-sm leading-relaxed mb-3">
                {altExplanation.alternativeExplanation}
              </p>
              <div className="glass rounded-2xl p-3 mb-3">
                <p className="text-xs text-gray-400 font-semibold mb-1">EXAMPLE</p>
                <p className="text-gray-300 text-xs leading-relaxed">{altExplanation.example}</p>
              </div>
              <div className="bg-brand-500/10 rounded-xl px-3 py-2 text-xs text-brand-300">
                🎯 {altExplanation.keyTakeaway}
              </div>
              <button
                onClick={() => setAltExplanation(null)}
                className="mt-3 text-xs text-brand-400 hover:text-brand-300 transition-colors"
              >
                ← Show original
              </button>
            </div>
          ) : (
            <div className="animate-fade-in">
              {lesson.hint && (
                <div className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2 mb-3">
                  {lesson.hint}
                </div>
              )}
              <p className="text-gray-200 text-sm leading-relaxed">{lesson.explanation}</p>
              <div className="bg-brand-500/10 rounded-xl px-3 py-2 mt-4 text-xs text-brand-300">
                🎯 {lesson.keyTakeaway}
              </div>
            </div>
          )}
        </div>

        {/* Helper buttons — hidden once answered */}
        {!isAnswered && (
          <div className="flex gap-2">
            <button
              id="explain-differently-btn"
              onClick={handleExplainDifferently}
              className="btn-secondary text-xs flex-1"
            >
              🔄 Explain differently
            </button>
            <button
              id="confused-btn"
              onClick={handleConfused}
              className="btn-secondary text-xs flex-1"
            >
              😕 I'm confused
            </button>
          </div>
        )}

        {/* Error banner */}
        {error && (
          <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2 text-center">
            {error}
          </div>
        )}

        {/* Question */}
        <div className="glass rounded-3xl p-5">
          <p className="text-sm font-semibold text-white mb-4">❓ {lesson.question.text}</p>
          <div className="flex flex-col gap-2.5" role="group" aria-label="Answer options">
            {lesson.question.options.map((option) => (
              <button
                key={option.id}
                id={`answer-${option.id}`}
                onClick={() => handleSelectAnswer(option.id)}
                disabled={answerState !== ANSWER_STATE.IDLE}
                className={`option-card ${getOptionClass(option)}`}
                aria-pressed={selectedAnswer === option.id}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-6 h-6 rounded-lg border flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all ${
                      option.correct && isAnswered
                        ? 'bg-green-500 border-green-500 text-white'
                        : option.id === selectedAnswer && answerState === ANSWER_STATE.WRONG
                        ? 'bg-red-500/30 border-red-500 text-red-300'
                        : 'border-white/20 text-gray-400'
                    }`}
                  >
                    {option.id.toUpperCase()}
                  </div>
                  <span className="text-sm text-gray-200 text-left">{option.text}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Feedback panel */}
        {feedback && (
          <div
            className={`glass rounded-3xl p-5 animate-slide-up border ${
              feedback.type === 'success'
                ? 'border-green-500/30 bg-green-500/5'
                : 'border-red-500/20 bg-red-500/5'
            }`}
          >
            <p
              className={`font-semibold text-sm mb-2 ${
                feedback.type === 'success' ? 'text-green-400' : 'text-red-400'
              }`}
            >
              {feedback.message}
            </p>
            <p className="text-gray-300 text-xs leading-relaxed">{feedback.explanation}</p>

            {feedback.type === 'success' ? (
              <button
                id="next-lesson-btn"
                onClick={fetchLesson}
                className="btn-primary w-full mt-4 text-sm"
              >
                Next Lesson →
              </button>
            ) : (
              <button
                id="try-again-btn"
                onClick={handleTryAgain}
                className="btn-secondary w-full mt-4 text-sm text-center"
              >
                Try Again 🔄
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
