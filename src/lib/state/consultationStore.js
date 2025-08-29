import { create } from 'zustand'

// Keys in localStorage are namespaced by consultationId for isolation
const storageKey = (consultationId, suffix) => `consultation:${consultationId}:${suffix}`

export const useConsultationStore = create((set, get) => ({
  activeModule: 'EVOLUCAO', // EVOLUCAO | RECEITA | ATESTADO
  drafts: {
    evolution: '',
    prescription: [],
    certificate: {
      cid: '',
      restDays: '',
      activities: '',
      stamp: ''
    }
  },
  lastSavedAt: {
    evolution: null,
    prescription: null,
    certificate: null
  },
  miniPlayer: {
    position: { x: 16, y: 16 },
    size: { width: 320, height: 180 },
    preset: 'mini', // mini | medium
    state: 'normal', // minimized | normal | maximized
    pinned: false
  },

  setActiveModule: (module) => set({ activeModule: module }),

  loadFromStorage: (consultationId) => {
    if (!consultationId) return
    try {
      const evolution = localStorage.getItem(storageKey(consultationId, 'draft:evolution'))
      const prescription = localStorage.getItem(storageKey(consultationId, 'draft:prescription'))
      const certificate = localStorage.getItem(storageKey(consultationId, 'draft:certificate'))
      const miniPlayer = localStorage.getItem(storageKey(consultationId, 'miniPlayer'))

      const next = {}
      if (evolution !== null) next.evolution = evolution
      if (prescription !== null) next.prescription = JSON.parse(prescription)
      if (certificate !== null) next.certificate = JSON.parse(certificate)

      set((state) => ({
        drafts: { ...state.drafts, ...next },
        miniPlayer: miniPlayer ? JSON.parse(miniPlayer) : state.miniPlayer
      }))
    } catch {}
  },

  saveEvolutionDraft: (consultationId, text) => {
    set((state) => ({ drafts: { ...state.drafts, evolution: text } }))
    try {
      localStorage.setItem(storageKey(consultationId, 'draft:evolution'), text)
      set((state) => ({ lastSavedAt: { ...state.lastSavedAt, evolution: Date.now() } }))
    } catch {}
  },

  savePrescriptionDraft: (consultationId, items) => {
    set((state) => ({ drafts: { ...state.drafts, prescription: items } }))
    try {
      localStorage.setItem(storageKey(consultationId, 'draft:prescription'), JSON.stringify(items))
      set((state) => ({ lastSavedAt: { ...state.lastSavedAt, prescription: Date.now() } }))
    } catch {}
  },

  saveCertificateDraft: (consultationId, cert) => {
    set((state) => ({ drafts: { ...state.drafts, certificate: cert } }))
    try {
      localStorage.setItem(storageKey(consultationId, 'draft:certificate'), JSON.stringify(cert))
      set((state) => ({ lastSavedAt: { ...state.lastSavedAt, certificate: Date.now() } }))
    } catch {}
  },

  updateMiniPlayer: (consultationId, partial) => {
    set((state) => ({ miniPlayer: { ...state.miniPlayer, ...partial } }))
    try {
      const next = { ...get().miniPlayer, ...partial }
      localStorage.setItem(storageKey(consultationId, 'miniPlayer'), JSON.stringify(next))
    } catch {}
  },

  setMiniPreset: (consultationId, preset) => {
    const sizes = { mini: { width: 320, height: 180 }, medium: { width: 480, height: 270 } }
    const size = sizes[preset] || sizes.mini
    set((state) => ({ miniPlayer: { ...state.miniPlayer, preset, size } }))
    try {
      const next = { ...get().miniPlayer, preset, size }
      localStorage.setItem(storageKey(consultationId, 'miniPlayer'), JSON.stringify(next))
    } catch {}
  }
}))


