/**
 * Intelligent Learning Assistant - Express API Server
 * In-memory sessions, no DB required
 */

const express = require('express');
const cors    = require('cors');
const { v4: uuidv4 } = require('uuid');
const { generateCurriculum } = require('./data/curriculum');

const app  = express();
const PORT = process.env.PORT || 3013;

// ── Middleware ────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ── In-Memory Store ───────────────────────────────────────────
const sessions = {};

function getSession(id) {
  return sessions[id] || null;
}

function createSession(topic, level, dailyMinutes) {
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
    difficultyModifier: 0, // -1 simplify | 0 normal | +1 challenge
    history: [],
  };

  return sessions[id];
}

// ── Adaptive Logic ────────────────────────────────────────────
function getAdaptedLesson(session) {
  const lesson = session.curriculum.lessons[session.currentLessonIndex];
  if (!lesson) return null;

  // Shallow clone so we never mutate the stored lesson
  const adapted = { ...lesson };

  if (session.difficultyModifier < 0) {
    adapted.explanation  = lesson.simpleExplanation;
    adapted.hint         = '💡 Take it slow — focus on the key takeaway first.';
    adapted.simplifiedMode = true;
  }

  if (session.difficultyModifier > 0) {
    adapted.challengeBonus = true;
    adapted.hint = "🚀 You're on fire! Bonus XP for your streak!";
  }

  return adapted;
}

// ── Routes ────────────────────────────────────────────────────

/**
 * POST /start-learning
 * Body: { topic, level, dailyMinutes }
 */
app.post('/start-learning', (req, res) => {
  try {
    const { topic, level, dailyMinutes } = req.body;

    if (!topic || typeof topic !== 'string' || topic.trim().length === 0) {
      return res.status(400).json({ error: 'topic is required and must be a non-empty string' });
    }
    if (!['beginner', 'intermediate', 'advanced'].includes(level)) {
      return res.status(400).json({ error: 'level must be: beginner | intermediate | advanced' });
    }
    if (![5, 10, 20].includes(Number(dailyMinutes))) {
      return res.status(400).json({ error: 'dailyMinutes must be: 5 | 10 | 20' });
    }

    const trimmedTopic = topic.trim();
    const session = createSession(trimmedTopic, level, Number(dailyMinutes));

    res.json({
      sessionId:     session.id,
      topic:         session.topic,
      level:         session.level,
      dailyMinutes:  session.dailyMinutes,
      totalLessons:  session.curriculum.totalLessons,
      estimatedDays: session.curriculum.estimatedDays,
      emoji:         session.curriculum.emoji,
      message:       `🎯 Your personalized ${level} curriculum for "${trimmedTopic}" is ready!`,
    });
  } catch (err) {
    console.error('Error in /start-learning:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /next-lesson?sessionId=xxx
 */
app.get('/next-lesson', (req, res) => {
  try {
    const { sessionId } = req.query;
    if (!sessionId) return res.status(400).json({ error: 'sessionId query param is required' });

    const session = getSession(sessionId);
    if (!session) return res.status(404).json({ error: 'Session not found. Start a new session.' });

    const lesson = getAdaptedLesson(session);
    if (!lesson) {
      return res.json({
        completed: true,
        message:   "🎉 Congratulations! You've completed all lessons!",
        totalXp:   session.totalXp,
        streak:    session.streak,
      });
    }

    res.json({ lesson, completed: false });
  } catch (err) {
    console.error('Error in /next-lesson:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /submit-answer
 * Body: { sessionId, lessonId, answerId }
 */
app.post('/submit-answer', (req, res) => {
  try {
    const { sessionId, lessonId, answerId } = req.body;

    if (!sessionId || !lessonId || !answerId) {
      return res.status(400).json({ error: 'sessionId, lessonId, and answerId are required' });
    }

    const session = getSession(sessionId);
    if (!session) return res.status(404).json({ error: 'Session not found' });

    const lesson = session.curriculum.lessons[session.currentLessonIndex];
    if (!lesson || lesson.id !== lessonId) {
      return res.status(400).json({ error: 'lessonId does not match current lesson' });
    }

    const correctOption  = lesson.question.options.find((o) => o.correct);
    const selectedOption = lesson.question.options.find((o) => o.id === answerId);

    if (!selectedOption) {
      return res.status(400).json({ error: 'Invalid answerId' });
    }

    const isCorrect = selectedOption.correct;
    session.history.push({ lessonId, answerId, isCorrect, timestamp: new Date().toISOString() });

    if (isCorrect) {
      session.consecutiveCorrect++;
      session.consecutiveWrong    = 0;
      session.difficultyModifier  = session.consecutiveCorrect >= 2 ? 1 : 0;

      const baseXp    = lesson.xpReward;
      const bonusXp   = session.difficultyModifier > 0 ? 5 : 0;
      const xpEarned  = baseXp + bonusXp;
      session.totalXp += xpEarned;

      // Streak: increment only on the first correct answer of a new calendar day
      const today = new Date().toDateString();
      if (session.lastActivityDate !== today) {
        session.streak++;
        session.lastActivityDate = today;
      }

      session.completedLessons.push(lessonId);
      session.currentLessonIndex++;

      const isLast = session.currentLessonIndex >= session.curriculum.totalLessons;

      // BUG FIX: message was using a dead ternary (isCorrect is always true here)
      const streakMsg = session.consecutiveCorrect >= 3
        ? "🔥 Amazing! You're on a roll!"
        : '✅ Correct! Keep it up!';

      res.json({
        correct:         true,
        xpEarned,
        totalXp:         session.totalXp,
        streak:          session.streak,
        message:         streakMsg,
        explanation:     lesson.question.explanation,
        advancedToNext:  true,
        courseComplete:  isLast,
        nextLessonIndex: session.currentLessonIndex,
        totalLessons:    session.curriculum.totalLessons,
      });
    } else {
      session.consecutiveWrong++;
      session.consecutiveCorrect  = 0;
      session.difficultyModifier  = session.consecutiveWrong >= 2 ? -1 : 0;

      res.json({
        correct:         false,
        xpEarned:        0,
        totalXp:         session.totalXp,
        streak:          session.streak,
        correctAnswer:   correctOption.id,
        explanation:     `Not quite — ${lesson.question.explanation}`,
        simplify:        session.difficultyModifier < 0,
        message:         session.consecutiveWrong >= 2
                           ? '💙 Let\'s revisit this with a simpler approach.'
                           : '🤔 Not quite — let\'s try again!',
        advancedToNext:  false,
        nextLessonIndex: session.currentLessonIndex,
        totalLessons:    session.curriculum.totalLessons,
      });
    }
  } catch (err) {
    console.error('Error in /submit-answer:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /progress?sessionId=xxx
 */
app.get('/progress', (req, res) => {
  try {
    const { sessionId } = req.query;
    if (!sessionId) return res.status(400).json({ error: 'sessionId is required' });

    const session = getSession(sessionId);
    if (!session) return res.status(404).json({ error: 'Session not found' });

    const { curriculum, currentLessonIndex, completedLessons, totalXp, streak, dailyMinutes } = session;
    const progressPercent = Math.round((completedLessons.length / curriculum.totalLessons) * 100);
    const nextLesson = curriculum.lessons[currentLessonIndex];

    res.json({
      topic:           session.topic,
      level:           session.level,
      emoji:           curriculum.emoji,
      dailyMinutes,
      progressPercent,
      completedLessons: completedLessons.length,
      totalLessons:    curriculum.totalLessons,
      totalXp,
      streak,
      currentLessonIndex,
      nextLesson: nextLesson
        ? { id: nextLesson.id, title: nextLesson.title, estimatedMinutes: nextLesson.estimatedMinutes }
        : null,
      isComplete:    currentLessonIndex >= curriculum.totalLessons,
      estimatedDays: curriculum.estimatedDays,
    });
  } catch (err) {
    console.error('Error in /progress:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /explain-differently?sessionId=xxx
 */
app.get('/explain-differently', (req, res) => {
  try {
    const { sessionId } = req.query;
    if (!sessionId) return res.status(400).json({ error: 'sessionId is required' });

    const session = getSession(sessionId);
    if (!session) return res.status(404).json({ error: 'Session not found' });

    const lesson = session.curriculum.lessons[session.currentLessonIndex];
    if (!lesson) return res.status(400).json({ error: 'No current lesson' });

    res.json({
      alternativeExplanation: lesson.alternativeExplanation,
      example:                lesson.example,
      keyTakeaway:            lesson.keyTakeaway,
    });
  } catch (err) {
    console.error('Error in /explain-differently:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /confused?sessionId=xxx
 */
app.get('/confused', (req, res) => {
  try {
    const { sessionId } = req.query;
    if (!sessionId) return res.status(400).json({ error: 'sessionId is required' });

    const session = getSession(sessionId);
    if (!session) return res.status(404).json({ error: 'Session not found' });

    const lesson = session.curriculum.lessons[session.currentLessonIndex];
    if (!lesson) return res.status(400).json({ error: 'No current lesson' });

    session.difficultyModifier = -1;

    res.json({
      simpleExplanation: lesson.simpleExplanation,
      keyTakeaway:       lesson.keyTakeaway,
      hint:              "💡 Focus on one idea at a time. Read slowly — it's okay to take your time.",
      encouragement:     "Every expert was once confused by this exact thing. You're on the right path! 🌱",
    });
  } catch (err) {
    console.error('Error in /confused:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Health Check ──────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', sessions: Object.keys(sessions).length, uptime: process.uptime() });
});

// ── 404 ───────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
});

// ── Global Error Handler ──────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ── Start ─────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🧠 Learning Assistant API  →  http://localhost:${PORT}`);
  console.log('📚 POST /start-learning | GET /next-lesson | POST /submit-answer | GET /progress\n');
});

module.exports = app;
