import dotenv from 'dotenv';
dotenv.config();

const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'amar-informatique';
// Mémoire in-memory des sessions de conversation pour la gestion du contexte
const conversationSessions = new Map();

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

// Définitions des 6 Tools pour OpenAI Function Calling
const TOOLS_DEFINITIONS = [
  {
    type: 'function',
    function: {
      name: 'searchProducts',
      description: 'Rechercher des produits dans le catalogue réel de Amar Informatique.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Mots clés de recherche (ex: Dell i7, Epson, SSD 512)' },
          category: { type: 'string', description: 'Catégorie (laptop, imprimantes, accessoires)' },
          minPrice: { type: 'number', description: 'Prix minimum en DA' },
          maxPrice: { type: 'number', description: 'Prix maximum en DA' },
          brand: { type: 'string', description: 'Marque (Dell, HP, Lenovo, Epson, Asus)' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'getProductDetails',
      description: 'Obtenir la fiche technique et le prix d un produit spécifique par son ID.',
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
      description: 'Recommander des ordinateurs selon l usage (gaming, montage, bureautique, etudiant) et le budget en DA.',
      parameters: {
        type: 'object',
        properties: {
          usage: { type: 'string', description: 'Usage cible (gaming, montage, bureautique, autocad)' },
          budget: { type: 'number', description: 'Budget maximum en DA' },
          requirements: {
            type: 'array',
            items: { type: 'string' },
            description: 'Exigences spécifiques (ex: RTX, 16GB, SSD)'
          }
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
          productIds: {
            type: 'array',
            items: { type: 'string' },
            description: 'IDs des produits à comparer'
          }
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
      description: 'Rechercher des informations externes récentes (specs processeurs récents, actus tech, version Windows). NE PAS utiliser pour le prix ou stock du site.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Requête de recherche externe' }
        },
        required: ['query']
      }
    }
  }
];

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
    return res.status(200).json({ success: true, message: "Backend Chat API Agent is online." });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: { code: 'METHOD_NOT_ALLOWED', message: 'Méthode non autorisée.' } });
  }

  try {
    const body = req.body || {};
    const userMessage = typeof body.message === 'string' ? body.message.trim() : '';
    const conversationId = typeof body.conversationId === 'string' ? body.conversationId.trim() : `conv-${Date.now()}`;

    if (!userMessage) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_INPUT', message: "Le message est obligatoire." } });
    }

    const OPENAI_KEY = process.env.OPENAI_API_KEY;
    const MODEL_NAME = process.env.OPENAI_MODEL || 'gpt-4o-mini';

    if (!OPENAI_KEY || OPENAI_KEY.trim() === '' || OPENAI_KEY.includes('your_openai_api_key')) {
      console.error("OpenAI status: 401 - OPENAI_KEY missing or invalid");
      console.error("OpenAI error body: Clé API OpenAI non configurée ou invalide dans les variables d'environnement.");
      return res.status(500).json({
        success: false,
        error: {
          code: "CHAT_PROCESSING_FAILED",
          message: "Le service IA est temporairement indisponible."
        }
      });
    }

    // Gestion de la session de conversation et de l'historique récent
    const history = getSessionHistory(conversationId);
    saveMessageToSession(conversationId, 'user', userMessage);

    // Chargement de tous les produits réels depuis Firestore
    const allProducts = await fetchFirestoreProducts();

    let sourcesUsed = { firestore: false, web: false, ai: false };
    let recommendedProducts = [];

    const messagesPayload = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...history,
      { role: 'user', content: userMessage }
    ];

    let openAiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_KEY.trim()}`
      },
      body: JSON.stringify({
        model: MODEL_NAME,
        messages: messagesPayload,
        tools: TOOLS_DEFINITIONS,
        tool_choice: 'auto',
        temperature: 0.3
      })
    });

    if (!openAiRes.ok) {
      const errorBody = await openAiRes.text();
      console.error("OpenAI status:", openAiRes.status);
      console.error("OpenAI error body:", errorBody);

      let statusCode = openAiRes.status || 500;
      let errorCode = "CHAT_PROCESSING_FAILED";
      if (openAiRes.status === 401) errorCode = "UNAUTHORIZED";
      else if (openAiRes.status === 429) errorCode = "RATE_LIMIT";
      else if (openAiRes.status === 400) errorCode = "BAD_REQUEST";

      return res.status(statusCode).json({
        success: false,
        error: {
          code: errorCode,
          message: "Le service IA est temporairement indisponible."
        }
      });
    }

    let openAiData = await openAiRes.json();
    let responseMessage = openAiData.choices?.[0]?.message;

    // Boucle d'exécution des outils appelés dynamiquement par l'IA
    while (responseMessage && responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
      messagesPayload.push(responseMessage);

      for (const toolCall of responseMessage.tool_calls) {
        const funcName = toolCall.function.name;
        const funcArgs = JSON.parse(toolCall.function.arguments || '{}');
        let toolOutput = null;

        console.log(`🤖 [Agent IA Tool Call] ${funcName}:`, funcArgs);

        if (funcName === 'searchProducts') {
          sourcesUsed.firestore = true;
          toolOutput = executeSearchProducts(allProducts, funcArgs);
          if (Array.isArray(toolOutput)) recommendedProducts.push(...toolOutput);

        } else if (funcName === 'getProductDetails') {
          sourcesUsed.firestore = true;
          toolOutput = executeGetProductDetails(allProducts, funcArgs.productId);
          if (toolOutput && !toolOutput.error) recommendedProducts.push(toolOutput);

        } else if (funcName === 'recommendProducts') {
          sourcesUsed.firestore = true;
          toolOutput = executeRecommendProducts(allProducts, funcArgs);
          if (Array.isArray(toolOutput)) recommendedProducts.push(...toolOutput);

        } else if (funcName === 'compareProducts') {
          sourcesUsed.firestore = true;
          toolOutput = executeCompareProducts(allProducts, funcArgs.productIds);
          if (toolOutput && toolOutput.products) recommendedProducts.push(...toolOutput.products);

        } else if (funcName === 'checkAvailability') {
          sourcesUsed.firestore = true;
          toolOutput = executeCheckAvailability(allProducts, funcArgs.productId);

        } else if (funcName === 'webSearch') {
          sourcesUsed.web = true;
          toolOutput = await executeWebSearch(funcArgs.query);
        }

        messagesPayload.push({
          tool_call_id: toolCall.id,
          role: 'tool',
          name: funcName,
          content: JSON.stringify(toolOutput || {})
        });
      }

      // Ré-interrogation de l'IA avec les données des outils
      openAiRes = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_KEY.trim()}`
        },
        body: JSON.stringify({
          model: MODEL_NAME,
          messages: messagesPayload
        })
      });

      if (!openAiRes.ok) {
        const errorBody = await openAiRes.text();
        console.error("OpenAI status:", openAiRes.status);
        console.error("OpenAI error body:", errorBody);
        return res.status(openAiRes.status || 500).json({
          success: false,
          error: {
            code: "CHAT_PROCESSING_FAILED",
            message: "Le service IA est temporairement indisponible."
          }
        });
      }

      openAiData = await openAiRes.json();
      responseMessage = openAiData.choices?.[0]?.message;
    }

    if (responseMessage && responseMessage.content) {
      if (!sourcesUsed.firestore && !sourcesUsed.web) sourcesUsed.ai = true;

      const finalReply = responseMessage.content;
      saveMessageToSession(conversationId, 'assistant', finalReply);

      const sourceResult = determineSourceType(sourcesUsed);
      const deduplicatedProducts = deduplicateProducts(recommendedProducts);

      return res.status(200).json({
        success: true,
        conversationId: conversationId,
        message: finalReply,
        products: deduplicatedProducts.slice(0, 4),
        source: sourceResult,
        language: detectLanguage(userMessage)
      });
    }

    return res.status(500).json({
      success: false,
      error: {
        code: "CHAT_PROCESSING_FAILED",
        message: "Le service IA est temporairement indisponible."
      }
    });

  } catch (error) {
    console.error("❌ Erreur serveur /api/chat:", error);
    return res.status(500).json({
      success: false,
      error: {
        code: "CHAT_PROCESSING_FAILED",
        message: "Le service IA est temporairement indisponible."
      }
    });
  }
}

/**
 * IMPLÉMENTATION DES OUTILS (TOOLS) - FIRESTORE TOKENISÉ & RECHERCHE RÉELLE
 */

function executeSearchProducts(allProducts, args) {
  const query = args.query || '';
  const cat = normalizeString(args.category || '');
  const brand = normalizeString(args.brand || '');
  const maxP = args.maxPrice || null;
  const minP = args.minPrice || null;

  const queryNorm = normalizeString(query);
  const tokens = queryNorm.split(/\s+/).filter(t => t.length > 0);

  const scored = [];

  for (const p of allProducts) {
    if (maxP && p.price > maxP) continue;
    if (minP && p.price < minP) continue;

    const catN = normalizeString(p.category || '');
    const brandN = normalizeString(p.brand || p.name || '');

    if (cat && !catN.includes(cat)) continue;
    if (brand && !brandN.includes(brand)) continue;

    if (tokens.length === 0) {
      scored.push({ product: p, score: 1 });
      continue;
    }

    const nameN = normalizeString(p.name || '');
    const descN = normalizeString(p.description || '');
    const modelN = normalizeString(p.model || '');
    const refN = normalizeString(p.reference || '');

    let score = 0;
    for (const token of tokens) {
      if (nameN.includes(token)) score += 4;
      if (modelN.includes(token)) score += 4;
      if (refN.includes(token)) score += 4;
      if (brandN.includes(token)) score += 3;
      if (catN.includes(token)) score += 2;
      if (descN.includes(token)) score += 1;
    }

    if (score > 0) {
      scored.push({ product: p, score });
    }
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.map(item => item.product);
}

function executeGetProductDetails(allProducts, productId) {
  const queryNorm = normalizeString(productId);
  const found = allProducts.find(p => p.id === productId || normalizeString(p.name).includes(queryNorm));
  if (found) {
    return {
      id: found.id,
      name: found.name,
      price: found.price,
      oldPrice: found.oldPrice ?? null,
      promo: found.promo ?? null,
      stock: found.stock !== undefined ? found.stock : null,
      available: found.available !== undefined ? found.available : null,
      category: found.category ?? null,
      description: found.description ?? null,
      warranty: found.warranty !== undefined ? found.warranty : null
    };
  }
  return { error: "Produit non trouvé" };
}

function executeRecommendProducts(allProducts, args) {
  const usage = normalizeString(args.usage || '');
  const budget = args.budget || null;

  return allProducts.filter(p => {
    const nameN = normalizeString(p.name);
    const descN = normalizeString(p.description);

    if (budget && p.price > budget * 1.15) return false;

    if (usage.includes('gaming') || usage.includes('jeu')) {
      return descN.includes('rtx') || descN.includes('gtx') || descN.includes('mx') || descN.includes('i7') || nameN.includes('gamer');
    }
    if (usage.includes('montage') || usage.includes('autocad') || usage.includes('3d')) {
      return descN.includes('workstation') || descN.includes('quadro') || descN.includes('i7') || descN.includes('32gb');
    }
    if (usage.includes('bureautique') || usage.includes('etudiant')) {
      return p.price <= 70000;
    }
    return true;
  });
}

function executeCompareProducts(allProducts, productIds) {
  if (!Array.isArray(productIds)) return { error: "IDs invalides" };
  const prods = allProducts.filter(p => productIds.includes(p.id) || productIds.some(id => normalizeString(p.name).includes(normalizeString(id))));
  return {
    products: prods,
    comparison: prods.map(p => ({ id: p.id, name: p.name, price: p.price, specs: p.description }))
  };
}

function executeCheckAvailability(allProducts, productId) {
  const queryNorm = normalizeString(productId);
  const found = allProducts.find(p => p.id === productId || normalizeString(p.name).includes(queryNorm));
  if (found) {
    const isAvail = found.available !== undefined ? found.available : (found.stock !== undefined ? found.stock : null);
    return {
      available: isAvail,
      stock: found.stock !== undefined ? found.stock : null,
      price: found.price,
      productName: found.name
    };
  }
  return { available: false, stock: null };
}

async function executeWebSearch(query) {
  try {
    const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      if (data.AbstractText) {
        return { snippet: data.AbstractText, source: data.AbstractURL || 'Web' };
      }
      if (data.RelatedTopics && data.RelatedTopics.length > 0) {
        const topics = data.RelatedTopics.slice(0, 3).map(t => t.Text).filter(Boolean);
        if (topics.length > 0) {
          return { snippet: topics.join(' \n ') };
        }
      }
    }
  } catch (e) {
    console.warn("⚠️ Web Search Warning:", e.message);
  }
  return { success: false, error: "WEB_SEARCH_UNAVAILABLE" };
}

/**
 * GESTION DU CONTEXTE DE SESSION (conversationId)
 */
function getSessionHistory(id) {
  if (!conversationSessions.has(id)) {
    conversationSessions.set(id, []);
  }
  return conversationSessions.get(id);
}

function saveMessageToSession(id, role, content) {
  const history = getSessionHistory(id);
  history.push({ role, content });
  if (history.length > 12) {
    conversationSessions.set(id, history.slice(-12));
  }
}

function determineSourceType(sources) {
  if (sources.firestore && sources.web) return 'hybrid';
  if (sources.firestore) return 'firestore';
  if (sources.web) return 'web';
  return 'ai';
}

function deduplicateProducts(prods) {
  const map = new Map();
  prods.forEach(p => {
    if (p && p.id) map.set(p.id, p);
  });
  return Array.from(map.values());
}

function normalizeString(str) {
  if (!str) return '';
  return str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function detectLanguage(text) {
  if (/[\u0600-\u06FF]/.test(text)) {
    if (text.includes('بيسي') || text.includes('كاين') || text.includes('خصني') || text.includes('شحال') || text.includes('مليون') || text.includes('عندكم')) {
      return 'dz';
    }
    return 'ar';
  }
  return 'fr';
}

/**
 * RÉCUPÉRATION FIRESTORE REST
 */
async function fetchFirestoreProducts() {
  try {
    const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/produits`;
    const response = await fetch(url, { headers: { 'Accept': 'application/json' } });

    if (response.ok) {
      const data = await response.json();
      if (data.documents && data.documents.length > 0) {
        return data.documents.map(doc => {
          const docId = doc.name.split('/').pop();
          const f = doc.fields || {};
          return {
            id: docId,
            name: f.name?.stringValue || 'Produit Informatique',
            category: f.category?.stringValue || '',
            brand: f.brand?.stringValue || '',
            model: f.model?.stringValue || '',
            reference: f.reference?.stringValue || '',
            description: f.description?.stringValue || '',
            price: f.price?.doubleValue || f.price?.integerValue ? Number(f.price.doubleValue || f.price.integerValue) : (f.price?.stringValue ? parseFloat(f.price.stringValue) : 0),
            oldPrice: f.oldPrice?.doubleValue || f.oldPrice?.integerValue ? Number(f.oldPrice.doubleValue || f.oldPrice.integerValue) : null,
            promo: f.promo?.booleanValue || false,
            stock: f.stock?.booleanValue ?? (f.stock?.integerValue !== undefined ? f.stock.integerValue > 0 : null),
            available: f.available?.booleanValue ?? null,
            warranty: f.warranty?.stringValue ?? null,
            image: f.image?.stringValue || 'logo.jpg',
            productUrl: `produit.html?id=${docId}`
          };
        });
      }
    }
  } catch (e) {
    console.warn("⚠️ Échec chargement Firestore REST:", e.message);
  }
  return getFallbackDemoProducts();
}

function getFallbackDemoProducts() {
  return [
    {
      id: "demo-1",
      name: "Dell Latitude 5400 Core i5 8th 16GB SSD 512GB",
      category: "laptop",
      brand: "Dell",
      model: "Latitude 5400",
      description: "PC Portable Professionnel Dell Latitude 5400, Intel Core i5 8365U, 16Go RAM DDR4, SSD 512Go NVMe, Écran 14 IPS Full HD, Grade A+.",
      price: 52000,
      oldPrice: 58000,
      promo: true,
      stock: null,
      available: null,
      warranty: null,
      image: "logo.jpg",
      productUrl: "produit.html?id=demo-1"
    },
    {
      id: "demo-2",
      name: "Lenovo ThinkPad T490 i7 8th 16GB SSD 512GB MX250",
      category: "laptop",
      brand: "Lenovo",
      model: "ThinkPad T490",
      description: "Ultrabook Gamer & Pro Lenovo ThinkPad T490, Intel Core i7 8565U, 16GB RAM, 512GB SSD, NVIDIA GeForce MX250 2GB, Écran 14 Full HD IPS.",
      price: 68000,
      oldPrice: 75000,
      promo: true,
      stock: null,
      available: null,
      warranty: null,
      image: "logo.jpg",
      productUrl: "produit.html?id=demo-2"
    },
    {
      id: "demo-3",
      name: "HP ZBook 15 G5 Workstation Core i7 8th RTX 4GB RAM 32GB",
      category: "laptop",
      brand: "HP",
      model: "ZBook 15 G5",
      description: "Station de travail Workstation Montage vidéo & 3D, HP ZBook 15 G5, Intel Core i7 8850H 6 Coeurs, 32 Go RAM, 512 Go SSD + 1TB HDD, Quadro P2000 4GB.",
      price: 115000,
      oldPrice: 125000,
      promo: false,
      stock: null,
      available: null,
      warranty: null,
      image: "logo.jpg",
      productUrl: "produit.html?id=demo-3"
    },
    {
      id: "demo-5",
      name: "Imprimante Jet d'encre Epson EcoTank L3250 WiFi",
      category: "imprimante_jet_encre",
      brand: "Epson",
      model: "EcoTank L3250",
      description: "Multifonction 3-en-1 Epson EcoTank L3250 Réservoir d'encre rechargeable, WiFi Direct, Impression couleur ultra économique.",
      price: 34500,
      oldPrice: 37000,
      promo: true,
      stock: null,
      available: null,
      warranty: null,
      image: "logo.jpg",
      productUrl: "produit.html?id=demo-5"
    }
  ];
}
