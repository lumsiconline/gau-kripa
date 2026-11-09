// Real-time synchronization hub for GauKripa Chat (Devotee WhatsApp UI <-> Astro Dashboard)
import { ChatMessage, ChatSession } from './api';

// Create broadcast channel for zero-latency, cross-tab and in-tab message delivery
let channel: BroadcastChannel | null = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    channel = new BroadcastChannel('gaukripa_live_chat_channel');
  } catch (err) {
    console.warn('BroadcastChannel not supported in this environment:', err);
  }
}

export type ChatBusEvent =
  | { type: 'NEW_CHAT_REQUEST'; session: ChatSession }
  | { type: 'CHAT_ACCEPTED'; session: ChatSession }
  | { type: 'NEW_MESSAGE'; sessionId: string; message: ChatMessage; session: ChatSession }
  | { type: 'CHAT_ENDED'; sessionId: string };

// Helper to save session locally
export function saveLocalSession(session: ChatSession) {
  try {
    localStorage.setItem(`gaukripa_session_${session.id}`, JSON.stringify(session));
    localStorage.setItem(`gaukripa_astro_active_${session.astrologerId}`, JSON.stringify(session));
    localStorage.setItem(`gaukripa_latest_chat_id`, session.id);
  } catch (e) {
    console.error('Failed to save local session:', e);
  }
}

// Helper to read session locally
export function getLocalSession(sessionId: string): ChatSession | null {
  try {
    const raw = localStorage.getItem(`gaukripa_session_${sessionId}`);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

// Get active session for an astrologer
export function getAstrologerActiveSession(astrologerId: string): ChatSession | null {
  try {
    const raw = localStorage.getItem(`gaukripa_astro_active_${astrologerId}`);
    if (raw) {
      const sess: ChatSession = JSON.parse(raw);
      if (sess.status === 'active' || sess.status === 'waiting_approval') {
        return sess;
      }
    }
  } catch {}
  return null;
}

// Broadcast an event to all tabs and listeners
export function broadcastChatEvent(event: ChatBusEvent) {
  if (channel) {
    try {
      channel.postMessage(event);
    } catch (e) {
      console.warn('Broadcast failed:', e);
    }
  }
  // Also dispatch window custom event for same-tab components
  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(new CustomEvent('gaukripa_chat_event', { detail: event }));
      // Storage trigger for cross-tab fallback
      window.dispatchEvent(new Event('storage'));
    } catch {}
  }
}

// Subscribe to events for a specific chat session
export function subscribeToSession(
  sessionId: string,
  callbacks: {
    onMessage: (message: ChatMessage, session: ChatSession) => void;
    onEnd?: () => void;
  }
): () => void {
  const handleEvent = (event: ChatBusEvent) => {
    if (event.type === 'NEW_MESSAGE' && event.sessionId === sessionId) {
      callbacks.onMessage(event.message, event.session);
    } else if (event.type === 'CHAT_ENDED' && event.sessionId === sessionId) {
      if (callbacks.onEnd) callbacks.onEnd();
    }
  };

  // BroadcastChannel listener
  const bcListener = (e: MessageEvent) => {
    if (e.data && e.data.type) {
      handleEvent(e.data as ChatBusEvent);
    }
  };
  if (channel) {
    channel.addEventListener('message', bcListener);
  }

  // Same-window CustomEvent listener
  const customListener = (e: Event) => {
    const detail = (e as CustomEvent).detail;
    if (detail && detail.type) {
      handleEvent(detail as ChatBusEvent);
    }
  };
  window.addEventListener('gaukripa_chat_event', customListener);

  return () => {
    if (channel) channel.removeEventListener('message', bcListener);
    window.removeEventListener('gaukripa_chat_event', customListener);
  };
}

// Subscribe to incoming consultations for an astrologer
export function subscribeToAstrologerIncoming(
  astrologerId: string,
  callbacks: {
    onIncoming: (session: ChatSession) => void;
    onMessage: (message: ChatMessage, session: ChatSession) => void;
  }
): () => void {
  const handleEvent = (event: ChatBusEvent) => {
    if (event.type === 'NEW_CHAT_REQUEST') {
      if (!astrologerId || event.session.astrologerId === astrologerId) {
        callbacks.onIncoming(event.session);
      }
    } else if (event.type === 'NEW_MESSAGE') {
      if (!astrologerId || event.session.astrologerId === astrologerId) {
        callbacks.onMessage(event.message, event.session);
      }
    }
  };

  const bcListener = (e: MessageEvent) => {
    if (e.data && e.data.type) {
      handleEvent(e.data as ChatBusEvent);
    }
  };
  if (channel) {
    channel.addEventListener('message', bcListener);
  }

  const customListener = (e: Event) => {
    const detail = (e as CustomEvent).detail;
    if (detail && detail.type) {
      handleEvent(detail as ChatBusEvent);
    }
  };
  window.addEventListener('gaukripa_chat_event', customListener);

  return () => {
    if (channel) channel.removeEventListener('message', bcListener);
    window.removeEventListener('gaukripa_chat_event', customListener);
  };
}
