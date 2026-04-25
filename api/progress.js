const { getSession, setCors } = require('./_lib/store');

module.exports = async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { sessionId } = req.query;
    if (!sessionId) return res.status(400).json({ error: 'sessionId is required' });

    const session = getSession(sessionId);
    if (!session) return res.status(404).json({ error: 'Session not found' });

    const { curriculum, currentLessonIndex, completedLessons, totalXp, streak, dailyMinutes } = session;
    const progressPercent = Math.round((completedLessons.length / curriculum.totalLessons) * 100);
    const nextLesson = curriculum.lessons[currentLessonIndex];

    res.status(200).json({
      topic:            session.topic,
      level:            session.level,
      emoji:            curriculum.emoji,
      dailyMinutes,
      progressPercent,
      completedLessons: completedLessons.length,
      totalLessons:     curriculum.totalLessons,
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
    console.error('/progress error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
