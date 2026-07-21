import { useCallback, useEffect, useRef, useState } from 'react'

type RecorderStatus = 'idle' | 'recording' | 'denied' | 'unsupported' | 'error'

const PREFERRED_MIME_TYPES = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/mp4',
  'audio/ogg;codecs=opus',
  'audio/ogg',
]

function pickMimeType(): string | undefined {
  if (typeof MediaRecorder === 'undefined' || !MediaRecorder.isTypeSupported) {
    return undefined
  }
  return PREFERRED_MIME_TYPES.find((t) => MediaRecorder.isTypeSupported(t))
}

export function useMediaRecorder() {
  const [status, setStatus] = useState<RecorderStatus>('idle')
  const [seconds, setSeconds] = useState(0)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const mediaRecorder = useRef<MediaRecorder | null>(null)
  const chunks = useRef<Blob[]>([])
  const timer = useRef<number | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const stopResolver = useRef<((blob: Blob | null) => void) | null>(null)
  const mimeTypeRef = useRef<string | undefined>(undefined)

  const clearTimer = () => {
    if (timer.current) {
      window.clearInterval(timer.current)
      timer.current = null
    }
  }

  const stopStream = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }

  const start = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setStatus('unsupported')
      setErrorMessage('Ce navigateur ne permet pas d’enregistrer le micro.')
      return false
    }

    // Secure context required (HTTPS or localhost)
    if (typeof window.isSecureContext === 'boolean' && !window.isSecureContext) {
      setStatus('unsupported')
      setErrorMessage('L’enregistrement nécessite une connexion sécurisée (HTTPS).')
      return false
    }

    try {
      setErrorMessage(null)
      // Stop any previous stream cleanly
      if (mediaRecorder.current && mediaRecorder.current.state !== 'inactive') {
        mediaRecorder.current.stop()
      }
      stopStream()

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      })
      streamRef.current = stream
      chunks.current = []

      const mimeType = pickMimeType()
      mimeTypeRef.current = mimeType
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream)
      mediaRecorder.current = recorder

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) chunks.current.push(event.data)
      }

      recorder.onerror = () => {
        setStatus('error')
        setErrorMessage('L’enregistrement s’est interrompu. Réessaie.')
        stopStream()
      }

      recorder.onstop = () => {
        const type = mimeTypeRef.current || chunks.current[0]?.type || 'audio/webm'
        const blob =
          chunks.current.length > 0 ? new Blob(chunks.current, { type }) : null
        if (blob) {
          const url = URL.createObjectURL(blob)
          setAudioUrl((prev) => {
            if (prev) URL.revokeObjectURL(prev)
            return url
          })
        }
        stopStream()
        stopResolver.current?.(blob)
        stopResolver.current = null
        mediaRecorder.current = null
      }

      // timeslice: force periodic chunks (fixes empty blobs on some browsers)
      recorder.start(250)
      setSeconds(0)
      setStatus('recording')
      clearTimer()
      timer.current = window.setInterval(() => setSeconds((s) => s + 1), 1000)
      return true
    } catch (err) {
      stopStream()
      const name = err instanceof DOMException ? err.name : ''
      if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
        setStatus('denied')
        setErrorMessage(
          'Micro refusé. Autorise le micro dans ton navigateur, puis réessaie.',
        )
      } else if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
        setStatus('error')
        setErrorMessage('Aucun micro détecté sur cet appareil.')
      } else {
        setStatus('error')
        setErrorMessage('Impossible de démarrer l’enregistrement. Réessaie.')
      }
      return false
    }
  }, [])

  const stop = useCallback(() => {
    clearTimer()
    return new Promise<Blob | null>((resolve) => {
      const recorder = mediaRecorder.current
      if (!recorder || recorder.state === 'inactive') {
        setStatus('idle')
        resolve(null)
        return
      }
      stopResolver.current = (blob) => {
        setStatus('idle')
        resolve(blob)
      }
      try {
        // Flush remaining data before stop on browsers that support it
        if (recorder.state === 'recording') {
          try {
            recorder.requestData()
          } catch {
            // ignore
          }
        }
        recorder.stop()
      } catch {
        setStatus('idle')
        stopStream()
        resolve(null)
      }
    })
  }, [])

  useEffect(
    () => () => {
      clearTimer()
      stopStream()
      if (audioUrl) URL.revokeObjectURL(audioUrl)
    },
    [audioUrl],
  )

  return { status, seconds, audioUrl, errorMessage, start, stop }
}

export function formatTime(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, '0')
  const s = (totalSeconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}
