import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff, Monitor, MessageCircle, MessageSquare, Circle, Square } from 'lucide-react';
import api from '../services/api';
import io from 'socket.io-client';
import LayoutDoctorPanel from './consultation/LayoutDoctorPanel'
import CallMiniPlayer from './consultation/CallMiniPlayer'
import { useConsultationStore } from '../lib/state/consultationStore'

const VideoCall = () => {
  const { id: consultationId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [consultation, setConsultation] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [callDuration, setCallDuration] = useState(0);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const { miniPlayer, updateMiniPlayer, activeModule, setActiveModule, loadFromStorage } = useConsultationStore()

  const localVideoRef = useRef();
  const remoteVideoRef = useRef();
  const socketRef = useRef();
  const peerConnectionRef = useRef();
  const localStreamRef = useRef();
  const intervalRef = useRef();
  const initializedRef = useRef(false);
  const sentOfferRef = useRef(false);
  const pendingIceCandidatesRef = useRef([]);
  const answeredRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    initializeCall();
    return () => {
      cleanup();
      initializedRef.current = false;
      sentOfferRef.current = false;
    };
  }, []);

  useEffect(() => {
    let recordingInterval;
    if (isRecording) {
      recordingInterval = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (recordingInterval) {
        clearInterval(recordingInterval);
      }
    };
  }, [isRecording]);

  const initializeCall = async () => {
    try {
      // Check if consultationId is provided
      if (!consultationId) {
        console.error('No consultation ID provided');
        alert('ID da consulta não fornecido.');
        navigate('/dashboard');
        return;
      }

      console.log('Consultation ID:', consultationId);

      // Check if user is authenticated
      const token = localStorage.getItem('auth-storage');
      if (!token) {
        console.error('No authentication token found');
        alert('Usuário não autenticado. Faça login novamente.');
        navigate('/login');
        return;
      }

      console.log('User authenticated, proceeding with call initialization...');
      console.log('Current user:', user);
      console.log('Consultation ID:', consultationId);

      // Get consultation details
      const response = await api.get(`video/status/${consultationId}`);
      setConsultation(response.data.consultation);
      try { window.__currentConsultation = response.data.consultation } catch {}
      // Load drafts/mini-player from storage
      loadFromStorage(consultationId)

      // Start video call
      const startResponse = await api.post(`video/start/${consultationId}`);
      const { roomId, userType } = startResponse.data;

      // Initialize WebRTC
      await initializeWebRTC(roomId, userType);

      // Start call timer
      intervalRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);

      // Join chat
      joinChat();

    } catch (error) {
      console.error('Error initializing call:', error);
      console.error('Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url
      });
      
      if (error.response?.status === 401) {
        alert('Sessão expirada. Faça login novamente.');
        navigate('/login');
      } else if (error.response?.status === 404) {
        alert('Consulta não encontrada ou você não tem permissão para acessá-la.');
        navigate('/dashboard');
      } else if (error.response?.status === 402) {
        // Saldo insuficiente: direciona para compra de créditos
        alert('Você não tem créditos suficientes para iniciar a consulta. Compre créditos para continuar.');
        navigate('/creditos');
      } else {
        alert('Erro ao iniciar videochamada');
        navigate('/dashboard');
      }
    }
  };

  const initializeWebRTC = async (roomId, userType) => {
    try {
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });

      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        const playLocal = () => localVideoRef.current.play().catch(() => {});
        if (localVideoRef.current.readyState >= 2) {
          playLocal();
        } else {
          localVideoRef.current.onloadedmetadata = playLocal;
        }
      }

      // Initialize Socket.IO
      socketRef.current = io('http://localhost:3001');

      // Join room
      socketRef.current.emit('join-video-call', {
        consultationId,
        userId: user.id
      });

      // Initialize PeerConnection
      const isPolite = userType === 'PATIENT';
      const configuration = {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      };

      peerConnectionRef.current = new RTCPeerConnection(configuration);

      // Add local stream
      stream.getTracks().forEach(track => {
        peerConnectionRef.current.addTrack(track, stream);
      });

      // Handle remote stream
      peerConnectionRef.current.ontrack = (event) => {
        if (!remoteVideoRef.current) return;
        let remoteStream = remoteVideoRef.current.srcObject;
        if (!(remoteStream instanceof MediaStream)) {
          remoteStream = new MediaStream();
          remoteVideoRef.current.srcObject = remoteStream;
        }
        // Avoid adding duplicate tracks
        if (!remoteStream.getTracks().some(t => t.id === event.track.id)) {
          remoteStream.addTrack(event.track);
        }
        const playRemote = () => remoteVideoRef.current.play().catch(() => {});
        if (remoteVideoRef.current.readyState >= 2) {
          playRemote();
        } else {
          remoteVideoRef.current.onloadedmetadata = playRemote;
        }
      };

      // ICE connection state logs
      peerConnectionRef.current.oniceconnectionstatechange = () => {
        console.log('ICE state:', peerConnectionRef.current.iceConnectionState);
      };

      // Handle ICE candidates
      peerConnectionRef.current.onicecandidate = (event) => {
        if (event.candidate) {
          socketRef.current.emit('ice-candidate', {
            consultationId,
            candidate: event.candidate,
            from: socketRef.current.id
          });
        }
      };

      // Socket event handlers
      socketRef.current.on('user-joined-call', async (data) => {
        console.log('User joined call:', data);
        setParticipants(prev => [...prev, data]);
        setIsConnected(true);

        // Only doctor initiates the offer after someone joins
        if (userType === 'DOCTOR' && !sentOfferRef.current && peerConnectionRef.current) {
          try {
            const offer = await peerConnectionRef.current.createOffer();
            await peerConnectionRef.current.setLocalDescription(offer);
            sentOfferRef.current = true;
            socketRef.current.emit('offer', {
              consultationId,
              offer,
              from: socketRef.current.id
            });
          } catch (err) {
            console.error('Error creating/sending offer:', err);
          }
        }
      });

      socketRef.current.on('user-left-call', (data) => {
        console.log('User left call:', data);
        setParticipants(prev => prev.filter(p => p.socketId !== data.socketId));
      });

      // Chat event handlers
      socketRef.current.on('chat-history', (data) => {
        setChatMessages(data.messages || []);
      });

      socketRef.current.on('chat-message', (message) => {
        setChatMessages(prev => [...prev, message]);
      });

      socketRef.current.on('user-joined-chat', (data) => {
        console.log('User joined chat:', data);
      });

      socketRef.current.on('user-left-chat', (data) => {
        console.log('User left chat:', data);
      });

      // Recording event handlers
      socketRef.current.on('recording-started', (data) => {
        setIsRecording(true);
        setRecordingDuration(0);
      });

      socketRef.current.on('recording-stopped', (data) => {
        setIsRecording(false);
        alert('Gravação finalizada');
      });

      socketRef.current.on('recording-error', (data) => {
        alert(`Erro na gravação: ${data.error}`);
      });

            socketRef.current.on('offer', async (data) => {
        try {
          const pc = peerConnectionRef.current;
          if (!pc) return;
          const offer = new RTCSessionDescription(data.offer);
          const offerCollision = pc.signalingState !== 'stable';
          if (offerCollision) {
            if (!isPolite) {
              console.warn('Impolite peer ignoring offer due to collision');
              return;
            }
            try {
              await pc.setLocalDescription({ type: 'rollback' });
            } catch (e) {
              console.warn('Rollback failed (safe to ignore):', e);
            }
          }
          await pc.setRemoteDescription(offer);
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          answeredRef.current = true;
          
          socketRef.current.emit('answer', {
            consultationId,
            answer,
            from: socketRef.current.id
          });

          // Apply any queued ICE candidates now that remoteDescription is set
          if (pendingIceCandidatesRef.current.length) {
            for (const c of pendingIceCandidatesRef.current) {
              await pc.addIceCandidate(new RTCIceCandidate(c));
            }
            pendingIceCandidatesRef.current = [];
          }
        } catch (error) {
          console.error('Error handling offer:', error);
        }
      });

      socketRef.current.on('answer', async (data) => {
        try {
          // Only accept answer if we have a local offer set
          if (!peerConnectionRef.current || peerConnectionRef.current.signalingState !== 'have-local-offer') {
            console.warn('Ignoring unexpected answer in state:', peerConnectionRef.current?.signalingState);
            return;
          }
          await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.answer));

          // Apply any queued ICE candidates now that remoteDescription is set
          if (pendingIceCandidatesRef.current.length) {
            for (const c of pendingIceCandidatesRef.current) {
              await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(c));
            }
            pendingIceCandidatesRef.current = [];
          }
        } catch (error) {
          console.error('Error handling answer:', error);
        }
      });

      socketRef.current.on('ice-candidate', async (data) => {
        try {
          const pc = peerConnectionRef.current;
          if (!pc) return;
          // Queue candidates until remoteDescription is set
          if (!pc.remoteDescription || !pc.remoteDescription.type) {
            pendingIceCandidatesRef.current.push(data.candidate);
            return;
          }
          await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
        } catch (error) {
          console.error('Error handling ICE candidate:', error);
        }
      });

      socketRef.current.on('consultation-ended', () => {
        alert('Consulta encerrada pelo médico');
        endCall();
      });

      socketRef.current.on('room-info', async (data) => {
        try {
          if (userType === 'DOCTOR' && data.participants >= 2 && !sentOfferRef.current && peerConnectionRef.current) {
            const offer = await peerConnectionRef.current.createOffer();
            await peerConnectionRef.current.setLocalDescription(offer);
            sentOfferRef.current = true;
            socketRef.current.emit('offer', {
              consultationId,
              offer,
              from: socketRef.current.id
            });
          }
        } catch (err) {
          console.error('Error creating/sending offer (room-info):', err);
        }
      });

       // Doctor will create offer when a peer joins (user-joined-call) or via room-info

       // Connection state updates
       peerConnectionRef.current.onconnectionstatechange = () => {
         const state = peerConnectionRef.current.connectionState;
         if (state === 'connected' || state === 'completed') {
           setIsConnected(true);
         } else if (state === 'disconnected' || state === 'failed' || state === 'closed') {
           setIsConnected(false);
         }
       };

    } catch (error) {
      console.error('Error initializing WebRTC:', error);
      alert('Erro ao acessar câmera e microfone');
    }
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!isMuted);
      }
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!isVideoOff);
      }
    }
  };

  const joinChat = () => {
    if (socketRef.current) {
      socketRef.current.emit('join-chat', {
        consultationId,
        userId: user.id,
        userType: user.role
      });
    }
  };

  const leaveChat = () => {
    if (socketRef.current) {
      socketRef.current.emit('leave-chat', { consultationId });
    }
  };

  const sendMessage = () => {
    if (newMessage.trim() && socketRef.current) {
      socketRef.current.emit('chat-message', {
        consultationId,
        message: newMessage.trim(),
        userId: user.id,
        userType: user.role
      });
      setNewMessage('');
    }
  };

  const startRecording = () => {
    if (socketRef.current) {
      socketRef.current.emit('start-recording', {
        consultationId,
        roomId: `consultation-${consultationId}`
      });
    }
  };

  const stopRecording = () => {
    if (socketRef.current) {
      socketRef.current.emit('stop-recording', {
        roomId: `consultation-${consultationId}`
      });
    }
  };

  const endCall = async () => {
    try {
      if (user.role === 'DOCTOR') {
        await api.post(`video/end/${consultationId}`);
      }
    } catch (error) {
      console.error('Error ending call:', error);
    } finally {
      cleanup();
      navigate('/dashboard');
    }
  };

  const cleanup = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current.ontrack = null;
      peerConnectionRef.current.onicecandidate = null;
      peerConnectionRef.current.oniceconnectionstatechange = null;
      peerConnectionRef.current.onconnectionstatechange = null;
      peerConnectionRef.current = null;
    }

    if (socketRef.current) {
      leaveChat();
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }

    // Reset flags and state
    sentOfferRef.current = false;
    initializedRef.current = false;
    answeredRef.current = false;
    pendingIceCandidatesRef.current = [];
    setParticipants([]);
    setIsConnected(false);
    setIsRecording(false);
    setRecordingDuration(0);
    setCallDuration(0);
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Alt+M to toggle mini-player maximize/restore
  useEffect(() => {
    const onKey = (e) => {
      if (e.altKey && (e.key === 'm' || e.key === 'M')) {
        const next = miniPlayer.state === 'maximized' ? 'normal' : 'maximized'
        updateMiniPlayer(consultationId, { state: next })
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [miniPlayer.state, consultationId, updateMiniPlayer])

  if (!consultation) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Iniciando videochamada...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full mx-auto bg-white text-gray-900">
      {/* Header (integrated with page background and spacing) */}
      <div className="bg-white border-b border-gray-200 w-full">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Consulta em andamento</h1>
            <p className="text-gray-500">
              {consultation.patient?.name} {consultation.doctor?.name ? `- ${consultation.doctor?.name}` : ''}
            </p>
          </div>
          <div className="text-center">
            <div className="text-2xl font-mono text-gray-900">{formatDuration(callDuration)}</div>
            <div className="text-sm text-gray-500">Duração</div>
          </div>
        </div>
      </div>

      {/* Video area (somente paciente) */}
      {user?.role === 'PATIENT' && (
        <div className="relative h-[calc(100vh-200px)]">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-4 right-4 w-64 h-48">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover rounded-lg border-2 border-white"
            />
          </div>
          {!isConnected && (
            <div className="absolute top-4 left-4 bg-yellow-600 px-3 py-1 rounded-full text-sm">
              Conectando...
            </div>
          )}
        </div>
      )}

      {/* Controls (somente paciente) */}
      {user?.role === 'PATIENT' && (
        <div className="bg-gray-800 p-4 flex justify-center items-center space-x-4">
          <button
            onClick={toggleMute}
            className={`p-3 rounded-full ${isMuted ? 'bg-red-600' : 'bg-gray-600'} hover:opacity-80 transition-opacity`}
          >
            {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
          </button>

          <button
            onClick={toggleVideo}
            className={`p-3 rounded-full ${isVideoOff ? 'bg-red-600' : 'bg-gray-600'} hover:opacity-80 transition-opacity`}
          >
            {isVideoOff ? <VideoOff size={24} /> : <Video size={24} />}
          </button>

          <button
            onClick={() => setIsChatOpen(!isChatOpen)}
            className={`p-3 rounded-full ${isChatOpen ? 'bg-blue-600' : 'bg-gray-600'} hover:opacity-80 transition-opacity`}
          >
            <MessageCircle size={24} />
          </button>

          <button
            onClick={endCall}
            className="p-3 rounded-full bg-red-600 hover:bg-red-700 transition-colors"
          >
            <PhoneOff size={24} />
          </button>
        </div>
      )}

      {/* Doctor exclusive modules */}
      {user?.role === 'DOCTOR' && consultation && (
        <LayoutDoctorPanel consultation={consultation} />
      )}

      {/* Chat Panel */}
      {isChatOpen && (
        <div className="absolute right-4 top-20 w-80 h-96 bg-gray-800 rounded-lg border border-gray-700 flex flex-col">
          <div className="p-3 border-b border-gray-700">
            <h3 className="text-white font-semibold">Chat</h3>
          </div>
          
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {chatMessages.map((msg, index) => (
              <div
                key={index}
                className={`p-2 rounded-lg ${
                  msg.userId === user.id
                    ? 'bg-blue-600 text-white ml-auto'
                    : 'bg-gray-700 text-white'
                } max-w-xs`}
              >
                <div className="text-xs opacity-75 mb-1">
                  {msg.userType === 'DOCTOR' ? 'Dr.' : 'Paciente'}
                </div>
                <div>{msg.content}</div>
              </div>
            ))}
          </div>
          
          <div className="p-3 border-t border-gray-700">
            <div className="flex space-x-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Digite sua mensagem..."
                className="flex-1 bg-gray-700 text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={sendMessage}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Enviar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recording Indicator */}
      {isRecording && (
        <div className="absolute top-4 right-4 bg-red-600 px-3 py-1 rounded-full text-sm flex items-center space-x-2">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
          <span>Gravando {formatDuration(recordingDuration)}</span>
        </div>
      )}

      {/* Mini Player floating (PiP) */}
      <CallMiniPlayer
        consultationId={consultation?.id}
        position={miniPlayer.position}
        size={miniPlayer.size}
        state={miniPlayer.state}
        pinned={miniPlayer.pinned}
        onChange={(partial) => updateMiniPlayer(consultationId, partial)}
        onPreset={(preset) => useConsultationStore.getState().setMiniPreset(consultationId, preset)}
        onToggleMute={toggleMute}
        onToggleVideo={toggleVideo}
        onEnd={endCall}
      >
        {/* Render video only inside mini-player for DOCTOR, and also for PATIENT when minimized/maximized duplication is not needed */}
        {user?.role === 'DOCTOR' && (
          <div className="relative w-full h-full">
            <video ref={remoteVideoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute bottom-2 right-2 w-28 h-20">
              <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover rounded border border-white/40" />
            </div>
          </div>
        )}
      </CallMiniPlayer>
    </div>
  );
};

export default VideoCall; 