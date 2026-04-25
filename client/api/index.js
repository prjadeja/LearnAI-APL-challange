const { v4: uuidv4 } = require('uuid');
const { generateCurriculum } = require('./_lib/curriculum');

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
    difficultyModifier: 0,
    history: [],
  };

  return sessions[id];
}

// ── Adaptive Logic ────────────────────────────────────────────
function getAdaptedLesson(session) {
  const lesson = session.curriculum.lessons[session.currentLessonIndex];
  if (!lesson) return null;

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

// ── Vercel Handler ────────────────────────────────────────────
module.exports = async function handler(req, res) {
  // Setup CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const pathname = url.pathname;

    // Helper to extract query
    const getQuery = (key) => url.searchParams.get(key);

    if (pathname === '/api/start-learning' && req.method === 'POST') {
      const { topic, level, dailyMinutes } = req.body || {};
      if (!topic || typeof topic !== 'string' || topic.trim().length === 0) {
        return res.status(400).json({ error: 'topic is required and must be a non-empty string' });
      }
      const trimmedTopic = topic.trim();
      const session = createSession(trimmedTopic, level, Number(dailyMinutes));

      return res.status(200).json({
        sessionId:     session.id,
        topic:         session.topic,
        level:         session.level,
        dailyMinutes:  session.dailyMinutes,
        totalLessons:  session.curriculum.totalLessons,
        estimatedDays: session.curriculum.estimatedDays,
        emoji:         session.curriculum.emoji,
        message:       `🎯 Your personalized ${level} curriculum for "${trimmedTopic}" is ready!`,
      });
    }

    if (pathname === '/api/next-lesson' && req.method === 'GET') {
      const sessionId = getQuery('sessionId');
      if (!sessionId) return res.status(400).json({ error: 'sessionId query param is required' });

      const session = getSession(sessionId);
      if (!session) return res.status(404).json({ error: 'Session not found. Start a new session.' });

      const lesson = getAdaptedLesson(session);
      if (!lesson) {
        return res.status(200).json({
          completed: true,
          message:   "🎉 Congratulations! You've completed all lessons!",
          totalXp:   session.totalXp,
          streak:    session.streak,
        });
      }

      return res.status(200).json({ lesson, completed: false });
    }

    if (pathname === '/api/submit-answer' && req.method === 'POST') {
      const { sessionId, lessonId, answerId } = req.body || {};
      const session = getSession(sessionId);
      if (!session) return res.status(404).json({ error: 'Session not found' });

      const lesson = session.curriculum.lessons[session.currentLessonIndex];
      if (!lesson) return res.status(400).json({ error: 'No lesson found' });

      const correctOption  = lesson.question.options.find((o) => o.correct);
      const selectedOption = lesson.question.options.find((o) => o.id === answerId);
      if (!selectedOption) return res.status(400).json({ error: 'Invalid answerId' });

      const isCorrect = selectedOption.correct;
      
      if (isCorrect) {
        session.consecutiveCorrect++;
        session.consecutiveWrong    = 0;
        session.difficultyModifier  = session.consecutiveCorrect >= 2 ? 1 : 0;

        session.totalXp += lesson.xpReward + (session.difficultyModifier > 0 ? 5 : 0);
        
        const today = new Date().toDateString();
        if (session.lastActivityDate !== today) {
          session.streak++;
          session.lastActivityDate = today;
        }

        session.completedLessons.push(lessonId);
        session.currentLessonIndex++;

        const isLast = session.currentLessonIndex >= session.curriculum.totalLessons;
        const streakMsg = session.consecutiveCorrect >= 3
          ? "🔥 Amazing! You're on a roll!"
          : '✅ Correct! Keep it up!';

        return res.status(200).json({
          correct: true,
          xpEarned: lesson.xpReward + (session.difficultyModifier > 0 ? 5 : 0),
          totalXp: session.totalXp,
          streak: session.streak,
          message: streakMsg,
          explanation: lesson.question.explanation,
          advancedToNext: true,
          courseComplete: isLast,
          nextLessonIndex: session.currentLessonIndex,
          totalLessons: session.curriculum.totalLessons,
        });
      } else {
        session.consecutiveWrong++;
        session.consecutiveCorrect  = 0;
        session.difficultyModifier  = session.consecutiveWrong >= 2 ? -1 : 0;

        return res.status(200).json({
          correct: false,
          xpEarned: 0,
          totalXp: session.totalXp,
          streak: session.streak,
          correctAnswer: correctOption.id,
          explanation: `Not quite — ${lesson.question.explanation}`,
          simplify: session.difficultyModifier < 0,
          message: session.consecutiveWrong >= 2
            ? '💙 Let\'s revisit this with a simpler approach.'
            : '🤔 Not quite — let\'s try again!',
          advancedToNext: false,
          nextLessonIndex: session.currentLessonIndex,
          totalLessons: session.curriculum.totalLessons,
        });
      }
    }

    if (pathname === '/api/progress' && req.method === 'GET') {
      const sessionId = getQuery('sessionId');
      const session = getSession(sessionId);
      if (!session) return res.status(404).json({ error: 'Session not found' });

      const { curriculum, currentLessonIndex, completedLessons, totalXp, streak, dailyMinutes } = session;
      const progressPercent = Math.round((completedLessons.length / curriculum.totalLessons) * 100);
      const nextLesson = curriculum.lessons[currentLessonIndex];

      return res.status(200).json({
        topic: session.topic,
        level: session.level,
        emoji: curriculum.emoji,
        dailyMinutes,
        progressPercent,
        completedLessons: completedLessons.length,
        totalLessons: curriculum.totalLessons,
        totalXp,
        streak,
        currentLessonIndex,
        nextLesson: nextLesson ? { id: nextLesson.id, title: nextLesson.title, estimatedMinutes: nextLesson.estimatedMinutes } : null,
        isComplete: currentLessonIndex >= curriculum.totalLessons,
        estimatedDays: curriculum.estimatedDays,
      });
    }

    if (pathname === '/api/explain-differently' && req.method === 'GET') {
      const session = getSession(getQuery('sessionId'));
      if (!session) return res.status(404).json({ error: 'Session not found' });
      const lesson = session.curriculum.lessons[session.currentLessonIndex];
      return res.status(200).json({
        alternativeExplanation: lesson.alternativeExplanation,
        example: lesson.example,
        keyTakeaway: lesson.keyTakeaway,
      });
    }

    if (pathname === '/api/confused' && req.method === 'GET') {
      const session = getSession(getQuery('sessionId'));
      if (!session) return res.status(404).json({ error: 'Session not found' });
      const lesson = session.curriculum.lessons[session.currentLessonIndex];
      session.difficultyModifier = -1;
      return res.status(200).json({
        simpleExplanation: lesson.simpleExplanation,
        keyTakeaway: lesson.keyTakeaway,
        hint: "💡 Focus on one idea at a time. Read slowly — it's okay to take your time.",
        encouragement: "Every expert was once confused by this exact thing. You're on the right path! 🌱",
      });
    }

    // Fallback 404
    return res.status(404).json({ error: 'Route not found', pathname, method: req.method });

  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ error: 'Internal server error', details: err.message });
  }
};
