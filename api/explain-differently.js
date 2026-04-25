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

    res.status(200).json({
      alternativeExplanation: lesson.alternativeExplanation,
      example:                lesson.example,
      keyTakeaway:            lesson.keyTakeaway,
    });
  } catch (err) {
    console.error('/explain-differently error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
