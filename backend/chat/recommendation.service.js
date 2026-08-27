import { getAllProducts } from '../config/firebase.js';

/**
 * Tool 4 : getProductRecommendations
 * Recommande des ordinateurs/matériels adaptés au besoin (Gaming, Montage, Bureautique) et au budget.
 */
export async function getProductRecommendations({ usage, budget, category, requirements }) {
  try {
    const products = await getAllProducts();

    let candidates = products.filter(p => {
      // Si budget spécifié, filtrer avec une marge tolérante (+10%)
      if (typeof budget === 'number' && budget > 0) {
        if (p.price > budget * 1.1) return false;
      }

      if (category) {
        const cat = category.toLowerCase().trim();
        if (cat === 'laptop' && p.category !== 'laptop') return false;
        if (cat === 'imprimantes' && !(p.category || '').startsWith('imprimante')) return false;
      }

      return true;
    });

    // Score par cas d'usage
    const scored = candidates.map(p => {
      const pName = (p.name || '').toLowerCase();
      const pDesc = (p.description || '').toLowerCase();
      const text = `${pName} ${pDesc}`;

      let score = 0;

      if (usage) {
        const u = usage.toLowerCase();
        if (u.includes('gaming') || u.includes('jeu') || u.includes('gamer')) {
          if (text.includes('rtx') || text.includes('gtx') || text.includes('quadro') || text.includes('mx') || text.includes('ryzen') || text.includes('i7')) score += 5;
          if (text.includes('16gb') || text.includes('32gb') || text.includes('16 go')) score += 3;
        } else if (u.includes('montage') || u.includes('video') || u.includes('3d') || u.includes('design')) {
          if (text.includes('workstation') || text.includes('quadro') || text.includes('i7') || text.includes('ryzen')) score += 5;
          if (text.includes('32gb') || text.includes('16gb') || text.includes('512gb') || text.includes('1tb')) score += 3;
        } else if (u.includes('bureautique') || u.includes('etudiant') || u.includes('office') || u.includes('travail')) {
          if (text.includes('i5') || text.includes('i3') || text.includes('latitude') || text.includes('thinkpad')) score += 5;
          if (p.price <= 70000) score += 3;
        }
      }

      if (requirements && Array.isArray(requirements)) {
        requirements.forEach(req => {
          if (text.includes(req.toLowerCase())) score += 2;
        });
      }

      // Plus le prix est proche du budget sans le dépasser, bon score
      if (budget && p.price <= budget) {
        score += 2;
      }

      return { product: p, score };
    });

    // Trier par meilleur score puis par prix
    scored.sort((a, b) => b.score - a.score || b.product.price - a.product.price);

    const bestResults = scored.slice(0, 4).map(item => ({
      id: item.product.id,
      name: item.product.name,
      price: item.product.price,
      oldPrice: item.product.oldPrice || null,
      category: item.product.category,
      specifications: item.product.description,
      image: item.product.image || 'logo.jpg',
      available: true,
      productUrl: `produit.html?id=${item.product.id}`
    }));

    return bestResults;
  } catch (error) {
    console.error("❌ Erreur getProductRecommendations:", error);
    return [];
  }
}

/**
 * Tool 5 : compareProducts
 * Compare automatiquement plusieurs produits entre eux.
 */
export async function compareProducts({ productIds }) {
  try {
    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return { error: "Veuillez fournir au moins deux identifiants de produits à comparer." };
    }

    const allProds = await getAllProducts();
    const targetProds = allProds.filter(p => productIds.includes(p.id) || productIds.includes(String(p.id)));

    if (targetProds.length === 0) {
      return { error: "Aucun produit correspondant trouvé." };
    }

    const comparisonList = targetProds.map(p => {
      const desc = p.description || '';
      
      // Extraction basique des specs depuis le texte
      let cpu = "Non spécifié";
      if (desc.includes("i7") || p.name.includes("i7")) cpu = "Intel Core i7";
      else if (desc.includes("i5") || p.name.includes("i5")) cpu = "Intel Core i5";
      else if (desc.includes("i3") || p.name.includes("i3")) cpu = "Intel Core i3";
      else if (desc.includes("Ryzen") || p.name.includes("Ryzen")) cpu = "AMD Ryzen";

      let ram = "Non spécifié";
      if (desc.includes("32GB") || desc.includes("32 Go") || p.name.includes("32GB")) ram = "32 Go DDR4";
      else if (desc.includes("16GB") || desc.includes("16 Go") || p.name.includes("16GB")) ram = "16 Go DDR4";
      else if (desc.includes("8GB") || desc.includes("8 Go") || p.name.includes("8GB")) ram = "8 Go DDR4";

      let gpu = "Intel HD/UHD Integrated";
      if (desc.includes("RTX") || p.name.includes("RTX")) gpu = "NVIDIA GeForce RTX";
      else if (desc.includes("GTX") || p.name.includes("GTX")) gpu = "NVIDIA GeForce GTX";
      else if (desc.includes("Quadro") || p.name.includes("Quadro")) gpu = "NVIDIA Quadro Pro";
      else if (desc.includes("MX250") || p.name.includes("MX")) gpu = "NVIDIA MX Dedicated";

      let storage = "SSD NVMe";
      if (desc.includes("1TB") || desc.includes("1 To")) storage = "1 To SSD";
      else if (desc.includes("512GB") || desc.includes("512 Go")) storage = "512 Go SSD";
      else if (desc.includes("256GB") || desc.includes("256 Go")) storage = "256 Go SSD";

      return {
        id: p.id,
        name: p.name,
        price: p.price,
        processor: cpu,
        ram: ram,
        graphicsCard: gpu,
        storage: storage,
        category: p.category,
        warranty: "12 mois",
        available: true,
        image: p.image || 'logo.jpg',
        productUrl: `produit.html?id=${p.id}`
      };
    });

    return {
      comparisonCount: comparisonList.length,
      products: comparisonList
    };
  } catch (error) {
    console.error("❌ Erreur compareProducts:", error);
    return { error: "Impossible de réaliser la comparaison." };
  }
}
