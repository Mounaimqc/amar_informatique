import dotenv from 'dotenv';
dotenv.config();

const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'amar-informatique';
const OPENAI_KEY = process.env.OPENAI_API_KEY;
const MODEL_NAME = process.env.OPENAI_MODEL || 'gpt-4o-mini';

const SYSTEM_PROMPT = `Tu es l'assistant virtuel officiel de Amar Informatique, un site e-commerce algérien spécialisé dans la vente de matériel informatique haut de gamme et reconditionné certifié.

Tes missions principales :
1. Aider les clients à trouver un produit (laptops, imprimantes, accessoires).
2. Proposer des PC adaptés selon l'usage (Gaming, Montage vidéo/3D, Bureautique) et le budget en Dinars Algériens (DA).
3. Répondre en Français, Arabe ou Darija algérienne.
4. Adopter un ton court, accueillant, clair et commercial.
5. Ne jamais inventer des prix ou des produits non existants dans la liste fournie.`;

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
      message: "Backend Chat API is online and operational."
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: { code: 'METHOD_NOT_ALLOWED', message: 'Méthode non autorisée. Utilisez POST.' }
    });
  }

  try {
    const body = req.body || {};
    const rawMessage = body.message;
    const userMessage = typeof rawMessage === 'string' ? rawMessage.trim() : '';
    const conversationId = typeof body.conversationId === 'string' ? body.conversationId.trim() : `conv-${Date.now()}`;

    console.log("💬 /api/chat received message:", userMessage);

    if (!userMessage) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: "Le message est obligatoire." }
      });
    }

    // 1. Récupération des produits réels depuis Firestore REST API
    const products = await fetchFirestoreProducts();

    // 2. Filtrage des produits selon la recherche utilisateur
    const matchedProducts = searchAndFilterProducts(products, userMessage);

    // 3. Si clé OpenAI configurée, appel direct à l'API OpenAI Chat Completions
    if (OPENAI_KEY && OPENAI_KEY.trim() !== '' && !OPENAI_KEY.includes('your_openai_api_key')) {
      try {
        const aiResponseText = await callOpenAICompletions(userMessage, matchedProducts);
        if (aiResponseText) {
          return res.status(200).json({
            success: true,
            conversationId: conversationId,
            message: aiResponseText,
            language: detectLanguage(userMessage),
            products: matchedProducts.slice(0, 4),
            actions: matchedProducts.length > 0 ? [{ type: 'view_product', productId: matchedProducts[0].id }] : []
          });
        }
      } catch (aiErr) {
        console.warn("⚠️ OpenAI API Call Warning:", aiErr.message);
      }
    }

    // 4. Moteur de réponse intelligent fallback (si OpenAI non configuré ou indisponible)
    const fallbackText = buildSmartFallbackResponse(userMessage, matchedProducts);

    return res.status(200).json({
      success: true,
      conversationId: conversationId,
      message: fallbackText,
      language: detectLanguage(userMessage),
      products: matchedProducts.slice(0, 4),
      actions: matchedProducts.length > 0 ? [{ type: 'view_product', productId: matchedProducts[0].id }] : []
    });

  } catch (error) {
    console.error("❌ Exception dans /api/chat:", error);
    
    // Garantir une réponse HTTP 200 avec message convivial
    return res.status(200).json({
      success: true,
      conversationId: `conv-${Date.now()}`,
      message: "Bonjour 👋 Merci d'avoir contacté **Amar Informatique** ! Voici les meilleurs matériels disponibles actuellement dans notre boutique :",
      language: "fr",
      products: getFallbackDemoProducts().slice(0, 4),
      actions: []
    });
  }
}

/**
 * Récupère la liste des produits depuis Firestore REST
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
            description: f.description?.stringValue || '',
            price: f.price?.doubleValue || f.price?.integerValue ? Number(f.price.doubleValue || f.price.integerValue) : (f.price?.stringValue ? parseFloat(f.price.stringValue) : 0),
            oldPrice: f.oldPrice?.doubleValue || f.oldPrice?.integerValue ? Number(f.oldPrice.doubleValue || f.oldPrice.integerValue) : null,
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

/**
 * Appel API OpenAI Chat Completions direct
 */
async function callOpenAICompletions(userText, matchedProds) {
  const contextProducts = matchedProds.map(p => `- ${p.name} (Prix: ${p.price} DA) : ${p.description}`).join('\n');
  const promptMessage = `Produits réellement disponibles en magasin :\n${contextProducts || 'Aucun produit spécifique.'}\n\nQuestion du client : ${userText}`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_KEY.trim()}`
    },
    body: JSON.stringify({
      model: MODEL_NAME,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: promptMessage }
      ],
      temperature: 0.3,
      max_tokens: 400
    })
  });

  if (response.ok) {
    const json = await response.json();
    return json.choices?.[0]?.message?.content || null;
  } else {
    const errJson = await response.json().catch(() => ({}));
    console.warn("⚠️ OpenAI HTTP Error:", response.status, errJson);
  }
  return null;
}

/**
 * Filtre les produits selon le message utilisateur
 */
function searchAndFilterProducts(allProducts, text) {
  const q = text.toLowerCase();
  
  // Extraction de budget si présent dans la phrase
  const budgetMatch = q.match(/\d+/);
  const requestedBudget = budgetMatch ? parseInt(budgetMatch[0]) * (q.includes('مليون') ? 10000 : 1) : null;

  const filtered = allProducts.filter(p => {
    const name = (p.name || '').toLowerCase();
    const desc = (p.description || '').toLowerCase();
    const cat = (p.category || '').toLowerCase();

    if (requestedBudget && p.price > requestedBudget * 1.15) {
      return false;
    }

    if (q.includes('gamer') || q.includes('gaming') || q.includes('للعاب') || q.includes('الڤايمينغ')) {
      return desc.includes('rtx') || desc.includes('gtx') || desc.includes('mx') || desc.includes('i7') || name.includes('gamer') || name.includes('thinkpad');
    }

    if (q.includes('imprimante') || q.includes('طابعة') || q.includes('epson') || q.includes('hp')) {
      return cat.startsWith('imprimante') || name.includes('epson') || name.includes('hp') || name.includes('laser');
    }

    if (q.includes('laptop') || q.includes('ordinateur') || q.includes('حاسوب') || q.includes('بيسي')) {
      return cat === 'laptop' || name.includes('dell') || name.includes('lenovo') || name.includes('hp');
    }

    return name.includes(q) || desc.includes(q) || cat.includes(q);
  });

  return filtered.length > 0 ? filtered : allProducts;
}

/**
 * Construit une réponse synthétique
 */
function buildSmartFallbackResponse(userText, prods) {
  const q = userText.toLowerCase();
  const lang = detectLanguage(userText);

  if (q.includes('gamer') || q.includes('gaming') || q.includes('الڤايمينغ')) {
    return lang === 'dz' || lang === 'ar' 
      ? "تفضل أفضل حواسيب الـ Gaming المتوفرة لدينا حالياً مع خصائصها وأسعارها الحقيقية:" 
      : "Voici nos meilleurs PC Portable Gaming disponibles en magasin dans votre budget :";
  }

  if (q.includes('imprimante') || q.includes('طابعة') || q.includes('epson')) {
    return lang === 'dz' || lang === 'ar'
      ? "تفضل الطابعات الأكثر مبيعاً والمتوفرة لدينا حالياً في المحل:"
      : "Voici les modèles d'imprimantes disponibles actuellement dans notre magasin :";
  }

  if (q.includes('ssd') || q.includes('hdd') || q.includes('stockage')) {
    return "💡 **SSD vs HDD** :\n- **SSD (Solid State Drive)** : Ultra-rapide (jusqu'à 10x plus rapide qu'un HDD), silencieux et résistant aux chocs. Idéal pour démarrer Windows en quelques secondes.\n- **HDD (Hard Disk Drive)** : Disque mécanique traditionnel, plus lent mais offre un espace de stockage à bas coût.\n\n*Tous nos laptops Amar Informatique sont équipés de SSD NVMe rapides.*";
  }

  return lang === 'dz' || lang === 'ar'
    ? "مرحباً بك في عمار للمعلوماتية 👋 إليك المنتجات الأكثر طلباً والمتوفرة حالياً في المحل:"
    : "Bonjour 👋 Bienvenue chez Amar Informatique ! Voici nos produits les plus recherchés et disponibles actuellement en magasin :";
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

function getFallbackDemoProducts() {
  return [
    {
      id: "demo-1",
      name: "Dell Latitude 5400 Core i5 8th 16GB SSD 512GB",
      category: "laptop",
      description: "PC Portable Professionnel Dell Latitude 5400, Intel Core i5 8365U, 16Go RAM DDR4, SSD 512Go NVMe, Écran 14 IPS Full HD, Grade A+.",
      price: 52000,
      oldPrice: 58000,
      image: "logo.jpg",
      productUrl: "produit.html?id=demo-1"
    },
    {
      id: "demo-2",
      name: "Lenovo ThinkPad T490 i7 8th 16GB SSD 512GB MX250",
      category: "laptop",
      description: "Ultrabook Gamer & Pro Lenovo ThinkPad T490, Intel Core i7 8565U, 16GB RAM, 512GB SSD, NVIDIA GeForce MX250 2GB, Écran 14 Full HD IPS.",
      price: 68000,
      oldPrice: 75000,
      image: "logo.jpg",
      productUrl: "produit.html?id=demo-2"
    },
    {
      id: "demo-3",
      name: "HP ZBook 15 G5 Workstation Core i7 8th RTX 4GB RAM 32GB",
      category: "laptop",
      description: "Station de travail Workstation Montage vidéo & 3D, HP ZBook 15 G5, Intel Core i7 8850H 6 Coeurs, 32 Go RAM, 512 Go SSD + 1TB HDD, Quadro P2000 4GB.",
      price: 115000,
      oldPrice: 125000,
      image: "logo.jpg",
      productUrl: "produit.html?id=demo-3"
    },
    {
      id: "demo-5",
      name: "Imprimante Jet d'encre Epson EcoTank L3250 WiFi",
      category: "imprimante_jet_encre",
      description: "Multifonction 3-en-1 Epson EcoTank L3250 Réservoir d'encre rechargeable, WiFi Direct, Impression couleur ultra économique.",
      price: 34500,
      oldPrice: 37000,
      image: "logo.jpg",
      productUrl: "produit.html?id=demo-5"
    }
  ];
}
