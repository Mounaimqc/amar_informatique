import { processChatMessage } from './ai.service.js';
import { getOrCreateConversation } from './conversation.service.js';

export async function handleChatRequest(req, res) {
  try {
    // ÉTAPE 3 — Logs d'entrée de requête
    console.log("========================================");
    console.log("💬 Chatbot API called");

    const { message, conversationId } = req.body || {};
    console.log("Message received:", message);

    // ÉTAPE 4 — Vérification de la configuration de la clé API
    const isApiKeyConfigured = !!(process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim() !== '' && !process.env.OPENAI_API_KEY.includes('your_openai_api_key'));
    console.log("OpenAI API key configured:", isApiKeyConfigured);

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

    // 3. Traitement IA & Tools avec gestion des erreurs fine
    const result = await processChatMessage(message.trim(), session.id);

    return res.status(200).json(result);

  } catch (error) {
    console.error("❌ AI ERROR in Controller:", error);
    console.error("Error message:", error.message);
    console.error("Error status:", error.status || error.statusCode);
    if (error.response?.data) {
      console.error("Error response data:", error.response.data);
    }

    const statusCode = error.status || error.statusCode || 500;
    
    return res.status(statusCode).json({
      success: false,
      conversationId: req.body?.conversationId || null,
      error: error.message || "Erreur interne du serveur IA.",
      message: "Une erreur est survenue lors du traitement de votre demande.",
      products: [],
      actions: []
    });
  }
}
