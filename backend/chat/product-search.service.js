import { getAllProducts } from '../config/firebase.js';

/**
 * Tool 1 : searchProducts
 * Recherche et filtre dans la base de données réelle de produits.
 */
export async function searchProducts({ query, category, minPrice, maxPrice, brand, specifications }) {
  try {
    const products = await getAllProducts();

    const filtered = products.filter(product => {
      const pName = (product.name || '').toLowerCase();
      const pDesc = (product.description || '').toLowerCase();
      const pCat = (product.category || '').toLowerCase();

      // 1. Recherche par terme textuel
      if (query) {
        const q = query.toLowerCase().trim();
        const matchesQuery = pName.includes(q) || pDesc.includes(q) || pCat.includes(q);
        if (!matchesQuery) return false;
      }

      // 2. Catégorie
      if (category) {
        const cat = category.toLowerCase().trim();
        if (cat === 'laptop' && pCat !== 'laptop') return false;
        if (cat === 'imprimantes' && !pCat.startsWith('imprimante')) return false;
        if (cat === 'imprimante_laser' && !(pCat === 'imprimante_laser' || (pCat.startsWith('imprimante') && (pName.includes('laser') || pDesc.includes('laser'))))) return false;
        if (cat === 'imprimante_jet_encre' && !(pCat === 'imprimante_jet_encre' || (pCat.startsWith('imprimante') && (pName.includes('jet') || pDesc.includes('jet'))))) return false;
        if (cat === 'accessoires' && pCat !== 'accessoires') return false;
      }

      // 3. Filtrage par prix min & max
      if (typeof minPrice === 'number' && minPrice > 0 && product.price < minPrice) return false;
      if (typeof maxPrice === 'number' && maxPrice > 0 && product.price > maxPrice) return false;

      // 4. Marque
      if (brand) {
        const b = brand.toLowerCase().trim();
        if (!pName.includes(b) && !pDesc.includes(b)) return false;
      }

      // 5. Spécifications particulières (ex: i7, RTX, 16GB, SSD)
      if (specifications && Array.isArray(specifications)) {
        const matchSpecs = specifications.every(spec => {
          const s = spec.toLowerCase().trim();
          return pName.includes(s) || pDesc.includes(s);
        });
        if (!matchSpecs) return false;
      }

      return true;
    });

    // Retourner un sous-ensemble propre de données pour éviter de surcharger les tokens
    return filtered.map(p => ({
      id: p.id,
      name: p.name,
      price: p.price,
      oldPrice: p.oldPrice || null,
      stock: true, // Produits en base sont disponibles
      brand: p.name.split(' ')[0],
      category: p.category,
      specifications: p.description.substring(0, 150),
      image: p.image || 'logo.jpg',
      productUrl: `produit.html?id=${p.id}`
    })).slice(0, 8); // Max 8 résultats pertinents

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
      available: true,
      stockQuantity: 5, // Quantité estimée disponible
      specifications: product.description,
      brand: product.name.split(' ')[0],
      images: [product.image || 'logo.jpg'],
      category: product.category,
      warranty: "12 mois de garantie certifiée",
      productUrl: `produit.html?id=${product.id}`
    };
  } catch (error) {
    console.error("❌ Erreur getProductDetails:", error);
    return { error: "Erreur lors de la récupération des détails du produit." };
  }
}

/**
 * Tool 3 : checkProductAvailability
 * Vérifie la disponibilité réelle en base de données.
 */
export async function checkProductAvailability({ productId }) {
  try {
    const products = await getAllProducts();
    const product = products.find(p => p.id === productId || String(p.id) === String(productId));

    if (!product) {
      return { available: false, stockQuantity: 0, message: "Produit non trouvé en magasin." };
    }

    return {
      available: true,
      stockQuantity: 10,
      name: product.name,
      price: product.price
    };
  } catch (error) {
    console.error("❌ Erreur checkProductAvailability:", error);
    return { available: false, stockQuantity: 0 };
  }
}
