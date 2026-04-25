/**
 * Shared in-memory session store for Vercel Serverless Functions.
 * Module-level variables persist across warm invocations of the same function instance.
 * Good enough for a demo — no external DB needed.
 */

// ── Tiny UUID v4 (no external dependency needed) ─────────────
function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

// ── Session store ─────────────────────────────────────────────
const sessions = {};

function getSession(id) {
  return sessions[id] || null;
}

function createSession(topic, level, dailyMinutes) {
  const { generateCurriculum } = require('./curriculum');
  const id = uuidv4();
  const curriculum = generateCurriculum(topic, level, dailyMinutes);

  sessions[id] = {
    id,
    createdAt: new Date().toISOString(),
    topic,
    level,
    dailyMinutes,
    curriculum,
    currentLessonIndex: 0,
    completedLessons: [],
    streak: 0,
    lastActivityDate: new Date().toDateString(),
    totalXp: 0,
    consecutiveCorrect: 0,
    consecutiveWrong: 0,
    difficultyModifier: 0,
    history: [],
  };

  return sessions[id];
}

// ── Adaptive lesson ───────────────────────────────────────────
function getAdaptedLesson(session) {
  const lesson = session.curriculum.lessons[session.currentLessonIndex];
  if (!lesson) return null;

  const adapted = { ...lesson };

  if (session.difficultyModifier < 0) {
    adapted.explanation    = lesson.simpleExplanation;
    adapted.hint           = '💡 Take it slow — focus on the key takeaway first.';
    adapted.simplifiedMode = true;
  }

  if (session.difficultyModifier > 0) {
    adapted.challengeBonus = true;
    adapted.hint           = "🚀 You're on fire! Bonus XP for your streak!";
  }

  return adapted;
}

// ── CORS helper ───────────────────────────────────────────────
function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

module.exports = { getSession, createSession, getAdaptedLesson, setCors };
