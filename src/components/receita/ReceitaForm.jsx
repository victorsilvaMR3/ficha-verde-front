import { useEffect } from 'react'
import { useConsultationStore } from '../../lib/state/consultationStore'
import { useMemed } from '../../lib/memed/useMemed'
import { pdfService } from '../../lib/pdf/pdfService'

const ReceitaForm = ({ consultationId }) => {
  const { drafts, savePrescriptionDraft, lastSavedAt } = useConsultationStore()
  const { ready, openComposer } = useMemed()

  useEffect(() => {
    // preload if needed
  }, [])

  const handleChange = (index, field, value) => {
    const next = (drafts.prescription || []).map((i, idx) => idx === index ? { ...i, [field]: value } : i)
    savePrescriptionDraft(consultationId, next)
  }

  const addItem = () => {
    const next = [ ...(drafts.prescription || []), { name: '', dosage: '', duration: '', notes: '' } ]
    savePrescriptionDraft(consultationId, next)
  }

  const removeItem = (index) => {
    const next = (drafts.prescription || []).filter((_, i) => i !== index)
    savePrescriptionDraft(consultationId, next)
  }

  const handleEmit = async () => {
    // Construir paciente com base nos dados da consulta corrente (armazenados pelo app)
    // drafts.patient pode não existir; vamos tentar usar window.__currentConsultation
    const c = window.__currentConsultation || {}
    const p = c.patient || {}
    const patient = {
      idExterno: p.id || c.patientId || 'paciente-sem-id',
      nome: p.name || 'Paciente',
      cpf: p.cpf?.replace(/\D/g, '') || undefined,
      withoutCpf: p.cpf ? undefined : true,
      data_nascimento: p.birthDate ? new Date(p.birthDate).toLocaleDateString('pt-BR') : undefined,
      telefone: p.phone || undefined,
      email: p.email || undefined
    }
    const btn = document.getElementById('btn-memed')
    if (btn) btn.disabled = true
    await openComposer({ patient })
    if (btn) btn.disabled = false
  }

  const handleExport = async () => {
    await pdfService.exportPrescription({ consultationId, items: drafts.prescription || [] })
  }

  const savedAgo = lastSavedAt.prescription ? `${Math.floor((Date.now() - lastSavedAt.prescription)/1000)}s` : '—'

  const items = drafts.prescription || []

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-xs text-gray-500">Salvo há {savedAgo}</div>
        <div className="flex gap-2">
          <button onClick={addItem} className="px-3 py-1 rounded bg-gray-100 text-gray-900 hover:bg-gray-200 border border-gray-200">Adicionar item</button>
          <button id="btn-memed" onClick={handleEmit} className="px-3 py-1 rounded bg-green-600 text-white hover:bg-green-700">Prescrever com Memed</button>
          <button onClick={handleExport} className="px-3 py-1 rounded bg-gray-100 text-gray-900 hover:bg-gray-200 border border-gray-200">Exportar PDF</button>
        </div>
      </div>
      <div className="space-y-3">
        {items.length === 0 && (
          <div className="text-sm text-gray-500">Nenhum item adicionado.</div>
        )}
        {items.map((item, index) => (
          <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-3">
            <input
              value={item.name}
              onChange={(e) => handleChange(index, 'name', e.target.value)}
              className="md:col-span-4 rounded-md bg-white text-gray-900 p-2 border border-gray-300"
              placeholder="Medicamento"
            />
            <input
              value={item.dosage}
              onChange={(e) => handleChange(index, 'dosage', e.target.value)}
              className="md:col-span-3 rounded-md bg-white text-gray-900 p-2 border border-gray-300"
              placeholder="Posologia"
            />
            <input
              value={item.duration}
              onChange={(e) => handleChange(index, 'duration', e.target.value)}
              className="md:col-span-2 rounded-md bg-white text-gray-900 p-2 border border-gray-300"
              placeholder="Duração"
            />
            <input
              value={item.notes}
              onChange={(e) => handleChange(index, 'notes', e.target.value)}
              className="md:col-span-2 rounded-md bg-white text-gray-900 p-2 border border-gray-300"
              placeholder="Observações"
            />
            <div className="md:col-span-1 flex items-center">
              <button onClick={() => removeItem(index)} className="px-3 py-2 rounded bg-red-600 text-white hover:bg-red-700">Remover</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default ReceitaForm


