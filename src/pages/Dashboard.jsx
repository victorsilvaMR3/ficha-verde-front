import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { Video, Clock, FileText, User, Calendar, Phone, DollarSign } from 'lucide-react'
import api from '../services/api'
import toast from 'react-hot-toast'
import Credits from './Credits'

const Dashboard = () => {
  const { user, isAuthenticated, updateUser } = useAuthStore()
  const navigate = useNavigate()
  const [consultations, setConsultations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchConsultations()
  }, [])

  useEffect(() => {
    // refresh /auth/me to sync balance on mount
    (async () => {
      try {
        const me = await api.get('/auth/me')
        if (me?.data?.user) updateUser(me.data.user)
      } catch {}
    })()
  }, [updateUser])

  const fetchConsultations = async () => {
    try {
      const response = await api.get('/consultations')
      setConsultations(response.data.consultations)
    } catch (error) {
      console.error('Error fetching consultations:', error)
      toast.error('Erro ao carregar consultas')
    } finally {
      setLoading(false)
    }
  }

  const showPurchaseModal = () => {
    const modal = document.getElementById('purchase_modal');
    if (modal) {
      modal.showModal();
    }
  };

  const startConsultation = async () => {
    if (user?.role === 'PATIENT' && user?.balance === 0) {
      setError('Você não tem créditos suficientes para iniciar uma consulta.');
      showPurchaseModal();
      return;
    }

    try {
      const response = await api.post('/consultations')
      const { consultation } = response.data
      
      toast.success('Consulta criada com sucesso!')
      navigate(`/waiting-room/${consultation.id}`)
    } catch (error) {
      console.error('Error creating consultation:', error)
      setError(error.response?.data?.error || 'Erro ao criar consulta');
      toast.error(error.response?.data?.error || 'Erro ao criar consulta')
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'WAITING':
        return 'bg-yellow-100 text-yellow-800'
      case 'ACTIVE':
        return 'bg-green-100 text-green-800'
      case 'FINISHED':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'WAITING':
        return 'Aguardando'
      case 'ACTIVE':
        return 'Em andamento'
      case 'FINISHED':
        return 'Finalizada'
      default:
        return status
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="loading-spinner"></div>
      </div>
    )
  }

  // Find an ongoing consultation for the patient (WAITING or ACTIVE)
  const ongoingConsultation = user?.role === 'PATIENT'
    ? consultations.find(c => c.status === 'ACTIVE' || c.status === 'WAITING')
    : null

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Olá, {user?.name}! 👋
        </h1>
        <p className="text-gray-600 mt-2">
          Bem-vindo ao seu painel de consultas médicas
        </p>
      </div>

      {/* Return to ongoing consultation (Patient) */}
      {ongoingConsultation && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Video className="w-5 h-5 text-green-700" />
            <div>
              <p className="text-green-800 font-medium">Você tem uma consulta {ongoingConsultation.status === 'ACTIVE' ? 'em andamento' : 'aguardando médico'}.</p>
              <p className="text-sm text-green-700">Criada em {new Date(ongoingConsultation.createdAt).toLocaleString('pt-BR')}</p>
            </div>
          </div>
          <button
            onClick={() => navigate(ongoingConsultation.status === 'ACTIVE' ? `/video-call/${ongoingConsultation.id}` : `/waiting-room/${ongoingConsultation.id}`)}
            className="btn-primary text-sm"
          >
            Voltar para a consulta
          </button>
        </div>
      )}

      {/* Patient Credit Balance */}
      {user?.role === 'PATIENT' && (
        <div className="bg-primary-50 rounded-lg p-4 flex items-center justify-between mb-6 shadow-sm">
          <div className="flex items-center space-x-3">
            <DollarSign className="w-6 h-6 text-primary-600" />
            <p className="text-lg font-medium text-gray-800">
              Seu saldo de créditos: <span className="font-bold text-primary-700">{Number.isFinite(user?.balance) ? user.balance : 0}</span>
            </p>
          </div>
          <button 
            onClick={() => navigate('/creditos')}
            className="btn-secondary text-sm px-4 py-2"
          >
            Gerenciar Créditos
          </button>
        </div>
      )}

      {/* Quick Actions */}
      {user?.role === 'PATIENT' && (
        <div className="mb-8">
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Iniciar Nova Consulta
            </h2>
            <p className="text-gray-600 mb-4">
              Conecte-se com um médico qualificado em poucos minutos
            </p>
            {error && <p className="text-red-500 mb-4">{error}</p>}
            <button
              onClick={startConsultation}
              className="btn-primary flex items-center space-x-2"
            >
              <Video className="w-5 h-5" />
              <span>Iniciar Consulta</span>
            </button>
          </div>
        </div>
      )}

      {/* Consultations List */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          Suas Consultas
        </h2>

        {consultations.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">
              {user?.role === 'PATIENT' 
                ? 'Você ainda não tem consultas. Inicie sua primeira consulta!'
                : 'Nenhuma consulta encontrada.'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {consultations.map((consultation) => (
              <div
                key={consultation.id}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {user?.role === 'PATIENT' 
                          ? `Dr. ${consultation.doctor?.name || 'Aguardando médico'}`
                          : consultation.patient?.name
                        }
                      </h3>
                      <p className="text-sm text-gray-500">
                        {new Date(consultation.createdAt).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(consultation.status)}`}>
                      {getStatusText(consultation.status)}
                    </span>
                    
                    {consultation.status === 'ACTIVE' && (
                      <button
                        onClick={() => navigate(`/video-call/${consultation.id}`)}
                        className="btn-primary text-sm flex items-center space-x-2"
                      >
                        <Video className="w-4 h-4" />
                        <span>Entrar na Consulta</span>
                      </button>
                    )}
                    
                    {consultation.status === 'WAITING' && user?.role === 'DOCTOR' && (
                      <button
                        onClick={() => navigate(`/video-call/${consultation.id}`)}
                        className="btn-primary text-sm flex items-center space-x-2"
                      >
                        <Phone className="w-4 h-4" />
                        <span>Iniciar Consulta</span>
                      </button>
                    )}
                  </div>
                </div>

                {consultation.evolution && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Evolução Médica</h4>
                    <p className="text-sm text-gray-600">{consultation.evolution}</p>
                  </div>
                )}

                {consultation.prescription && (
                  <div className="mt-4 flex items-center space-x-2 text-sm text-primary-600">
                    <FileText className="w-4 h-4" />
                    <span>Prescrição disponível</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      {/* Include the Credits component for the modal to work */}
      <Credits />
    </div>
  )
}

export default Dashboard 