const { createSession, setCors } = require('./_lib/store');

module.exports = async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

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

    res.status(200).json({
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
    console.error('/start-learning error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
