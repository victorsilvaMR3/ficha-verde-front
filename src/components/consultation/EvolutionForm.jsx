import { useEffect, useState } from 'react'
import api from '../../services/api'
import toast from 'react-hot-toast'

const EvolutionForm = ({ consultationId, initialEvolution = '', onSaved }) => {
  const [evolution, setEvolution] = useState(initialEvolution || '')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    setEvolution(initialEvolution || '')
  }, [initialEvolution])

  const handleSave = async () => {
    if (!consultationId) return
    setIsSaving(true)
    try {
      await api.patch(`/consultations/${consultationId}/evolution`, { evolution })
      toast.success('Evolução salva com sucesso')
      onSaved && onSaved(evolution)
    } catch (error) {
      const message = error.response?.data?.error || 'Erro ao salvar evolução'
      toast.error(message)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-200">Evolução médica</label>
      <textarea
        className="w-full h-40 rounded-md bg-gray-800 text-white p-3 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500"
        placeholder="Descreva a evolução e achados do atendimento..."
        value={evolution}
        onChange={(e) => setEvolution(e.target.value)}
      />
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-4 py-2 rounded-md bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white"
        >
          {isSaving ? 'Salvando...' : 'Salvar evolução'}
        </button>
      </div>
    </div>
  )
}

export default EvolutionForm


