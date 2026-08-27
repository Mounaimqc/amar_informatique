import OpenAI from 'openai';
import dotenv from 'dotenv';
import { searchProducts, getProductDetails, checkProductAvailability } from './product-search.service.js';
import { getProductRecommendations, compareProducts } from './recommendation.service.js';
import { webSearch } from './web-search.service.js';
import { getConversationHistory, saveMessageToConversation } from './conversation.service.js';

dotenv.config();

const apiKey = process.env.OPENAI_API_KEY;
const modelName = process.env.OPENAI_MODEL || 'gpt-4o-mini';

let openai = null;
if (apiKey && apiKey.trim() !== '' && !apiKey.includes('your_openai_api_key')) {
  openai = new OpenAI({ apiKey: apiKey });
}

// System Prompt Officiel conforme aux exigences
const SYSTEM_PROMPT = `Tu es Amar AI, l'assistant intelligent de Amar Informatique.

Tu réponds naturellement aux questions générales et techniques.

Pour les informations propres au magasin Amar Informatique, utilise les outils disponibles.

Ne prétends jamais qu'un produit est disponible, en promotion ou à un certain prix sans données réelles retournées par Firestore.

Pour les informations récentes et externes, utilise la recherche Web lorsque nécessaire.

Si un outil échoue ou si une information n'est pas disponible, dis-le clairement.

N'invente jamais une recherche, un produit, un prix, une promotion, une disponibilité ou une information récente.

Réponds dans la langue principale utilisée par le client.

Comprends également :
- Français
- العربية
- Darija algérienne
- Français + Darija
- Arabe + Français`;

const TOOLS_DEFINITIONS = [
  {
    type: 'function',
    function: {
      name: 'searchProducts',
      description: 'Rechercher des produits dans le catalogue réel de Amar Informatique.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Mots clés (ex: Dell i7, Epson)' },
          category: { type: 'string', description: 'Catégorie' },
          minPrice: { type: 'number', description: 'Prix min DA' },
          maxPrice: { type: 'number', description: 'Prix max DA' },
          brand: { type: 'string', description: 'Marque' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'getProductDetails',
      description: 'Obtenir la fiche technique et le prix d un produit par son ID.',
      parameters: {
        type: 'object',
        properties: {
          productId: { type: 'string', description: 'ID du produit' }
        },
        required: ['productId']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'recommendProducts',
      description: 'Recommander des ordinateurs selon l usage (gaming, montage, bureautique) et le budget en DA.',
      parameters: {
        type: 'object',
        properties: {
          usage: { type: 'string', description: 'Usage ciblé' },
          budget: { type: 'number', description: 'Budget max DA' },
          requirements: { type: 'array', items: { type: 'string' } }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'compareProducts',
      description: 'Comparer les caractéristiques et prix de 2 ou plusieurs produits du magasin.',
      parameters: {
        type: 'object',
        properties: {
          productIds: { type: 'array', items: { type: 'string' } }
        },
        required: ['productIds']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'checkAvailability',
      description: 'Vérifier la disponibilité et le stock réel d un produit.',
      parameters: {
        type: 'object',
        properties: {
          productId: { type: 'string', description: 'ID du produit' }
        },
        required: ['productId']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'webSearch',
      description: 'Rechercher des informations externes récentes (actu tech, version Windows, etc.).',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Requête externe' }
        },
        required: ['query']
      }
    }
  }
];

export async function processChatMessage(userMessage, conversationId) {
  saveMessageToConversation(conversationId, 'user', userMessage);

  let detectedLanguage = detectLanguage(userMessage);
  let recommendedProducts = [];
  let sources = { firestore: false, web: false, ai: false };

  if (!openai) {
    console.error("OpenAI status: 401 - OPENAI_KEY missing or invalid");
    console.error("OpenAI error body: Clé API OpenAI non configurée ou invalide dans les variables d'environnement.");
    const err = new Error("Le service IA est temporairement indisponible.");
    err.status = 500;
    err.code = "OPENAI_KEY_MISSING";
    throw err;
  }

  try {
    const history = getConversationHistory(conversationId);
    
    const messagesPayload = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...history
    ];

    let response = await openai.chat.completions.create({
      model: modelName,
      messages: messagesPayload,
      tools: TOOLS_DEFINITIONS,
      tool_choice: 'auto',
      temperature: 0.3
    });

    let responseMessage = response.choices[0].message;

    while (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
      messagesPayload.push(responseMessage);

      for (const toolCall of responseMessage.tool_calls) {
        const functionName = toolCall.function.name;
        const functionArgs = JSON.parse(toolCall.function.arguments || '{}');
        let functionResult = null;

        console.log(`🤖 [Agent IA Tool Call] ${functionName}:`, functionArgs);

        if (functionName === 'searchProducts') {
          sources.firestore = true;
          functionResult = await searchProducts(functionArgs);
          if (Array.isArray(functionResult)) recommendedProducts.push(...functionResult);

        } else if (functionName === 'getProductDetails') {
          sources.firestore = true;
          functionResult = await getProductDetails(functionArgs);
          if (functionResult && !functionResult.error) recommendedProducts.push(functionResult);

        } else if (functionName === 'recommendProducts') {
          sources.firestore = true;
          functionResult = await getProductRecommendations(functionArgs);
          if (Array.isArray(functionResult)) recommendedProducts.push(...functionResult);

        } else if (functionName === 'compareProducts') {
          sources.firestore = true;
          functionResult = await compareProducts(functionArgs);
          if (functionResult && functionResult.products) recommendedProducts.push(...functionResult.products);

        } else if (functionName === 'checkAvailability') {
          sources.firestore = true;
          functionResult = await checkProductAvailability(functionArgs);

        } else if (functionName === 'webSearch') {
          sources.web = true;
          functionResult = await webSearch(functionArgs);
        }

        messagesPayload.push({
          tool_call_id: toolCall.id,
          role: 'tool',
          name: functionName,
          content: JSON.stringify(functionResult || {})
        });
      }

      response = await openai.chat.completions.create({
        model: modelName,
        messages: messagesPayload
      });

      responseMessage = response.choices[0].message;
    }

    if (!sources.firestore && !sources.web) sources.ai = true;

    const finalReply = responseMessage.content || "Je reste à votre entière disposition pour tout renseignement.";

    const uniqueProductsMap = new Map();
    recommendedProducts.forEach(p => { if (p && p.id) uniqueProductsMap.set(p.id, p); });
    const uniqueProducts = Array.from(uniqueProductsMap.values());

    saveMessageToConversation(conversationId, 'assistant', finalReply);

    let sourceType = 'ai';
    if (sources.firestore && sources.web) sourceType = 'hybrid';
    else if (sources.firestore) sourceType = 'firestore';
    else if (sources.web) sourceType = 'web';

    return {
      success: true,
      conversationId: conversationId,
      message: finalReply,
      language: detectedLanguage,
      products: uniqueProducts.slice(0, 4),
      source: sourceType,
      actions: uniqueProducts.length > 0 ? [{ type: 'view_product', productId: uniqueProducts[0].id }] : []
    };

  } catch (error) {
    console.error("OpenAI status:", error.status || error.statusCode || 500);
    console.error("OpenAI error body:", error.message || error);
    const err = new Error("Le service IA est temporairement indisponible.");
    err.status = error.status || error.statusCode || 500;
    err.code = "CHAT_PROCESSING_FAILED";
    throw err;
  }
}

function detectLanguage(text) {
  if (/[\u0600-\u06FF]/.test(text)) {
    if (text.includes('بيسي') || text.includes('كاين') || text.includes('خصني') || text.includes('شحال') || text.includes('مليون')) {
      return 'dz';
    }
    return 'ar';
  }
  return 'fr';
}
