import { useEffect, useRef, useState } from 'react'

/** Suit l’énergie micro (0–1) pour caler le défilement sur le jeu réel. */
export function usePlayEnergy(active: boolean) {
  const [energy, setEnergy] = useState(0)
  const [ready, setReady] = useState(false)
  const [denied, setDenied] = useState(false)
  const streamRef = useRef<MediaStream | null>(null)
  const ctxRef = useRef<AudioContext | null>(null)
  const rafRef = useRef(0)

  useEffect(() => {
    if (!active) {
      setEnergy(0)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      streamRef.current?.getTracks().forEach((t) => t.stop())
      streamRef.current = null
      void ctxRef.current?.close()
      ctxRef.current = null
      setReady(false)
      return
    }

    let cancelled = false

    const start = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setDenied(true)
        return
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true },
        })
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        streamRef.current = stream
        const ctx = new AudioContext()
        ctxRef.current = ctx
        const source = ctx.createMediaStreamSource(stream)
        const analyser = ctx.createAnalyser()
        analyser.fftSize = 2048
        analyser.smoothingTimeConstant = 0.85
        source.connect(analyser)
        const data = new Uint8Array(analyser.fftSize)
        setReady(true)
        setDenied(false)

        const tick = () => {
          analyser.getByteTimeDomainData(data)
          let sum = 0
          for (let i = 0; i < data.length; i += 1) {
            const v = (data[i] - 128) / 128
            sum += v * v
          }
          const rms = Math.sqrt(sum / data.length)
          // Seuil de silence + courbe douce
          const gated = Math.max(0, rms - 0.02)
          const normalized = Math.min(1, gated * 6)
          setEnergy(normalized)
          rafRef.current = requestAnimationFrame(tick)
        }
        rafRef.current = requestAnimationFrame(tick)
      } catch {
        if (!cancelled) setDenied(true)
      }
    }

    void start()

    return () => {
      cancelled = true
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      streamRef.current?.getTracks().forEach((t) => t.stop())
      streamRef.current = null
      void ctxRef.current?.close()
      ctxRef.current = null
    }
  }, [active])

  return { energy, ready, denied }
}
