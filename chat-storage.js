/**
 * MentorBridge - Chat localStorage fallback
 * Persists chat messages to localStorage for demo (survives server restart)
 */

function chatStorageKey(userId, partnerId) {
  return 'mb_chat_' + [userId, partnerId].sort().join('_');
}

function getStoredChat(userId, partnerId) {
  try {
    const raw = localStorage.getItem(chatStorageKey(userId, partnerId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function storeChatMessage(userId, partnerId, message) {
  const key = chatStorageKey(userId, partnerId);
  const msgs = getStoredChat(userId, partnerId);
  msgs.push(message);
  localStorage.setItem(key, JSON.stringify(msgs));
}
