/**
 * Amar Informatique - Client Chatbot IA
 * Integrated Chatbot Widget JavaScript
 */

(function () {
  const CHAT_STORAGE_KEY = 'amar_chat_session_id';
  const API_ENDPOINT = (window.location.origin && !window.location.origin.startsWith('file'))
    ? '/api/chat'
    : 'http://localhost:3000/api/chat';

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
            <button class="chatbot-header-btn" id="chatbotMinimizeBtn" title="Réduire"><i class="fas fa-minus"></i></button>
            <button class="chatbot-header-btn" id="chatbotCloseBtn" title="Fermer"><i class="fas fa-times"></i></button>
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
          <button class="chatbot-send-btn" id="chatbotSendBtn" title="Envoyer"><i class="fas fa-paper-plane"></i></button>
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

  function closeChatWindow() {
    const windowEl = document.getElementById('chatbotWindow');
    if (!windowEl) return;
    windowEl.classList.remove('active');
    windowEl.setAttribute('aria-hidden', 'true');
  }

  function minimizeChatWindow() {
    const windowEl = document.getElementById('chatbotWindow');
    if (!windowEl) return;
    windowEl.classList.toggle('minimized');
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

    try {
      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userText,
          conversationId: conversationId
        })
      });

      removeTypingIndicator();

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const data = await response.json();

      if (data.conversationId) {
        conversationId = data.conversationId;
        localStorage.setItem(CHAT_STORAGE_KEY, conversationId);
      }

      if (data.success && data.message) {
        appendBotBubble(data.message, data.products);
      } else {
        appendBotBubble("Désolé, je n'ai pas réussi à traiter votre demande. Veuillez réessayer.");
      }

    } catch (error) {
      console.error("❌ Erreur Chatbot API:", error);
      removeTypingIndicator();
      appendBotBubble("⚠️ Problème de connexion au serveur IA. Veuillez vérifier votre connexion ou retenter dans quelques secondes.");
    } finally {
      isSending = false;
    }
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
            <img src="${p.image || 'logo.jpg'}" alt="${escapeHTML(p.name)}" class="chat-product-img" onerror="this.src='logo.jpg'">
            <div class="chat-product-details">
              <h4 class="chat-product-name">${escapeHTML(p.name)}</h4>
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
