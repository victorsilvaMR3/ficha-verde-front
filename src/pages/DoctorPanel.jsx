import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { Users, Clock, Video, FileText, Activity } from 'lucide-react'
import api from '../services/api'
import toast from 'react-hot-toast'

const DoctorPanel = () => {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [waitingPatients, setWaitingPatients] = useState([])
  const [activeConsultations, setActiveConsultations] = useState([])
  const [statistics, setStatistics] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [waitingResponse, activeResponse, statsResponse] = await Promise.all([
        api.get('/doctors/waiting-patients'),
        api.get('/doctors/active-consultations'),
        api.get('/doctors/statistics')
      ])

      setWaitingPatients(waitingResponse.data.consultations)
      setActiveConsultations(activeResponse.data.consultations)
      setStatistics(statsResponse.data.statistics)
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }

  const startConsultation = async (consultationId) => {
    try {
      await api.patch(`/consultations/${consultationId}/start`)
      toast.success('Consulta iniciada')
      fetchData() // Refresh data
    } catch (error) {
      console.error('Error starting consultation:', error)
      toast.error('Erro ao iniciar consulta')
    }
  }

  const joinConsultation = (consultationId) => {
    navigate(`/video-call/${consultationId}`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="loading-spinner"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Painel Médico
        </h1>
        <p className="text-gray-600 mt-2">
          Gerencie suas consultas e pacientes
        </p>
      </div>

      {/* Statistics */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="card">
            <div className="flex items-center">
              <div className="p-2 bg-primary-100 rounded-lg">
                <Activity className="w-6 h-6 text-primary-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total de Consultas</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.totalConsultations}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Clock className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Consultas Hoje</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.todayConsultations}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Users className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Aguardando</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.waitingConsultations}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Video className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Ativas</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.activeConsultations}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Waiting Patients */}
      <div className="card mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          Pacientes Aguardando
        </h2>

        {waitingPatients.length === 0 ? (
          <div className="text-center py-8">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Nenhum paciente aguardando</p>
          </div>
        ) : (
          <div className="space-y-4">
            {waitingPatients.map((consultation) => (
              <div
                key={consultation.id}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                      <Users className="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {consultation.patient.name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {consultation.patient.email}
                      </p>
                      <p className="text-xs text-gray-400">
                        Aguardando desde {new Date(consultation.createdAt).toLocaleTimeString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => startConsultation(consultation.id)}
                    className="btn-primary"
                  >
                    Iniciar Consulta
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Active Consultations */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          Consultas Ativas
        </h2>

        {activeConsultations.length === 0 ? (
          <div className="text-center py-8">
            <Video className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Nenhuma consulta ativa</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activeConsultations.map((consultation) => (
              <div
                key={consultation.id}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <Video className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {consultation.patient.name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {consultation.patient.email}
                      </p>
                      <p className="text-xs text-gray-400">
                        Iniciada às {new Date(consultation.startedAt).toLocaleTimeString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => joinConsultation(consultation.id)}
                    className="btn-primary"
                  >
                    Entrar na Consulta
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default DoctorPanel 