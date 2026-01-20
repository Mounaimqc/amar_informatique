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
    "01 - Adrar": ["Aoulef", "Araouane", "Charouine", "Méchéria", "Ouled Mimoune", "Reggane", "Tamantit", "Tamentit", "Adrar"],
    "02 - Chlef": ["Abou", "Ain Merane", "Boukadir", "Chlef", "El Karimia", "Lebdaoui", "Oum Djerem", "Sidi Abdelmoumene", "Sobarine", "Talassa", "Tenes"],
    "03 - Laghouat": ["Ain Seba", "Aïn Madhi", "Brida", "Gueltat Sidi Saïd", "Hadj Mechri", "Ksar El Hirane", "Laghouat", "Oued Morra", "Tahchdit"],
    "04 - Oum El Bouaghi": ["Aïn Beïda", "Ain M'lila", "Bekhouda", "Bir Chouhada", "El Fedj", "Fkirina", "Hadjera Zerga", "Merouana", "Oum El Bouaghi"],
    "05 - Batna": ["Akbou", "Alia", "Arris", "Ayt Youcef", "Barika", "Batna", "Béni Hamdan", "Belkhadem", "Faydh", "Gosbantine", "Jarjera", "Lambese", "Menaa", "Seriana", "Tazoult"],
    "06 - Béjaïa": ["Aboudaou", "Adel", "Aït Ouabellah", "Aït Yenni", "Akbou", "Amizour", "Béjaïa", "Boukhelifa", "Bounouh", "Chebdel", "Chemini", "El Kseur", "Farah", "Fenaia", "Igoudrane", "Imessaoudene", "Kendira", "Medjebeur", "Oulfen", "Seddouk", "Semaoune", "Sidi Ayad", "Souk El Tenine", "Tamazirt", "Tazemmait", "Timezrit", "Tirimouchine"],
    "07 - Biskra": ["Ain Naga", "Aïn Zaatout", "Alouana", "Beni Mzab", "Besbes", "Bir Khel", "Biskra", "Bouchagroune", "Boulila", "El Feidh", "El Ghrous", "El Kantara", "El Outaïa", "Foughala", "Had Sefra", "Lioua", "Mezhouda", "M'chounèche", "Ouarlach", "Ouled Aissen", "Ouled Djellal", "Ouled Khaled", "Tolga", "Zeribet El Oued"],
    "08 - Béchar": ["Abadla", "Adrar Souttouf", "Aïn Ben Khelil", "Aïn Sefra", "Atakor", "Béchar", "Bouda", "Boudnib", "Figuig", "Kénadsa", "Tabesbest", "Tadjemout", "Timaoui"],
    "09 - Tlemcen": ["Aïn Fezza", "Aïn Ghorbal", "Aïn Koudjel", "Aït Khaled", "Azail", "Azlaoun", "Bab El Assa", "Béni Mester", "Béni Saf", "Chetouane", "Hadj Boudjemâa", "Khenancha", "Maghnia", "Marhoum", "Mecheria", "Ouled Mimoun", "Sebdou", "Sidi Medel", "Souahlia", "Tafesset", "Tahar", "Tatahuite", "Tlemcen", "Youb"],
    "10 - Tiaret": ["Aïn Bouchekif", "Aïn Zahra", "Aïn Zerrouk", "Aïn Oussera", "Aougrout", "Bir El Ater", "Cedeville", "Dahlia", "Froha", "Guestrine", "Hamadia", "Hamza", "Kef El Ksour", "Ksar Chellala", "Medjaida", "Medrissa", "Rahouane", "Seboura", "Sedraia", "Sidi Bakhti", "Sougueur", "Tadjemout", "Tagodine", "Tagrine", "Talemza", "Telamine", "Tiaret", "Tighennif", "Tousnina", "Trantamba"],
    "11 - Tizi Ouzou": ["Aïn Oulmène", "Aït Aïissa", "Aït Khaled", "Aït Chafa", "Alahoum", "Amazouaou", "Aradjaoui", "Assi Youcef", "Azacene", "Azaguene", "Azaoua", "Azefoun", "Azerou", "Azib Izar", "Azilal", "Azizel", "Benni Zmenzer", "Beni Aïssai", "Beni Aïzal", "Béni Amer", "Beni Khata", "Béni Ourtilane", "Béni Seddik", "Béni Yahia", "Béni Zmenzer", "Berrekach", "Bir El Qaid", "Birah", "Bogroum", "Bokassem", "Bosnodjar", "Bousebaa", "Bouseddek", "Bouya", "Bouyadi", "Bouyacoub", "Bouyalem", "Bouyami", "Brague", "Braoui", "Brezina", "Brida", "Brinissa", "Bsebsa", "Bsisa", "Buhamia", "Buhaya", "Buhel", "Bujja", "Bumour", "Bunaïa", "Bunaj", "Bunaya", "Buneid", "Buneida", "Bunejaj", "Bunejja", "Bunej", "Bunelt", "Bunena", "Bunera", "Buneri", "Bunezia", "Bunezzi", "Bunezza", "Bunfaia", "Bunfaj", "Bunhaïa", "Bunhaïz", "Bunhaja", "Bunhajat", "Bunhajia", "Bunhaïm", "Bunhaïn", "Bunhaïr", "Bunhaïs", "Bunhait", "Bunhaïta", "Bunhaïti", "Bunhaïza", "Bunhaïzi", "Bunhala", "Bunhali", "Bunham", "Bunhami", "Bunhammu", "Bunhamu", "Bunhan", "Bunhana", "Bunhani", "Bunhanna", "Bunhanni", "Bunhannu", "Bunhanu", "Bunhaoul", "Bunhaoula", "Bunhaoule", "Bunhaouli", "Bunhaoulim", "Bunhaoulin", "Bunhaoulit", "Bunhaoulu", "Bunhaouma", "Bunhaoun", "Bunhaounta", "Bunhaountif", "Bunhaoura", "Bunhaouri", "Bunhaouris", "Bunhaourit", "Bunhaourja", "Bunhaourji", "Bunhaourt", "Bunhaouza", "Bunhaouzi", "Djaem", "Djaem", "Djaem", "Djaem", "Djaem", "Djaem", "Djaem", "Djaem"],
    "12 - Algiers": ["Algiers", "Bab El Oued", "Bouzareah", "El Biar", "El Madania", "Bir Mourad Rais", "Casbah", "Kouba", "Ouled Fayet", "Sidi M'hamed", "Sidi Lakhdar", "Haï Es Salam"],
    "13 - Saïda": ["Aïn El Hadjar", "Aïn Sehaoui", "Béni Chaïb", "Bou Maïa", "Hounet", "Khacharem", "Moussadek", "Ouled Brahim", "Ouled Khaled", "Saïda", "Sidi Aïdel", "Sidi Ali Benyoub", "Youb"],
    "14 - Sidi Bel Abbes": ["Aïn Tédelès", "Aïn Tindamine", "Aïn Tolba", "Aït Sidi Aïssa", "Aït Sidi Hamadouche", "Alahoum", "Amoura", "Aouaguer", "Aouamer", "Aouainet", "Aouaouine", "Aouatia"],
    "15 - Annaba": ["Ain Berda", "Annaba", "Asfirouene", "Beni Bahdel", "Belhariya", "Berrahal", "Boukhadra", "Chetaibi", "Djerrah", "El Ancer", "El Hadjar", "El Kala", "Guelaat Bousbaa", "Hadjar El Guebli", "Houari Boumediene", "Jidjel", "Khenfela", "Mokrar", "Oued El Aneb", "Oued Sebbah"],
    "16 - Guelma": ["Aïn Defla", "Aïn Sefra", "Alouana", "Alouaoun", "Amis", "Aouanet", "Aoulel", "Aouzia", "Aour", "Aouraia", "Aourani", "Aouranja", "Aouranj", "Aouranjon", "Aourajou", "Aourajx", "Aourajy", "Aourajza", "Aourajz"],
    "17 - Jijel": ["Aïn Azal", "Aïn Zitoun", "Aït Ouabellah", "Akbou", "Amezrou", "Andraoua", "Azzaba", "Belbessat", "Beni Bahdel", "Beni Belaid", "Beni Ghanem", "Beni Hammouche", "Beni Maarsa", "Beni Ouadjadj", "Beni Sedrène", "Besbes", "Jijel"],
    "18 - Setif": ["Setif", "Aïn Azel", "Aïn Oulmène", "Aït Aïissa", "Aït Ouabellah", "Amira", "Aourir", "Aoulef", "Aoumir", "Aour", "Arabeïq", "Araïs", "Arij"],
    "19 - Mila": ["Mila", "Aïn Beïda", "Aït Ouabellah", "Aoui", "Aourir", "Aouzia", "Arij", "Azzaba", "Badjarah", "Badjah", "Bagraoui"],
    "20 - Aïn Defla": ["Aïn Defla", "Aïn Korrine", "Aïn Leuh", "Aïn Soltane", "Aïn Torki", "Aït Khaled", "Aït Soualemine", "Aït Soudane", "Aït Youcef"],
    "21 - Boumerdès": ["Boumerdès", "Aïn Aïssa", "Aïn Benian", "Aïn Bouchekif", "Aïn Corania", "Aïn Krichech", "Aïn Khaled"],
    "22 - Msila": ["Msila", "Aïn Azel", "Aïn Hamid", "Aïn Limdja", "Aïn Meliouh", "Aïn Semmam", "Aïn Zloul"],
    "23 - Blida": ["Blida", "Aïn Aïssa", "Aïn Benian", "Aïn Bouchekif", "Aïn Corania", "Aïn Krichech"],
    "24 - Souk Ahras": ["Souk Ahras", "Aïn Aïssa", "Aïn Benian", "Aïn Bouchekif", "Aïn Corania"],
    "25 - Khenchela": ["Khenchela", "Aïn Aïssa", "Aïn Benian", "Aïn Bouchekif"],
    "26 - Oum El Bouaghi": ["Oum El Bouaghi", "Aïn Aïssa", "Aïn Benian", "Aïn Bouchekif"],
    "27 - El Bayadh": ["El Bayadh", "Aïn Aïssa", "Aïn Benian"],
    "28 - Medea": ["Medea", "Aïn Aïssa", "Aïn Benian"],
    "29 - Ouargla": ["Ouargla", "Aïn Aïssa", "Aïn Benian"],
    "30 - Illizi": ["Illizi", "Aïn Benian"],
    "31 - El Oued": ["El Oued", "Aïn Aïssa"],
    "32 - Bordj Baji Mokhtar": ["Bordj Baji Mokhtar"],
    "33 - Tindouf": ["Tindouf"],
    "34 - Ghardaia": ["Ghardaia", "Aïn Benian", "Guerrara", "Metlili"],
    "35 - Relizane": ["Relizane", "Aïn Bouchekif", "Aïn Fezza", "Ammi Moussa"],
    "36 - Constantine": ["Constantine", "Aïn Abid", "Aïn M'lila", "Aïn Smara", "Benaceur"],
    "37 - Oran": ["Oran", "Aïn Beïda", "Aïn El Turk", "Aïn Kerma", "Aïn Nouissy"],
    "38 - Mostaganem": ["Mostaganem", "Aïn Belbel", "Aïn Chekaïda", "Aïn Dahra", "Aïn Farah"],
    "39 - Mascara": ["Mascara", "Aïn Bouchekif", "Aïn Fezza", "Aîn Tedles"],
    "40 - Tipaza": ["Tipaza", "Aïn Aïssa", "Aïn Benian", "Aïn Bouchekif"],
    "41 - Tlemcen": ["Tlemcen", "Aïn Fezza", "Aïn Ghorbal", "Aïn Koudjel"],
    "42 - Souk Ahras (Rev)": ["Souk Ahras", "Aïn Aïssa", "Aïn Benian"],
    "43 - Mascara (Rev)": ["Mascara", "Aïn Bouchekif", "Aïn Fezza"],
    "44 - Relizane (Rev)": ["Relizane", "Aïn Bouchekif"],
    "45 - El Taraf": ["El Taraf", "Aïn Aïssa"],
    "46 - Aïn Temouchent": ["Aïn Temouchent", "Aïn Abdel Moumine"],
    "47 - Guelma (Rev)": ["Guelma"],
    "48 - Jijel (Rev)": ["Jijel"],
    "49 - Ouled Djellal": ["Ouled Djellal"],
    "50 - Bordj Baji Mokhtar (Rev)": ["Bordj Baji Mokhtar"],
    "51 - Draa El Mizan": ["Draa El Mizan"],
    "52 - Hassi Messaoud": ["Hassi Messaoud"],
    "53 - In Salah": ["In Salah"],
    "54 - In Guezzam": ["In Guezzam"],
    "55 - Djanet": ["Djanet"],
    "56 - Touggourt": ["Touggourt"],
    "57 - Ain Salah": ["Ain Salah"],
    "58 - El Menea": ["El Menea"],
    "59 - Adrar (Rev)": ["Adrar"],
    "60 - Annaba (Rev)": ["Annaba"],
    "61 - Setif (Rev)": ["Setif"],
    "62 - Batna (Rev)": ["Batna"],
    "63 - Béjaïa (Rev)": ["Béjaïa"],
    "64 - Tiaret (Rev)": ["Tiaret"],
    "65 - Chlef (Rev)": ["Chlef"],
    "66 - Saïda (Rev)": ["Saïda"],
    "67 - Sidi Bel Abbes (Rev)": ["Sidi Bel Abbes"],
    "68 - Tlemcen (Rev)": ["Tlemcen"],
    "69 - Laghouat (Rev)": ["Laghouat"]
};

const shippingPrices = {
   "01 - Adrar": 2500,
    "02 - Chlef": 800,
    "03 - Laghouat": 1800,
    "04 - Oum El Bouaghi": 1500,
    "05 - Batna": 1500,
    "06 - Béjaïa": 900,
    "07 - Biskra": 1500,
    "08 - Béchar": 2800,
    "09 - Tlemcen": 1200,
    "10 - Tiaret": 1300,
    "11 - Tizi Ouzou": 700,
    "12 - Algiers": 500,
    "13 - Saïda": 1200,
    "14 - Sidi Bel Abbes": 1100,
    "15 - Annaba": 1000,
    "16 - Guelma": 1100,
    "17 - Jijel": 1000,
    "18 - Setif": 1000,
    "19 - Mila": 1100,
    "20 - Aïn Defla": 700,
    "21 - Boumerdès": 600,
    "22 - Msila": 1200,
    "23 - Blida": 600,
    "24 - Souk Ahras": 1200,
    "25 - Khenchela": 1400,
    "26 - Oum El Bouaghi": 1500,
    "27 - El Bayadh": 1600,
    "28 - Medea": 800,
    "29 - Ouargla": 2000,
    "30 - Illizi": 3000,
    "31 - El Oued": 1800,
    "32 - Bordj Baji Mokhtar": 3500,
    "33 - Tindouf": 3200,
    "34 - Ghardaia": 1800,
    "35 - Relizane": 1000,
    "36 - Constantine": 1100,
    "37 - Oran": 900,
    "38 - Mostaganem": 900,
    "39 - Mascara": 1000,
    "40 - Tipaza": 600,
    "41 - Tlemcen": 1200,
    "42 - Souk Ahras (Rev)": 1200,
    "43 - Mascara (Rev)": 1000,
    "44 - Relizane (Rev)": 1000,
    "45 - El Taraf": 1100,
    "46 - Aïn Temouchent": 1000,
    "47 - Guelma (Rev)": 1100,
    "48 - Jijel (Rev)": 1000,
    "49 - Ouled Djellal": 1600,
    "50 - Bordj Baji Mokhtar (Rev)": 3500,
    "51 - Draa El Mizan": 900,
    "52 - Hassi Messaoud": 2200,
    "53 - In Salah": 2500,
    "54 - In Guezzam": 3000,
    "55 - Djanet": 3200,
    "56 - Touggourt": 1800,
    "57 - Ain Salah": 2500,
    "58 - El Menea": 2000,
    "59 - Adrar (Rev)": 2500,
    "60 - Annaba (Rev)": 1000,
    "61 - Setif (Rev)": 1000,
    "62 - Batna (Rev)": 1500,
    "63 - Béjaïa (Rev)": 900,
    "64 - Tiaret (Rev)": 1300,
    "65 - Chlef (Rev)": 800,
    "66 - Saïda (Rev)": 1200,
    "67 - Sidi Bel Abbes (Rev)": 1100,
    "68 - Tlemcen (Rev)": 1200,
    "69 - Laghouat (Rev)": 1800
};

const stopDeskPrices = {
 "01 - Adrar": 600,
    "02 - Chlef": 600,
    "03 - Laghouat": 600,
    "04 - Oum El Bouaghi": 600,
    "05 - Batna": 600,
    "06 - Béjaïa": 600,
    "07 - Biskra": 600,
    "08 - Béchar": 600,
    "09 - Tlemcen": 600,
    "10 - Tiaret": 600,
    "11 - Tizi Ouzou": 0,
    "12 - Algiers": 0,
    "13 - Saïda": 0,
    "14 - Sidi Bel Abbes": 0,
    "15 - Annaba": 0,
    "16 - Guelma": 0,
    "17 - Jijel": 0,
    "18 - Setif": 0,
    "19 - Mila": 0,
    "20 - Aïn Defla": 0,
    "21 - Boumerdès": 0,
    "22 - Msila": 0,
    "23 - Blida": 0,
    "24 - Souk Ahras": 0,
    "25 - Khenchela": 0,
    "26 - Oum El Bouaghi": 0,
    "27 - El Bayadh": 0,
    "28 - Medea": 0,
    "29 - Ouargla": 0,
    "30 - Illizi": 0,
    "31 - El Oued": 0,
    "32 - Bordj Baji Mokhtar": 0,
    "33 - Tindouf": 0,
    "34 - Ghardaia": 0,
    "35 - Relizane": 0,
    "36 - Constantine": 0,
    "37 - Oran": 0,
    "38 - Mostaganem": 0,
    "39 - Mascara": 0,
    "40 - Tipaza": 0,
    "41 - Tlemcen": 0,
    "42 - Souk Ahras (Rev)": 0,
    "43 - Mascara (Rev)": 0,
    "44 - Relizane (Rev)": 0,
    "45 - El Taraf": 0,
    "46 - Aïn Temouchent": 0,
    "47 - Guelma (Rev)": 0,
    "48 - Jijel (Rev)": 0,
    "49 - Ouled Djellal": 0,
    "50 - Bordj Baji Mokhtar (Rev)": 0,
    "51 - Draa El Mizan": 0,
    "52 - Hassi Messaoud": 0,
    "53 - In Salah": 0,
    "54 - In Guezzam": 0,
    "55 - Djanet": 0,
    "56 - Touggourt": 0,
    "57 - Ain Salah": 0,
    "58 - El Menea": 0,
    "59 - Adrar (Rev)": 0,
    "60 - Annaba (Rev)": 0,
    "61 - Setif (Rev)": 0,
    "62 - Batna (Rev)": 0,
    "63 - Béjaïa (Rev)": 0,
    "64 - Tiaret (Rev)": 0,
    "65 - Chlef (Rev)": 0,
    "66 - Saïda (Rev)": 0,
    "67 - Sidi Bel Abbes (Rev)": 0,
    "68 - Tlemcen (Rev)": 0,
    "69 - Laghouat (Rev)": 0


};
