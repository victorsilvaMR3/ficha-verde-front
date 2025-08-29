import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { Clock, Users, Video, Phone } from 'lucide-react'
import toast from 'react-hot-toast'

const WaitingRoom = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [position, setPosition] = useState(0)
  const [estimatedTime, setEstimatedTime] = useState(0)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    // Simulate waiting room updates
    const interval = setInterval(() => {
      setPosition(prev => Math.max(0, prev - 1))
      setEstimatedTime(prev => Math.max(0, prev - 1))
    }, 30000) // Update every 30 seconds

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    // Simulate connection to waiting room
    setIsConnected(true)
    toast.success('Conectado à sala de espera')
  }, [])

  const handleCancel = () => {
    if (confirm('Tem certeza que deseja cancelar a consulta?')) {
      navigate('/dashboard')
      toast.info('Consulta cancelada')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-green-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-primary-100">
            <Clock className="h-6 w-6 text-primary-600" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Sala de Espera
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Aguardando um médico disponível
          </p>
        </div>

        <div className="card">
          {/* Position in queue */}
          <div className="text-center mb-6">
            <div className="text-4xl font-bold text-primary-600 mb-2">
              {position}
            </div>
            <p className="text-gray-600">
              {position === 0 ? 'Você é o próximo!' : 'Pessoas na sua frente'}
            </p>
          </div>

          {/* Estimated time */}
          <div className="text-center mb-6">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Clock className="w-5 h-5 text-gray-400" />
              <span className="text-lg font-medium text-gray-900">
                {estimatedTime} min
              </span>
            </div>
            <p className="text-sm text-gray-500">
              Tempo estimado de espera
            </p>
          </div>

          {/* Connection status */}
          <div className="flex items-center justify-center space-x-2 mb-6">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm text-gray-600">
              {isConnected ? 'Conectado' : 'Desconectado'}
            </span>
          </div>

          {/* Progress bar */}
          <div className="mb-6">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.max(0, 100 - (position * 10))}%` }}
              ></div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={() => navigate(`/video-call/${id}`)}
              disabled={position > 0}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              <Video className="w-5 h-5" />
              <span>
                {position === 0 ? 'Entrar na Consulta' : 'Aguardando...'}
              </span>
            </button>

            <button
              onClick={handleCancel}
              className="w-full btn-secondary"
            >
              Cancelar Consulta
            </button>
          </div>
        </div>

        {/* Tips */}
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Dicas para sua consulta
          </h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start space-x-2">
              <Phone className="w-4 h-4 text-primary-600 mt-0.5" />
              <span>Certifique-se de que sua câmera e microfone estão funcionando</span>
            </li>
            <li className="flex items-start space-x-2">
              <Users className="w-4 h-4 text-primary-600 mt-0.5" />
              <span>Encontre um local tranquilo e bem iluminado</span>
            </li>
            <li className="flex items-start space-x-2">
              <Clock className="w-4 h-4 text-primary-600 mt-0.5" />
              <span>Tenha seus documentos médicos em mãos</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default WaitingRoom 