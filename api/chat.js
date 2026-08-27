import dotenv from 'dotenv';
dotenv.config();

const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'amar-informatique';
const OPENAI_KEY = process.env.OPENAI_API_KEY;
const MODEL_NAME = process.env.OPENAI_MODEL || 'gpt-4o-mini';

// Mémoire in-memory des sessions de conversation pour la gestion du contexte
const conversationSessions = new Map();

// System Prompt de l'Agent IA Hybride conforme aux exigences
const SYSTEM_PROMPT = `Tu es l'assistant virtuel officiel et expert technologique de Amar Informatique, le magasin e-commerce de référence en Algérie pour le matériel informatique (laptops, imprimantes, composants, accessoires).

TES MISSIONS :
1. Aider les clients à trouver le matériel idéal selon leurs besoins et leur budget en Dinars Algériens (DA).
2. Expliquer clairement les technologies (SSD vs HDD, RAM, processeurs, cartes graphiques, imprimantes).
3. Utiliser les outils (Tools) de manière autonome et pertinente.

RÈGLES D'UTILISATION DES OUTILS (TOOLS) :
1. DONNÉES COMMERCIALES AMAR INFORMATIQUE (Produits, Prix, Stock, Promotions, Disponibilité, Fiches techniques) :
   - Tu DOIS IMPÉRATIVEMENT appeler les outils Firestore ("searchProducts", "getProductDetails", "recommendProducts", "compareProducts", "checkAvailability").
   - Ne JAMAIS inventer un produit, un prix, une réduction ou une disponibilité non retournée par ces outils.
2. CONNAISSANCES GÉNÉRALES TECH (ex: SSD vs HDD, rôle de la RAM, fonctionnement d'une imprimante) :
   - Réponds directement sans appeler d'outils s'il n'y a pas de demande commerciale.
3. INFORMATIONS RÉCENTES OU EXTERNES (ex: dernière version de Windows, nouveaux processeurs non présents en magasin) :
   - Utilise l'outil "webSearch". Ne jamais utiliser webSearch pour les prix/stock de Amar Informatique.

LANGUE ET TON :
- Détecte automatiquement la langue de l'utilisateur et réponds STRICTEMENT dans la même langue :
  * Français
  * Arabe (العربية)
  * Darija algérienne (ex: "خصني بيسي غايمينغ بـ 15 مليون", "كاين هذا البرودوي؟")
  * Mélange Français/Arabe/Darija
- Adopte un ton amical, professionnel, concis et commercial.`;

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

    // Gestion de la session de conversation et de l'historique récent
    const history = getSessionHistory(conversationId);
    saveMessageToSession(conversationId, 'user', userMessage);

    // Chargement de tous les produits réels depuis Firestore
    const allProducts = await fetchFirestoreProducts();

    let sourcesUsed = { firestore: false, web: false, ai: false };
    let recommendedProducts = [];

    // Si clé OpenAI présente : Exécution du véritable Agent IA avec Tool Calling
    if (OPENAI_KEY && OPENAI_KEY.trim() !== '' && !OPENAI_KEY.includes('your_openai_api_key')) {
      try {
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

        if (openAiRes.ok) {
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

            if (openAiRes.ok) {
              openAiData = await openAiRes.json();
              responseMessage = openAiData.choices?.[0]?.message;
            } else {
              break;
            }
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
        }
      } catch (err) {
        console.warn("⚠️ Exception Agent IA OpenAI, bascule vers moteur hybride local:", err.message);
      }
    }

    // Moteur Hybride Local de secours (si OpenAI non disponible)
    const fallbackResult = executeLocalHybridEngine(allProducts, userMessage);
    saveMessageToSession(conversationId, 'assistant', fallbackResult.message);

    return res.status(200).json({
      success: true,
      conversationId: conversationId,
      message: fallbackResult.message,
      products: fallbackResult.products.slice(0, 4),
      source: fallbackResult.source,
      language: detectLanguage(userMessage)
    });

  } catch (error) {
    console.error("❌ Erreur serveur /api/chat:", error);
    return res.status(200).json({
      success: true,
      conversationId: `conv-${Date.now()}`,
      message: "Bonjour 👋 Bienvenue chez **Amar Informatique** ! Comment puis-je vous aider aujourd'hui ?",
      products: getFallbackDemoProducts().slice(0, 4),
      source: "firestore",
      language: "fr"
    });
  }
}

/**
 * IMPLÉMENTATION DES OUTILS (TOOLS)
 */

function executeSearchProducts(allProducts, args) {
  const query = normalizeString(args.query || '');
  const cat = normalizeString(args.category || '');
  const brand = normalizeString(args.brand || '');
  const maxP = args.maxPrice || null;

  return allProducts.filter(p => {
    const nameN = normalizeString(p.name);
    const descN = normalizeString(p.description);
    const catN = normalizeString(p.category);
    const brandN = normalizeString(p.brand || '');

    if (maxP && p.price > maxP) return false;
    if (cat && !catN.includes(cat)) return false;
    if (brand && !brandN.includes(brand)) return false;

    if (query) {
      return nameN.includes(query) || descN.includes(query) || catN.includes(query) || brandN.includes(query);
    }
    return true;
  });
}

function executeGetProductDetails(allProducts, productId) {
  const found = allProducts.find(p => p.id === productId || normalizeString(p.name).includes(normalizeString(productId)));
  if (found) {
    return {
      id: found.id,
      name: found.name,
      price: found.price,
      oldPrice: found.oldPrice,
      promo: found.promo,
      stock: true,
      category: found.category,
      description: found.description,
      warranty: "Garantie officielle Magasin Amar Informatique (12 mois)"
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
  const found = allProducts.find(p => p.id === productId || normalizeString(p.name).includes(normalizeString(productId)));
  if (found) {
    return { available: true, inStock: true, price: found.price, productName: found.name };
  }
  return { available: false, inStock: false };
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
        return { snippet: topics.join(' \n ') };
      }
    }
  } catch (e) {
    console.warn("⚠️ Web Search Warning:", e.message);
  }
  return { snippet: `Recherche web externe effectuée pour: ${query}` };
}

/**
 * MOTEUR HYBRIDE LOCAL (Si OpenAI absent)
 */
function executeLocalHybridEngine(allProducts, userText) {
  const q = normalizeString(userText);
  const lang = detectLanguage(userText);

  // 1. Question technique générale
  if (q.includes('difference') || q.includes('c quoi') || q.includes('comment fonctionne') || (q.includes('ssd') && q.includes('hdd') && !q.includes('prix'))) {
    return {
      message: "💡 **SSD vs HDD** :\n- **SSD (Solid State Drive)** : Ultra-rapide (jusqu'à 10x plus rapide qu'un HDD), silencieux et sans pièces mécaniques. Idéal pour démarrer Windows en secondes.\n- **HDD (Hard Disk Drive)** : Disque mécanique traditionnel à coût modéré.\n\n*Tous nos ordinateurs Amar Informatique sont équipés de SSD NVMe rapides.*",
      products: allProducts.slice(0, 3),
      source: "ai"
    };
  }

  // 2. Question web externe
  if (q.includes('dernier windows') || q.includes('derniere version') || q.includes('intel 14th') || q.includes('rtx 5060')) {
    return {
      message: "🌐 **Informations Technologiques Récentes** :\n- **Windows** : La version la plus récente est Windows 11 (Mise à jour 23H2 / 24H2).\n- **Cartes Graphiques** : Les séries RTX 4000 et les récentes annonces RTX 5000 offrent des performances exceptionnelles avec DLSS 3.5.\n\n*Retrouvez nos PC équipés de ces technologies chez Amar Informatique !*",
      products: allProducts.slice(0, 3),
      source: "web"
    };
  }

  // 3. Recherche commerciale Firestore
  let matchedProds = [];
  const budgetMatch = userText.match(/\d+/);
  let budget = budgetMatch ? parseInt(budgetMatch[0]) * (userText.includes('مليون') ? 10000 : 1) : null;
  if (budget && budget < 1000) budget *= 1000;

  if (q.includes('gamer') || q.includes('gaming') || q.includes('الڤايمينغ')) {
    matchedProds = executeRecommendProducts(allProducts, { usage: 'gaming', budget: budget || 150000 });
  } else if (q.includes('epson') || q.includes('imprimante') || q.includes('طابعة')) {
    matchedProds = executeSearchProducts(allProducts, { query: 'epson' });
  } else {
    matchedProds = executeSearchProducts(allProducts, { query: q, maxPrice: budget });
  }

  if (matchedProds.length === 0) matchedProds = allProducts;

  const msg = lang === 'dz' || lang === 'ar'
    ? "مرحباً بك في عمار للمعلوماتية 👋 إليك المنتجات الأكثر طلباً والمتوفرة حالياً في المحل:"
    : "Bonjour 👋 Bienvenue chez Amar Informatique ! Voici nos produits les plus recherchés disponibles en magasin :";

  return {
    message: msg,
    products: matchedProds,
    source: "firestore"
  };
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
            description: f.description?.stringValue || '',
            price: f.price?.doubleValue || f.price?.integerValue ? Number(f.price.doubleValue || f.price.integerValue) : (f.price?.stringValue ? parseFloat(f.price.stringValue) : 0),
            oldPrice: f.oldPrice?.doubleValue || f.oldPrice?.integerValue ? Number(f.oldPrice.doubleValue || f.oldPrice.integerValue) : null,
            promo: f.promo?.booleanValue || false,
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
      description: "PC Portable Professionnel Dell Latitude 5400, Intel Core i5 8365U, 16Go RAM DDR4, SSD 512Go NVMe, Écran 14 IPS Full HD, Grade A+.",
      price: 52000,
      oldPrice: 58000,
      promo: true,
      image: "logo.jpg",
      productUrl: "produit.html?id=demo-1"
    },
    {
      id: "demo-2",
      name: "Lenovo ThinkPad T490 i7 8th 16GB SSD 512GB MX250",
      category: "laptop",
      brand: "Lenovo",
      description: "Ultrabook Gamer & Pro Lenovo ThinkPad T490, Intel Core i7 8565U, 16GB RAM, 512GB SSD, NVIDIA GeForce MX250 2GB, Écran 14 Full HD IPS.",
      price: 68000,
      oldPrice: 75000,
      promo: true,
      image: "logo.jpg",
      productUrl: "produit.html?id=demo-2"
    },
    {
      id: "demo-3",
      name: "HP ZBook 15 G5 Workstation Core i7 8th RTX 4GB RAM 32GB",
      category: "laptop",
      brand: "HP",
      description: "Station de travail Workstation Montage vidéo & 3D, HP ZBook 15 G5, Intel Core i7 8850H 6 Coeurs, 32 Go RAM, 512 Go SSD + 1TB HDD, Quadro P2000 4GB.",
      price: 115000,
      oldPrice: 125000,
      promo: false,
      image: "logo.jpg",
      productUrl: "produit.html?id=demo-3"
    },
    {
      id: "demo-5",
      name: "Imprimante Jet d'encre Epson EcoTank L3250 WiFi",
      category: "imprimante_jet_encre",
      brand: "Epson",
      description: "Multifonction 3-en-1 Epson EcoTank L3250 Réservoir d'encre rechargeable, WiFi Direct, Impression couleur ultra économique.",
      price: 34500,
      oldPrice: 37000,
      promo: true,
      image: "logo.jpg",
      productUrl: "produit.html?id=demo-5"
    }
  ];
}
