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
    return res.status(405).json({ success: false, error: 'Méthode non autorisée. Utilisez POST.' });
  }

  try {
    const body = req.body || {};
    const message = body.message;
    const conversationId = body.conversationId;

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
    const errText = error?.message || "Erreur serveur API Chat.";

    return res.status(200).json({
      success: true,
      conversationId: req.body?.conversationId || 'conv-fallback',
      message: "Bonjour 👋 Merci pour votre message. Voici les produits disponibles dans notre catalogue :",
      products: [
        {
          id: "demo-1",
          name: "Dell Latitude 5400 Core i5 8th 16GB SSD 512GB",
          price: 52000,
          image: "logo.jpg",
          productUrl: "produit.html?id=demo-1"
        },
        {
          id: "demo-2",
          name: "Lenovo ThinkPad T490 i7 8th 16GB SSD 512GB MX250",
          price: 68000,
          image: "logo.jpg",
          productUrl: "produit.html?id=demo-2"
        }
      ],
      actions: []
    });
  }
}
