let allCommandes = [];
let allProducts = [];

// ========== CHARGEMENT DES COMMANDES ==========
function loadCommandes() {
  // ... (استخدم الكود الحالي لديك دون تغيير)
}

// ========== CHARGEMENT DES PRODUITS ==========
function loadProductsAdmin() {
  const tbody = document.getElementById('productsTableBody');
  if (!tbody) return;

  tbody.innerHTML = '<tr><td colspan="5">Chargement...</td></tr>';

  db.collection("produits")
    .get()
    .then((snapshot) => {
      allProducts = [];
      snapshot.forEach(doc => {
        allProducts.push({ id: doc.id, ...doc.data() });
      });
      displayProductsAdmin(allProducts);
    })
    .catch((error) => {
      console.error("Erreur chargement produits:", error);
      tbody.innerHTML = `<tr><td colspan="5">Erreur de chargement</td></tr>`;
    });
}

// ========== AFFICHAGE PRODUITS ==========
function displayProductsAdmin(products) {
  const tbody = document.getElementById('productsTableBody');
  if (products.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5">Aucun produit</td></tr>`;
    return;
  }
  tbody.innerHTML = products.map(p => `
    <tr>
      <td><img src="${p.image || ''}" alt="" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px;"></td>
      <td>${p.name}</td>
      <td>${p.category || '—'}</td>
      <td>${(p.price || 0).toFixed(2)} DA</td>
      <td>
        <button class="action-btn" style="background-color: #f39c12;" onclick="openEditProduct('${p.id}')">✏️ Modifier</button>
        <button class="delete-btn" onclick="deleteProduct('${p.id}')">🗑 Supprimer</button>
      </td>
    </tr>
  `).join('');
}

// ========== MODAL ==========
function openAddProductModal() {
  document.getElementById('productModalTitle').textContent = '➕ Ajouter un Produit';
  document.getElementById('productId').value = '';
  document.getElementById('productForm').reset();
  document.getElementById('imagePreview').innerHTML = '';
  document.getElementById('productModal').classList.add('active');
}

function openEditProduct(productId) {
  const product = allProducts.find(p => p.id === productId);
  if (!product) return;

  document.getElementById('productModalTitle').textContent = '✏️ Modifier Produit';
  document.getElementById('productId').value = product.id;
  document.getElementById('productName').value = product.name || '';
  document.getElementById('productCategory').value = product.category || '';
  document.getElementById('productDescription').value = product.description || '';
  document.getElementById('productPrice').value = product.price || '';

  const preview = document.getElementById('imagePreview');
  preview.innerHTML = product.image ? `<img src="${product.image}" style="max-width:100%; max-height:150px; border-radius:4px;">` : '';

  document.getElementById('productModal').classList.add('active');
}

function closeProductModal() {
  document.getElementById('productModal').classList.remove('active');
}

// ========== SAUVEGARDER PRODUIT ==========
document.getElementById('productForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const productId = document.getElementById('productId').value;
  const name = document.getElementById('productName').value.trim();
  const category = document.getElementById('productCategory').value;
  const description = document.getElementById('productDescription').value.trim();
  const price = parseFloat(document.getElementById('productPrice').value);

  if (!name || !category || isNaN(price) || price <= 0) {
    alert("⚠️ Veuillez remplir : Nom, Catégorie et Prix valide.");
    return;
  }

  let imageUrl = '';
  const fileInput = document.getElementById('productImageFile');
  const file = fileInput.files[0];

  if (file) {
    try {
      showNotification('📤 Téléchargement de l\'image...');
      const timestamp = Date.now();
      const safeName = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
      const storageRef = storage.ref(`produits/${safeName}`);
      await storageRef.put(file);
      imageUrl = await storageRef.getDownloadURL();
    } catch (error) {
      console.error("❌ Erreur upload:", error);
      alert("Erreur lors du téléchargement de l'image.");
      return;
    }
  } else if (!productId) {
    alert("⚠️ Veuillez sélectionner une image.");
    return;
  }

  const productData = {
    name,
    image: imageUrl,
    category,
    description: description || '',
    price,
    dateAdded: new Date().toISOString()
  };

  try {
    if (productId) {
      await db.collection("produits").doc(productId).update(productData);
      showNotification('✅ Produit mis à jour!');
    } else {
      await db.collection("produits").add(productData);
      showNotification('✅ Produit ajouté avec succès!');
    }
    closeProductModal();
    loadProductsAdmin();
  } catch (error) {
    console.error("❌ Erreur sauvegarde:", error);
    alert("Erreur lors de l'enregistrement.");
  }
});

// ========== SUPPRIMER PRODUIT ==========
async function deleteProduct(productId) {
  if (!confirm("⚠️ Supprimer ce produit ? Cette action est irréversible.")) return;
  try {
    await db.collection("produits").doc(productId).delete();
    showNotification('🗑 Produit supprimé');
    loadProductsAdmin();
  } catch (error) {
    console.error("Erreur suppression:", error);
    alert("Erreur lors de la suppression.");
  }
}

// ========== معاينة الصورة ==========
document.addEventListener('DOMContentLoaded', () => {
  const fileInput = document.getElementById('productImageFile');
  const preview = document.getElementById('imagePreview');
  if (fileInput && preview) {
    fileInput.addEventListener('change', function(e) {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        preview.innerHTML = `
          <div style="border: 1px dashed #ccc; padding: 10px; border-radius: 6px; text-align: center;">
            <img src="${event.target.result}" alt="Aperçu" style="max-width: 100%; max-height: 150px; border-radius: 4px; margin-bottom: 8px;">
            <p style="font-size: 0.9rem; color: #555;">${file.name} (${(file.size / 1024).toFixed(1)} KB)</p>
          </div>
        `;
      };
      reader.readAsDataURL(file);
    });
  }
});

// ========== UTILITAIRES ==========
function showNotification(msg) {
  const n = document.createElement('div');
  n.textContent = msg;
  n.style.cssText = `
    position: fixed; top: 20px; right: 20px;
    background: #27ae60; color: white;
    padding: 12px 18px; border-radius: 5px;
    z-index: 9999; font-size: 1rem;
  `;
  document.body.appendChild(n);
  setTimeout(() => n.remove(), 3000);
}

// ========== INITIALISATION ==========
document.addEventListener('DOMContentLoaded', () => {
  // تحميل الطلبات (من كودك الحالي)
  // loadCommandes(); // ← فعّله إذا أردت

  // تحميل المنتجات
  loadProductsAdmin();
});
