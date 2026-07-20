import { useCallback, useEffect, useRef, useState } from 'react'

type RecorderStatus = 'idle' | 'recording' | 'denied' | 'unsupported'

export function useMediaRecorder() {
  const [status, setStatus] = useState<RecorderStatus>('idle')
  const [seconds, setSeconds] = useState(0)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const mediaRecorder = useRef<MediaRecorder | null>(null)
  const chunks = useRef<Blob[]>([])
  const timer = useRef<number | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const stopResolver = useRef<((blob: Blob | null) => void) | null>(null)

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
      return false
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      chunks.current = []
      const recorder = new MediaRecorder(stream)
      mediaRecorder.current = recorder

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunks.current.push(event.data)
      }

      recorder.onstop = () => {
        const blob =
          chunks.current.length > 0 ? new Blob(chunks.current, { type: 'audio/webm' }) : null
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
      }

      recorder.start()
      setSeconds(0)
      setStatus('recording')
      clearTimer()
      timer.current = window.setInterval(() => setSeconds((s) => s + 1), 1000)
      return true
    } catch {
      setStatus('denied')
      return false
    }
  }, [])

  const stop = useCallback(() => {
    clearTimer()
    setStatus('idle')
    return new Promise<Blob | null>((resolve) => {
      if (!mediaRecorder.current || mediaRecorder.current.state === 'inactive') {
        resolve(null)
        return
      }
      stopResolver.current = resolve
      mediaRecorder.current.stop()
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

  return { status, seconds, audioUrl, start, stop }
}

export function formatTime(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, '0')
  const s = (totalSeconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}
