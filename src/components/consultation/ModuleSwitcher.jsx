import { useEffect } from 'react'

const tabs = [
  { key: 'EVOLUCAO', label: 'Evolução', hotkey: '1' },
  { key: 'RECEITA', label: 'Receita', hotkey: '2' },
  { key: 'ATESTADO', label: 'Atestado', hotkey: '3' }
]

const ModuleSwitcher = ({ active, onChange }) => {
  useEffect(() => {
    const handler = (e) => {
      if (e.altKey) {
        if (e.key === '1') onChange('EVOLUCAO')
        if (e.key === '2') onChange('RECEITA')
        if (e.key === '3') onChange('ATESTADO')
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onChange])

  return (
    <div role="tablist" aria-label="Alternar módulos" className="inline-flex rounded-md border border-gray-700 overflow-hidden">
      {tabs.map(t => (
        <button
          key={t.key}
          role="tab"
          aria-selected={active === t.key}
          onClick={() => onChange(t.key)}
          className={`px-4 py-2 text-sm ${active === t.key ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-200 hover:bg-gray-700'}`}
        >
          {t.label}
          <span className="ml-2 text-xs opacity-70">Alt+{t.hotkey}</span>
        </button>
      ))}
    </div>
  )
}

export default ModuleSwitcher


