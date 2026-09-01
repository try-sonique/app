import { useEffect, useRef, useState, type FormEvent } from 'react'
import {
  afterPlayback,
  liveLine,
  openingLine,
  replyToMusician,
  STRING_PROMPTS,
  type ChatMsg,
  type StringSnapshot,
} from '../lib/stringsCoach'
import { formatTime, useMediaRecorder } from '../lib/recorder'
import { useStringListen } from '../lib/tuner'
import { t } from '../lib/presets'

function uid() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function StringsStudio({
  instrument,
  onBack,
}: {
  instrument: 'guitar' | 'bass'
  onBack: () => void
}) {
  const copy = t()
  const { status, seconds, audioUrl, errorMessage, start, stop } = useMediaRecorder()
  const recording = status === 'recording'
  const { energy, note, ready, denied } = useStringListen(!recording, instrument)
  const heard = energy > 0.07
  const [messages, setMessages] = useState<ChatMsg[]>(() => [
    { id: 'open', from: 'aria', text: openingLine(instrument) },
  ])
  const [draft, setDraft] = useState('')
  const lastLive = useRef<string | null>(null)
  const logRef = useRef<HTMLDivElement | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [playingBack, setPlayingBack] = useState(false)

  const snap: StringSnapshot = { instrument, heard, energy, note, denied }

  useEffect(() => {
    setMessages([{ id: 'open', from: 'aria', text: openingLine(instrument) }])
    lastLive.current = null
  }, [instrument])

  useEffect(() => {
    if (recording) return
    const line = liveLine(snap, lastLive.current)
    if (!line) return
    lastLive.current = line
    const timer = window.setTimeout(() => {
      setMessages((m) => [...m.slice(-12), { id: uid(), from: 'aria', text: line }])
    }, 900)
    return () => window.clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- liveLine is driven by hear/tune, not every energy tick
  }, [recording, heard, denied, note?.name, note?.cents, note?.inTune, note?.string?.id])

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  const pushYou = (text: string) => {
    const trimmed = text.trim()
    if (!trimmed) return
    const answer = replyToMusician(trimmed, snap)
    setMessages((m) => [
      ...m,
      { id: uid(), from: 'you', text: trimmed },
      { id: uid(), from: 'aria', text: answer },
    ])
    setDraft('')
  }

  const onRecord = async () => {
    if (recording) {
      const blob = await stop()
      setMessages((m) => [
        ...m,
        { id: uid(), from: 'aria', text: afterPlayback(Boolean(blob && blob.size > 1200)) },
      ])
      return
    }
    await start()
  }

  const cents = note?.cents ?? 0
  const needle = Math.max(-50, Math.min(50, cents))
  const title = instrument === 'bass' ? copy.welcomeBass : copy.welcomeGuitar

  return (
    <section className="slide slide-left strings-studio">
      <button type="button" className="account-back-link" onClick={onBack}>
        ← {copy.accountBack}
      </button>
      <span className="eyebrow">{title}</span>
      <h1>{copy.stringsTitle}</h1>
      <p className="lead">{copy.stringsLead}</p>

      <div className="strings-meters">
        <div className="strings-meter">
          <span>{copy.stringsHear}</span>
          <div className="strings-bar" aria-hidden>
            <i style={{ width: `${Math.round(energy * 100)}%` }} />
          </div>
          <strong className={heard ? 'is-good' : 'is-warn'}>
            {denied ? copy.stringsMicDenied : heard ? copy.stringsHeard : copy.stringsTooQuiet}
          </strong>
        </div>
        <div className="strings-meter">
          <span>{copy.stringsTune}</span>
          <div className="tuner-face" aria-hidden>
            <div className="tuner-scale" />
            <div className="tuner-needle" style={{ transform: `rotate(${needle * 1.4}deg)` }} />
          </div>
          <strong className={note?.inTune ? 'is-good' : 'is-warn'}>
            {denied
              ? copy.stringsMicDenied
              : note?.string
                ? `${note.string.label} · ${note.inTune ? copy.stringsInTune : cents > 0 ? copy.stringsSharp : copy.stringsFlat}`
                : ready
                  ? copy.stringsPlayOpen
                  : copy.stringsMicWait}
          </strong>
        </div>
      </div>

      <div className="strings-chat" aria-live="polite">
        <p className="field-label">Aria</p>
        <div className="strings-log" ref={logRef}>
          {messages.map((msg) => (
            <p key={msg.id} className={`strings-bubble ${msg.from}`}>
              <span>{msg.from === 'aria' ? 'Aria' : copy.stringsYou}</span>
              {msg.text}
            </p>
          ))}
        </div>
        <div className="strings-prompts">
          {STRING_PROMPTS.map((p) => (
            <button key={p} type="button" className="chip" onClick={() => pushYou(p)}>
              {p}
            </button>
          ))}
        </div>
        <form
          className="strings-ask"
          onSubmit={(e: FormEvent) => {
            e.preventDefault()
            pushYou(draft)
          }}
        >
          <label className="field">
            <span className="sr-only">{copy.stringsAsk}</span>
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={copy.stringsAsk}
              autoComplete="off"
            />
          </label>
          <button type="submit" className="btn btn-primary" disabled={!draft.trim()}>
            {copy.stringsSend}
          </button>
        </form>
      </div>

      <div className="strings-rec">
        {errorMessage ? (
          <p className="lead" style={{ color: 'var(--warn)', margin: 0 }}>
            {errorMessage}
          </p>
        ) : null}
        <button type="button" className={`btn ${recording ? 'btn-rec' : 'btn-primary'}`} onClick={() => void onRecord()}>
          {recording ? `${copy.stringsStop} · ${formatTime(seconds)}` : copy.stringsRecord}
        </button>
        {audioUrl && !recording ? (
          <div className="strings-playback">
            <audio
              ref={audioRef}
              src={audioUrl}
              controls
              onPlay={() => setPlayingBack(true)}
              onPause={() => setPlayingBack(false)}
              onEnded={() => setPlayingBack(false)}
            />
            <p className="play-subnote">
              {playingBack ? copy.stringsListening : copy.stringsReplayHint}
            </p>
          </div>
        ) : null}
      </div>
    </section>
  )
}
