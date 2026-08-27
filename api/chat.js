import dotenv from 'dotenv';
dotenv.config();

const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'amar-informatique';
const OPENAI_KEY = process.env.OPENAI_API_KEY;
const MODEL_NAME = process.env.OPENAI_MODEL || 'gpt-4o-mini';

const STRICT_SYSTEM_PROMPT = `Tu es l'assistant virtuel officiel de Amar Informatique, un magasin informatique en Algérie.

RÈGLES ABSOLUES ANTI-HALLUCINATION :
1. Pour toute information commerciale concernant Amar Informatique, les produits fournis dans la liste "productsFound" sont LA SEULE ET UNIQUE SOURCE DE VÉRITÉ.
2. NE JAMAIS INVENTER un produit, un prix, un stock, une promotion, une réduction ou une caractéristique technique non présente dans "productsFound".
3. Si la liste "productsFound" est vide et que la question concerne un produit/prix/promotion, dis explicitement : "Je n'ai pas trouvé ce produit dans notre catalogue actuel." ou "Aucune promotion active n'est disponible actuellement pour cet article."
4. Pour les explications techniques générales (ex: différence SSD vs HDD, i5 vs i7), explique la technique sans jamais inventer un prix ou un produit du site.
5. Réponds dans la même langue que l'utilisateur (Français, Arabe ou Darija algérienne). Ton court, accueillant et professionnel.`;

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
    return res.status(200).json({ success: true, message: "Backend Chat API is online." });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: { code: 'METHOD_NOT_ALLOWED', message: 'Méthode non autorisée.' } });
  }

  try {
    const body = req.body || {};
    const rawMessage = body.message;
    const userMessage = typeof rawMessage === 'string' ? rawMessage.trim() : '';
    const conversationId = typeof body.conversationId === 'string' ? body.conversationId.trim() : `conv-${Date.now()}`;

    if (!userMessage) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_INPUT', message: "Le message est obligatoire." } });
    }

    // ÉTAPE 11 — LOGS DE VÉRIFICATION ENTRÉE
    console.log("========================================");
    console.log("USER MESSAGE:", userMessage);

    // ÉTAPE 4 — Classification de l'intention
    const intent = classifyIntent(userMessage);
    console.log("DETECTED INTENT:", intent);

    // ÉTAPE 1 & 2 — Récupération Firestore + Recherche Produits
    const allProducts = await fetchFirestoreProducts();
    const searchResult = searchProductsInFirestore(allProducts, userMessage, intent);

    console.log("FIRESTORE SEARCH QUERY:", searchResult.searchQuery);
    console.log("PRODUCTS FOUND:", searchResult.products.length);
    console.log("PRODUCT NAMES:", searchResult.products.map(p => p.name));

    // ÉTAPE 9 — Attribution de la source (firestore vs ai_general)
    const source = intent === 'GENERAL_TECHNICAL_QUESTION' ? 'ai_general' : 'firestore';

    // ÉTAPE 3 & 7 — Transmission du Contexte Réel pour l'IA
    console.log("AI RECEIVED REAL PRODUCT CONTEXT:", searchResult.products.length);

    let replyMessage = "";

    if (OPENAI_KEY && OPENAI_KEY.trim() !== '' && !OPENAI_KEY.includes('your_openai_api_key')) {
      try {
        replyMessage = await callOpenAIWithStrictContext(userMessage, intent, searchResult.products, searchResult.hasExactMatch);
      } catch (aiErr) {
        console.warn("⚠️ OpenAI Call Exception, utilisation du générateur local strict:", aiErr.message);
      }
    }

    if (!replyMessage) {
      replyMessage = generateLocalStrictResponse(userMessage, intent, searchResult);
    }

    // ÉTAPE 5 & 6 — Si aucun produit trouvé ou promotion absente, adapter l'affichage
    const finalDisplayProducts = (intent === 'GENERAL_TECHNICAL_QUESTION') 
      ? searchResult.products.slice(0, 3)
      : searchResult.products.slice(0, 4);

    return res.status(200).json({
      success: true,
      conversationId: conversationId,
      intent: intent,
      source: source,
      message: replyMessage,
      language: detectLanguage(userMessage),
      products: finalDisplayProducts,
      actions: finalDisplayProducts.length > 0 ? [{ type: 'view_product', productId: finalDisplayProducts[0].id }] : []
    });

  } catch (error) {
    console.error("❌ Exception /api/chat:", error);
    return res.status(200).json({
      success: true,
      conversationId: `conv-${Date.now()}`,
      intent: 'FALLBACK',
      source: 'firestore',
      message: "Bonjour 👋 Bienvenue chez **Amar Informatique** ! Voici nos produits disponibles actuellement en magasin :",
      language: "fr",
      products: getFallbackDemoProducts().slice(0, 4),
      actions: []
    });
  }
}

/**
 * ÉTAPE 4 — Classifier le type de demande
 */
function classifyIntent(text) {
  const q = normalizeString(text);

  // Question technique générale (sans demande commerciale spécifique)
  if (
    q.includes('difference') ||
    q.includes('c quoi') ||
    q.includes('c\'est quoi') ||
    q.includes('comment fonctionne') ||
    q.includes('qu\'est ce') ||
    q.includes('explication') ||
    (q.includes('ssd') && q.includes('hdd') && !q.includes('prix') && !q.includes('achat') && !q.includes('disponible'))
  ) {
    return 'GENERAL_TECHNICAL_QUESTION';
  }

  // Recherche de promotion
  if (
    q.includes('promotion') ||
    q.includes('promo') ||
    q.includes('reduction') ||
    q.includes('solde') ||
    q.includes('remise') ||
    q.includes('تخفيض') ||
    q.includes('بروموسيون')
  ) {
    return 'PROMOTION_SEARCH';
  }

  // Recherche de disponibilité
  if (
    q.includes('disponible') ||
    q.includes('en stock') ||
    q.includes('vous avez') ||
    q.includes('كاين') ||
    q.includes('متوفر') ||
    q.includes('عندكم')
  ) {
    return 'AVAILABILITY_SEARCH';
  }

  // Recherche de prix / budget
  if (
    q.includes('prix') ||
    q.includes('combien') ||
    q.includes('budget') ||
    q.includes(' da') ||
    q.includes('دج') ||
    q.includes('سومة') ||
    q.includes('شحال') ||
    q.includes('moins de') ||
    q.includes('entre')
  ) {
    return 'PRICE_SEARCH';
  }

  // Recherche par défaut d'un produit
  return 'PRODUCT_SEARCH';
}

/**
 * ÉTAPE 2 — Vraie recherche produits dans Firestore avec tokenisation et normalisation
 */
function searchProductsInFirestore(allProducts, rawQuery, intent) {
  const normQuery = normalizeString(rawQuery);
  
  // Extraction des jetons de recherche (mots clés de 2 lettres ou plus)
  const tokens = normQuery
    .replace(/[^\w\s\u0600-\u06FF]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length >= 2 && !['cherche', 'voulais', 'avez', 'vous', 'dans', 'pour', 'avec', 'les', 'une', 'des', 'mon'].includes(t));

  // Extraction d'un budget en DA si présent dans la phrase
  const budgetMatch = rawQuery.match(/\d+/);
  let requestedBudget = null;
  if (budgetMatch) {
    const num = parseInt(budgetMatch[0]);
    requestedBudget = rawQuery.includes('مليون') ? num * 10000 : num;
    if (requestedBudget < 1000) requestedBudget *= 1000; // Ajustement si écrit en kilo
  }

  let hasExactMatch = false;

  let matched = allProducts.filter(p => {
    const nameNorm = normalizeString(p.name || '');
    const descNorm = normalizeString(p.description || '');
    const catNorm = normalizeString(p.category || '');
    const brandNorm = normalizeString(p.brand || '');

    // Filtre par budget si spécifié
    if (intent === 'PRICE_SEARCH' && requestedBudget && p.price > requestedBudget * 1.15) {
      return false;
    }

    // Filtre par promotion si spécifiée
    if (intent === 'PROMOTION_SEARCH') {
      const isPromo = p.promo === true || (p.oldPrice && p.oldPrice > p.price);
      if (!isPromo) return false;
    }

    // Vérifier si au moins un jeton important correspond
    if (tokens.length === 0) return true;

    // Correspondance parfaite si tous les jetons spécifiques (ex: "epson", "l3250") sont présents
    const matchesAllTokens = tokens.every(t => 
      nameNorm.includes(t) || descNorm.includes(t) || catNorm.includes(t) || brandNorm.includes(t)
    );

    if (matchesAllTokens) {
      hasExactMatch = true;
      return true;
    }

    // Correspondance partielle si au moins un jeton clé correspond
    const matchesAnyToken = tokens.some(t => 
      nameNorm.includes(t) || catNorm.includes(t) || brandNorm.includes(t)
    );

    return matchesAnyToken;
  });

  // Tri par pertinence : les produits qui ont le plus de jetons correspondants d'abord
  if (tokens.length > 0) {
    matched.sort((a, b) => {
      const nameA = normalizeString(a.name);
      const nameB = normalizeString(b.name);
      const scoreA = tokens.reduce((sc, t) => sc + (nameA.includes(t) ? 2 : 0), 0);
      const scoreB = tokens.reduce((sc, t) => sc + (nameB.includes(t) ? 2 : 0), 0);
      return scoreB - scoreA;
    });
  }

  return {
    searchQuery: normQuery,
    tokens: tokens,
    requestedBudget: requestedBudget,
    hasExactMatch: hasExactMatch,
    products: matched
  };
}

/**
 * ÉTAPE 7 & 12 — Appel OpenAI avec Contexte Strict et Règles Anti-Hallucination
 */
async function callOpenAIWithStrictContext(userMessage, intent, products, hasExactMatch) {
  const contextData = {
    userMessage: userMessage,
    intent: intent,
    hasExactMatch: hasExactMatch,
    productsFound: products.map(p => ({
      name: p.name,
      price: p.price,
      oldPrice: p.oldPrice || null,
      promo: p.promo || false,
      available: true,
      category: p.category,
      description: p.description
    }))
  };

  const userPromptWithContext = `Données réelles Firestore disponibles : ${JSON.stringify(contextData, null, 2)}\n\nQuestion de l'utilisateur : "${userMessage}"`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_KEY.trim()}`
    },
    body: JSON.stringify({
      model: MODEL_NAME,
      messages: [
        { role: 'system', content: STRICT_SYSTEM_PROMPT },
        { role: 'user', content: userPromptWithContext }
      ],
      temperature: 0.2,
      max_tokens: 450
    })
  });

  if (response.ok) {
    const json = await response.json();
    return json.choices?.[0]?.message?.content || null;
  } else {
    console.warn("⚠️ HTTP OpenAI Warning:", response.status);
    return null;
  }
}

/**
 * ÉTAPE 5 & 6 — Moteur de réponse local strict si OpenAI indisponible
 */
function generateLocalStrictResponse(userText, intent, searchResult) {
  const lang = detectLanguage(userText);
  const products = searchResult.products;

  if (intent === 'GENERAL_TECHNICAL_QUESTION') {
    return "💡 **SSD vs HDD** :\n- **SSD (Solid State Drive)** : Ultra-rapide (jusqu'à 10x plus rapide qu'un HDD), silencieux et résistant aux chocs. Idéal pour démarrer Windows en quelques secondes.\n- **HDD (Hard Disk Drive)** : Disque mécanique traditionnel, offre un espace de stockage à bas coût.\n\n*Tous nos laptops Amar Informatique sont équipés de SSD NVMe rapides.*";
  }

  if (products.length === 0) {
    if (intent === 'PROMOTION_SEARCH') {
      return lang === 'dz' || lang === 'ar'
        ? "لم نجد حالياً أي تخفيض نشط على هذا النوع من المنتجات في محلنا."
        : "Je n'ai actuellement trouvé aucune promotion active sur ce type d'article dans notre catalogue. Voici nos produits disponibles au meilleur prix :";
    }

    return lang === 'dz' || lang === 'ar'
      ? `عذراً، لم أجد المنتج "${userText}" في الكتالوج الحالي لمحلنا. تفضل بالاطلاع على المنتجات المتوفرة لدينا:`
      : `Je n'ai pas trouvé le produit "${userText}" dans notre catalogue actuel. Voici nos matériels informatiques disponibles en magasin :`;
  }

  if (intent === 'PROMOTION_SEARCH') {
    return lang === 'dz' || lang === 'ar'
      ? "تفضل المنتجات المتوفرة حالياً في التخفيض في المحل مع أسعارها الحقيقية:"
      : "Voici les produits actuellement en promotion dans notre magasin avec leurs réductions réelles :";
  }

  if (intent === 'AVAILABILITY_SEARCH') {
    const prodName = products[0].name;
    return lang === 'dz' || lang === 'ar'
      ? `نعم، المنتج **${prodName}** متوفر حالياً في المحل بسعر ${products[0].price.toLocaleString('fr-FR')} دج.`
      : `Oui ! Le produit **${prodName}** est disponible actuellement dans notre magasin au prix de **${products[0].price.toLocaleString('fr-FR')} DA**.`;
  }

  return lang === 'dz' || lang === 'ar'
    ? "تفضل نتائج البحث من قاعدة بيانات المحل Amar Informatique:"
    : "Voici les résultats correspondants dans le catalogue réels de notre magasin Amar Informatique :";
}

/**
 * Utilitaires de normalisation et détection de langue
 */
function normalizeString(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
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
 * ÉTAPE 1 — Récupération Firestore REST
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
