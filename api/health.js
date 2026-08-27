import dotenv from 'dotenv';
dotenv.config();

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const isAiConfigured = !!(process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim() !== '' && !process.env.OPENAI_API_KEY.includes('your_openai_api_key'));

  return res.status(200).json({
    success: true,
    server: 'online',
    chatApi: 'available',
    aiConfigured: isAiConfigured,
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    timestamp: new Date().toISOString()
  });
}
