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

    const lesson = session.curriculum.lessons[session.currentLessonIndex];
    if (!lesson) return res.status(400).json({ error: 'No current lesson' });

    session.difficultyModifier = -1;

    res.status(200).json({
      simpleExplanation: lesson.simpleExplanation,
      keyTakeaway:       lesson.keyTakeaway,
      hint:              "💡 Focus on one idea at a time. Read slowly — it's okay to take your time.",
      encouragement:     "Every expert was once confused by this exact thing. You're on the right path! 🌱",
    });
  } catch (err) {
    console.error('/confused error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
