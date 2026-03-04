import { create } from 'zustand'

export const useIPStore = create((set) => ({
  inputIP:    '',
  setInputIP: (v) => set({ inputIP: v }),

  isScanning: false,
  setIsScanning: (v) => set({ isScanning: v }),

  result: null,
  setResult: (result) => set({ result }),

  error: null,
  setError: (error) => set({ error }),

  activeView: 'overview',
  setActiveView: (v) => set({ activeView: v }),

  reset: () => set({ result: null, error: null, isScanning: false, activeView: 'overview' }),
}))