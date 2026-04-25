const { getSession, setCors } = require('./_lib/store');

module.exports = async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

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
      session.consecutiveWrong   = 0;
      session.difficultyModifier = session.consecutiveCorrect >= 2 ? 1 : 0;

      const baseXp   = lesson.xpReward;
      const bonusXp  = session.difficultyModifier > 0 ? 5 : 0;
      const xpEarned = baseXp + bonusXp;
      session.totalXp += xpEarned;

      const today = new Date().toDateString();
      if (session.lastActivityDate !== today) {
        session.streak++;
        session.lastActivityDate = today;
      }

      session.completedLessons.push(lessonId);
      session.currentLessonIndex++;

      const isLast = session.currentLessonIndex >= session.curriculum.totalLessons;
      const message = session.consecutiveCorrect >= 3
        ? "🔥 Amazing! You're on a roll!"
        : '✅ Correct! Keep it up!';

      return res.status(200).json({
        correct:         true,
        xpEarned,
        totalXp:         session.totalXp,
        streak:          session.streak,
        message,
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

      return res.status(200).json({
        correct:         false,
        xpEarned:        0,
        totalXp:         session.totalXp,
        streak:          session.streak,
        correctAnswer:   correctOption.id,
        explanation:     `Not quite — ${lesson.question.explanation}`,
        simplify:        session.difficultyModifier < 0,
        message:         session.consecutiveWrong >= 2
                           ? "💙 Let's revisit this with a simpler approach."
                           : "🤔 Not quite — let's try again!",
        advancedToNext:  false,
        nextLessonIndex: session.currentLessonIndex,
        totalLessons:    session.curriculum.totalLessons,
      });
    }
  } catch (err) {
    console.error('/submit-answer error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
