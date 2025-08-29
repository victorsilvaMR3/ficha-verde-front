import { useEffect, useRef, useState } from 'react'
import api from '../../services/api'

export function useMemed() {
  const [ready, setReady] = useState(false)
  const tokenRef = useRef('')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const { data } = await api.get('/doctors/memed/config')
        const { scriptUrl, token } = data
        tokenRef.current = token || ''

        // Se já existir um script carregado sem token correto, remove e recarrega com token
        const existing = document.querySelector('script[data-memed="true"]')
        if (existing) {
          const hasToken = existing.getAttribute('data-token')
          if (!hasToken && token) {
            existing.remove()
          } else if (hasToken && token && hasToken !== token) {
            existing.remove()
          } else {
            if (!cancelled) setReady(true)
            return
          }
        }

        // Se não houver token, evita carregar para não disparar erro no script da Memed
        if (!token) {
          return
        }

        const s = document.createElement('script')
        s.src = scriptUrl
        s.async = true
        s.dataset.memed = 'true'
        s.setAttribute('data-token', token)
        s.onload = () => { if (!cancelled) setReady(true) }
        document.body.appendChild(s)
      } catch (e) {
        // silent
      }
    })()
    return () => { cancelled = true }
  }, [])

  const loadScript = () => new Promise((resolve) => {
    const token = tokenRef.current
    if (!token) return resolve(false)
    const existing = document.querySelector('script[data-memed="true"]')
    if (existing) {
      const hasToken = existing.getAttribute('data-token')
      if (hasToken === token) return resolve(true)
      existing.remove()
    }
    // Helpers para carregar dependências que o SDK da Memed espera
    const loadExternal = (src) => new Promise((res, rej) => {
      const tag = document.createElement('script')
      tag.src = src
      tag.async = true
      tag.onload = () => res(true)
      tag.onerror = () => rej(new Error(`Falha ao carregar ${src}`))
      document.head.appendChild(tag)
    })

    const ensureDeps = async () => {
      // Zepto ($)
      if (typeof window.$ === 'undefined') {
        try {
          await loadExternal('https://cdn.jsdelivr.net/npm/zepto@1.2.0/dist/zepto.min.js')
          if (typeof window.$ === 'undefined' && typeof window.Zepto !== 'undefined') {
            window.$ = window.Zepto
          }
        } catch {
          try {
            await loadExternal('https://unpkg.com/zepto@1.2.0/dist/zepto.min.js')
            if (typeof window.$ === 'undefined' && typeof window.Zepto !== 'undefined') {
              window.$ = window.Zepto
            }
          } catch {}
        }
      }
      // Bluebird (Promise lib usada pelo SDK)
      if (typeof window.Bluebird === 'undefined') {
        try {
          await loadExternal('https://cdn.jsdelivr.net/npm/bluebird@3.7.2/js/browser/bluebird.min.js')
        } catch {
          try { await loadExternal('https://unpkg.com/bluebird@3.7.2/js/browser/bluebird.min.js') } catch {}
        }
      }
      // fetch polyfill (apenas se necessário)
      if (typeof window.fetch === 'undefined') {
        try {
          await loadExternal('https://cdn.jsdelivr.net/npm/whatwg-fetch@2.0.4/fetch.min.js')
        } catch {
          try { await loadExternal('https://unpkg.com/whatwg-fetch@2.0.4/fetch.js') } catch {}
        }
      }

      // Fallbacks locais se CDNs estiverem indisponíveis
      if (typeof window.$ === 'undefined') {
        const stub = function () {
          const api = {
            on: () => api,
            off: () => api,
            trigger: () => api,
            ready: (cb) => { try { cb && cb() } catch {} return api },
            ajax: () => (window.Promise ? window.Promise.resolve() : undefined),
            length: 0
          }
          return api
        }
        window.$ = stub
        window.Zepto = stub
      }
      if (typeof window.Bluebird === 'undefined') {
        window.Bluebird = window.Promise
      }
    }

    (async () => {
      try {
        await ensureDeps()
      } catch {}
      // Carregar script principal da Memed
      const url = 'https://integrations.memed.com.br/modulos/plataforma.sinapse-prescricao/build/sinapse-prescricao.min.js'
      const s = document.createElement('script')
      s.src = url
      s.async = true
      s.dataset.memed = 'true'
      s.setAttribute('data-token', token)
      s.onload = () => { setReady(true); resolve(true) }
      s.onerror = () => resolve(false)
      document.body.appendChild(s)
    })()
  })

  const openComposer = async ({ patient }) => {
    const ok = await loadScript()
    if (!ok) return

    // Listener para quando o módulo carregar
    const sp = window.MdSinapsePrescricao
    const hub = window.MdHub || window.mdHub
    if (!sp || !hub) return

    const safePatient = patient && Object.keys(patient).length > 0
      ? patient
      : { withoutCpf: true, nome: 'Paciente' }

    let handled = false
    const onInit = async (module) => {
      if (module.name !== 'plataforma.prescricao' || handled) return
      handled = true
      try {
        await hub.command.send('plataforma.prescricao', 'setPaciente', safePatient)
      } catch {}
      try { hub.module.show('plataforma.prescricao') } catch {}
    }
    try { sp.event.add('core:moduleInit', onInit) } catch {}

    // Tenta imediatamente caso o módulo já esteja disponível
    try {
      await hub.command.send('plataforma.prescricao', 'setPaciente', safePatient)
      hub.module.show('plataforma.prescricao')
    } catch {}
  }

  return { ready, openComposer }
}

