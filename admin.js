/* ==============================
GESTION DES COMMANDES & PRODUITS (FIREBASE)
============================== */
let allCommandes = [];

// ========== جعل الدوال متاحة عالميًا (مهم جدًا) ==========
window.showDetail = showDetail;
window.deleteCommande = deleteCommande;
window.updateOrderStatus = updateOrderStatus;
window.closeDetail = closeDetail;
window.exportCommandes = exportCommandes;
window.openAddProductModal = openAddProductModal;
window.closeAddProductModal = closeAddProductModal;
window.clearFilters = clearFilters;
window.filterCommandes = filterCommandes;

// ========== CHARGEMENT DES COMMANDES ==========
function loadCommandes() {
    const tbody = document.getElementById('ordersTableBody');
    if (!tbody) {
        console.error("❌ ordersTableBody non trouvé");
        return;
    }
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:40px;">Chargement des commandes...</td></tr>';
    
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
            console.error("❌ Erreur Firebase: ", error);
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
            <td>${cmd.firstName || ''} ${cmd.lastName || ''}</td>
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
                <button class="action-btn" onclick="showDetail('${cmd.orderNumber}')">
                    <i class="fas fa-eye"></i> Détails
                </button>
                <button class="delete-btn" onclick="deleteCommande('${cmd.orderNumber}')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// ========== MODAL DÉTAILS COMMANDE ==========
function showDetail(orderNumber) {
    console.log("🔍 showDetail appelé pour:", orderNumber);
    const cmd = allCommandes.find(c => c.orderNumber === orderNumber);
    
    if (!cmd) {
        alert("❌ Commande introuvable: " + orderNumber);
        return;
    }
    
    const modal = document.getElementById('detailModal');
    if (!modal) {
        alert("❌ Modal detailModal non trouvé!");
        return;
    }
    
    // Stocker les données dans le modal
    modal.dataset.firebaseId = cmd.id;
    modal.dataset.currentOrderNumber = orderNumber;
    
    // Remplir les informations
    document.getElementById('detailOrderNumber').textContent = cmd.orderNumber || 'N/A';
    document.getElementById('detailDate').textContent = formatDateTime(cmd.date);
    document.getElementById('detailName').textContent = `${cmd.firstName || ''} ${cmd.lastName || ''}`;
    document.getElementById('detailPhone1').textContent = cmd.phone1 || '—';
    document.getElementById('detailPhone2').textContent = cmd.phone2 || '—';
    document.getElementById('detailWilaya').textContent = cmd.wilaya || '—';
    document.getElementById('detailCommune').textContent = cmd.commune || '—';
    document.getElementById('detailOrderType').textContent = cmd.orderType === 'domicile' ? '🏠 Livraison à domicile' : '🏪 Stop Desk';
    
    // Statut
    const status = cmd.status || 'pending';
    const badge = document.getElementById('detailStatusBadge');
    badge.textContent = getStatusLabel(status);
    badge.className = 'status-badge-table ' + getStatusClass(status);
    
    // Produits
    const itemsContainer = document.getElementById('detailItems');
    if (cmd.cartItems && cmd.cartItems.length > 0) {
        itemsContainer.innerHTML = cmd.cartItems.map(item => `
            <div class="item-entry">
                <div>
                    <strong>${item.name || 'Produit inconnu'}</strong><br>
                    ${item.price || 0} DA × ${item.quantity || 1}
                </div>
                <div>
                    <strong>${((item.price || 0) * (item.quantity || 1)).toFixed(2)} DA</strong>
                </div>
            </div>
        `).join('');
    } else {
        itemsContainer.innerHTML = '<p style="text-align:center; color:#999;">📭 Aucun produit</p>';
    }
    
    // Totaux
    document.getElementById('detailCartTotal').textContent = (cmd.cartTotal || 0).toFixed(2);
    document.getElementById('detailShipping').textContent = (cmd.shippingPrice || 0).toFixed(2);
    document.getElementById('detailTotal').textContent = (cmd.grandTotal || 0).toFixed(2);
    
    // === زر الواتساب الجديد ===
    const whatsappContainer = document.getElementById('detailWhatsappContainer');
    if (whatsappContainer) {
        const phone = cmd.phone1 ? cmd.phone1.replace(/[^0-9]/g, '') : '';
        const internationalPhone = phone.startsWith('0') ? '213' + phone.substring(1) : (phone.startsWith('213') ? phone : '213' + phone);
        const statusLabel = getStatusLabel(cmd.status || 'pending');
        const message = `مرحباً ${cmd.firstName || ''}، تحديث بخصوص طلبك رقم ${cmd.orderNumber}: ${statusLabel}. شكراً لثقتكم بـ Amar Informatique.`;
        const whatsappUrl = `https://wa.me/${internationalPhone}?text=${encodeURIComponent(message)}`;
        
        whatsappContainer.innerHTML = `
            <a href="${whatsappUrl}" target="_blank" class="action-btn" style="background:#25D366; color:white; text-decoration:none; display:inline-flex; align-items:center; gap:5px; margin-top:10px; width:100%; justify-content:center;">
                <i class="fab fa-whatsapp"></i> إشعار العميل عبر واتساب
            </a>
        `;
    }
    
    // Afficher le modal
    modal.classList.add('active');
    console.log("✅ Modal affiché avec succès");
}

function closeDetail() {
    const modal = document.getElementById('detailModal');
    if (modal) {
        modal.classList.remove('active');
    }
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
        // 1. تحديث البيانات المحلية
        const cmdIndex = allCommandes.findIndex(c => c.orderNumber === orderNumber);
        if (cmdIndex !== -1) allCommandes[cmdIndex].status = newStatus;
        
        // 2. حفظ إشعار في قاعدة البيانات (ليظهر في صفحة التتبع)
        db.collection("notifications").add({
            orderNumber: orderNumber,
            message: `تم تحديث حالة طلبك إلى: ${getStatusLabel(newStatus)}`,
            status: newStatus,
            date: new Date().toISOString(),
            read: false
        }).catch(err => console.error("Erreur notification", err));
        
        // 3. عرض إشعار نجاح للأدمن
        showNotification('✅ Statut mis à jour');
        displayCommandes(allCommandes);
        showDetail(orderNumber); // إعادة تحميل التفاصيل لتحديث زر الواتساب
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
        const form = document.getElementById('addProductForm');
        if (form) form.reset();
        const preview = document.getElementById('imagePreview');
        if (preview) preview.innerHTML = '';
    }
}

function closeAddProductModal() {
    const modal = document.getElementById('addProductModal');
    if (modal) modal.classList.remove('active');
}

// ========== INITIALISATION ==========
document.addEventListener('DOMContentLoaded', () => {
    console.log("✅ DOMContentLoaded - Chargement des commandes...");
    loadCommandes();
    
    // Écouteurs filtres
    document.getElementById('searchInput')?.addEventListener('input', filterCommandes);
    document.getElementById('filterType')?.addEventListener('change', filterCommandes);
    document.getElementById('filterWilaya')?.addEventListener('change', filterCommandes);
    
    // Bouton reset
    const resetBtn = document.querySelector('.filters button');
    if (resetBtn) resetBtn.addEventListener('click', clearFilters);
    
    // Formulaire ajout produit
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
                
                if (typeof storage === 'undefined') {
                    throw new Error("Firebase Storage non initialisé");
                }
                
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
                console.error("❌ Erreur complète: ", error);
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
});

// ========== UTILITAIRES ==========
function showNotification(msg) {
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();
    
    const n = document.createElement('div');
    n.className = 'notification';
    n.textContent = msg;
    n.style.cssText = `position: fixed; top: 20px; right: 20px; background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 15px 25px; border-radius: 10px; z-index: 9999; font-size: 0.95rem; font-weight: 600; box-shadow: 0 10px 40px rgba(16, 185, 129, 0.4); animation: slideIn 0.3s ease;`;
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

// Styles pour les notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
    @keyframes slideOut { from { transform: translateX(0); opacity: 1; } to { transform: translateX(100%); opacity: 0; } }
`;
document.head.appendChild(style);
