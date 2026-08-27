import dotenv from 'dotenv';
import { processChatMessage } from '../backend/chat/ai.service.js';
import { getOrCreateConversation } from '../backend/chat/conversation.service.js';

dotenv.config();

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return res.status(200).json({
      success: true,
      message: "Backend Chat API is ready. Send a POST request with { message } to interact."
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: { code: 'METHOD_NOT_ALLOWED', message: 'Méthode non autorisée. Utilisez POST.' } });
  }

  // ÉTAPE 2 — Logs Vercel Serverless
  console.log("========================================");
  console.log("Chat API invoked");
  console.log("Request method:", req.method);
  console.log("Message exists:", Boolean(req.body?.message));
  console.log("OpenAI API key configured:", Boolean(process.env.OPENAI_API_KEY));
  console.log("OpenAI model:", process.env.OPENAI_MODEL || 'gpt-4o-mini');

  try {
    // ÉTAPE 9 — Format req.body et conversationId: null
    const message = typeof req.body?.message === 'string' ? req.body.message.trim() : '';
    const conversationId = typeof req.body?.conversationId === 'string' ? req.body.conversationId.trim() : null;

    if (!message) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_INPUT",
          message: "Le champ 'message' est obligatoire et doit être une chaîne non vide."
        }
      });
    }

    if (message.length > 1000) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INPUT_TOO_LONG",
          message: "Le message dépasse la longueur maximale autorisée (1000 caractères)."
        }
      });
    }

    const session = getOrCreateConversation(conversationId);
    const result = await processChatMessage(message, session.id);

    return res.status(200).json(result);

  } catch (error) {
    // ÉTAPE 2 — Logs d'erreur fatale serveur
    console.error("FATAL CHAT API ERROR");
    console.error("Name:", error?.name || "Error");
    console.error("Message:", error?.message || "Unknown error");
    console.error("Stack:", error?.stack || "No stack trace available");

    return res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: error?.message || "Erreur serveur interne"
      }
    });
  }
}
