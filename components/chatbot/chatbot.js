/**
 * Amar Informatique - Client Chatbot IA
 * Integrated Chatbot Widget JavaScript (Production Ready with Strict Error Handling & ARIA Fix)
 */

(function () {
  const CHAT_STORAGE_KEY = 'amar_chat_session_id';

  // Configurable API base URL or automatic origin detection
  let API_BASE_URL = window.CHATBOT_API_URL || '';
  if (!API_BASE_URL) {
    if (window.location.origin && !window.location.origin.startsWith('file')) {
      API_BASE_URL = window.location.origin;
    } else {
      API_BASE_URL = 'http://localhost:3000';
    }
  }
  const API_ENDPOINT = `${API_BASE_URL.replace(/\/$/, '')}/api/chat`;

  let conversationId = localStorage.getItem(CHAT_STORAGE_KEY) || null;
  let isSending = false;

  // Attendre le chargement complet du DOM
  document.addEventListener('DOMContentLoaded', initChatbot);

  function initChatbot() {
    createChatbotDOM();
    setupEventListeners();
    appendWelcomeMessage();
  }

  function createChatbotDOM() {
    if (document.getElementById('chatbotWindow')) return;

    const html = `
      <!-- Chatbot Trigger Button -->
      <button class="chatbot-trigger-btn" id="chatbotTriggerBtn" title="Conseiller IA Amar Info" aria-label="Ouvrir le chatbot">
        <i class="fas fa-robot"></i>
        <span class="badge-pulse"></span>
      </button>

      <!-- Chat Window -->
      <div class="chatbot-window" id="chatbotWindow" role="dialog" aria-hidden="true">
        <!-- Header -->
        <div class="chatbot-header">
          <div class="chatbot-header-info">
            <div class="chatbot-avatar">
              <i class="fas fa-headset" style="color:white;"></i>
            </div>
            <div class="chatbot-title-block">
              <h3>Amar Assistant IA <i class="fas fa-check-circle" style="color:#10b981; font-size:0.8rem;"></i></h3>
              <div class="chatbot-status">En ligne | Réponse instantanée</div>
            </div>
          </div>
          <div class="chatbot-header-actions">
            <button class="chatbot-header-btn" id="chatbotMinimizeBtn" title="Réduire" type="button"><i class="fas fa-minus"></i></button>
            <button class="chatbot-header-btn" id="chatbotCloseBtn" title="Fermer" type="button"><i class="fas fa-times"></i></button>
          </div>
        </div>

        <!-- Messages scroll area -->
        <div class="chatbot-messages" id="chatbotMessages">
          <!-- Dynamic message bubbles here -->
        </div>

        <!-- Quick Suggestions bar -->
        <div class="chatbot-suggestions" id="chatbotSuggestions">
          <span class="suggestion-chip" data-query="Je cherche un ordinateur"><i class="fas fa-laptop"></i> 💻 PC Portable</span>
          <span class="suggestion-chip" data-query="Je cherche un PC Gamer en promotion"><i class="fas fa-gamepad"></i> 🎮 PC Gamer</span>
          <span class="suggestion-chip" data-query="Imprimantes disponibles"><i class="fas fa-print"></i> 🖨️ Imprimantes</span>
          <span class="suggestion-chip" data-query="Produits selon mon budget"><i class="fas fa-wallet"></i> 💰 Selon mon budget</span>
          <span class="suggestion-chip" data-query="SSD et stockage"><i class="fas fa-hdd"></i> 💾 Stockage & SSD</span>
          <span class="suggestion-chip" data-query="Contacter un conseiller par WhatsApp"><i class="fab fa-whatsapp"></i> 📞 WhatsApp</span>
        </div>

        <!-- Input Footer -->
        <div class="chatbot-footer">
          <input type="text" class="chatbot-input" id="chatbotInput" placeholder="Posez votre question sur nos produits..." autocomplete="off">
          <button class="chatbot-send-btn" id="chatbotSendBtn" title="Envoyer" type="button"><i class="fas fa-paper-plane"></i></button>
        </div>
      </div>
    `;

    const container = document.createElement('div');
    container.id = 'chatbotWidgetContainer';
    container.innerHTML = html;
    document.body.appendChild(container);
  }

  function setupEventListeners() {
    const triggerBtn = document.getElementById('chatbotTriggerBtn');
    const windowEl = document.getElementById('chatbotWindow');
    const minimizeBtn = document.getElementById('chatbotMinimizeBtn');
    const closeBtn = document.getElementById('chatbotCloseBtn');
    const sendBtn = document.getElementById('chatbotSendBtn');
    const inputEl = document.getElementById('chatbotInput');
    const suggestionsBox = document.getElementById('chatbotSuggestions');

    triggerBtn?.addEventListener('click', toggleChatWindow);
    closeBtn?.addEventListener('click', closeChatWindow);
    minimizeBtn?.addEventListener('click', minimizeChatWindow);

    sendBtn?.addEventListener('click', handleUserSend);
    inputEl?.addEventListener('keypress', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleUserSend();
      }
    });

    suggestionsBox?.addEventListener('click', function (e) {
      const chip = e.target.closest('.suggestion-chip');
      if (chip) {
        const query = chip.getAttribute('data-query');
        if (query) {
          if (query.includes('WhatsApp')) {
            window.open('https://wa.me/213559469956', '_blank');
            return;
          }
          sendChatMessage(query);
        }
      }
    });
  }

  function toggleChatWindow() {
    const windowEl = document.getElementById('chatbotWindow');
    if (!windowEl) return;
    const isActive = windowEl.classList.contains('active');
    if (isActive) {
      closeChatWindow();
    } else {
      openChatWindow();
    }
  }

  function openChatWindow() {
    const windowEl = document.getElementById('chatbotWindow');
    if (!windowEl) return;
    windowEl.classList.remove('minimized');
    windowEl.classList.add('active');
    windowEl.setAttribute('aria-hidden', 'false');
    document.getElementById('chatbotInput')?.focus();
  }

  /**
   * ÉTAPE 10 — Correction de l'erreur ARIA Focus :
   * Déplace le focus vers chatbotTriggerBtn AVANT d'appliquer aria-hidden="true"
   */
  function closeChatWindow() {
    const windowEl = document.getElementById('chatbotWindow');
    const triggerBtn = document.getElementById('chatbotTriggerBtn');

    if (windowEl && windowEl.contains(document.activeElement)) {
      if (triggerBtn) {
        triggerBtn.focus();
      } else if (document.activeElement && typeof document.activeElement.blur === 'function') {
        document.activeElement.blur();
      }
    }

    if (!windowEl) return;
    windowEl.classList.remove('active');
    windowEl.setAttribute('aria-hidden', 'true');
  }

  function minimizeChatWindow() {
    const windowEl = document.getElementById('chatbotWindow');
    const triggerBtn = document.getElementById('chatbotTriggerBtn');

    if (windowEl && windowEl.classList.contains('minimized')) {
      windowEl.classList.remove('minimized');
    } else if (windowEl) {
      if (windowEl.contains(document.activeElement)) {
        if (triggerBtn) {
          triggerBtn.focus();
        } else if (document.activeElement && typeof document.activeElement.blur === 'function') {
          document.activeElement.blur();
        }
      }
      windowEl.classList.add('minimized');
    }
  }

  function appendWelcomeMessage() {
    const messagesEl = document.getElementById('chatbotMessages');
    if (!messagesEl || messagesEl.children.length > 0) return;

    appendBotBubble("Bonjour 👋 Bienvenue chez <strong>Amar Informatique</strong> ! Comment puis-je vous aider aujourd'hui ?");
  }

  function handleUserSend() {
    const inputEl = document.getElementById('chatbotInput');
    if (!inputEl) return;
    const message = inputEl.value.trim();
    if (!message || isSending) return;

    inputEl.value = '';
    sendChatMessage(message);
  }

  async function sendChatMessage(userText) {
    if (!userText || isSending) return;

    isSending = true;
    appendUserBubble(userText);
    showTypingIndicator();

    const payload = {
      message: userText,
      conversationId: conversationId
    };

    console.log("💬 [Frontend Chat Request]");
    console.log("Chat request URL:", API_ENDPOINT);
    console.log("Chat request payload:", payload);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      // ÉTAPE 10 — Traitement propre du corps de réponse
      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);

        let serverMessage = errorBody?.error?.message || errorBody?.message;
        if (!serverMessage) {
          if (response.status === 401) {
            serverMessage = "Configuration du service IA invalide.";
          } else if (response.status === 429) {
            serverMessage = "Le service IA est temporairement très sollicité ou le quota API est dépassé.";
          } else if (response.status === 500) {
            serverMessage = "Une erreur interne est survenue lors du traitement de votre demande.";
          } else {
            serverMessage = `Erreur HTTP ${response.status}`;
          }
        }

        throw {
          status: response.status,
          statusText: response.statusText,
          url: response.url,
          errorBody: errorBody,
          message: serverMessage
        };
      }

      const responseData = await response.json();
      console.log("Chat response status:", response.status);
      console.log("Chat response:", responseData);

      removeTypingIndicator();

      if (responseData && responseData.conversationId) {
        conversationId = responseData.conversationId;
        localStorage.setItem(CHAT_STORAGE_KEY, conversationId);
      }

      if (responseData && responseData.message) {
        appendBotBubble(responseData.message, responseData.products);
      } else {
        handleClientFallback(userText, "Format de réponse du serveur non valide.");
      }

    } catch (error) {
      clearTimeout(timeoutId);
      removeTypingIndicator();

      // ÉTAPE 10 — Log sérialisé propre sans [object Object]
      const errorMessage =
        error?.message ||
        error?.errorBody?.error?.message ||
        `Erreur serveur HTTP (${error?.status || "inconnue"})`;

      console.error(
        "Chatbot error:",
        JSON.stringify(error, null, 2)
      );

      console.warn(
        "Chatbot Fallback activé :",
        errorMessage
      );

      handleClientFallback(userText, errorMessage);
    } finally {
      isSending = false;
    }
  }

  /**
   * Fallback client intelligent si le serveur retourne une erreur HTTP ou est indisponible
   */
  function handleClientFallback(userText, errorContext = null) {
    const textLower = userText.toLowerCase();
    let replyText = "";
    let localProducts = [];

    const siteProducts = Array.isArray(window.products) ? window.products : [];

    if (textLower.includes('bonjour') || textLower.includes('salut') || textLower.includes('سلام') || textLower.includes('مرحبا')) {
      replyText = "Bonjour 👋 Bienvenue chez <strong>Amar Informatique</strong> ! Comment puis-je vous aider aujourd'hui ? Vous pouvez rechercher un laptop, une imprimante ou demander des recommandations par budget.";
    } else if (textLower.includes('gamer') || textLower.includes('gaming') || textLower.includes('للعاب') || textLower.includes('الڤايمينغ')) {
      replyText = "Bien sûr 🎮 Voici nos meilleurs ordinateurs portables performants pour le **Gaming** et le montage vidéo :";
      localProducts = siteProducts.filter(p => {
        const desc = (p.description || '').toLowerCase();
        const name = (p.name || '').toLowerCase();
        return desc.includes('rtx') || desc.includes('gtx') || desc.includes('mx') || desc.includes('i7') || name.includes('gamer') || name.includes('thinkpad');
      }).slice(0, 4);
    } else if (textLower.includes('imprimante') || textLower.includes('طابعة') || textLower.includes('laser') || textLower.includes('epson')) {
      replyText = "Voici les modèles d'**imprimantes** (Laser et Jet d'encre) disponibles dans notre magasin :";
      localProducts = siteProducts.filter(p => (p.category || '').startsWith('imprimante')).slice(0, 4);
    } else if (textLower.includes('budget') || textLower.includes('سعر') || textLower.includes('شحال') || textLower.includes('سومة') || textLower.includes('100000') || textLower.includes('150000') || textLower.includes('50000')) {
      replyText = "Voici une sélection de nos meilleurs produits informatiques au rapport qualité/prix garanti en magasin :";
      localProducts = siteProducts.slice(0, 4);
    } else if (textLower.includes('ssd') || textLower.includes('hdd') || textLower.includes('stockage') || textLower.includes('différence') || textLower.includes('فرق')) {
      replyText = "💡 **SSD vs HDD** :\n- **SSD (Solid State Drive)** : Ultra-rapide (jusqu'à 10x plus rapide qu'un HDD), silencieux et résistant aux chocs. Idéal pour démarrer Windows en quelques secondes.\n- **HDD (Hard Disk Drive)** : Disque mécanique traditionnel, plus lent mais offre un espace de stockage à bas coût.\n\n*Tous nos laptops Amar Informatique sont équipés de SSD NVMe rapides.*";
    } else {
      replyText = "Bien sûr 💻 Quel type d'équipement recherchez-vous ? Vous pouvez choisir une catégorie ci-dessous ou préciser votre budget.";
      localProducts = siteProducts.slice(0, 3);
    }

    appendBotBubble(replyText, localProducts);
  }

  function appendUserBubble(text) {
    const messagesEl = document.getElementById('chatbotMessages');
    if (!messagesEl) return;

    const row = document.createElement('div');
    row.className = 'chat-message-row user';
    row.innerHTML = `<div class="chat-bubble">${escapeHTML(text)}</div>`;
    messagesEl.appendChild(row);
    scrollToBottom();
  }

  function appendBotBubble(textHTML, products = []) {
    const messagesEl = document.getElementById('chatbotMessages');
    if (!messagesEl) return;

    const row = document.createElement('div');
    row.className = 'chat-message-row bot';
    
    let productsHTML = '';
    if (products && products.length > 0) {
      productsHTML = `<div class="chat-products-grid">
        ${products.map(p => `
          <div class="chat-product-card">
            <img src="${p.image || 'logo.jpg'}" alt="${escapeHTML(p.name || 'Produit')}" class="chat-product-img" onerror="this.src='logo.jpg'">
            <div class="chat-product-details">
              <h4 class="chat-product-name">${escapeHTML(p.name || 'Produit')}</h4>
              <div class="chat-product-price">
                ${p.oldPrice ? `<del>${p.oldPrice.toLocaleString('fr-FR')} DA</del>` : ''}
                <span>${(p.price || 0).toLocaleString('fr-FR')} DA</span>
              </div>
              <div class="chat-product-actions">
                <a href="${p.productUrl || 'produit.html?id=' + p.id}" class="chat-btn-view" target="_self">
                  <i class="fas fa-eye"></i> Voir
                </a>
                <button class="chat-btn-add" onclick="window.handleChatbotAddToCart('${p.id}')">
                  <i class="fas fa-cart-plus"></i> Panier
                </button>
              </div>
            </div>
          </div>
        `).join('')}
      </div>`;
    }

    row.innerHTML = `<div class="chat-bubble">${formatBotMarkdown(textHTML)}${productsHTML}</div>`;
    messagesEl.appendChild(row);
    scrollToBottom();
  }

  function showTypingIndicator() {
    const messagesEl = document.getElementById('chatbotMessages');
    if (!messagesEl || document.getElementById('chatbotTypingIndicator')) return;

    const typingEl = document.createElement('div');
    typingEl.className = 'chat-message-row bot';
    typingEl.id = 'chatbotTypingIndicator';
    typingEl.innerHTML = `
      <div class="typing-indicator">
        <span style="font-size:0.75rem; color:var(--chat-text-muted); margin-right:4px;">Le conseiller écrit</span>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
      </div>
    `;
    messagesEl.appendChild(typingEl);
    scrollToBottom();
  }

  function removeTypingIndicator() {
    const typingEl = document.getElementById('chatbotTypingIndicator');
    if (typingEl) typingEl.remove();
  }

  function scrollToBottom() {
    const messagesEl = document.getElementById('chatbotMessages');
    if (messagesEl) {
      messagesEl.scrollTop = messagesEl.scrollHeight;
    }
  }

  function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g, 
      tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
  }

  function formatBotMarkdown(text) {
    if (!text) return '';
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br>');
  }

  // Global Cart Bridge Function
  window.handleChatbotAddToCart = function (productId) {
    if (typeof window.handleAddToCart === 'function') {
      window.handleAddToCart(productId);
    } else {
      alert("Produit ajouté au panier !");
    }
  };

})();
