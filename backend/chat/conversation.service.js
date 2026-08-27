import { crypto } from 'crypto';

// Mémoire in-memory des sessions de conversation
const conversationStore = new Map();

// Nettoyage automatique des conversations inactives (> 2 heures)
setInterval(() => {
  const now = Date.now();
  for (const [id, session] of conversationStore.entries()) {
    if (now - session.lastActivity > 2 * 60 * 60 * 1000) {
      conversationStore.delete(id);
    }
  }
}, 15 * 60 * 1000);

export function getOrCreateConversation(conversationId) {
  let id = conversationId;
  if (!id || typeof id !== 'string' || !conversationStore.has(id)) {
    id = generateUUID();
    conversationStore.set(id, {
      id: id,
      messages: [],
      productsConsulted: [],
      language: 'fr',
      createdAt: Date.now(),
      lastActivity: Date.now()
    });
  }

  const session = conversationStore.get(id);
  session.lastActivity = Date.now();
  return session;
}

export function saveMessageToConversation(conversationId, role, content) {
  const session = getOrCreateConversation(conversationId);
  session.messages.push({ role, content, timestamp: Date.now() });
  
  // Conserver uniquement les 12 derniers messages (context windowing)
  if (session.messages.length > 12) {
    session.messages = session.messages.slice(-12);
  }
}

export function getConversationHistory(conversationId) {
  const session = getOrCreateConversation(conversationId);
  return session.messages.map(m => ({ role: m.role, content: m.content }));
}

function generateUUID() {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }
  return 'conv-' + Math.random().toString(36).substring(2, 11) + '-' + Date.now();
}
