import { processChatMessage } from './ai.service.js';
import { getOrCreateConversation } from './conversation.service.js';

export async function handleChatRequest(req, res) {
  try {
    const { message, conversationId } = req.body || {};

    // 1. Validation de la requête
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

    // 2. Gestion de la session de conversation
    const session = getOrCreateConversation(conversationId);

    console.log(`💬 [POST /api/chat] [Session ${session.id}] Client: "${message.substring(0, 60)}..."`);

    // 3. Traitement IA & Tools
    const result = await processChatMessage(message.trim(), session.id);

    return res.status(200).json(result);

  } catch (error) {
    console.error("❌ Erreur serveur /api/chat:", error);
    return res.status(500).json({
      success: false,
      conversationId: req.body?.conversationId || null,
      message: "Désolé, une erreur temporaire est survenue. Veuillez réessayer dans un instant.",
      products: [],
      actions: []
    });
  }
}
