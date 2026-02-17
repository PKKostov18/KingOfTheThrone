import { create } from 'zustand';

interface SessionState {
  isActive: boolean;
  startTime: Date | null;
  startSession: () => void;
  endSession: () => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  isActive: false,
  startTime: null,
  startSession: () => set({ isActive: true, startTime: new Date() }),
  endSession: () => set({ isActive: false, startTime: null }),
}));