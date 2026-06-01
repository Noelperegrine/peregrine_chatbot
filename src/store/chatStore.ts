import { create } from 'zustand';
import type { Session, Message } from '@/types';

interface ChatState {
  currentSession: Session | null;
  sessions: Session[];
  isLoading: boolean;
  error: string | null;
  setCurrentSession: (session: Session | null) => void;
  setSessions: (sessions: Session[]) => void;
  addMessage: (message: Message) => void;
  updateMessage: (messageId: string, updates: Partial<Message>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  currentSession: null,
  sessions: [],
  isLoading: false,
  error: null,
  setCurrentSession: (session) => set({ currentSession: session }),
  setSessions: (sessions) => set({ sessions }),
  addMessage: (message) =>
    set((state) => ({
      currentSession: state.currentSession
        ? {
            ...state.currentSession,
            messages: [...(state.currentSession.messages || []), message],
          }
        : null,
    })),
  updateMessage: (messageId, updates) =>
    set((state) => ({
      currentSession: state.currentSession
        ? {
            ...state.currentSession,
            messages: (state.currentSession.messages || []).map((msg) =>
              msg.id === messageId ? { ...msg, ...updates } : msg
            ),
          }
        : null,
    })),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),
}));
