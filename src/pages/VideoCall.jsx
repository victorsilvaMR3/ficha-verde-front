import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { Video, VideoOff, Mic, MicOff, Phone, PhoneOff, Settings } from 'lucide-react'
import toast from 'react-hot-toast'

const VideoCall = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [isVideoOn, setIsVideoOn] = useState(true)
  const [isAudioOn, setIsAudioOn] = useState(true)
  const [isCallActive, setIsCallActive] = useState(false)
  const [callDuration, setCallDuration] = useState(0)
  const videoRef = useRef(null)
  const remoteVideoRef = useRef(null)

  useEffect(() => {
    // Simulate call start
    setIsCallActive(true)
    toast.success('Chamada iniciada')

    // Start call timer
    const timer = setInterval(() => {
      setCallDuration(prev => prev + 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const toggleVideo = () => {
    setIsVideoOn(!isVideoOn)
    toast.info(isVideoOn ? 'Vídeo desligado' : 'Vídeo ligado')
  }

  const toggleAudio = () => {
    setIsAudioOn(!isAudioOn)
    toast.info(isAudioOn ? 'Áudio desligado' : 'Áudio ligado')
  }

  const endCall = () => {
    if (confirm('Tem certeza que deseja encerrar a chamada?')) {
      setIsCallActive(false)
      navigate('/dashboard')
      toast.info('Chamada encerrada')
    }
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 text-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">
              Consulta #{id.slice(-8)}
            </h1>
            <p className="text-sm text-gray-300">
              {isCallActive ? `Duração: ${formatTime(callDuration)}` : 'Conectando...'}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="text-gray-300 hover:text-white"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Video Area */}
      <div className="flex-1 relative">
        {/* Remote Video (Main) */}
        <div className="absolute inset-0 bg-gray-800">
          <video
            ref={remoteVideoRef}
            className="w-full h-full object-cover"
            autoPlay
            playsInline
            muted
          />
          {!isCallActive && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-white">
                <div className="loading-spinner mx-auto mb-4"></div>
                <p>Conectando...</p>
              </div>
            </div>
          )}
        </div>

        {/* Local Video (Picture-in-Picture) */}
        <div className="absolute top-4 right-4 w-48 h-36 bg-gray-700 rounded-lg overflow-hidden">
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            autoPlay
            playsInline
            muted
          />
          {!isVideoOn && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
              <VideoOff className="w-8 h-8 text-gray-400" />
            </div>
          )}
        </div>

        {/* Call Controls */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
          <div className="flex items-center space-x-4 bg-gray-800 rounded-full px-6 py-3">
            <button
              onClick={toggleVideo}
              className={`p-3 rounded-full ${
                isVideoOn 
                  ? 'bg-gray-600 text-white hover:bg-gray-500' 
                  : 'bg-red-600 text-white hover:bg-red-500'
              }`}
            >
              {isVideoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
            </button>

            <button
              onClick={toggleAudio}
              className={`p-3 rounded-full ${
                isAudioOn 
                  ? 'bg-gray-600 text-white hover:bg-gray-500' 
                  : 'bg-red-600 text-white hover:bg-red-500'
              }`}
            >
              {isAudioOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
            </button>

            <button
              onClick={endCall}
              className="p-3 rounded-full bg-red-600 text-white hover:bg-red-500"
            >
              <PhoneOff className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Call Status */}
        <div className="absolute top-4 left-4">
          <div className="bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
            {isCallActive ? 'Chamada ativa' : 'Conectando...'}
          </div>
        </div>
      </div>

      {/* Call Info */}
      <div className="bg-gray-800 text-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-300">
              {user?.role === 'PATIENT' ? 'Médico' : 'Paciente'}
            </p>
            <p className="font-medium">
              {user?.role === 'PATIENT' ? 'Dr. Silva' : user?.name}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-300">Qualidade da conexão</p>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default VideoCall 