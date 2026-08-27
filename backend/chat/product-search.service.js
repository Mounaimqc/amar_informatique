import { getAllProducts } from '../config/firebase.js';

function normalizeString(str) {
  if (!str) return '';
  return str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

/**
 * Tool 1 : searchProducts
 * Recherche tokenisée et filtrée dans la base de données réelle de produits.
 */
export async function searchProducts({ query, category, minPrice, maxPrice, brand, specifications }) {
  try {
    const products = await getAllProducts();

    const queryNorm = normalizeString(query);
    const catNorm = normalizeString(category);
    const brandNorm = normalizeString(brand);
    const tokens = queryNorm.split(/\s+/).filter(t => t.length > 0);

    const scored = [];

    for (const p of products) {
      if (typeof minPrice === 'number' && minPrice > 0 && p.price < minPrice) continue;
      if (typeof maxPrice === 'number' && maxPrice > 0 && p.price > maxPrice) continue;

      const pCat = normalizeString(p.category);
      const pBrand = normalizeString(p.brand || p.name);

      if (catNorm) {
        if (catNorm === 'laptop' && pCat !== 'laptop') continue;
        if (catNorm === 'imprimantes' && !pCat.startsWith('imprimante')) continue;
        if (!pCat.includes(catNorm)) continue;
      }

      if (brandNorm && !pBrand.includes(brandNorm)) continue;

      if (specifications && Array.isArray(specifications)) {
        const pName = normalizeString(p.name);
        const pDesc = normalizeString(p.description);
        const matchSpecs = specifications.every(spec => {
          const s = normalizeString(spec);
          return pName.includes(s) || pDesc.includes(s);
        });
        if (!matchSpecs) continue;
      }

      if (tokens.length === 0) {
        scored.push({ product: p, score: 1 });
        continue;
      }

      const pName = normalizeString(p.name);
      const pDesc = normalizeString(p.description);
      const pModel = normalizeString(p.model || '');
      const pRef = normalizeString(p.reference || '');

      let score = 0;
      for (const token of tokens) {
        if (pName.includes(token)) score += 4;
        if (pModel.includes(token)) score += 4;
        if (pRef.includes(token)) score += 4;
        if (pBrand.includes(token)) score += 3;
        if (pCat.includes(token)) score += 2;
        if (pDesc.includes(token)) score += 1;
      }

      if (score > 0) {
        scored.push({ product: p, score });
      }
    }

    scored.sort((a, b) => b.score - a.score);

    return scored.map(item => {
      const p = item.product;
      return {
        id: p.id,
        name: p.name,
        price: p.price,
        oldPrice: p.oldPrice || null,
        stock: p.stock !== undefined ? p.stock : null,
        available: p.available !== undefined ? p.available : null,
        brand: p.brand || p.name.split(' ')[0],
        category: p.category,
        specifications: (p.description || '').substring(0, 150),
        image: p.image || 'logo.jpg',
        productUrl: `produit.html?id=${p.id}`
      };
    }).slice(0, 8);

  } catch (error) {
    console.error("❌ Erreur searchProducts:", error);
    return [];
  }
}

/**
 * Tool 2 : getProductDetails
 * Récupère les caractéristiques complètes d'un produit par ID.
 */
export async function getProductDetails({ productId }) {
  try {
    const products = await getAllProducts();
    const product = products.find(p => p.id === productId || String(p.id) === String(productId));

    if (!product) {
      return { error: `Produit introuvable avec l'ID ${productId}` };
    }

    return {
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      oldPrice: product.oldPrice || null,
      stock: product.stock !== undefined ? product.stock : null,
      available: product.available !== undefined ? product.available : null,
      warranty: product.warranty !== undefined ? product.warranty : null,
      specifications: product.description,
      brand: product.brand || product.name.split(' ')[0],
      image: product.image || 'logo.jpg',
      category: product.category,
      productUrl: `produit.html?id=${product.id}`
    };
  } catch (error) {
    console.error("❌ Erreur getProductDetails:", error);
    return { error: "Erreur lors de la récupération des détails du produit." };
  }
}

/**
 * Tool 3 : checkProductAvailability
 * Vérifie la disponibilité réelle en base de données sans fausses garanties.
 */
export async function checkProductAvailability({ productId }) {
  try {
    const products = await getAllProducts();
    const product = products.find(p => p.id === productId || String(p.id) === String(productId));

    if (!product) {
      return { available: false, stock: null, message: "Produit non trouvé en magasin." };
    }

    return {
      available: product.available !== undefined ? product.available : (product.stock !== undefined ? product.stock : null),
      stock: product.stock !== undefined ? product.stock : null,
      name: product.name,
      price: product.price
    };
  } catch (error) {
    console.error("❌ Erreur checkProductAvailability:", error);
    return { available: false, stock: null };
  }
}
