/**
 * API client — all calls go through Vite proxy /api → http://localhost:3013
 */

const BASE = '/api';

async function request(method, path, body = null) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body) opts.body = JSON.stringify(body);

  const res  = await fetch(BASE + path, opts);
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || `HTTP ${res.status}`);
  }
  return data;
}

export const api = {
  startLearning: (topic, level, dailyMinutes) =>
    request('POST', '/start-learning', { topic, level, dailyMinutes }),

  getNextLesson: (sessionId) =>
    request('GET', `/next-lesson?sessionId=${encodeURIComponent(sessionId)}`),

  submitAnswer: (sessionId, lessonId, answerId) =>
    request('POST', '/submit-answer', { sessionId, lessonId, answerId }),

  getProgress: (sessionId) =>
    request('GET', `/progress?sessionId=${encodeURIComponent(sessionId)}`),

  explainDifferently: (sessionId) =>
    request('GET', `/explain-differently?sessionId=${encodeURIComponent(sessionId)}`),

  imConfused: (sessionId) =>
    request('GET', `/confused?sessionId=${encodeURIComponent(sessionId)}`),
};
