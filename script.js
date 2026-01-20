// ========== PRODUITS (IDs uniques) ==========
const products = [
  {
    id: 1,
    name: "Imprimante Laser Canon LBP6030B",
    category: "imprimantes",
    price: 41500,
    image: "images/6030.jpg",
    description: "Imprimante Laser avec toner"
  },
  {
    id: 2,
    name: "Imprimante Laser Canon MF3010",
    category: "imprimantes",
    price: 50500,
    image: "images/3010.jpg",
    description: "Son haute qualité avec isolation du bruit"
  },
  {
    id: 3,
    name: "Imprimante Epson L3210",
    category: "imprimantes",
    price: 410000,
    image: "images/3210.jfif",
    description: "Imprimante sans Wifi"
  },
  {
    id: 4,
    name: "Imprimante Brother DCP-T530 DW",
    category: "imprimantes",
    price: 52500,
    image: "images/530.jfif",
    description: "Suivi de la santé et des activités"
  }
];

// ========== PANIER ==========
let cart = [];

// ========== INITIALISATION ==========
document.addEventListener('DOMContentLoaded', function () {
  loadProducts();
  setupEventListeners();
  loadCartFromStorage();
});

// ========== AFFICHAGE DES PRODUITS ==========
function loadProducts(filteredProducts = null) {
  const grid = document.getElementById('productsGrid');
  const productsToDisplay = filteredProducts || products;
  grid.innerHTML = '';
  if (productsToDisplay.length === 0) {
    grid.innerHTML = '<p style="text-align: center; grid-column: 1/-1;">Aucun produit trouvé.</p>';
    return;
  }
  productsToDisplay.forEach(product => {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.innerHTML = `
      <img src="${product.image}" alt="${product.name}" class="product-image"
        onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22250%22 height=%22200%22%3E%3Crect fill=%22%23ddd%22 width=%22250%22 height=%22200%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22 font-family=%22Arial%22 font-size=%2220%22 fill=%22%23666%22%3E${product.name}%3C/text%3E%3C/svg%3E'">
      <div class="product-info">
        <h3 class="product-name">${product.name}</h3>
        <p class="product-category">${product.category}</p>
        <p class="product-description">${product.description}</p>
        <div class="product-footer">
          <span class="product-price">${product.price.toFixed(2)} DA</span>
          <button class="add-to-cart-btn" onclick="addToCart(${product.id})">Ajouter</button>
        </div>
      </div>
    `;
    grid.appendChild(card);
  });
}

// ========== FONCTIONS DU PANIER ==========
function addToCart(productId) {
  const product = products.find(p => p.id === productId);
  if (!product) return;
  const existingItem = cart.find(item => item.id === productId);
  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({ ...product, quantity: 1 });
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
    const itemTotal = item.price * item.quantity;
    total += itemTotal;
    const cartItem = document.createElement('div');
    cartItem.className = 'cart-item';
    cartItem.innerHTML = `
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-price">${item.price.toFixed(2)} DA × ${item.quantity} = ${itemTotal.toFixed(2)} DA</div>
      </div>
      <div class="cart-item-quantity">
        <button class="quantity-btn" onclick="updateQuantity(${item.id}, -1)">-</button>
        <span>${item.quantity}</span>
        <button class="quantity-btn" onclick="updateQuantity(${item.id}, 1)">+</button>
      </div>
      <button class="remove-btn" onclick="removeFromCart(${item.id})">Supprimer</button>
    `;
    cartItems.appendChild(cartItem);
  });
  document.getElementById('totalPrice').textContent = total.toFixed(2);
  document.getElementById('checkoutBtn').disabled = false;
}

function updateCartCount() {
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  document.getElementById('cartCount').textContent = count;
}

function saveCartToStorage() {
  localStorage.setItem('cart', JSON.stringify(cart));
}

function loadCartFromStorage() {
  const saved = localStorage.getItem('cart');
  if (saved) {
    cart = JSON.parse(saved);
    updateCartCount();
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

  cartBtn.addEventListener('click', () => {
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

  checkoutBtn.addEventListener('click', () => {
    if (cart.length > 0) {
      cartModal.classList.remove('active');
      openOrderForm();
    }
  });

  searchInput.addEventListener('input', filterProducts);
  categoryFilter.addEventListener('change', filterProducts);
}

function filterProducts() {
  const searchTerm = document.getElementById('searchInput').value.toLowerCase();
  const selectedCategory = document.getElementById('categoryFilter').value;
  const filtered = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm) ||
                          product.description.toLowerCase().includes(searchTerm);
    const matchesCategory = !selectedCategory || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });
  loadProducts(filtered);
}

// ========== FORMULAIRE DE COMMANDE ==========
function generateOrderNumber() {
  // مثال: AM260121001 (AM + تاريخ + رقم تسلسلي)
  const now = new Date();
  const datePart = now.toISOString().slice(2, 10).replace(/-/g, ''); // YYMMDD
  let count = localStorage.getItem('orderCount') || '0';
  count = String(parseInt(count) + 1).padStart(3, '0');
  localStorage.setItem('orderCount', count);
  return `AM${datePart}${count}`; // مثال: AM260121001
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
  const type = document.getElementById('orderType').value;
  const wilaya = document.getElementById('wilaya').value;
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
  const cartTotal = parseFloat(document.getElementById('totalPrice').textContent);
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
    // ✅ Envoi à Firebase
    await db.collection("commandes").add(commande);
    
    // Afficher confirmation
    document.getElementById('orderFormModal').classList.remove('active');
    document.getElementById('confirmModal').classList.add('active');
    document.getElementById('orderNumber').textContent = orderNumber;

    // Vider le panier
    cart = [];
    saveCartToStorage();
    updateCartCount();

    // Réinitialiser formulaire
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
// ⬇️ احتفظ بنفس البيانات من ملفك الأصلي (wilayasData, shippingPrices, stopDeskPrices)
// سأضع نسخة مختصرة هنا لتوفير المساحة — استبدلها ببياناتك الكاملة

const wilayasData = {
  "01 - Adrar": ["Adrar", "Aoulef", "Charouine"],
  "02 - Chlef": ["Chlef", "Abou", "Ain Merane"],
  "12 - Algiers": ["Algiers", "Bab El Oued", "Kouba"]
};

const shippingPrices = {
  "01 - Adrar": 2500,
  "02 - Chlef": 800,
  "12 - Algiers": 500
};

const stopDeskPrices = {
  "01 - Adrar": 600,
  "02 - Chlef": 600,
  "12 - Algiers": 0
};