import { useEffect, useRef, useState } from 'react'
import { Mic, MicOff, Video, VideoOff, Maximize2, Minimize2, Pin, PinOff, X, CornerDownRight } from 'lucide-react'

const clamp = (val, min, max) => Math.min(Math.max(val, min), max)

const CallMiniPlayer = ({
  consultationId,
  position,
  size,
  state,
  pinned,
  onChange,
  onToggleMute,
  onToggleVideo,
  onEnd,
  onPreset
  , children
}) => {
  const containerRef = useRef(null)
  const [dragging, setDragging] = useState(false)
  const [resizing, setResizing] = useState(false)
  const [start, setStart] = useState({ x: 0, y: 0 })
  const [origin, setOrigin] = useState({ x: position.x, y: position.y, width: size.width, height: size.height })

  useEffect(() => {
    const onMove = (e) => {
      if (!containerRef.current) return
      const parent = containerRef.current.parentElement || document.body
      const maxX = parent.clientWidth - origin.width - 8
      const maxY = parent.clientHeight - origin.height - 8
      if (dragging && !pinned) {
        const nextX = clamp(origin.x + (e.clientX - start.x), 8, maxX)
        const nextY = clamp(origin.y + (e.clientY - start.y), 8, maxY)
        onChange({ position: { x: nextX, y: nextY } })
      }
      if (resizing) {
        const nextW = clamp(origin.width + (e.clientX - start.x), 240, parent.clientWidth - position.x - 8)
        const nextH = clamp(origin.height + (e.clientY - start.y), 160, parent.clientHeight - position.y - 8)
        onChange({ size: { width: nextW, height: nextH } })
      }
    }
    const onUp = () => { setDragging(false); setResizing(false) }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
  }, [dragging, resizing, start, origin, onChange, pinned, position.x, position.y])

  const startDrag = (e) => { setDragging(true); setStart({ x: e.clientX, y: e.clientY }); setOrigin({ ...origin, x: position.x, y: position.y }) }
  const startResize = (e) => { setResizing(true); setStart({ x: e.clientX, y: e.clientY }); setOrigin({ ...origin, width: size.width, height: size.height }) }

  return (
    <div
      ref={containerRef}
      className={`fixed ${state === 'maximized' ? 'inset-4' : ''} z-40 pointer-events-auto select-none`}
      style={state !== 'maximized' ? { left: position.x, top: position.y, width: size.width, height: size.height } : undefined}
      aria-label="Mini player da chamada"
    >
      <div className="relative w-full h-full rounded-lg overflow-hidden border border-gray-700 bg-black">
        {/* Draggable header */}
        {state !== 'maximized' && (
          <div onMouseDown={startDrag} className="absolute top-0 left-0 right-0 h-8 bg-gray-900/80 cursor-move flex items-center justify-between px-2 z-10">
            <div className="text-xs text-gray-300">Consulta {consultationId?.slice(0, 6)}</div>
            <div className="flex items-center gap-1">
              <button aria-label="Fixar" onClick={() => onChange({ pinned: !pinned })} className="p-1 rounded hover:bg-gray-800">
                {pinned ? <Pin size={16} /> : <PinOff size={16} />}
              </button>
              <button aria-label="Maximizar" onClick={() => onChange({ state: 'maximized' })} className="p-1 rounded hover:bg-gray-800">
                <Maximize2 size={16} />
              </button>
              <button aria-label="Encerrar" onClick={onEnd} className="p-1 rounded hover:bg-gray-800">
                <X size={16} />
              </button>
            </div>
          </div>
        )}

        {state === 'maximized' && (
          <div className="absolute top-2 right-2 z-10 flex gap-2">
            <button aria-label="Restaurar" onClick={() => onChange({ state: 'normal' })} className="px-2 py-1 rounded bg-gray-900/80 hover:bg-gray-800">
              <Minimize2 size={16} />
            </button>
            <button aria-label="Encerrar" onClick={onEnd} className="px-2 py-1 rounded bg-gray-900/80 hover:bg-gray-800">
              <X size={16} />
            </button>
          </div>
        )}

        {/* Video content slot */}
        <div className="w-full h-full bg-black flex items-center justify-center overflow-hidden">
          {children ? children : (
            <div className="text-gray-400 text-xs">Chamada em andamento</div>
          )}
        </div>

        {/* Controls */}
        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-center gap-2 z-10">
          <button onClick={onToggleMute} className="p-2 rounded-full bg-gray-900/80 hover:bg-gray-800" aria-label="Microfone">
            <Mic size={16} />
          </button>
          <button onClick={onToggleVideo} className="p-2 rounded-full bg-gray-900/80 hover:bg-gray-800" aria-label="Câmera">
            <Video size={16} />
          </button>
          {state !== 'maximized' && (
            <div className="ml-2 inline-flex rounded bg-gray-900/60 border border-gray-700 overflow-hidden">
              <button onClick={() => onPreset('mini')} className="px-2 py-1 text-xs hover:bg-gray-800" aria-label="Tamanho mini">Mini</button>
              <button onClick={() => onPreset('medium')} className="px-2 py-1 text-xs hover:bg-gray-800" aria-label="Tamanho médio">Médio</button>
            </div>
          )}
        </div>

        {/* Resize handle */}
        {state !== 'maximized' && (
          <div onMouseDown={startResize} className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize bg-transparent"></div>
        )}
      </div>
    </div>
  )
}

export default CallMiniPlayer


