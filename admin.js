/* ==============================
GESTION DES COMMANDES & PRODUITS (FIREBASE)
============================== */
let allCommandes = [];

// ========== جعل الدوال متاحة عالميًا ==========
window.showDetail = showDetail;
window.deleteCommande = deleteCommande;
window.updateOrderStatus = updateOrderStatus;
window.closeDetail = closeDetail;
window.exportCommandes = exportCommandes;
window.openAddProductModal = openAddProductModal;
window.closeAddProductModal = closeAddProductModal;
window.clearFilters = clearFilters;

// ========== CHARGEMENT DES COMMANDES ==========
function loadCommandes() {
  const tbody = document.getElementById('ordersTableBody');
  if (!tbody) return;
  
  tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:40px;"><i class="fas fa-spinner fa-spin fa-2x"></i><br><br>Chargement des commandes...</td></tr>';
  
  db.collection("commandes")
    .orderBy("date", "desc")
    .get()
    .then((snapshot) => {
      allCommandes = [];
      snapshot.forEach(doc => {
        allCommandes.push({ id: doc.id, ...doc.data() });
      });
      displayCommandes(allCommandes);
      updateStats();
      initializeWilayaFilter();
    })
    .catch((error) => {
      console.error("❌ Erreur Firebase:", error);
      tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:40px; color:#e74c3c;">❌ Erreur de chargement: ${error.message}</td></tr>`;
    });
}

// ========== AFFICHAGE COMMANDES ==========
function displayCommandes(commandes) {
  const tbody = document.getElementById('ordersTableBody');
  if (!tbody) return;
  
  if (commandes.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:40px; color:#999;">📭 Aucune commande trouvée</td></tr>`;
    return;
  }
  
  tbody.innerHTML = commandes.map(cmd => `
    <tr>
      <td class="order-id">${cmd.orderNumber || 'N/A'}</td>
      <td>
        <div class="client-cell">
          <div class="client-avatar">${(cmd.firstName || '?')[0]}${(cmd.lastName || '?')[0]}</div>
          <div class="client-info">
            <div class="client-name">${cmd.firstName || ''} ${cmd.lastName || ''}</div>
          </div>
        </div>
      </td>
      <td>
        <span class="order-type ${cmd.orderType || ''}">
          ${cmd.orderType === 'domicile' ? '🏠 Domicile' : '🏪 Stop Desk'}
        </span>
      </td>
      <td>${cmd.wilaya || 'N/A'}</td>
      <td>${cmd.phone1 || 'N/A'}</td>
      <td class="total-price">${(cmd.grandTotal || 0).toFixed(2)} DA</td>
      <td>
        <span class="status-badge-table ${getStatusClass(cmd.status || 'pending')}">
          ${getStatusLabel(cmd.status || 'pending')}
        </span>
      </td>
      <td>
        <div class="action-buttons">
          <button class="btn-details" onclick="showDetail('${cmd.orderNumber}')">
            <i class="fas fa-eye"></i> Détails
          </button>
          <button class="btn-delete" onclick="deleteCommande('${cmd.orderNumber}')">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

// ========== MODAL DÉTAILS COMMANDE ==========
function showDetail(orderNumber) {
  console.log("🔍 showDetail:", orderNumber);
  
  const cmd = allCommandes.find(c => c.orderNumber === orderNumber);
  if (!cmd) {
    console.warn("⚠️ Commande non trouvée:", orderNumber);
    return;
  }
  
  const modal = document.getElementById('detailModal');
  if (!modal) {
    console.error("❌ Modal #detailModal non trouvé!");
    return;
  }
  
  // تخزين البيانات في modal
  modal.dataset.firebaseId = cmd.id;
  modal.dataset.currentOrderNumber = orderNumber;
  
  // دالة مساعدة لتعيين النص بأمان
  const setText = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value ?? '—';
    else console.warn(`⚠️ Élément #${id} non trouvé`);
  };
  
  // تعبئة البيانات
  setText('detailOrderNumber', cmd.orderNumber);
  setText('detailDate', formatDateTime(cmd.date));
  setText('detailName', `${cmd.firstName ?? ''} ${cmd.lastName ?? ''}`);
  setText('detailPhone1', cmd.phone1);
  setText('detailPhone2', cmd.phone2);
  setText('detailWilaya', cmd.wilaya);
  setText('detailCommune', cmd.commune);
  setText('detailOrderType', cmd.orderType === 'domicile' ? '🏠 Domicile' : '🏪 Stop Desk');
  
  // Statut
  const status = cmd.status || 'pending';
  const badge = document.getElementById('detailStatusBadge');
  if (badge) {
    badge.textContent = getStatusLabel(status);
    badge.className = 'status-badge-table ' + getStatusClass(status);
  }
  
  // Produits
  const itemsContainer = document.getElementById('detailItems');
  if (itemsContainer) {
    if (cmd.cartItems?.length) {
      itemsContainer.innerHTML = cmd.cartItems.map(it => `
        <div class="item-entry">
          <div><strong>${it.name || 'Produit inconnu'}</strong><br>${it.price || 0} DA × ${it.quantity || 1}</div>
          <div><strong>${((it.price || 0) * (it.quantity || 1)).toFixed(2)} DA</strong></div>
        </div>
      `).join('');
    } else {
      itemsContainer.innerHTML = '<p style="text-align:center;color:#999;">Aucun produit</p>';
    }
  }
  
  // Totaux
  setText('detailCartTotal', (cmd.cartTotal || 0).toFixed(2));
  setText('detailShipping', (cmd.shippingPrice || 0).toFixed(2));
  setText('detailTotal', (cmd.grandTotal || 0).toFixed(2));
  
  // إظهار المودال
  modal.classList.add('active');
  console.log("✅ Modal affiché avec succès");
}
function closeDetail() {
  const modal = document.getElementById('detailModal');
  if (modal) modal.classList.remove('active');
}

// ========== GESTION STATUT ==========
function getStatusClass(status) {
  return {
    pending: 'status-pending',
    accepted: 'status-accepted',
    shipped: 'status-shipped',
    arrived: 'status-arrived',
    returned: 'status-returned'
  }[status] || 'status-pending';
}

function getStatusLabel(status) {
  return {
    pending: '⏳ En attente',
    accepted: '✓ Acceptée',
    shipped: '🚚 En route',
    arrived: '📦 Arrivée',
    returned: '↩️ Retournée'
  }[status] || '⏳ En attente';
}

function updateOrderStatus(newStatus) {
  const modal = document.getElementById('detailModal');
  const firebaseId = modal?.dataset.firebaseId;
  const orderNumber = modal?.dataset.currentOrderNumber;
  
  if (!firebaseId) {
    alert("❌ Erreur: ID Firebase manquant");
    return;
  }
  
  if (!confirm(`Changer le statut de la commande ${orderNumber} à "${getStatusLabel(newStatus)}"?`)) {
    return;
  }
  
  db.collection("commandes").doc(firebaseId).update({
    status: newStatus
  })
  .then(() => {
    const cmd = allCommandes.find(c => c.orderNumber === orderNumber);
    if (cmd) cmd.status = newStatus;
    showNotification('✅ Statut mis à jour');
    displayCommandes(allCommandes);
    showDetail(orderNumber); // تحديث النافذة
  })
  .catch((error) => {
    console.error("❌ Erreur mise à jour:", error);
    alert("❌ Erreur lors de la mise à jour du statut");
  });
}

// ========== SUPPRESSION COMMANDE ==========
function deleteCommande(orderNumber) {
  if (!confirm(`⚠️ Êtes-vous sûr de vouloir supprimer la commande ${orderNumber}?\n\nCette action est irréversible!`)) {
    return;
  }
  
  const cmd = allCommandes.find(c => c.orderNumber === orderNumber);
  if (!cmd || !cmd.id) {
    alert("❌ Commande introuvable");
    return;
  }
  
  db.collection("commandes").doc(cmd.id).delete()
    .then(() => {
      allCommandes = allCommandes.filter(c => c.orderNumber !== orderNumber);
      displayCommandes(allCommandes);
      updateStats();
      initializeWilayaFilter();
      showNotification('🗑️ Commande supprimée');
    })
    .catch((error) => {
      console.error("❌ Erreur suppression:", error);
      alert("❌ Erreur lors de la suppression: " + error.message);
    });
}

// ========== FILTRES COMMANDES ==========
function filterCommandes() {
  const searchInput = document.getElementById('searchInput');
  const filterType = document.getElementById('filterType');
  const filterWilaya = document.getElementById('filterWilaya');
  
  const search = (searchInput?.value || '').toLowerCase();
  const type = filterType?.value || '';
  const wilaya = filterWilaya?.value || '';
  
  const filtered = allCommandes.filter(c => {
    const matchSearch =
      (c.orderNumber || '').toLowerCase().includes(search) ||
      ((c.firstName || '').toLowerCase().includes(search)) ||
      ((c.lastName || '').toLowerCase().includes(search)) ||
      ((c.phone1 || '').includes(search));
    const matchType = !type || c.orderType === type;
    const matchWilaya = !wilaya || c.wilaya === wilaya;
    return matchSearch && matchType && matchWilaya;
  });
  
  displayCommandes(filtered);
}

function clearFilters() {
  const searchInput = document.getElementById('searchInput');
  const filterType = document.getElementById('filterType');
  const filterWilaya = document.getElementById('filterWilaya');
  
  if (searchInput) searchInput.value = '';
  if (filterType) filterType.value = '';
  if (filterWilaya) filterWilaya.value = '';
  
  filterCommandes();
}

// ========== STATISTIQUES ==========
function updateStats() {
  const totalEl = document.getElementById('totalCommandes');
  const revenuEl = document.getElementById('totalRevenu');
  const domicileEl = document.getElementById('totalDomicile');
  const stopdeskEl = document.getElementById('totalStopdesk');
  
  if (totalEl) totalEl.textContent = allCommandes.length;
  
  const totalRevenu = allCommandes.reduce((sum, c) => sum + (c.grandTotal || 0), 0);
  if (revenuEl) revenuEl.textContent = totalRevenu.toFixed(2) + ' DA';
  
  const domicile = allCommandes.filter(c => c.orderType === 'domicile').length;
  const stopdesk = allCommandes.filter(c => c.orderType === 'stopdesk').length;
  
  if (domicileEl) domicileEl.textContent = domicile;
  if (stopdeskEl) stopdeskEl.textContent = stopdesk;
}

// ========== FILTRE WILAYA ==========
function initializeWilayaFilter() {
  const select = document.getElementById('filterWilaya');
  if (!select) return;
  
  select.innerHTML = '<option value="">Toutes les wilayas</option>';
  const wilayas = [...new Set(allCommandes.map(c => c.wilaya).filter(Boolean))].sort();
  wilayas.forEach(w => {
    const opt = document.createElement('option');
    opt.value = w;
    opt.textContent = w;
    select.appendChild(opt);
  });
}

// ========== EXPORT CSV ==========
function exportCommandes() {
  if (allCommandes.length === 0) {
    alert("⚠️ Aucune commande à exporter");
    return;
  }
  
  let csv = 'N° Commande;Client;Téléphone;Wilaya;Commune;Type;Total (DA);Statut;Date\n';
  allCommandes.forEach(c => {
    csv += `"${c.orderNumber || ''}";"${c.firstName || ''} ${c.lastName || ''}";"${c.phone1 || ''}";"${c.wilaya || ''}";"${c.commune || ''}";"${c.orderType || ''}";"${(c.grandTotal || 0).toFixed(2)}";"${c.status || 'pending'}";"${c.date || ''}"\n`;
  });
  
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `commandes_amar_informatique_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  
  showNotification('📥 Export CSV réussi!');
}

// ========== AJOUT PRODUIT ==========
function openAddProductModal() {
  const modal = document.getElementById('addProductModal');
  if (modal) {
    modal.classList.add('active');
    document.getElementById('addProductForm')?.reset();
    document.getElementById('imagePreview').innerHTML = '';
  }
}

function closeAddProductModal() {
  const modal = document.getElementById('addProductModal');
  if (modal) modal.classList.remove('active');
}

// معاينة الصورة
document.addEventListener('DOMContentLoaded', () => {
  const fileInput = document.getElementById('productImageFile');
  if (fileInput) {
    fileInput.addEventListener('change', function(e) {
      const preview = document.getElementById('imagePreview');
      if (!preview) return;
      
      preview.innerHTML = '';
      if (this.files && this.files[0]) {
        const reader = new FileReader();
        reader.onload = function(event) {
          const img = document.createElement('img');
          img.src = event.target.result;
          img.style.maxWidth = '100%';
          img.style.maxHeight = '200px';
          img.style.borderRadius = '8px';
          img.style.marginTop = '10px';
          preview.appendChild(img);
        };
        reader.readAsDataURL(this.files[0]);
      }
    });
  }
  
  // حفظ المنتج
  const form = document.getElementById('addProductForm');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const name = document.getElementById('productName')?.value.trim();
      const category = document.getElementById('productCategory')?.value;
      const description = document.getElementById('productDescription')?.value.trim();
      const priceInput = document.getElementById('productPrice')?.value;
      const fileInput = document.getElementById('productImageFile');
      const file = fileInput?.files[0];
      
      if (!name || !category || !priceInput || !file) {
        alert("⚠️ Veuillez remplir tous les champs obligatoires.");
        return;
      }
      
      const price = parseFloat(priceInput);
      if (isNaN(price) || price <= 0) {
        alert("⚠️ Le prix doit être un nombre positif.");
        return;
      }
      
      try {
        showNotification('📤 Téléchargement de l\'image...');
        
        const storageRef = storage.ref();
        const safeFileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
        const imageRef = storageRef.child(`produits/${safeFileName}`);
        await imageRef.put(file);
        const imageUrl = await imageRef.getDownloadURL();
        
        const nouveauProduit = {
          name,
          image: imageUrl,
          category,
          description: description || '',
          price,
          dateAdded: new Date().toISOString()
        };
        
        await db.collection("produits").add(nouveauProduit);
        
        showNotification('✅ Produit ajouté avec succès!');
        closeAddProductModal();
        form.reset();
        document.getElementById('imagePreview').innerHTML = '';
        
      } catch (error) {
        console.error("❌ Erreur complète:", error);
        let msg = "❌ Erreur inconnue.";
        if (error.code === 'storage/unauthorized') {
          msg = "❌ Accès refusé à Firebase Storage. Vérifiez les règles.";
        } else if (error.code === 'permission-denied') {
          msg = "❌ Permission refusée dans Firestore.";
        }
        alert(msg + "\nVérifiez la console pour plus de détails.");
      }
    });
  }
  
  // Écouteurs filtres
  document.getElementById('searchInput')?.addEventListener('input', filterCommandes);
  document.getElementById('filterType')?.addEventListener('change', filterCommandes);
  document.getElementById('filterWilaya')?.addEventListener('change', filterCommandes);
  
  // تحميل الطلبات
  loadCommandes();
});

// ========== UTILITAIRES ==========
function showNotification(msg) {
  const existing = document.querySelector('.notification');
  if (existing) existing.remove();
  
  const n = document.createElement('div');
  n.className = 'notification';
  n.textContent = msg;
  n.style.cssText = `
    position: fixed; top: 20px; right: 20px;
    background: linear-gradient(135deg, #10b981, #059669);
    color: white; padding: 15px 25px;
    border-radius: 10px; z-index: 9999;
    font-size: 0.95rem; font-weight: 600;
    box-shadow: 0 10px 40px rgba(16, 185, 129, 0.4);
    animation: slideIn 0.3s ease;
  `;
  document.body.appendChild(n);
  setTimeout(() => {
    n.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => n.remove(), 300);
  }, 3000);
}

function formatDateTime(d) {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (e) {
    return '—';
  }
}

// أنيميشن للإشعارات
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  @keyframes slideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
  }
  
  .client-cell {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  
  .client-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: linear-gradient(135deg, #667eea, #764ba2);
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 0.9rem;
    color: white;
  }
  
  .client-info {
    display: flex;
    flex-direction: column;
  }
  
  .client-name {
    font-weight: 600;
    color: #2c3e50;
  }
  
  .item-entry {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px;
    border-bottom: 1px solid #eee;
  }
  
  .item-entry:last-child {
    border-bottom: none;
  }
  
  .item-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  
  .item-info strong {
    color: #2c3e50;
  }
  
  .item-info small {
    color: #999;
    font-size: 0.85rem;
  }
  
  .item-total {
    font-weight: 700;
    color: #e74c3c;
  }
`;
document.head.appendChild(style);

