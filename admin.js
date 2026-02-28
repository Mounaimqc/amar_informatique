/* ==============================
GESTION DES COMMANDES & PRODUITS (FIREBASE)
============================== */
let allCommandes = [];
let allProduits = [];
let isFirstLoad = true;

// ========== Export des fonctions ==========
window.showDetail = showDetail;
window.deleteCommande = deleteCommande;
window.updateOrderStatus = updateOrderStatus;
window.closeDetail = closeDetail;
window.exportCommandes = exportCommandes;
window.openAddProductModal = openAddProductModal;
window.closeAddProductModal = closeAddProductModal;
window.openEditProductModal = openEditProductModal;
window.closeEditProductModal = closeEditProductModal;
window.saveProduct = saveProduct;
window.updateProduct = updateProduct;
window.deleteProduct = deleteProduct;
window.clearFilters = clearFilters;
window.filterCommandes = filterCommandes;
window.loadProduits = loadProduits;

// ========== 🔔 CHARGEMENT COMMANDES (Real-time avec Notification) ==========
function loadCommandes() {
    const tbody = document.getElementById('ordersTableBody');
    if (!tbody) { console.error("❌ ordersTableBody non trouvé"); return; }
    tbody.innerHTML = '<tr><td colspan="7" class="loading-state"><div class="loading-spinner"></div>Chargement...</td></tr>';
    
    // onSnapshot للمراقبة المستمرة
    db.collection("commandes").orderBy("date", "desc").onSnapshot((snapshot) => {
        let newOrdersCount = 0;
        snapshot.docChanges().forEach((change) => {
            if (change.type === "added" && !isFirstLoad) newOrdersCount++;
        });
        if (isFirstLoad) { isFirstLoad = false; }
        else if (newOrdersCount > 0) {
            showNotification(`🔔 ${newOrdersCount} Nouvelle(s) commande(s) !`, 'new-order');
            playNotificationSound();
        }
        allCommandes = [];
        snapshot.forEach(doc => allCommandes.push({ id: doc.id, ...doc.data() }));
        displayCommandes(allCommandes);
        updateStats();
        initializeWilayaFilter();
    }, (error) => {
        console.error("❌ Erreur Firebase:", error);
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:40px;color:#ef4444;">❌ ${error.message}</td></tr>`;
    });
}

// ========== 🔔 صوت الإشعار ==========
function playNotificationSound() {
    const audio = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-software-interface-start-2574.mp3');
    audio.play().catch(e => console.log("Audio play failed", e));
}

// ========== 🛒 CHARGEMENT PRODUITS ==========
function loadProduits() {
    db.collection("produits").orderBy("dateAdded", "desc").get().then((snapshot) => {
        allProduits = [];
        snapshot.forEach(doc => allProduits.push({ id: doc.id, ...doc.data() }));
    }).catch(err => console.error("❌ Erreur produits:", err));
}

// ========== AFFICHAGE COMMANDES ==========
function displayCommandes(commandes) {
    const tbody = document.getElementById('ordersTableBody');
    if (!tbody) return;
    if (commandes.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:40px;color:#94a3b8;">📭 Aucune commande</td></tr>`;
        return;
    }
    tbody.innerHTML = commandes.map(cmd => `
        <tr>
            <td class="order-id">${cmd.orderNumber||'N/A'}</td>
            <td>${cmd.firstName||''} ${cmd.lastName||''}</td>
            <td><span class="status-badge ${cmd.orderType==='domicile'?'status-accepted':'status-pending'}">${cmd.orderType==='domicile'?'🏠 Domicile':'🏪 Stop Desk'}</span></td>
            <td>${cmd.wilaya||'N/A'}</td>
            <td>${(cmd.grandTotal||0).toFixed(2)} DA</td>
            <td><span class="status-badge ${getStatusClass(cmd.status||'pending')}">${getStatusLabel(cmd.status||'pending')}</span></td>
            <td><div class="action-buttons">
                <button class="btn-details" onclick="showDetail('${cmd.orderNumber}')"><i class="fas fa-eye"></i> Détails</button>
                <button class="btn-delete" onclick="deleteCommande('${cmd.orderNumber}')"><i class="fas fa-trash"></i></button>
            </div></td>
        </tr>
    `).join('');
}

// ========== MODAL DÉTAILS ==========
function showDetail(orderNumber) {
    const cmd = allCommandes.find(c => c.orderNumber === orderNumber);
    if (!cmd) { alert("❌ Commande introuvable"); return; }
    const modal = document.getElementById('detailModal');
    if (!modal) { alert("❌ Modal non trouvé"); return; }
    modal.dataset.firebaseId = cmd.id;
    modal.dataset.currentOrderNumber = orderNumber;
    const setText = (id, val) => { const el=document.getElementById(id); if(el) el.textContent=val??'—'; };
    setText('detailOrderNumber', cmd.orderNumber);
    setText('detailDate', formatDateTime(cmd.date));
    setText('detailName', `${cmd.firstName||''} ${cmd.lastName||''}`);
    setText('detailPhone1', cmd.phone1); setText('detailPhone2', cmd.phone2);
    setText('detailWilaya', cmd.wilaya); setText('detailCommune', cmd.commune);
    setText('detailOrderType', cmd.orderType === 'domicile' ? '🏠 Domicile' : '🏪 Stop Desk');
    const status = cmd.status || 'pending';
    const badge = document.getElementById('detailStatusBadge');
    if(badge) { badge.textContent = getStatusLabel(status); badge.className = 'status-badge ' + getStatusClass(status); }
    const items = document.getElementById('detailItems');
    if(items) {
        if(cmd.cartItems?.length) {
            items.innerHTML = cmd.cartItems.map(it => `<div class="item-entry"><div><strong>${it.name||'?'}</strong><br>${it.price||0} DA × ${it.quantity||1}</div><div><strong>${((it.price||0)*(it.quantity||1)).toFixed(2)} DA</strong></div></div>`).join('');
        } else { items.innerHTML = '<p style="text-align:center;color:var(--text-muted);">Aucun produit</p>'; }
    }
    setText('detailCartTotal', (cmd.cartTotal||0).toFixed(2));
    setText('detailShipping', (cmd.shippingPrice||0).toFixed(2));
    setText('detailTotal', (cmd.grandTotal||0).toFixed(2));
    modal.classList.add('active');
}
function closeDetail() { document.getElementById('detailModal')?.classList.remove('active'); }
function getStatusClass(s) { return {pending:'status-pending',accepted:'status-accepted',shipped:'status-shipped',arrived:'status-arrived',returned:'status-returned'}[s]||'status-pending'; }
function getStatusLabel(s) { return {pending:'⏳ En attente',accepted:'✓ Acceptée',shipped:'🚚 En route',arrived:'📦 Arrivée',returned:'↩️ Retournée'}[s]||'⏳ En attente'; }

function updateOrderStatus(newStatus) {
    const modal = document.getElementById('detailModal');
    const fid = modal?.dataset.firebaseId, on = modal?.dataset.currentOrderNumber;
    if(!fid) { alert("❌ ID Firebase manquant"); return; }
    if(!confirm(`Changer statut de ${on} à "${getStatusLabel(newStatus)}"?`)) return;
    db.collection("commandes").doc(fid).update({status:newStatus}).then(() => {
        const cmd = allCommandes.find(c => c.orderNumber === on);
        if(cmd) cmd.status = newStatus;
        showNotification('✅ Statut mis à jour', 'success');
        displayCommandes(allCommandes);
        showDetail(on);
    }).catch(err => { console.error(err); alert("❌ Erreur mise à jour"); });
}

function deleteCommande(orderNumber) {
    if(!confirm(`⚠️ Supprimer ${orderNumber}?`)) return;
    const cmd = allCommandes.find(c => c.orderNumber === orderNumber);
    if(!cmd?.id) { alert("❌ Introuvable"); return; }
    db.collection("commandes").doc(cmd.id).delete().then(() => {
        allCommandes = allCommandes.filter(c => c.orderNumber !== orderNumber);
        displayCommandes(allCommandes); updateStats(); initializeWilayaFilter();
        showNotification('🗑️ Supprimée', 'success');
    }).catch(err => { console.error(err); alert("❌ Erreur: "+err.message); });
}

// ========== FILTRES & STATS ==========
function filterCommandes() {
    const s = (document.getElementById('searchInput')?.value||'').toLowerCase();
    const t = document.getElementById('filterType')?.value||'', w = document.getElementById('filterWilaya')?.value||'';
    const filtered = allCommandes.filter(c => {
        const ms = (c.orderNumber||'').toLowerCase().includes(s)||(c.firstName||'').toLowerCase().includes(s)||(c.phone1||'').includes(s);
        return ms && (!t||c.orderType===t) && (!w||c.wilaya===w);
    });
    displayCommandes(filtered);
}
function clearFilters() {
    if(document.getElementById('searchInput')) document.getElementById('searchInput').value='';
    if(document.getElementById('filterType')) document.getElementById('filterType').value='';
    if(document.getElementById('filterWilaya')) document.getElementById('filterWilaya').value='';
    filterCommandes();
}
function updateStats() {
    if(document.getElementById('totalCommandes')) document.getElementById('totalCommandes').textContent = allCommandes.length;
    if(document.getElementById('totalRevenu')) {
        const total = allCommandes.reduce((sum,c)=>sum+(c.grandTotal||0),0);
        document.getElementById('totalRevenu').textContent = total.toFixed(2) + ' DA';
    }
    if(document.getElementById('totalDomicile')) document.getElementById('totalDomicile').textContent = allCommandes.filter(c=>c.orderType==='domicile').length;
    if(document.getElementById('totalStopdesk')) document.getElementById('totalStopdesk').textContent = allCommandes.filter(c=>c.orderType==='stopdesk').length;
}
function initializeWilayaFilter() {
    const sel = document.getElementById('filterWilaya'); if(!sel) return;
    sel.innerHTML = '<option value="">Toutes les wilayas</option>';
    [...new Set(allCommandes.map(c=>c.wilaya).filter(Boolean))].sort().forEach(w => {
        const opt = document.createElement('option'); opt.value=w; opt.textContent=w; sel.appendChild(opt);
    });
}
function exportCommandes() {
    if(!allCommandes.length) { alert("Aucune commande"); return; }
    let csv = 'N°;Client;Téléphone;Wilaya;Type;Total;Statut;Date\n';
    allCommandes.forEach(c => csv += `"${c.orderNumber||''}";"${c.firstName||''} ${c.lastName||''}";"${c.phone1||''}";"${c.wilaya||''}";"${c.orderType||''}";"${(c.grandTotal||0).toFixed(2)}";"${c.status||'pending'}";"${c.date||''}"\n`);
    const blob = new Blob([csv],{type:'text/csv;charset=utf-8;'});
    const a = document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=`commandes_${new Date().toISOString().slice(0,10)}.csv`; a.click();
    showNotification('📥 Exporté!', 'success');
}

// ========== 🛒 GESTION PRODUITS (URL GitHub) ==========
function openAddProductModal() {
    const modal = document.getElementById('addProductModal');
    if(modal) { modal.classList.add('active'); document.getElementById('addProductForm')?.reset(); document.getElementById('imagePreview').innerHTML=''; }
}
function closeAddProductModal() { document.getElementById('addProductModal')?.classList.remove('active'); }

function openEditProductModal(productId) {
    const produit = allProduits.find(p => p.id === productId);
    if(!produit) { alert("❌ Produit introuvable"); return; }
    const modal = document.getElementById('editProductModal');
    if(!modal) { alert("❌ Modal edit non trouvé"); return; }
    modal.dataset.productId = productId;
    document.getElementById('editProductName').value = produit.name||'';
    document.getElementById('editProductCategory').value = produit.category||'';
    document.getElementById('editProductPrice').value = produit.price||'';
    document.getElementById('editProductDescription').value = produit.description||'';
    document.getElementById('editProductImageUrl').value = produit.image||'';
    const preview = document.getElementById('editImagePreview');
    if(preview) {
        if(produit.image) preview.innerHTML = `<img src="${produit.image}" alt="${produit.name}" style="max-width:100%;max-height:200px;border-radius:8px;">`;
        else preview.innerHTML = '<p style="color:#999">Aucune image</p>';
    }
    modal.classList.add('active');
}
function closeEditProductModal() { document.getElementById('editProductModal')?.classList.remove('active'); }

async function saveProduct(e) {
    e.preventDefault();
    const name = document.getElementById('productName')?.value.trim();
    const category = document.getElementById('productCategory')?.value;
    const description = document.getElementById('productDescription')?.value.trim();
    const price = parseFloat(document.getElementById('productPrice')?.value);
    const imageUrl = document.getElementById('productImageUrl')?.value.trim();
    if(!name||!category||!price||!imageUrl||isNaN(price)||price<=0) { alert("⚠️ Remplissez tous les champs"); return; }
    if(!imageUrl.includes('github') && !imageUrl.includes('raw.githubusercontent')) {
        if(!confirm("⚠️ L'URL ne semble pas GitHub. Continuer?")) return;
    }
    try {
        showNotification('📤 Ajout en cours...', 'success');
        await db.collection("produits").add({ name, image:imageUrl, category, description:description||'', price, dateAdded:new Date().toISOString() });
        showNotification('✅ Produit ajouté!', 'success');
        closeAddProductModal(); document.getElementById('addProductForm')?.reset(); document.getElementById('imagePreview').innerHTML='';
        loadProduits();
    } catch(err) { console.error(err); alert("❌ "+err.message); }
}

async function updateProduct(e) {
    e.preventDefault();
    const modal = document.getElementById('editProductModal');
    const productId = modal?.dataset.productId;
    if(!productId) { alert("❌ ID manquant"); return; }
    const name = document.getElementById('editProductName')?.value.trim();
    const category = document.getElementById('editProductCategory')?.value;
    const description = document.getElementById('editProductDescription')?.value.trim();
    const price = parseFloat(document.getElementById('editProductPrice')?.value);
    const imageUrl = document.getElementById('editProductImageUrl')?.value.trim();
    if(!name||!category||!price||!imageUrl||isNaN(price)||price<=0) { alert("⚠️ Remplissez tous les champs"); return; }
    try {
        showNotification('🔄 Mise à jour...', 'success');
        await db.collection("produits").doc(productId).update({ name, image:imageUrl, category, description:description||'', price, dateUpdated:new Date().toISOString() });
        showNotification('✅ Produit modifié!', 'success');
        closeEditProductModal(); loadProduits();
    } catch(err) { console.error(err); alert("❌ "+err.message); }
}

function deleteProduct(productId) {
    if(!confirm("⚠️ Supprimer ce produit définitivement?")) return;
    db.collection("produits").doc(productId).delete().then(() => {
        showNotification('🗑️ Produit supprimé', 'success'); loadProduits();
    }).catch(err => { console.error(err); alert("❌ "+err.message); });
}

// ========== 🔔 NOTIFICATIONS ==========
function showNotification(msg, type='success') {
    const existing = document.querySelector('.notification'); if(existing) existing.remove();
    const n = document.createElement('div');
    n.className = `notification ${type}`; n.textContent = msg;
    n.style.cssText = `position:fixed;top:20px;right:20px;padding:1rem 1.5rem;border-radius:12px;font-weight:600;z-index:9999;animation:slideIn 0.3s ease;background:${type==='new-order'?'linear-gradient(135deg,#f59e0b,#d97706)':type==='error'?'var(--danger)':'var(--success)'};color:white`;
    document.body.appendChild(n);
    setTimeout(()=>{ n.style.animation='slideOut 0.3s ease'; setTimeout(()=>n.remove(),300); }, 4000);
}
function formatDateTime(d) { if(!d) return '—'; try{return new Date(d).toLocaleString('fr-FR',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'})}catch{return'—'} }

// ========== INITIALISATION ==========
document.addEventListener('DOMContentLoaded', () => {
    // معاينة صورة الإضافة
    const urlInput = document.getElementById('productImageUrl');
    if(urlInput) urlInput.addEventListener('input', function() {
        const pv = document.getElementById('imagePreview');
        if(pv && this.value.trim()) pv.innerHTML = `<img src="${this.value.trim()}" alt="Preview" style="max-width:100%;max-height:200px;border-radius:8px;">`;
        else if(pv) pv.innerHTML = '';
    });
    // حفظ منتج جديد
    const addForm = document.getElementById('addProductForm');
    if(addForm) addForm.addEventListener('submit', saveProduct);
    // معاينة صورة التعديل
    const editUrlInput = document.getElementById('editProductImageUrl');
    if(editUrlInput) editUrlInput.addEventListener('input', function() {
        const pv = document.getElementById('editImagePreview');
        if(pv && this.value.trim()) pv.innerHTML = `<img src="${this.value.trim()}" alt="Preview" style="max-width:100%;max-height:200px;border-radius:8px;">`;
    });
    // تحديث منتج
    const editForm = document.getElementById('editProductForm');
    if(editForm) editForm.addEventListener('submit', updateProduct);
    // فلاتر
    document.getElementById('searchInput')?.addEventListener('input', filterCommandes);
    document.getElementById('filterType')?.addEventListener('change', filterCommandes);
    document.getElementById('filterWilaya')?.addEventListener('change', filterCommandes);
    // تحميل البيانات
    loadCommandes();
    loadProduits();
});

// ========== AUTH ==========
if(sessionStorage.getItem('adminLogged')!=='true') window.location.href='login.html';
function logout() { sessionStorage.removeItem('adminLogged'); window.location.href='login.html'; }
