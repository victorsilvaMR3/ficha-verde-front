import { useMemo } from 'react'
import { useConsultationStore } from '../../lib/state/consultationStore'
import { pdfService } from '../../lib/pdf/pdfService'

const AtestadoForm = ({ consultationId }) => {
  const { drafts, saveCertificateDraft, lastSavedAt } = useConsultationStore()
  const cert = drafts.certificate || { cid: '', restDays: '', activities: '', stamp: '' }

  const savedAgo = useMemo(() => lastSavedAt.certificate ? `${Math.floor((Date.now() - lastSavedAt.certificate)/1000)}s` : '—', [lastSavedAt.certificate])

  const update = (field, value) => {
    saveCertificateDraft(consultationId, { ...cert, [field]: value })
  }

  const handleEmit = async () => {
    alert('Atestado emitido (stub). Integração Memed quando aplicável.')
  }

  const handleExport = async () => {
    await pdfService.exportCertificate({ consultationId, certificate: cert })
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-xs text-gray-500">Salvo há {savedAgo}</div>
        <div className="flex gap-2">
          <button onClick={handleEmit} className="px-3 py-1 rounded bg-green-600 text-white hover:bg-green-700">Emitir/Assinar</button>
          <button onClick={handleExport} className="px-3 py-1 rounded bg-gray-100 text-gray-900 hover:bg-gray-200 border border-gray-200">Exportar PDF</button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <input
          value={cert.cid}
          onChange={(e) => update('cid', e.target.value)}
          className="rounded-md bg-white text-gray-900 p-2 border border-gray-300"
          placeholder="CID (opcional)"
          aria-label="CID"
        />
        <input
          type="number"
          min="0"
          value={cert.restDays}
          onChange={(e) => update('restDays', e.target.value)}
          className="rounded-md bg-white text-gray-900 p-2 border border-gray-300"
          placeholder="Dias de afastamento"
          aria-label="Dias de afastamento"
        />
        <textarea
          value={cert.activities}
          onChange={(e) => update('activities', e.target.value)}
          className="md:col-span-2 rounded-md bg-white text-gray-900 p-2 border border-gray-300 h-24"
          placeholder="Atividades restritas/livres"
          aria-label="Atividades"
        />
        <input
          value={cert.stamp}
          onChange={(e) => update('stamp', e.target.value)}
          className="md:col-span-2 rounded-md bg-white text-gray-900 p-2 border border-gray-300"
          placeholder="Carimbo/Assinatura (texto ou identificador)"
          aria-label="Carimbo"
        />
      </div>
    </div>
  )
}

export default AtestadoForm


