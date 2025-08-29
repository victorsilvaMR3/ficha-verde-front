import { useEffect, useMemo, useState } from 'react'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { useConsultationStore } from '../../lib/state/consultationStore'

const placeholders = `Queixa principal, HMA, Antecedentes, Exame físico, Hipóteses, Conduta...`

const EvolucaoEditor = ({ consultationId, onFinalized, externalValue, onRequestNew }) => {
  const { drafts, saveEvolutionDraft, lastSavedAt } = useConsultationStore()
  const [text, setText] = useState(drafts.evolution || '')
  const [saving, setSaving] = useState(false)
  const [readOnly, setReadOnly] = useState(false)

  useEffect(() => {
    setText(drafts.evolution || '')
  }, [drafts.evolution])

  useEffect(() => {
    if (typeof externalValue === 'string') {
      setText(externalValue)
      setReadOnly(true)
    } else if (externalValue === undefined) {
      setReadOnly(false)
      setText(drafts.evolution || '')
    }
  }, [externalValue, drafts.evolution])

  // autosave on blur
  const onBlur = () => { if (!readOnly) saveEvolutionDraft(consultationId, text) }

  const savedAgo = useMemo(() => {
    const ts = lastSavedAt.evolution
    if (!ts) return '—'
    const secs = Math.floor((Date.now() - ts) / 1000)
    return `${secs}s`
  }, [lastSavedAt.evolution])

  const handleSaveDraft = async () => {
    if (readOnly) return
    setSaving(true)
    saveEvolutionDraft(consultationId, text)
    setSaving(false)
  }

  const handleFinalize = async () => {
    if (readOnly) return
    if (!text.trim()) return alert('Evolução vazia')
    if (!consultationId) return alert('Consulta inválida')
    try {
      await api.patch(`/consultations/${consultationId}/evolution`, { evolution: text })
      toast.success('Evolução salva com sucesso')
      // Persist local draft as well
      saveEvolutionDraft(consultationId, text)
      onFinalized && onFinalized({ type: 'EVOLUTION', content: text })
    } catch (e) {
      const msg = e.response?.data?.error || 'Erro ao salvar evolução'
      toast.error(msg)
    }
  }

  // Export removido conforme solicitação

  return (
    <div className="space-y-4">
      {readOnly ? (
        <div className="flex items-start justify-between gap-2">
          <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
            Esta é uma evolução finalizada. Edição desabilitada.
          </div>
          <button
            onClick={() => onRequestNew && onRequestNew()}
            className="px-2.5 py-1.5 text-xs rounded-md bg-green-600 text-white hover:bg-green-700 shadow-sm"
          >
            Nova evolução
          </button>
        </div>
      ) : (
        <div className="text-xs text-gray-500">Salvo há {savedAgo}</div>
      )}
      <textarea
        aria-label="Editor de evolução"
        placeholder={placeholders}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={onBlur}
        readOnly={readOnly}
        className={`w-full h-64 rounded-lg bg-white text-gray-900 p-3 border ${readOnly ? 'bg-gray-50 text-gray-700 border-gray-200' : 'border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500'} shadow-sm`}
      />
      <div className="text-xs text-gray-500 text-right">{text.length} caracteres</div>
      <div className="flex gap-2 pt-2 border-t border-gray-200">
        <button onClick={handleSaveDraft} disabled={saving || readOnly} className={`px-3 py-2 rounded-md ${readOnly ? 'bg-gray-100 text-gray-400 border border-gray-200' : 'bg-gray-100 text-gray-900 hover:bg-gray-200 border border-gray-200'} shadow-sm`}>
          {saving ? 'Salvando...' : 'Salvar rascunho'}
        </button>
        <button onClick={handleFinalize} disabled={readOnly} className={`px-3 py-2 rounded-md ${readOnly ? 'bg-gray-200 text-gray-400' : 'bg-green-600 text-white hover:bg-green-700'} shadow-sm`}>Finalizar evolução</button>
      </div>
    </div>
  )
}

export default EvolucaoEditor


