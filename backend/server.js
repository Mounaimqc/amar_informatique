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

// Middleware CORS
app.use(cors());

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

// Endpoint de santé
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'Amar Informatique Chatbot API', timestamp: new Date().toISOString() });
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
  console.log(`==================================================`);
  console.log(`🚀 Serveur Chatbot Amar Informatique démarré sur http://localhost:${PORT}`);
  console.log(`💬 Endpoint Chat API: POST http://localhost:${PORT}/api/chat`);
  console.log(`==================================================`);
});
