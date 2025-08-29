import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { Video, FileText, User, Clock } from 'lucide-react'
import api from '../services/api'
import toast from 'react-hot-toast'

const Consultation = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [consultation, setConsultation] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchConsultation()
  }, [id])

  const fetchConsultation = async () => {
    try {
      const response = await api.get(`/consultations/${id}`)
      setConsultation(response.data.consultation)
    } catch (error) {
      console.error('Error fetching consultation:', error)
      toast.error('Erro ao carregar consulta')
    } finally {
      setLoading(false)
    }
  }

  const joinVideoCall = () => {
    navigate(`/video-call/${id}`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="loading-spinner"></div>
      </div>
    )
  }

  if (!consultation) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Consulta não encontrada</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Consulta #{consultation.id.slice(-8)}
        </h1>
        <p className="text-gray-600 mt-2">
          {new Date(consultation.createdAt).toLocaleDateString('pt-BR')}
        </p>
      </div>

      {/* Consultation Details */}
      <div className="grid md:grid-cols-2 gap-8">
        {/* Patient/Doctor Info */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {user?.role === 'PATIENT' ? 'Médico' : 'Paciente'}
          </h2>
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">
                {user?.role === 'PATIENT' 
                  ? consultation.doctor?.name || 'Aguardando médico'
                  : consultation.patient?.name
                }
              </h3>
              <p className="text-sm text-gray-500">
                {user?.role === 'PATIENT' 
                  ? consultation.doctor?.email || 'Email não disponível'
                  : consultation.patient?.email
                }
              </p>
            </div>
          </div>
        </div>

        {/* Status */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Status da Consulta
          </h2>
          <div className="flex items-center space-x-3">
            <Clock className="w-5 h-5 text-gray-400" />
            <span className="font-medium text-gray-900">
              {consultation.status === 'WAITING' && 'Aguardando médico'}
              {consultation.status === 'ACTIVE' && 'Em andamento'}
              {consultation.status === 'FINISHED' && 'Finalizada'}
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      {consultation.status === 'ACTIVE' && (
        <div className="card mt-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Ações Disponíveis
          </h2>
          <div className="flex space-x-4">
            <button
              onClick={joinVideoCall}
              className="btn-primary flex items-center space-x-2"
            >
              <Video className="w-5 h-5" />
              <span>Entrar na Videochamada</span>
            </button>
          </div>
        </div>
      )}

      {/* Medical Evolution */}
      {consultation.evolution && (
        <div className="card mt-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Evolução Médica
          </h2>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-gray-700">{consultation.evolution}</p>
          </div>
        </div>
      )}

      {/* Prescription */}
      {consultation.prescription && (
        <div className="card mt-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Prescrição Médica
          </h2>
          <div className="flex items-center space-x-2 text-primary-600">
            <FileText className="w-5 h-5" />
            <span>Prescrição disponível</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default Consultation 