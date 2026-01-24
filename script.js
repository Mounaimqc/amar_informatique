// ========== VARIABLES GLOBALES ==========
let products = [];
let cart = [];
let currentProductId = null;

// ========== INITIALISATION ==========
document.addEventListener('DOMContentLoaded', function () {
  loadProductsFromFirebase();
  setupEventListeners();
  loadCartFromStorage();

  const modalBtn = document.getElementById('modalAddToCartBtn');
  if (modalBtn) {
    modalBtn.addEventListener('click', () => {
      if (currentProductId) {
        addToCart(currentProductId);
        document.getElementById('productDetailModal').classList.remove('active');
      }
    });
  }
});

// ========== CHARGER LES PRODUITS DEPUIS FIREBASE ==========
async function loadProductsFromFirebase() {
  try {
    const snapshot = await db.collection("produits").get();
    products = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      // التأكد من وجود الحقول الأساسية
      products.push({
        id: doc.id,
        name: data.name || 'Produit sans nom',
        category: data.category || '',
        description: data.description || '',
        price: typeof data.price === 'number' ? data.price : 0,
        image: data.image || ''
      });
    });
    loadProducts();
  } catch (error) {
    console.error("Erreur chargement produits:", error);
    document.getElementById('productsGrid').innerHTML = '<p style="text-align:center; grid-column:1/-1; color:red;">❌ Erreur de chargement des produits.</p>';
  }
}

// ========== AFFICHAGE DES PRODUITS ==========
function loadProducts(filteredProducts = null) {
  const grid = document.getElementById('productsGrid');
  if (!grid) return;

  const productsToDisplay = filteredProducts || products;
  grid.innerHTML = '';

  if (productsToDisplay.length === 0) {
    grid.innerHTML = '<p style="text-align: center; grid-column: 1/-1;">Aucun produit trouvé.</p>';
    return;
  }

  productsToDisplay.forEach(product => {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.onclick = () => openProductDetail(product.id);

    const img = document.createElement('img');
    img.src = product.image || '';
    img.alt = product.name;
    img.className = 'product-image';
    img.onerror = function () {
      this.src = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22250%22 height=%22200%22%3E%3Crect fill=%22%23ddd%22 width=%22250%22 height=%22200%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22 font-family=%22Arial%22 font-size=%2216%22 fill=%22%23666%22%3EImage non disponible%3C/text%3E%3C/svg%3E';
    };

    const info = document.createElement('div');
    info.className = 'product-info';
    const price = parseFloat(product.price) || 0;
    info.innerHTML = `
      <h3 class="product-name">${product.name}</h3>
      <p class="product-category">${product.category || ''}</p>
      <p class="product-description">${product.description || ''}</p>
      <div class="product-footer">
        <span class="product-price">${price.toFixed(2)} DA</span>
        <button class="add-to-cart-btn" onclick="event.stopPropagation(); addToCart('${product.id}')">Ajouter</button>
      </div>
    `;

    card.appendChild(img);
    card.appendChild(info);
    grid.appendChild(card);
  });
}

// ========== MODAL DÉTAIL PRODUIT ==========
function openProductDetail(productId) {
  const product = products.find(p => p.id === productId);
  if (!product) return;

  currentProductId = productId;
  document.getElementById('detailImage').src = product.image || '';
  document.getElementById('detailName').textContent = product.name;
  document.getElementById('detailCategory').textContent = product.category || '';
  document.getElementById('detailDescription').textContent = product.description || 'Pas de description.';
  const price = parseFloat(product.price) || 0;
  document.getElementById('detailPrice').textContent = price.toFixed(2);

  document.getElementById('productDetailModal').classList.add('active');
}

// ========== FONCTIONS DU PANIER ==========
function addToCart(productId) {
  const product = products.find(p => p.id === productId);
  if (!product) {
    showNotification("Produit non trouvé.");
    return;
  }

  const existingItem = cart.find(item => item.id === productId);
  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({
      ...product,
      quantity: 1,
      price: parseFloat(product.price) || 0
    });
  }
  saveCartToStorage();
  updateCartCount();
  showNotification(`${product.name} ajouté au panier!`);
}

function updateQuantity(productId, change) {
  const item = cart.find(item => item.id === productId);
  if (item) {
    item.quantity += change;
    if (item.quantity <= 0) {
      removeFromCart(productId);
    } else {
      saveCartToStorage();
      displayCart();
    }
  }
}

function removeFromCart(productId) {
  cart = cart.filter(item => item.id !== productId);
  saveCartToStorage();
  updateCartCount();
  displayCart();
}

function displayCart() {
  const cartItems = document.getElementById('cartItems');
  let total = 0;
  if (cart.length === 0) {
    cartItems.innerHTML = '<div class="cart-empty">Votre panier est vide</div>';
    document.getElementById('totalPrice').textContent = '0.00';
    document.getElementById('checkoutBtn').disabled = true;
    return;
  }
  cartItems.innerHTML = '';
  cart.forEach(item => {
    const price = parseFloat(item.price) || 0;
    const quantity = parseInt(item.quantity) || 0;
    const itemTotal = price * quantity;
    total += itemTotal;

    const cartItem = document.createElement('div');
    cartItem.className = 'cart-item';
    cartItem.innerHTML = `
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name || 'Produit inconnu'}</div>
        <div class="cart-item-price">${price.toFixed(2)} DA × ${quantity} = ${itemTotal.toFixed(2)} DA</div>
      </div>
      <div class="cart-item-quantity">
        <button class="quantity-btn" onclick="updateQuantity('${item.id}', -1)">-</button>
        <span>${quantity}</span>
        <button class="quantity-btn" onclick="updateQuantity('${item.id}', 1)">+</button>
      </div>
      <button class="remove-btn" onclick="removeFromCart('${item.id}')">Supprimer</button>
    `;
    cartItems.appendChild(cartItem);
  });
  document.getElementById('totalPrice').textContent = total.toFixed(2);
  document.getElementById('checkoutBtn').disabled = false;
}

function updateCartCount() {
  const count = cart.reduce((sum, item) => sum + (parseInt(item.quantity) || 0), 0);
  document.getElementById('cartCount').textContent = count;
}

function saveCartToStorage() {
  localStorage.setItem('cart', JSON.stringify(cart));
}

function loadCartFromStorage() {
  const saved = localStorage.getItem('cart');
  if (saved) {
    try {
      cart = JSON.parse(saved);
      // تنظيف العناصر التالفة
      cart = cart.map(item => ({
        ...item,
        price: parseFloat(item.price) || 0,
        quantity: parseInt(item.quantity) || 1
      })).filter(item => item.id && item.name);
      updateCartCount();
    } catch (e) {
      console.error("Erreur lecture panier:", e);
      cart = [];
      localStorage.removeItem('cart');
    }
  }
}

// ========== ÉVÉNEMENTS ==========
function setupEventListeners() {
  const cartBtn = document.getElementById('cartBtn');
  const cartModal = document.getElementById('cartModal');
  const closeButtons = document.querySelectorAll('.close-modal');
  const checkoutBtn = document.getElementById('checkoutBtn');
  const searchInput = document.getElementById('searchInput');
  const categoryFilter = document.getElementById('categoryFilter');

  cartBtn?.addEventListener('click', () => {
    cartModal.classList.add('active');
    displayCart();
  });

  closeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      btn.closest('.modal').classList.remove('active');
    });
  });

  window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
      e.target.classList.remove('active');
    }
  });

  checkoutBtn?.addEventListener('click', () => {
    if (cart.length > 0) {
      cartModal.classList.remove('active');
      openOrderForm();
    }
  });

  searchInput?.addEventListener('input', filterProducts);
  categoryFilter?.addEventListener('change', filterProducts);
}

function filterProducts() {
  const searchTerm = (document.getElementById('searchInput')?.value || '').toLowerCase();
  const selectedCategory = document.getElementById('categoryFilter')?.value || '';
  const filtered = products.filter(product => {
    const name = (product.name || '').toLowerCase();
    const description = (product.description || '').toLowerCase();
    const matchesSearch = name.includes(searchTerm) || description.includes(searchTerm);
    const matchesCategory = !selectedCategory || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });
  loadProducts(filtered);
}

// ========== FORMULAIRE DE COMMANDE ==========
function generateOrderNumber() {
  const now = new Date();
  const datePart = now.toISOString().slice(2, 10).replace(/-/g, '');
  let count = localStorage.getItem('orderCount') || '0';
  count = String(parseInt(count) + 1).padStart(3, '0');
  localStorage.setItem('orderCount', count);
  return `AM${datePart}${count}`;
}

function openOrderForm() {
  const modal = document.getElementById('orderFormModal');
  if (modal) {
    modal.classList.add('active');
    initializeWilayaSelect();
  }
}

function closeOrderForm() {
  document.getElementById('orderFormModal')?.classList.remove('active');
}

function initializeWilayaSelect() {
  const select = document.getElementById('wilaya');
  select.innerHTML = '<option value="">Sélectionner une wilaya</option>';
  Object.keys(wilayasData).forEach(wilaya => {
    const opt = document.createElement('option');
    opt.value = wilaya;
    opt.textContent = wilaya;
    select.appendChild(opt);
  });
}

function updateShippingPrice() {
  const type = document.getElementById('orderType')?.value || '';
  const wilaya = document.getElementById('wilaya')?.value || '';
  const priceEl = document.getElementById('shippingPrice');
  const info = document.querySelector('.shipping-info');

  if (!wilaya) {
    priceEl.textContent = '0 DA';
    info?.classList.remove('active');
    return;
  }

  let price = 0;
  if (type === 'domicile') price = shippingPrices[wilaya] || 0;
  else if (type === 'stopdesk') price = stopDeskPrices[wilaya] || 0;

  priceEl.textContent = price + ' DA';
  info?.classList.add('active');
}

document.addEventListener('DOMContentLoaded', () => {
  const wilayaSel = document.getElementById('wilaya');
  const typeSel = document.getElementById('orderType');
  const communeSel = document.getElementById('commune');

  wilayaSel?.addEventListener('change', () => {
    const w = wilayaSel.value;
    communeSel.innerHTML = '<option value="">Sélectionner une commune</option>';
    updateShippingPrice();
    if (w && wilayasData[w]) {
      wilayasData[w].forEach(c => {
        const opt = document.createElement('option');
        opt.value = c;
        opt.textContent = c;
        communeSel.appendChild(opt);
      });
    }
  });

  typeSel?.addEventListener('change', updateShippingPrice);

  document.getElementById('orderForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    submitOrderForm();
  });
});

// ✅ ENVOI À FIREBASE
async function submitOrderForm() {
  const form = document.getElementById('orderForm');
  const orderType = form.orderType.value;
  const wilaya = form.wilaya.value;
  const commune = form.commune.value;

  if (!orderType || !wilaya || !commune) {
    alert("Veuillez remplir tous les champs obligatoires.");
    return;
  }

  let shippingPrice = 0;
  if (orderType === 'domicile') shippingPrice = shippingPrices[wilaya] || 0;
  else if (orderType === 'stopdesk') shippingPrice = stopDeskPrices[wilaya] || 0;

  const orderNumber = generateOrderNumber();
  const cartTotal = parseFloat(document.getElementById('totalPrice').textContent) || 0;
  const grandTotal = cartTotal + shippingPrice;

  const commande = {
    orderNumber,
    status: 'pending',
    orderType,
    firstName: form.firstName.value.trim(),
    lastName: form.lastName.value.trim(),
    phone1: form.phone1.value.trim(),
    phone2: form.phone2.value.trim() || null,
    wilaya,
    commune,
    cartItems: [...cart],
    cartTotal,
    shippingPrice,
    grandTotal,
    date: new Date().toISOString()
  };

  try {
    await db.collection("commandes").add(commande);
    
    document.getElementById('orderFormModal').classList.remove('active');
    document.getElementById('confirmModal').classList.add('active');
    document.getElementById('orderNumber').textContent = orderNumber;

    cart = [];
    saveCartToStorage();
    updateCartCount();
    form.reset();
    document.getElementById('shippingPrice').textContent = '0 DA';

    showNotification('Commande envoyée avec succès!');
  } catch (error) {
    console.error("Erreur Firebase:", error);
    alert("Erreur lors de l'envoi. Vérifiez votre connexion.");
  }
}

// ========== NOTIFICATIONS ==========
function showNotification(message) {
  const notif = document.createElement('div');
  notif.style.cssText = `
    position: fixed; top: 20px; right: 20px;
    background: #27ae60; color: white; padding: 15px 25px;
    border-radius: 5px; z-index: 300;
    animation: slideIn 0.3s ease-out;
  `;
  notif.textContent = message;
  document.body.appendChild(notif);
  setTimeout(() => {
    notif.style.animation = 'slideOut 0.3s ease-out';
    setTimeout(() => notif.remove(), 300);
  }, 3000);
}

const style = document.createElement('style');
style.textContent = `
@keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
@keyframes slideOut { from { transform: translateX(0); opacity: 1; } to { transform: translateX(100%); opacity: 0; } }
`;
document.head.appendChild(style);

// ========== DONNÉES WILAYAS & PRIX ==========
// (تم الاحتفاظ بكامل البيانات كما هي — لا حاجة لتغييرها)
const wilayasData = { /* ... نفس البيانات ... */ };
const shippingPrices = { /* ... نفس البيانات ... */ };
const stopDeskPrices = { /* ... نفس البيانات ... */ };
