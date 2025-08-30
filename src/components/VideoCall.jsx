// src/components/VideoCall.jsx
import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { PhoneOff, Mic, MicOff, Video, VideoOff, MessageCircle } from 'lucide-react';
import api from '../services/api';
import { io } from 'socket.io-client';
import LayoutDoctorPanel from './consultation/LayoutDoctorPanel';
import CallMiniPlayer from './consultation/CallMiniPlayer';
import { useConsultationStore } from '../lib/state/consultationStore';

// Resolve a origem da API: produção usa VITE_API_ORIGIN; em dev cai no origin do Vite (proxy)
const API_ORIGIN =
  (import.meta.env.VITE_API_ORIGIN && import.meta.env.VITE_API_ORIGIN.replace(/\/$/, '')) ||
  (typeof window !== 'undefined' ? window.location.origin : '');

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
  const { miniPlayer, updateMiniPlayer, loadFromStorage } = useConsultationStore();

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
      recordingInterval = setInterval(() => setRecordingDuration((prev) => prev + 1), 1000);
    }
    return () => recordingInterval && clearInterval(recordingInterval);
  }, [isRecording]);

  const initializeCall = async () => {
    try {
      if (!consultationId) {
        alert('ID da consulta não fornecido.');
        navigate('/dashboard');
        return;
      }

      const tokenStr = localStorage.getItem('auth-storage');
      if (!tokenStr) {
        alert('Usuário não autenticado. Faça login novamente.');
        navigate('/login');
        return;
      }
      const parsedToken = JSON.parse(tokenStr);
      const jwt = parsedToken?.state?.token;

      // Status da consulta
      const response = await api.get(`/video/status/${consultationId}`);
      setConsultation(response.data.consultation);
      try { window.__currentConsultation = response.data.consultation; } catch {}
      loadFromStorage(consultationId);

      // Iniciar consulta (checa créditos/regra de autorização)
      const startResponse = await api.post(`/video/start/${consultationId}`);
      const { roomId, userType } = startResponse.data;

      // Iniciar WebRTC + Socket
      await initializeWebRTC(roomId, userType, jwt);

      // Timer de chamada
      intervalRef.current = setInterval(() => setCallDuration((prev) => prev + 1), 1000);

      // Entrar no chat
      joinChat();
    } catch (error) {
      console.error('Error initializing call:', {
        status: error.response?.status,
        data: error.response?.data,
        url: error.config?.url,
        message: error.message,
      });

      const st = error.response?.status;
      if (st === 401) {
        alert('Sessão expirada. Faça login novamente.');
        navigate('/login');
      } else if (st === 404) {
        alert('Consulta não encontrada ou sem permissão.');
        navigate('/dashboard');
      } else if (st === 402) {
        alert('Créditos insuficientes. Compre créditos para continuar.');
        navigate('/creditos');
      } else {
        alert('Erro ao iniciar videochamada');
        navigate('/dashboard');
      }
    }
  };

  const initializeWebRTC = async (_roomId, userType, jwt) => {
    try {
      // Permissões de mídia
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = stream;

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        const playLocal = () => localVideoRef.current.play().catch(() => {});
        if (localVideoRef.current.readyState >= 2) playLocal();
        else localVideoRef.current.onloadedmetadata = playLocal;
      }

      // Conexão Socket.IO — sem localhost em produção!
      socketRef.current = io(API_ORIGIN, {
        path: '/socket.io',
        transports: ['websocket', 'polling'],
        withCredentials: true,
        auth: jwt ? { token: jwt } : undefined,
      });

      socketRef.current.on('connect_error', (e) => {
        console.error('Socket connect_error:', e?.message || e);
      });
      socketRef.current.on('error', (e) => {
        console.error('Socket error:', e);
      });

      // Entrar na sala de vídeo
      socketRef.current.emit('join-video-call', {
        consultationId,
        userId: user.id,
      });

      // PeerConnection (STUN + opcional TURN via env)
      const iceServers = [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ];
      // Opcional: se expuser TURN via env do front
      const TURN_URL = import.meta.env.VITE_TURN_URL;
      const TURN_USER = import.meta.env.VITE_TURN_USER;
      const TURN_PASS = import.meta.env.VITE_TURN_PASS;
      if (TURN_URL && TURN_USER && TURN_PASS) {
        iceServers.push({ urls: TURN_URL, username: TURN_USER, credential: TURN_PASS });
      }

      const isPolite = userType === 'PATIENT';
      peerConnectionRef.current = new RTCPeerConnection({ iceServers });

      // Tracks locais
      stream.getTracks().forEach((track) => {
        peerConnectionRef.current.addTrack(track, stream);
      });

      // Stream remoto
      peerConnectionRef.current.ontrack = (event) => {
        if (!remoteVideoRef.current) return;
        let remoteStream = remoteVideoRef.current.srcObject;
        if (!(remoteStream instanceof MediaStream)) {
          remoteStream = new MediaStream();
          remoteVideoRef.current.srcObject = remoteStream;
        }
        if (!remoteStream.getTracks().some((t) => t.id === event.track.id)) {
          remoteStream.addTrack(event.track);
        }
        const playRemote = () => remoteVideoRef.current.play().catch(() => {});
        if (remoteVideoRef.current.readyState >= 2) playRemote();
        else remoteVideoRef.current.onloadedmetadata = playRemote;
      };

      peerConnectionRef.current.oniceconnectionstatechange = () => {
        console.log('ICE state:', peerConnectionRef.current.iceConnectionState);
      };

      // Enviar ICE
      peerConnectionRef.current.onicecandidate = (event) => {
        if (event.candidate) {
          socketRef.current?.emit('ice-candidate', {
            consultationId,
            candidate: event.candidate,
            from: socketRef.current.id,
          });
        }
      };

      // Eventos do socket
      socketRef.current.on('user-joined-call', async (data) => {
        console.log('User joined call:', data);
        setParticipants((prev) => [...prev, data]);
        setIsConnected(true);

        // Médico inicia a oferta quando alguém entra
        if (userType === 'DOCTOR' && !sentOfferRef.current && peerConnectionRef.current) {
          try {
            const offer = await peerConnectionRef.current.createOffer();
            await peerConnectionRef.current.setLocalDescription(offer);
            sentOfferRef.current = true;
            socketRef.current.emit('offer', {
              consultationId,
              offer,
              from: socketRef.current.id,
            });
          } catch (err) {
            console.error('Error creating/sending offer:', err);
          }
        }
      });

      socketRef.current.on('user-left-call', (data) => {
        setParticipants((prev) => prev.filter((p) => p.socketId !== data.socketId));
      });

      // Chat
      socketRef.current.on('chat-history', (data) => setChatMessages(data.messages || []));
      socketRef.current.on('chat-message', (message) => setChatMessages((prev) => [...prev, message]));

      // Recording
      socketRef.current.on('recording-started', () => {
        setIsRecording(true);
        setRecordingDuration(0);
      });
      socketRef.current.on('recording-stopped', () => {
        setIsRecording(false);
        alert('Gravação finalizada');
      });
      socketRef.current.on('recording-error', (data) => alert(`Erro na gravação: ${data.error}`));

      // SDP Offer/Answer — Perfect Negotiation
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
            from: socketRef.current.id,
          });

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
          const pc = peerConnectionRef.current;
          if (!pc || pc.signalingState !== 'have-local-offer') {
            console.warn('Ignoring unexpected answer in state:', pc?.signalingState);
            return;
          }
          await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
          if (pendingIceCandidatesRef.current.length) {
            for (const c of pendingIceCandidatesRef.current) {
              await pc.addIceCandidate(new RTCIceCandidate(c));
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
              from: socketRef.current.id,
            });
          }
        } catch (err) {
          console.error('Error creating/sending offer (room-info):', err);
        }
      });

      peerConnectionRef.current.onconnectionstatechange = () => {
        const state = peerConnectionRef.current.connectionState;
        if (state === 'connected' || state === 'completed') setIsConnected(true);
        else if (['disconnected', 'failed', 'closed'].includes(state)) setIsConnected(false);
      };
    } catch (error) {
      console.error('Error initializing WebRTC:', error);
      alert('Erro ao acessar câmera e microfone');
    }
  };

  const toggleMute = () => {
    const audioTrack = localStreamRef.current?.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    const videoTrack = localStreamRef.current?.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setIsVideoOff(!isVideoOff);
    }
  };

  const joinChat = () => {
    if (socketRef.current) {
      socketRef.current.emit('join-chat', {
        consultationId,
        userId: user.id,
        userType: user.role,
      });
    }
  };

  const leaveChat = () => {
    socketRef.current?.emit('leave-chat', { consultationId });
  };

  const sendMessage = () => {
    if (newMessage.trim() && socketRef.current) {
      socketRef.current.emit('chat-message', {
        consultationId,
        message: newMessage.trim(),
        userId: user.id,
        userType: user.role,
      });
      setNewMessage('');
    }
  };

  const startRecording = () => {
    socketRef.current?.emit('start-recording', {
      consultationId,
      roomId: `consultation-${consultationId}`,
    });
  };

  const stopRecording = () => {
    socketRef.current?.emit('stop-recording', {
      roomId: `consultation-${consultationId}`,
    });
  };

  const endCall = async () => {
    try {
      if (user.role === 'DOCTOR') {
        await api.post(`/video/end/${consultationId}`);
      }
    } catch (error) {
      console.error('Error ending call:', error);
    } finally {
      cleanup();
      navigate('/dashboard');
    }
  };

  const cleanup = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }

    if (peerConnectionRef.current) {
      peerConnectionRef.current.ontrack = null;
      peerConnectionRef.current.onicecandidate = null;
      peerConnectionRef.current.oniceconnectionstatechange = null;
      peerConnectionRef.current.onconnectionstatechange = null;
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    if (socketRef.current) {
      leaveChat();
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;

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
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Atalho Alt+M para alternar estado do MiniPlayer
  useEffect(() => {
    const onKey = (e) => {
      if (e.altKey && (e.key === 'm' || e.key === 'M')) {
        const next = miniPlayer.state === 'maximized' ? 'normal' : 'maximized';
        updateMiniPlayer(consultationId, { state: next });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [miniPlayer.state, consultationId, updateMiniPlayer]);

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
      {/* Header */}
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

      {/* Área de vídeo (Paciente) */}
      {user?.role === 'PATIENT' && (
        <div className="relative h-[calc(100vh-200px)]">
          <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
          <div className="absolute bottom-4 right-4 w-64 h-48">
            <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover rounded-lg border-2 border-white" />
          </div>
          {!isConnected && (
            <div className="absolute top-4 left-4 bg-yellow-600 px-3 py-1 rounded-full text-sm">
              Conectando...
            </div>
          )}
        </div>
      )}

      {/* Controles (Paciente) */}
      {user?.role === 'PATIENT' && (
        <div className="bg-gray-800 p-4 flex justify-center items-center space-x-4">
          <button onClick={toggleMute} className={`p-3 rounded-full ${isMuted ? 'bg-red-600' : 'bg-gray-600'} hover:opacity-80 transition-opacity`}>
            {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
          </button>

          <button onClick={toggleVideo} className={`p-3 rounded-full ${isVideoOff ? 'bg-red-600' : 'bg-gray-600'} hover:opacity-80 transition-opacity`}>
            {isVideoOff ? <VideoOff size={24} /> : <Video size={24} />}
          </button>

          <button onClick={() => setIsChatOpen(!isChatOpen)} className={`p-3 rounded-full ${isChatOpen ? 'bg-blue-600' : 'bg-gray-600'} hover:opacity-80 transition-opacity`}>
            <MessageCircle size={24} />
          </button>

          <button onClick={endCall} className="p-3 rounded-full bg-red-600 hover:bg-red-700 transition-colors">
            <PhoneOff size={24} />
          </button>
        </div>
      )}

      {/* Módulos do Médico */}
      {user?.role === 'DOCTOR' && consultation && <LayoutDoctorPanel consultation={consultation} />}

      {/* Chat */}
      {isChatOpen && (
        <div className="absolute right-4 top-20 w-80 h-96 bg-gray-800 rounded-lg border border-gray-700 flex flex-col">
          <div className="p-3 border-b border-gray-700">
            <h3 className="text-white font-semibold">Chat</h3>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {chatMessages.map((msg, index) => (
              <div
                key={index}
                className={`p-2 rounded-lg ${msg.userId === user.id ? 'bg-blue-600 text-white ml-auto' : 'bg-gray-700 text-white'} max-w-xs`}
              >
                <div className="text-xs opacity-75 mb-1">{msg.userType === 'DOCTOR' ? 'Dr.' : 'Paciente'}</div>
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
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Digite sua mensagem..."
                className="flex-1 bg-gray-700 text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button onClick={sendMessage} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                Enviar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Indicador de gravação */}
      {isRecording && (
        <div className="absolute top-4 right-4 bg-red-600 px-3 py-1 rounded-full text-sm flex items-center space-x-2">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
          <span>Gravando {formatDuration(recordingDuration)}</span>
        </div>
      )}

      {/* Mini Player (Médico) */}
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
