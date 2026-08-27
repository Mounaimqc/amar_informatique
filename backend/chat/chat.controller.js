import { processChatMessage } from './ai.service.js';
import { getOrCreateConversation } from './conversation.service.js';

export async function handleChatRequest(req, res) {
  try {
    console.log("========================================");
    console.log("💬 Chatbot API called");

    const { message, conversationId } = req.body || {};
    console.log("Message received:", message);

    if (!message || typeof message !== 'string' || message.trim() === '') {
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
          code: "MESSAGE_TOO_LONG",
          message: "Le message dépasse la longueur maximale autorisée (1000 caractères)."
        }
      });
    }

    const session = getOrCreateConversation(conversationId);
    const result = await processChatMessage(message.trim(), session.id);

    return res.status(200).json(result);

  } catch (error) {
    console.error("❌ Controller Error:", error.message || error);
    const statusCode = error.status || error.statusCode || 500;
    
    return res.status(statusCode).json({
      success: false,
      error: {
        code: error.code || "CHAT_PROCESSING_FAILED",
        message: "Le service IA est temporairement indisponible."
      }
    });
  }
}
