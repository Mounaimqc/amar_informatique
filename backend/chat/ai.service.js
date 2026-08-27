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

// System Prompt Hybride
const SYSTEM_PROMPT = `Tu es l'assistant virtuel officiel et expert technologique de Amar Informatique, le magasin e-commerce spécialisé en matériel informatique en Algérie.

TES MISSIONS :
1. Aider les clients à trouver le matériel idéal selon leurs besoins et leur budget en DA.
2. Expliquer clairement les technologies (SSD vs HDD, RAM, processeurs, cartes graphiques).
3. Utiliser les outils (Tools) de manière autonome et pertinente.

RÈGLES STRICTES :
1. DONNÉES COMMERCIALES (Prix, Stock, Promotions, Disponibilité) : Tu DOIS obligatoirement appeler les outils Firestore. Ne jamais inventer une donnée non retournée.
2. CONNAISSANCES GÉNÉRALES TECH : Réponds directement sans outil.
3. INFORMATIONS RÉCENTES : Utilise "webSearch".
4. LANGUE : Réponds dans la langue du client (Français, Arabe, Darija algérienne). Ton court et accueillant.`;

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
    return await handleFallbackChat(userMessage, conversationId, detectedLanguage);
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
    recommendedProducts.forEach(p => { if (p.id) uniqueProductsMap.set(p.id, p); });
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
      products: uniqueProducts,
      source: sourceType,
      actions: uniqueProducts.length > 0 ? [{ type: 'view_product', productId: uniqueProducts[0].id }] : []
    };

  } catch (error) {
    console.error("❌ Erreur OpenAI Chat Completions:", error);
    return await handleFallbackChat(userMessage, conversationId, detectedLanguage);
  }
}

async function handleFallbackChat(userMessage, conversationId, language) {
  const msgLower = userMessage.toLowerCase();
  let textReply = "";
  let prods = [];
  let source = "firestore";

  if (msgLower.includes('gamer') || msgLower.includes('gaming') || msgLower.includes('للعاب') || msgLower.includes('الڤايمينغ')) {
    prods = await getProductRecommendations({ usage: 'gaming', budget: 150000 });
    textReply = language === 'ar' || language === 'dz' 
      ? "تفضل أفضل حواسيب الـ Gaming المتوفرة لدينا حالياً مع خصائصها وأسعارها الحقيقية:" 
      : "Voici nos meilleurs PC Portable Gaming disponibles en magasin dans votre budget :";
  } else if (msgLower.includes('imprimante') || msgLower.includes('طابعة') || msgLower.includes('epson')) {
    prods = await searchProducts({ category: 'imprimantes' });
    textReply = language === 'ar' || language === 'dz'
      ? "تفضل الطابعات الأكثر مبيعاً والمتوفرة لدينا حالياً في المحل:"
      : "Voici les modèles d'imprimantes disponibles actuellement dans notre magasin :";
  } else if (msgLower.includes('ssd') || msgLower.includes('hdd')) {
    source = "ai";
    textReply = "💡 **SSD vs HDD** :\n- **SSD (Solid State Drive)** : Ultra-rapide (jusqu'à 10x plus rapide qu'un HDD), silencieux et résistant aux chocs. Idéal pour démarrer Windows en quelques secondes.\n- **HDD (Hard Disk Drive)** : Disque mécanique traditionnel, plus lent mais offre un espace de stockage à bas coût.";
    prods = await searchProducts({ query: 'SSD' });
  } else {
    prods = await searchProducts({ query: '' });
    textReply = language === 'ar' || language === 'dz'
      ? "مرحباً بك في عمار للمعلوماتية 👋 كيف يمكنني مساعدتك اليوم؟ تفضل باختيار أحد المنتجات أو طرح سؤالك."
      : "Bonjour 👋 Bienvenue chez Amar Informatique ! Comment puis-je vous aider aujourd'hui ? N'hésitez pas à me demander un modèle, une comparaison ou des recommandations selon votre budget.";
  }

  saveMessageToConversation(conversationId, 'assistant', textReply);

  return {
    success: true,
    conversationId: conversationId,
    message: textReply,
    language: language,
    products: prods.slice(0, 4),
    source: source,
    actions: prods.length > 0 ? [{ type: 'view_product', productId: prods[0].id }] : []
  };
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
