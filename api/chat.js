import dotenv from 'dotenv';
import { processChatMessage } from '../backend/chat/ai.service.js';
import { getOrCreateConversation } from '../backend/chat/conversation.service.js';

dotenv.config();

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'GET') {
    return res.status(200).json({
      success: true,
      message: "Backend Chat API is ready. Send a POST request with { message } to interact."
    });
  }

  if (req.method !== 'POST') {
    return res.status(455 || 405).json({ success: false, error: 'Méthode non autorisée. Utilisez POST.' });
  }

  try {
    const { message, conversationId } = req.body || {};

    console.log("========================================");
    console.log("💬 Serverless /api/chat called");
    console.log("Message received:", message);

    if (!message || typeof message !== 'string' || message.trim() === '') {
      return res.status(400).json({
        success: false,
        error: "Le champ 'message' est obligatoire et doit être une chaîne non vide."
      });
    }

    if (message.length > 1000) {
      return res.status(400).json({
        success: false,
        error: "Le message dépasse la longueur maximale autorisée (1000 caractères)."
      });
    }

    const session = getOrCreateConversation(conversationId);
    const result = await processChatMessage(message.trim(), session.id);

    return res.status(200).json(result);

  } catch (error) {
    console.error("❌ AI Serverless Error:", error);
    return res.status(error.status || 500).json({
      success: false,
      error: error.message || "Erreur interne du serveur API Chat.",
      message: "Désolé, une erreur est survenue lors du traitement de votre demande.",
      products: [],
      actions: []
    });
  }
}
