import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import { handleChatRequest } from './chat/chat.controller.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Configuration CORS permissive pour développement & déploiement
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));

// Body Parser
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate Limiter pour la sécurité des APIs (max 40 requêtes/min par IP)
const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 40,
  message: {
    success: false,
    message: "Trop de requêtes. Veuillez patienter une minute avant d'envoyer un nouveau message."
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Serveur de fichiers statiques (racine du projet frontend)
const rootPath = path.join(__dirname, '..');
app.use(express.static(rootPath));

// ÉTAPE 10 — Endpoint de santé GET /api/health
app.get('/api/health', (req, res) => {
  const isAiConfigured = !!(process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim() !== '' && !process.env.OPENAI_API_KEY.includes('your_openai_api_key'));
  res.json({
    success: true,
    server: 'online',
    aiConfigured: isAiConfigured,
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    timestamp: new Date().toISOString()
  });
});

// ÉTAPE 2 — Endpoint de test rapide sans IA (POST /api/chat-test)
app.post('/api/chat-test', (req, res) => {
  res.json({
    success: true,
    message: "Backend connection works"
  });
});

// Endpoint principal Chatbot IA
app.post('/api/chat', chatLimiter, handleChatRequest);

// Middleware 404
app.use((req, res, next) => {
  if (req.accepts('html')) {
    res.sendFile(path.join(rootPath, 'index.html'));
    return;
  }
  res.status(404).json({ success: false, error: 'Route non trouvée' });
});

app.listen(PORT, () => {
  const isKeyConfigured = !!(process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim() !== '' && !process.env.OPENAI_API_KEY.includes('your_openai_api_key'));
  console.log(`==================================================`);
  console.log(`🚀 Serveur Chatbot Amar Informatique démarré sur http://localhost:${PORT}`);
  console.log(`💬 Endpoint Chat API : POST http://localhost:${PORT}/api/chat`);
  console.log(`🏥 Health Check     : GET  http://localhost:${PORT}/api/health`);
  console.log(`🔑 OpenAI API Key Configured : ${isKeyConfigured}`);
  console.log(`==================================================`);
});
