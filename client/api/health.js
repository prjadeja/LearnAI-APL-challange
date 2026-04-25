const { setCors } = require('./_lib/store');

module.exports = async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  res.status(200).json({ status: 'ok', runtime: 'vercel-serverless' });
};
