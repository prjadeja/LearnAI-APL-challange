import { useState, useCallback } from 'react';
import { Onboarding } from './components/Onboarding.jsx';
import { LessonView }  from './components/LessonView.jsx';
import { Dashboard }   from './components/Dashboard.jsx';
import { Toast }       from './components/ui.jsx';

const SCREEN = {
  ONBOARDING: 'onboarding',
  LESSON:     'lesson',
  DASHBOARD:  'dashboard',
  COMPLETION: 'completion',
};

function CompletionScreen({ session, onRestart }) {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-900/30 via-purple-900/20 to-pink-900/30" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-500/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-pink-500/20 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 text-center max-w-sm w-full animate-bounce-in">
        <div className="text-7xl mb-4" aria-label="Trophy">🏆</div>
        <h1 className="text-3xl font-bold gradient-text mb-3">Course Complete!</h1>
        <p className="text-gray-300 text-base mb-2">
          You've mastered <span className="text-white font-semibold">{session.topic}</span>!
        </p>
        <p className="text-gray-500 text-sm mb-8">Every expert was once a beginner. 🌱</p>

        <div className="glass-strong rounded-3xl p-6 mb-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-400">⚡ {session.totalXp || 0}</div>
              <div className="text-xs text-gray-500 mt-1">XP Earned</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-400">🔥 {session.streak || 0}</div>
              <div className="text-xs text-gray-500 mt-1">Day Streak</div>
            </div>
          </div>
        </div>

        <button id="learn-new-topic-btn" onClick={onRestart} className="btn-primary w-full text-sm">
          🎯 Learn Something New
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const [screen, setScreen]         = useState(SCREEN.ONBOARDING);
  const [sessionId, setSessionId]   = useState(null);
  const [sessionData, setSessionData] = useState(null);
  const [toast, setToast]           = useState(null);

  function showToast(message, type = 'info') {
    setToast({ message, type });
  }

  function handleStart(data) {
    setSessionId(data.sessionId);
    setSessionData({
      topic:              data.topic,
      level:              data.level,
      emoji:              data.emoji,
      totalLessons:       data.totalLessons,
      currentLessonIndex: 0,
      totalXp:            0,
      streak:             0,
      dailyMinutes:       data.dailyMinutes,
    });
    setScreen(SCREEN.LESSON);
    showToast(`🎯 ${data.totalLessons} lessons ready for "${data.topic}"`, 'success');
  }

  const handleComplete = useCallback((result) => {
    setSessionData((prev) => ({ ...prev, ...result }));
    setScreen(SCREEN.COMPLETION);
  }, []);

  // BUG FIX: update currentLessonIndex (not completedLessons) to keep sessionData in sync
  const handleProgressUpdate = useCallback((update) => {
    setSessionData((prev) => ({ ...prev, ...update }));
  }, []);

  function handleRestart() {
    setSessionId(null);
    setSessionData(null);
    setScreen(SCREEN.ONBOARDING);
  }

  const isLearning = screen !== SCREEN.ONBOARDING && !!sessionData;

  return (
    <div className="min-h-dvh bg-gray-950">
      {/* Persistent nav — visible during lesson / dashboard / completion */}
      {isLearning && (
        <nav className="fixed top-0 left-0 right-0 z-50 flex justify-center" aria-label="Main navigation">
          <div className="max-w-lg w-full px-4 pt-3 pb-2 flex justify-between items-center">
            <button
              id="nav-logo"
              onClick={() => setScreen(SCREEN.DASHBOARD)}
              className="flex items-center gap-2 text-sm font-bold gradient-text"
              aria-label="Go to dashboard"
            >
              🧠 LearnAI
            </button>
            <div className="flex gap-1">
              <button
                id="nav-dashboard"
                onClick={() => setScreen(SCREEN.DASHBOARD)}
                className={`text-xs px-3 py-1.5 rounded-xl transition-all ${
                  screen === SCREEN.DASHBOARD
                    ? 'bg-brand-500/20 text-brand-400'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Dashboard
              </button>
              <button
                id="nav-lesson"
                onClick={() => setScreen(SCREEN.LESSON)}
                className={`text-xs px-3 py-1.5 rounded-xl transition-all ${
                  screen === SCREEN.LESSON
                    ? 'bg-brand-500/20 text-brand-400'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Lesson
              </button>
            </div>
          </div>
        </nav>
      )}

      {/* Screen content — pad top when nav is visible */}
      <div className={isLearning ? 'pt-12' : ''}>
        {screen === SCREEN.ONBOARDING && (
          <Onboarding onStart={handleStart} />
        )}

        {screen === SCREEN.LESSON && sessionId && sessionData && (
          <LessonView
            sessionId={sessionId}
            session={sessionData}
            onComplete={handleComplete}
            onProgressUpdate={handleProgressUpdate}
          />
        )}

        {screen === SCREEN.DASHBOARD && sessionId && sessionData && (
          <Dashboard
            sessionId={sessionId}
            session={sessionData}
            onContinue={() => setScreen(SCREEN.LESSON)}
            onRestart={handleRestart}
          />
        )}

        {screen === SCREEN.COMPLETION && sessionData && (
          <CompletionScreen session={sessionData} onRestart={handleRestart} />
        )}
      </div>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}
