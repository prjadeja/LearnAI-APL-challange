const { getSession, getAdaptedLesson, setCors } = require('./_lib/store');

module.exports = async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { sessionId } = req.query;
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

    res.status(200).json({ lesson, completed: false });
  } catch (err) {
    console.error('/next-lesson error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
