import { useEffect, useState } from 'react'
import api from '../../services/api'
import { FileText, Clock, User2 } from 'lucide-react'

const typeLabel = {
  EVOLUTION: 'Evolução'
}

const PatientHistoryPanel = ({ patientId, onSelect, refreshToken }) => {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!patientId) return
    (async () => {
      setLoading(true)
      try {
        const { data } = await api.get(`/consultations/patient/${patientId}/history`)
        setItems(data.history || [])
      } catch (e) {
        setError('Erro ao carregar histórico')
      } finally {
        setLoading(false)
      }
    })()
  }, [patientId, refreshToken])

  if (loading) return (
    <div className="space-y-2">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="h-14 rounded-md bg-gray-100" />
        </div>
      ))}
    </div>
  )
  if (error) return <div className="text-xs rounded border border-red-200 bg-red-50 text-red-700 px-2 py-1">{error}</div>

  return (
    <div className="space-y-2">
      {items.length === 0 && (
        <div className="text-sm text-gray-500">Sem documentos anteriores.</div>
      )}
      {items.map((item, idx) => (
        <div
          key={idx}
          className="group flex items-start justify-between rounded-md border border-gray-200 bg-white p-3 hover:bg-gray-50 transition-colors"
        >
          <div className="flex-1 pr-3">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-gray-400" />
              <div className="text-sm font-medium text-gray-900">{typeLabel[item.type]}</div>
            </div>
            <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
              <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />{new Date(item.createdAt).toLocaleString('pt-BR')}</span>
              <span className="inline-flex items-center gap-1"><User2 className="h-3 w-3" />Dr(a). {item.doctor?.name || '—'}</span>
            </div>
            {item.summary && (
              <div className="text-xs text-gray-600 mt-2 line-clamp-2">{item.summary}</div>
            )}
          </div>
          <button
            onClick={async () => {
              if (!onSelect) return
              if (item.type === 'EVOLUTION') {
                try {
                  if (item.id) {
                    const { data } = await api.get(`/consultations/evolutions/${item.id}`)
                    onSelect({ ...item, content: data.content })
                  } else {
                    const { data } = await api.get(`/consultations/${item.consultationId}`)
                    const fullText = data.consultation?.evolution || ''
                    onSelect({ ...item, content: fullText })
                  }
                } catch {
                  onSelect(item)
                }
              } else {
                onSelect(item)
              }
            }}
            className="self-center rounded-md border border-gray-200 px-2.5 py-1.5 text-xs text-gray-700 hover:bg-gray-100"
            aria-label="Abrir item do histórico"
          >
            Ver
          </button>
        </div>
      ))}
    </div>
  )
}

export default PatientHistoryPanel


