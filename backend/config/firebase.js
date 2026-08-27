import dotenv from 'dotenv';
dotenv.config();

const projectId = process.env.FIREBASE_PROJECT_ID || 'amar-informatique';

/**
 * Récupère tous les produits depuis Firestore (API REST publique)
 * Sans dépendance lourde ni problème de clés d'administration Google.
 */
export async function getAllProducts() {
  try {
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/produits`;
    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' }
    });

    if (response.ok) {
      const data = await response.json();
      if (data.documents && data.documents.length > 0) {
        return data.documents.map(doc => {
          const docId = doc.name.split('/').pop();
          const fields = doc.fields || {};
          return {
            id: docId,
            name: fields.name?.stringValue || 'Produit Informatique',
            category: fields.category?.stringValue || '',
            description: fields.description?.stringValue || '',
            price: fields.price?.doubleValue || fields.price?.integerValue ? Number(fields.price.doubleValue || fields.price.integerValue) : (fields.price?.stringValue ? parseFloat(fields.price.stringValue) : 0),
            oldPrice: fields.oldPrice?.doubleValue || fields.oldPrice?.integerValue ? Number(fields.oldPrice.doubleValue || fields.oldPrice.integerValue) : null,
            image: fields.image?.stringValue || 'logo.jpg',
            promo: fields.promo?.booleanValue || false,
            featured: fields.featured?.booleanValue || false,
            createdAt: fields.createdAt?.timestampValue || new Date().toISOString()
          };
        });
      }
    }
  } catch (err) {
    console.warn("⚠️ Firestore REST Query Warning:", err.message);
  }

  // Échantillons de démonstration Amar Informatique si Firestore est temporairement inaccessible
  return [
    {
      id: "demo-1",
      name: "Dell Latitude 5400 Core i5 8th 16GB SSD 512GB",
      category: "laptop",
      description: "PC Portable Professionnel Dell Latitude 5400, Intel Core i5 8365U, 16Go RAM DDR4, SSD 512Go NVMe, Écran 14 IPS Full HD, Grade A+.",
      price: 52000,
      oldPrice: 58000,
      promo: true,
      featured: true,
      image: "logo.jpg"
    },
    {
      id: "demo-2",
      name: "Lenovo ThinkPad T490 i7 8th 16GB SSD 512GB MX250",
      category: "laptop",
      description: "Ultrabook Gamer & Pro Lenovo ThinkPad T490, Intel Core i7 8565U, 16GB RAM, 512GB SSD, NVIDIA GeForce MX250 2GB, Écran 14 Full HD IPS.",
      price: 68000,
      oldPrice: 75000,
      promo: true,
      featured: true,
      image: "logo.jpg"
    },
    {
      id: "demo-3",
      name: "HP ZBook 15 G5 Workstation Core i7 8th RTX 4GB RAM 32GB",
      category: "laptop",
      description: "Station de travail Workstation Montage vidéo & 3D, HP ZBook 15 G5, Intel Core i7 8850H 6 Coeurs, 32 Go RAM, 512 Go SSD + 1TB HDD, Carte graphique NVIDIA Quadro P2000 4GB DDR5.",
      price: 115000,
      oldPrice: 125000,
      promo: false,
      featured: true,
      image: "logo.jpg"
    },
    {
      id: "demo-4",
      name: "Imprimante Laser HP LaserJet Pro M404dn",
      category: "imprimante_laser",
      description: "Imprimante Laser Monochrome Haute Vitesse HP LaserJet Pro M404dn, Recto-Verso Automatique, Réseau Ethernet, Impression jusqu'à 38 ppm.",
      price: 39000,
      oldPrice: 43000,
      promo: false,
      featured: false,
      image: "logo.jpg"
    },
    {
      id: "demo-5",
      name: "Imprimante Jet d'encre Epson EcoTank L3250 WiFi",
      category: "imprimante_jet_encre",
      description: "Multifonction 3-en-1 Epson EcoTank L3250 Réservoir d'encre rechargeable, WiFi Direct, Impression couleur ultra économique, Idéal bureautique et étudiants.",
      price: 34500,
      oldPrice: 37000,
      promo: true,
      featured: true,
      image: "logo.jpg"
    }
  ];
}
