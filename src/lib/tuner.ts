import { useEffect, useRef, useState } from 'react'

export type OpenString = {
  id: string
  hz: number
  label: string
}

export const GUITAR_STRINGS: OpenString[] = [
  { id: 'E2', hz: 82.41, label: 'Mi grave' },
  { id: 'A2', hz: 110.0, label: 'La' },
  { id: 'D3', hz: 146.83, label: 'Ré' },
  { id: 'G3', hz: 196.0, label: 'Sol' },
  { id: 'B3', hz: 246.94, label: 'Si' },
  { id: 'E4', hz: 329.63, label: 'Mi aigu' },
]

export const BASS_STRINGS: OpenString[] = [
  { id: 'E1', hz: 41.2, label: 'Mi grave' },
  { id: 'A1', hz: 55.0, label: 'La' },
  { id: 'D2', hz: 73.42, label: 'Ré' },
  { id: 'G2', hz: 98.0, label: 'Sol' },
]

const NOTE_NAMES = ['Do', 'Do♯', 'Ré', 'Ré♯', 'Mi', 'Fa', 'Fa♯', 'Sol', 'Sol♯', 'La', 'La♯', 'Si']

export type HeardNote = {
  hz: number
  name: string
  cents: number
  string: OpenString | null
  inTune: boolean
}

function autoCorrelate(buf: Float32Array, sampleRate: number): number | null {
  const size = buf.length
  let rms = 0
  for (let i = 0; i < size; i += 1) rms += buf[i] * buf[i]
  rms = Math.sqrt(rms / size)
  if (rms < 0.008) return null

  const maxLag = Math.floor(size / 2)
  const corr = new Float32Array(maxLag)
  for (let lag = 0; lag < maxLag; lag += 1) {
    let sum = 0
    for (let i = 0; i < maxLag; i += 1) sum += buf[i] * buf[i + lag]
    corr[lag] = sum
  }

  let d = 0
  while (d < maxLag - 1 && corr[d] > corr[d + 1]) d += 1
  let best = -1
  let bestLag = -1
  for (let i = d; i < maxLag; i += 1) {
    if (corr[i] > best) {
      best = corr[i]
      bestLag = i
    }
  }
  if (bestLag <= 0 || best < 0.01) return null

  const y0 = corr[bestLag - 1] ?? best
  const y1 = best
  const y2 = corr[bestLag + 1] ?? best
  const denom = 2 * (2 * y1 - y2 - y0)
  const shift = Math.abs(denom) > 1e-6 ? (y2 - y0) / denom : 0
  const freq = sampleRate / (bestLag + shift)
  if (freq < 30 || freq > 1400) return null
  return freq
}

export function nearestOpenString(hz: number, strings: OpenString[]): OpenString | null {
  let best: OpenString | null = null
  let bestCents = Infinity
  for (const s of strings) {
    const cents = 1200 * Math.log2(hz / s.hz)
    const abs = Math.abs(cents)
    if (abs < bestCents) {
      bestCents = abs
      best = s
    }
  }
  if (!best || bestCents > 220) return null
  return best
}

export function describeHz(hz: number, strings: OpenString[]): HeardNote {
  const midi = 69 + 12 * Math.log2(hz / 440)
  const rounded = Math.round(midi)
  const centsFromEqual = Math.round((midi - rounded) * 100)
  const name = `${NOTE_NAMES[(rounded + 1200) % 12]}${Math.floor(rounded / 12) - 1}`
  const open = nearestOpenString(hz, strings)
  const cents = open ? Math.round(1200 * Math.log2(hz / open.hz)) : centsFromEqual
  return {
    hz,
    name,
    cents,
    string: open,
    inTune: Boolean(open && Math.abs(cents) <= 12),
  }
}

export function useStringListen(active: boolean, instrument: 'guitar' | 'bass') {
  const strings = instrument === 'bass' ? BASS_STRINGS : GUITAR_STRINGS
  const [energy, setEnergy] = useState(0)
  const [note, setNote] = useState<HeardNote | null>(null)
  const [ready, setReady] = useState(false)
  const [denied, setDenied] = useState(false)
  const streamRef = useRef<MediaStream | null>(null)
  const ctxRef = useRef<AudioContext | null>(null)
  const rafRef = useRef(0)

  useEffect(() => {
    if (!active) {
      setEnergy(0)
      setNote(null)
      setReady(false)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      streamRef.current?.getTracks().forEach((t) => t.stop())
      streamRef.current = null
      void ctxRef.current?.close()
      ctxRef.current = null
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
          audio: {
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false,
          },
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
        analyser.fftSize = 4096
        analyser.smoothingTimeConstant = 0.2
        source.connect(analyser)
        const time = new Float32Array(analyser.fftSize)
        setReady(true)
        setDenied(false)

        const tick = () => {
          analyser.getFloatTimeDomainData(time)
          let sum = 0
          for (let i = 0; i < time.length; i += 1) sum += time[i] * time[i]
          const rms = Math.sqrt(sum / time.length)
          const gated = Math.max(0, rms - 0.008)
          setEnergy(Math.min(1, gated * 8))
          const hz = autoCorrelate(time, ctx.sampleRate)
          setNote(hz ? describeHz(hz, strings) : null)
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
  }, [active, instrument, strings])

  return { energy, note, ready, denied, strings }
}
