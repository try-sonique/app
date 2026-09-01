import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { AuthGate } from './components/AuthGate'
import { PartitionViewer } from './components/PartitionViewer'
import { StringsStudio } from './components/StringsStudio'
import { analyzePerformance, useAriaCues, type PerformanceMeta } from './lib/aria'
import { extractAudioFeatures, mapScrollProgress } from './lib/audioFeatures'
import { usePlayEnergy } from './lib/playEnergy'
import { t } from './lib/presets'
import {
  beginnerMission,
  readPianoLevel,
  writePianoLevel,
  type PianoLevel,
} from './lib/coachScripts'

function downloadScoreFile(src: string, title: string) {
  const ext = src.includes('.svg')
    ? 'svg'
    : src.includes('.png')
      ? 'png'
      : src.includes('.pdf')
        ? 'pdf'
        : 'jpg'
  const a = document.createElement('a')
  a.href = src
  a.download = `${title.replace(/[^\w]+/g, '-').toLowerCase()}-score.${ext}`
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  a.remove()
}
import { formatTime, useMediaRecorder } from './lib/recorder'
import {
  getCurrentProfile,
  getRecordingBlob,
  getScoreFile,
  listSavedScores,
  listSessions,
  saveProfile,
  saveRecordingBlob,
  saveScoreFile,
  saveSession,
  attachSavedScoresToEmail,
  attachSessionsToEmail,
  type SavedScore,
  type StoredSession,
} from './lib/storage'
import { pushCloudSession, syncAccountSessions } from './lib/sessionCloud'
import {
  getSessionProfile,
  signOut,
  updateUserProfile,
} from './lib/supabaseAuth'
import {
  MAX_TAKES,
  initialState,
  type ArrangementKind,
  type AppState,
  type AriaFeedback,
  type InstrumentKind,
  type UserProfile,
} from './types'

type ThemeId = 'noir' | 'noir-rose' | 'poussin' | 'acrylique' | 'rose' | 'turquoise' | 'arabesque'

const ALL_THEMES: { id: ThemeId; label: string }[] = [
  { id: 'noir', label: 'Noir or' },
  { id: 'noir-rose', label: 'Noir rose' },
  { id: 'poussin', label: 'Poussin' },
  { id: 'acrylique', label: 'Acrylique' },
  { id: 'rose', label: 'Rose' },
  { id: 'turquoise', label: 'Turquoise' },
  { id: 'arabesque', label: 'Arabesque' },
]

/** `full` = sélecteur multi-couleurs ; sinon noir/or figé */
const THEME_MODE = (import.meta.env.VITE_THEME_MODE as string) || 'noir'
const FLOW_MODE = (import.meta.env.VITE_FLOW_MODE as string) || 'yc'
const IS_YC_FLOW = FLOW_MODE !== 'original'
const SHOW_THEME_DOCK = THEME_MODE === 'full'
const THEMES = SHOW_THEME_DOCK ? ALL_THEMES : ALL_THEMES.filter((t) => t.id === 'noir')

function ThemeDock({
  theme,
  onChange,
}: {
  theme: ThemeId
  onChange: (id: ThemeId) => void
}) {
  return (
    <div className="theme-dock" role="group" aria-label="Couleurs de fond">
      {THEMES.map((t) => (
        <button
          key={t.id}
          type="button"
          className={`theme-swatch ${theme === t.id ? 'active' : ''}`}
          data-swatch={t.id}
          onClick={() => onChange(t.id)}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}

type Phase = 'partition' | 'jouer' | 'retour'

function phaseFromSlide(slide: number, _hasPartition: boolean | null): Phase {
  // Same phases with or without score: setup → practice/record → feedback
  if (slide <= 4) return 'partition'
  if (slide <= 6) return 'jouer'
  return 'retour'
}

function PhaseNav({ phase }: { phase: Phase }) {
  const copy = t()
  const items: { id: Phase; n: number; label: string }[] = [
    { id: 'partition', n: 1, label: copy.phasePiece },
    { id: 'jouer', n: 2, label: copy.phasePlay },
    { id: 'retour', n: 3, label: copy.phaseFeedback },
  ]
  const order: Phase[] = ['partition', 'jouer', 'retour']
  const current = order.indexOf(phase)

  return (
    <nav className="phase-nav" aria-label={copy.phaseFeedback}>
      {items.map((item, i) => {
        const state = i < current ? 'done' : i === current ? 'active' : ''
        return (
          <div key={item.id} style={{ display: 'contents' }}>
            {i > 0 ? <span className="sep" /> : null}
            <div className={`phase ${state}`}>
              <span className="num">{item.n}</span>
              <span className="label">{item.label}</span>
            </div>
          </div>
        )
      })}
    </nav>
  )
}

function SupportMail() {
  const copy = t()
  return (
    <p className="footer-note">
      {copy.supportLabel}{' '}
      <a className="support" href={`mailto:${copy.supportEmail}`}>
        {copy.supportEmail}
      </a>
    </p>
  )
}

function FooterLine({ withPartition }: { withPartition?: boolean }) {
  const copy = t()
  return (
    <>
      <p className="footer-note">{withPartition ? copy.footerWithScore : copy.footerNoScore}</p>
      <SupportMail />
    </>
  )
}

const INSTRUMENT_KEY = 'sonique.instrument'

function readInstrument(): InstrumentKind {
  try {
    const v = sessionStorage.getItem(INSTRUMENT_KEY)
    if (v === 'guitar' || v === 'bass' || v === 'piano') return v
  } catch {
    /* ignore */
  }
  return 'piano'
}

function writeInstrument(kind: InstrumentKind) {
  try {
    sessionStorage.setItem(INSTRUMENT_KEY, kind)
  } catch {
    /* ignore */
  }
}

function isStrings(kind: InstrumentKind): kind is 'guitar' | 'bass' {
  return kind === 'guitar' || kind === 'bass'
}

const PICKED_KEY = 'sonique.instrumentPicked'

function readInstrumentPicked(): boolean {
  try {
    return sessionStorage.getItem(PICKED_KEY) === '1'
  } catch {
    return false
  }
}

function writeInstrumentPicked(picked: boolean) {
  try {
    if (picked) sessionStorage.setItem(PICKED_KEY, '1')
    else sessionStorage.removeItem(PICKED_KEY)
  } catch {
    /* ignore */
  }
}

function Welcome({ onNext }: { onNext: () => void }) {
  const copy = t()

  return (
    <section className="slide slide-welcome">
      <div className="welcome-core">
        <span className="eyebrow">{copy.readyToPlay}</span>
        <p className="hero-brand">Sonique</p>
        <p className="hero-tagline">{copy.heroTagline}</p>
        <button type="button" className="btn btn-hero" onClick={onNext}>
          {copy.start}
        </button>
      </div>
      <FooterLine />
    </section>
  )
}

function InstrumentSlide({ onPick }: { onPick: (instrument: InstrumentKind) => void }) {
  const copy = t()

  return (
    <section className="slide slide-left slide-instrument">
      <span className="eyebrow">{copy.instrumentEyebrow}</span>
      <h1>{copy.instrumentTitle}</h1>
      <p className="lead">{copy.instrumentLead}</p>
      <div className="instrument-grid">
        <button type="button" className="welcome-instrument" onClick={() => onPick('piano')}>
          <strong>{copy.welcomePiano}</strong>
          <small>{copy.welcomePianoHint}</small>
        </button>
        <button type="button" className="welcome-instrument" onClick={() => onPick('guitar')}>
          <strong>{copy.welcomeGuitar}</strong>
          <small>{copy.welcomeGuitarHint}</small>
        </button>
        <button
          type="button"
          className="welcome-instrument welcome-instrument-bass"
          onClick={() => onPick('bass')}
        >
          <strong>{copy.welcomeBass}</strong>
          <small>{copy.welcomeBassHint}</small>
        </button>
      </div>
      <FooterLine />
    </section>
  )
}


function PianoLevelSlide({
  pianoLevel,
  onSelect,
  onNext,
}: {
  pianoLevel: PianoLevel | null
  onSelect: (level: PianoLevel) => void
  onNext: () => void
}) {
  const copy = t()
  return (
    <section className="slide slide-left">
      <span className="eyebrow">{copy.pianoLevelEyebrow}</span>
      <h1>{copy.pianoLevelTitle}</h1>
      <p className="lead">{copy.pianoLevelLead}</p>
      <div className="choice-grid choice-grid-wide">
        <button
          type="button"
          className={`choice ${pianoLevel === 'beginner' ? 'active' : ''}`}
          onClick={() => onSelect('beginner')}
        >
          {copy.pianoLevelBeginner}
          <small>{copy.pianoLevelBeginnerHint}</small>
        </button>
        <button
          type="button"
          className={`choice ${pianoLevel === 'playing' ? 'active' : ''}`}
          onClick={() => onSelect('playing')}
        >
          {copy.pianoLevelPlaying}
          <small>{copy.pianoLevelPlayingHint}</small>
        </button>
      </div>
      {pianoLevel === 'beginner' ? (
        <p className="lead aria-sentence">{copy.howBeginnerLead}</p>
      ) : null}
      <div className="actions">
        <button type="button" className="btn btn-primary" disabled={!pianoLevel} onClick={onNext}>
          {copy.continue}
        </button>
      </div>
      <FooterLine />
    </section>
  )
}

function MissionCard({ takeNumber, pieceName }: { takeNumber: number; pieceName: string }) {
  const copy = t()
  const mission = beginnerMission(Math.max(1, takeNumber))
  return (
    <aside className="mission-card" aria-live="polite">
      <span className="mission-kicker">
        {copy.missionToday}
        {pieceName ? ` · ${pieceName}` : ''}
      </span>
      <strong>{mission.title}</strong>
      <p>{mission.drill}</p>
    </aside>
  )
}

function PieceSetupClassic({
  pieceName,
  hasPartition,
  partitionName,
  partitionPreview,
  partitionMime,
  savedScores,
  onOpenSaved,
  onPieceName,
  onToggleNoPartition,
  onUpload,
  onNext,
}: {
  pieceName: string
  hasPartition: boolean | null
  partitionName: string
  partitionPreview: string | null
  partitionMime: string | null
  savedScores: SavedScore[]
  onOpenSaved: (score: SavedScore) => void
  onPieceName: (v: string) => void
  onToggleNoPartition: (checked: boolean) => void
  onUpload: (file: File | null) => void
  onNext: () => void
}) {
  const noPartition = hasPartition === false
  const canContinue = pieceName.trim().length > 0 && (noPartition || Boolean(partitionName))
  const copy = t()

  return (
    <section className="slide slide-left">
      <span className="eyebrow">{copy.stepPiece}</span>
      <h1>{copy.classicTitle}</h1>
      <p className="lead">{copy.classicLead}</p>

      <div className="stack">
        <div>
          <p className="field-label">{copy.savedScores}</p>
          {savedScores.length === 0 ? (
            <p className="lead" style={{ margin: '0.4rem 0 0' }}>
              {copy.savedScoresEmpty}
            </p>
          ) : (
            <div className="preset-grid" style={{ marginTop: '0.65rem' }}>
              {savedScores.map((score) => (
                <button
                  key={score.id}
                  type="button"
                  className="preset-card"
                  onClick={() => onOpenSaved(score)}
                >
                  <strong>{score.pieceName}</strong>
                  <span>
                    {score.fileName} · {copy.savedScoreOpen}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <label className="field">
          <span>{copy.pieceNameLabel}</span>
          <input
            type="text"
            value={pieceName}
            onChange={(e) => onPieceName(e.target.value)}
            placeholder={copy.pieceNamePlaceholder}
          />
        </label>

        <div className="upload" style={{ opacity: noPartition ? 0.4 : 1 }}>
          <div className="upload-icon" aria-hidden>
            ♫
          </div>
          <strong>{copy.dropScore}</strong>
          <p className="lead" style={{ margin: 0 }}>
            {copy.uploadHint}
          </p>
          <input
            type="file"
            accept="image/*,.pdf,.svg"
            disabled={noPartition}
            onChange={(e) => onUpload(e.target.files?.[0] ?? null)}
          />
          {partitionName && !noPartition ? (
            <p className="footer-note" style={{ margin: 0, paddingTop: 0 }}>
              {copy.fileLabel} : {partitionName}
            </p>
          ) : null}
        </div>

        {!noPartition && partitionPreview ? (
          <div className="stage partition-stage">
            <p className="partition-label">{copy.previewLabel}</p>
            <PartitionViewer
              src={partitionPreview}
              mime={partitionMime}
              name={partitionName}
            />
          </div>
        ) : null}

        <label className="check-row">
          <input
            type="checkbox"
            checked={noPartition}
            onChange={(e) => onToggleNoPartition(e.target.checked)}
          />
          <div>
            <strong>{copy.noScoreContinue}</strong>
            <p className="lead" style={{ margin: '0.25rem 0 0' }}>
              {copy.noScoreContinueHint}
            </p>
          </div>
        </label>
      </div>

      <div className="actions">
        <button type="button" className="btn btn-primary" disabled={!canContinue} onClick={onNext}>
          {copy.continue}
        </button>
      </div>
      <FooterLine withPartition={!noPartition} />
    </section>
  )
}

function NoPartitionQuestions({
  arrangement,
  onSelect,
  onNext,
}: {
  arrangement: ArrangementKind
  onSelect: (v: ArrangementKind) => void
  onNext: () => void
}) {
  const copy = t()
  return (
    <section className="slide slide-left">
      <span className="eyebrow">{copy.noScoreEyebrow}</span>
      <h1>{copy.noScoreTitle}</h1>
      <p className="lead">{copy.noScoreLead}</p>
      <div className="choice-grid">
        <button
          type="button"
          className={`choice ${arrangement === 'original' ? 'active' : ''}`}
          onClick={() => onSelect('original')}
        >
          {copy.originalVersion}
          <small>{copy.originalHint}</small>
        </button>
        <button
          type="button"
          className={`choice ${arrangement === 'arrangement' ? 'active' : ''}`}
          onClick={() => onSelect('arrangement')}
        >
          {copy.arrangement}
          <small>{copy.arrangementHint}</small>
        </button>
      </div>
      <div className="actions">
        <button type="button" className="btn btn-primary" disabled={!arrangement} onClick={onNext}>
          {copy.goToPractice}
        </button>
      </div>
      <FooterLine />
    </section>
  )
}

function HowItWorks({
  firstName,
  beginner,
  onNext,
}: {
  firstName: string
  beginner: boolean
  onNext: () => void
}) {
  const copy = t()
  const name = firstName || copy.you
  const steps = beginner
    ? [
        { title: copy.howBeginner1Title, body: copy.howBeginner1Body },
        { title: copy.howBeginner2Title, body: copy.howBeginner2Body },
        { title: copy.howBeginner3Title, body: copy.howBeginner3Body },
        { title: copy.howBeginner4Title, body: copy.howBeginner4Body },
        { title: copy.howBeginner5Title, body: copy.howBeginner5Body },
      ]
    : [
        { title: copy.howStep1Title, body: copy.howStep1Body },
        { title: copy.howStep2Title, body: copy.howStep2Body },
        { title: copy.howStep3Title, body: copy.howStep3Body },
        { title: copy.howStep4Title, body: copy.howStep4Body },
        { title: copy.howStep5Title, body: copy.howStep5Body },
      ]
  return (
    <section className="slide slide-left">
      <span className="eyebrow">{copy.withScore}</span>
      <h1>
        {copy.howTitle}, {name} ?
      </h1>
      <p className="lead">{beginner ? copy.howBeginnerLead : copy.howLead}</p>
      <ol className="steps">
        {steps.map((step, i) => (
          <li key={step.title}>
            <span className="step-num">{i + 1}</span>
            <div>
              <strong>{step.title}</strong>
              <p>{step.body}</p>
            </div>
          </li>
        ))}
      </ol>
      <div className="actions">
        <button type="button" className="btn btn-primary" onClick={onNext}>
          {copy.goToPractice}
        </button>
      </div>
      <FooterLine withPartition />
    </section>
  )
}

function PracticeStage({
  pieceName,
  pieceId,
  partitionPreview,
  partitionMime,
  partitionName,
  previewAudio,
  practicePeekSec,
  scrollCapRatio,
  repeatEverySec,
  scrollKeyframes,
  pianoLevel,
  takesUsed,
  onNext,
}: {
  pieceName: string
  pieceId: string | null
  partitionPreview: string | null
  partitionMime: string | null
  partitionName: string
  previewAudio: string | null
  practicePeekSec?: number | null
  scrollCapRatio?: number
  repeatEverySec?: number
  scrollKeyframes?: { t: number; p: number }[] | null
  pianoLevel: PianoLevel | null
  takesUsed: number
  onNext: () => void
}) {
  const [active, setActive] = useState(true)
  const [refPlaying, setRefPlaying] = useState(false)
  const [refProgress, setRefProgress] = useState<number | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const { energy, denied } = usePlayEnergy(active && !refPlaying)
  const cue = useAriaCues(
    active && !refPlaying,
    'practice',
    pieceId,
    !partitionPreview,
    energy > 0.07,
    pianoLevel,
  )
  const peekSec = Math.max(6, practicePeekSec ?? 12)
  const hasScore = Boolean(partitionPreview)

  const stopRef = () => {
    audioRef.current?.pause()
    if (audioRef.current) audioRef.current.currentTime = 0
    setRefPlaying(false)
    setRefProgress(null)
  }

  const startRef = async () => {
    if (!previewAudio) return
    stopRef()
    const audio = new Audio(previewAudio)
    audioRef.current = audio
    audio.onended = () => {
      setRefPlaying(false)
      setRefProgress(null)
    }
    try {
      await audio.play()
      setRefPlaying(true)
    } catch {
      setRefPlaying(false)
      setRefProgress(null)
    }
  }

  // Cleanup only — no autoplay (practice ≠ performance replay)
  useEffect(() => {
    return () => {
      audioRef.current?.pause()
      audioRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!refPlaying) return
    const cycle = repeatEverySec ?? null
    const id = window.setInterval(() => {
      const audio = audioRef.current
      if (!audio) return
      // Court repère : stop avant de rejouer toute la perf
      if (audio.currentTime >= peekSec) {
        stopRef()
        return
      }
      if (cycle && cycle > 0) {
        const local = audio.currentTime % Math.min(cycle, peekSec)
        setRefProgress(Math.min(1, local / Math.min(cycle, peekSec)))
      } else {
        const tNorm = Math.min(1, audio.currentTime / peekSec)
        setRefProgress(mapScrollProgress(tNorm, scrollKeyframes ?? undefined, 0.04))
      }
    }, 80)
    return () => window.clearInterval(id)
  }, [refPlaying, repeatEverySec, peekSec, scrollKeyframes])

  const copy = t()

  return (
    <section className="slide slide-play">
      <div className="play-header">
        <span className="eyebrow">{copy.training}</span>
        <h1>{refPlaying ? copy.followRef : copy.yourTurn}</h1>
        <p className="lead play-lead">
          {refPlaying
            ? copy.refPlaying
            : hasScore
              ? copy.yourTurnLead
              : copy.yourTurnLeadNoScore}
        </p>
        {hasScore && !refPlaying ? (
          <p className="play-subnote">{copy.practiceNote}</p>
        ) : null}
        {pianoLevel === 'beginner' ? (
          <MissionCard takeNumber={takesUsed + 1} pieceName={pieceName} />
        ) : null}
        <div className="meta-row">
          <span>{pieceName}</span>
          {refPlaying ? <span className="ref-pill">{copy.refOn}</span> : null}
        </div>
      </div>
      <div className={`stage stage-score ${hasScore ? '' : 'stage-score-ear'}`}>
        <PartitionViewer
          src={partitionPreview}
          mime={partitionMime}
          name={partitionName}
          autoScroll={active && hasScore}
          energy={refPlaying ? 0 : energy}
          scrollProgress={refPlaying ? refProgress : null}
          scrollCapRatio={scrollCapRatio ?? 1}
        />
        {cue ? <div className={`cue-bubble ${cue.tone}`}>{cue.text}</div> : null}
      </div>
      {denied && !refPlaying ? (
        <p className="play-subnote" style={{ paddingTop: '0.75rem' }}>
          {copy.micDeniedPractice}
        </p>
      ) : null}
      <div className="actions play-actions">
        {hasScore ? (
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => downloadScoreFile(partitionPreview!, pieceName)}
          >
            {copy.downloadScore}
          </button>
        ) : null}
        {previewAudio ? (
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => (refPlaying ? stopRef() : void startRef())}
          >
            {refPlaying ? copy.cutRef : copy.restartRef}
          </button>
        ) : null}
        <button type="button" className="btn btn-ghost" onClick={() => setActive((v) => !v)}>
          {active ? copy.cutWhispers : copy.reviveAria}
        </button>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            stopRef()
            onNext()
          }}
        >
          {copy.readyRecord}
        </button>
      </div>
      <FooterLine withPartition={hasScore} />
    </section>
  )
}

function RecordStage({
  pieceName,
  pieceId,
  partitionPreview,
  partitionMime,
  partitionName,
  hasPartition,
  takesUsed,
  performanceAudio,
  scrollCapRatio,
  repeatEverySec,
  scrollDurationSec,
  scrollKeyframes,
  demoSync,
  pianoLevel,
  onFinish,
}: {
  pieceName: string
  pieceId: string | null
  partitionPreview: string | null
  partitionMime: string | null
  partitionName: string
  hasPartition: boolean
  takesUsed: number
  performanceAudio?: string | null
  scrollCapRatio?: number | null
  repeatEverySec?: number | null
  scrollDurationSec?: number | null
  scrollKeyframes?: { t: number; p: number }[] | null
  /** V2 YC : joue l’audio + scroll sync au lieu d’un micro silencieux */
  demoSync?: boolean
  pianoLevel: PianoLevel | null
  onFinish: (audioBlob: Blob | null, meta?: Omit<PerformanceMeta, 'features'>) => void
}) {
  const copy = t()
  const { status, seconds, errorMessage, start, stop } = useMediaRecorder()
  const micRecording = status === 'recording'
  const [demoPlaying, setDemoPlaying] = useState(false)
  const [demoSeconds, setDemoSeconds] = useState(0)
  const [scrollProgress, setScrollProgress] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)
  const [whispersOn, setWhispersOn] = useState(true)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const recording = demoSync ? demoPlaying : micRecording
  const { energy } = usePlayEnergy(!demoSync && micRecording)
  const cue = useAriaCues(
    recording && whispersOn,
    'record',
    pieceId,
    false,
    demoSync || energy > 0.07,
    pianoLevel,
  )

  const stopDemo = () => {
    audioRef.current?.pause()
    audioRef.current = null
    setDemoPlaying(false)
    setScrollProgress(null)
  }

  useEffect(() => {
    return () => stopDemo()
  }, [])

  useEffect(() => {
    if (!demoPlaying) return
    const cycle = repeatEverySec ?? null
    const fallbackDur = Math.max(8, scrollDurationSec ?? 55)
    const id = window.setInterval(() => {
      const audio = audioRef.current
      if (!audio) return
      setDemoSeconds(Math.floor(audio.currentTime))
      if (cycle && cycle > 0) {
        const local = audio.currentTime % cycle
        const tNorm = Math.min(1, local / cycle)
        setScrollProgress(mapScrollProgress(tNorm, scrollKeyframes ?? undefined, 0.045))
      } else {
        const dur =
          Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : fallbackDur
        const tNorm = Math.min(1, audio.currentTime / dur)
        setScrollProgress(mapScrollProgress(tNorm, scrollKeyframes ?? undefined, 0.05))
      }
    }, 80)
    return () => window.clearInterval(id)
  }, [demoPlaying, repeatEverySec, scrollDurationSec, scrollKeyframes])

  const buildMeta = (playedSec: number, totalSec: number | null): Omit<PerformanceMeta, 'features'> => ({
    playedSec,
    totalSec,
    demoSync: Boolean(demoSync),
    pieceId,
  })

  const toggle = async () => {
    if (busy) return
    setBusy(true)
    try {
      if (demoSync) {
        if (demoPlaying) {
          const audio = audioRef.current
          const playedSec = audio?.currentTime ?? demoSeconds
          const totalSec =
            audio && Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : null
          let blob: Blob | null = null
          if (performanceAudio) {
            try {
              const res = await fetch(performanceAudio)
              blob = await res.blob()
            } catch {
              blob = null
            }
          }
          stopDemo()
          onFinish(blob, buildMeta(playedSec, totalSec))
          return
        }
        if (!performanceAudio) {
          onFinish(null, buildMeta(0, null))
          return
        }
        const audio = new Audio(performanceAudio)
        audioRef.current = audio
        audio.onended = async () => {
          const totalSec =
            Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : null
          let blob: Blob | null = null
          try {
            const res = await fetch(performanceAudio)
            blob = await res.blob()
          } catch {
            blob = null
          }
          stopDemo()
          onFinish(blob, buildMeta(totalSec ?? demoSeconds, totalSec))
        }
        await audio.play()
        setDemoPlaying(true)
        setDemoSeconds(0)
        return
      }

      if (micRecording) {
        const blob = await stop()
        onFinish(blob, buildMeta(seconds, null))
        return
      }
      await start()
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className={`slide slide-play ${recording ? '' : 'slide-perf-ready'}`}>
      {recording ? (
        <>
          <div className="play-rec-bar">
            <div className="listen-status">
              <span className="rec-dot" aria-hidden />
              <p className="timer">{formatTime(demoSync ? demoSeconds : seconds)}</p>
              <span>{copy.listening}</span>
            </div>
            <span className="takes-pill">
              {copy.takeOf} {takesUsed + 1}
            </span>
          </div>
          <div className="stage stage-score stage-score-live">
            <PartitionViewer
              src={partitionPreview}
              mime={partitionMime}
              name={partitionName}
              autoScroll
              tall
              showReadingLine={Boolean(demoSync)}
              energy={demoSync ? 0 : energy}
              scrollProgress={demoSync ? scrollProgress : null}
              scrollCapRatio={scrollCapRatio ?? 1}
            />
            {cue ? <div className={`cue-bubble ${cue.tone}`}>{cue.text}</div> : null}
          </div>
          <div className="actions play-actions">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setWhispersOn((v) => !v)}
            >
              {whispersOn ? copy.cutWhispers : copy.reviveAria}
            </button>
            <button type="button" className="btn btn-primary" disabled={busy} onClick={() => void toggle()}>
              {copy.finishPerf}
            </button>
          </div>
        </>
      ) : (
        <div className="perf-ready">
          <div className="perf-ready-copy">
            <span className="eyebrow">{copy.stepPlay}</span>
            <p className="perf-ready-kicker">{copy.perfReadyEyebrow}</p>
            <h1>{copy.performance}</h1>
            <p className="perf-piece-meta">
              <span className="perf-piece-name">{pieceName}</span>
              <span className="perf-take-chip">
                {copy.takeOf} {takesUsed + 1}
              </span>
            </p>
            <p className="lead perf-ready-lead">
              {demoSync
                ? copy.perfLead
                : hasPartition
                  ? copy.perfLeadMic
                  : copy.perfLeadEar}
            </p>
            {pianoLevel === 'beginner' ? (
              <MissionCard takeNumber={takesUsed + 1} pieceName={pieceName} />
            ) : null}
            <div className="perf-ready-actions">
              <button
                type="button"
                className="btn btn-primary btn-perf-cta"
                disabled={busy}
                onClick={() => void toggle()}
              >
                {demoSync ? copy.startPerf : copy.startMic}
              </button>
              {!demoSync ? (
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => onFinish(null, buildMeta(0, null))}
                >
                  {copy.continueWithoutMic}
                </button>
              ) : null}
            </div>
            {errorMessage && !demoSync ? (
              <p className="footer-note" style={{ color: 'var(--warn)' }}>
                {errorMessage}
              </p>
            ) : (
              <p className="perf-ready-note">{demoSync ? copy.demoNote : copy.micHint}</p>
            )}
          </div>
          {partitionPreview ? (
            <div className="perf-ready-score" aria-label={copy.perfScoreLabel}>
              <p className="perf-score-label">{copy.perfScoreLabel}</p>
              <PartitionViewer
                src={partitionPreview}
                mime={partitionMime}
                name={partitionName}
                compact
              />
            </div>
          ) : null}
        </div>
      )}
      <FooterLine withPartition={hasPartition} />
    </section>
  )
}

function Analyzing({
  firstName,
  ready,
  onDone,
}: {
  firstName: string
  ready: boolean
  onDone: () => void
}) {
  const copy = t()
  const [stuck, setStuck] = useState(false)

  useEffect(() => {
    if (!ready) return
    const id = window.setTimeout(onDone, 900)
    return () => window.clearTimeout(id)
  }, [onDone, ready])

  // If analyze hangs (audio decode), never leave the founder on a dead orb
  useEffect(() => {
    if (ready) {
      setStuck(false)
      return
    }
    const id = window.setTimeout(() => setStuck(true), 3000)
    return () => window.clearTimeout(id)
  }, [ready])

  // Hard escape: never leave founder stuck on “Aria is listening…”
  useEffect(() => {
    const id = window.setTimeout(() => {
      if (!ready) onDone()
    }, 12000)
    return () => window.clearTimeout(id)
  }, [onDone, ready])

  return (
    <section className="slide">
      <div className="analyze">
        <div className="aria-orb" aria-hidden />
        <h1>{copy.ariaListening}</h1>
        <p className="lead" style={{ marginInline: 'auto' }}>
          {firstName ? `${firstName}, ${copy.oneMoment}` : copy.oneMoment}
        </p>
        {stuck && !ready ? (
          <div className="actions" style={{ justifyContent: 'center', marginTop: '1.25rem' }}>
            <button type="button" className="btn btn-primary" onClick={onDone}>
              {copy.seeFeedback}
            </button>
          </div>
        ) : null}
      </div>
      <FooterLine withPartition />
    </section>
  )
}

function Report({
  state,
  onReplay,
  onNewPiece,
  onOpenHistory,
}: {
  state: AppState
  onReplay: () => void
  onNewPiece: () => void
  onOpenHistory: () => void
}) {
  const feedback = state.feedback
  if (!feedback) return null
  const copy = t()
  const strengths = (feedback.strengths || []).slice(0, 3)
  const weaknesses = (feedback.weaknesses || []).slice(0, 3)
  const improvements = (feedback.improvements || []).slice(0, 3)

  return (
    <section className="slide">
      <span className="eyebrow">{copy.reportEyebrow}</span>
      <h1>{feedback.headline}</h1>
      <div className="takes-pill">
        {copy.takeOf} {state.takesUsed}
      </div>

      <div className="report-card report-card-compact">
        <p className="report-greeting">{feedback.greeting}</p>
        {weaknesses.length > 0 ? (
          <div className="report-block">
            <h3>{copy.weaknesses}</h3>
            <ul>
              {weaknesses.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </div>
        ) : null}
        {improvements.length > 0 ? (
          <div className="report-block">
            <h3>{copy.improvements}</h3>
            <ul>
              {improvements.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </div>
        ) : null}
        {feedback.nextFocus ? (
          <div className="report-block report-next">
            <h3>{copy.nextFocus}</h3>
            <p>{feedback.nextFocus}</p>
          </div>
        ) : null}
        {strengths.length > 0 ? (
          <div className="report-block report-strengths">
            <h3>{copy.strengths}</h3>
            <ul>
              {strengths.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      <div className="actions">
        <button type="button" className="btn btn-gold" onClick={onReplay}>
          {copy.replayPiece}
        </button>
        <button type="button" className="btn btn-ghost" onClick={onNewPiece}>
          {copy.chooseOther}
        </button>
        <button type="button" className="btn btn-ghost" onClick={onOpenHistory}>
          {copy.viewSessions}
        </button>
      </div>
      <FooterLine withPartition={state.hasPartition === true} />
    </section>
  )
}


function AccountView({
  profile,
  onProfileSaved,
  onBack,
  onOpenSessions,
  onLogOut,
}: {
  profile: UserProfile
  onProfileSaved: (profile: UserProfile) => void
  onBack: () => void
  onOpenSessions: () => void
  onLogOut: () => void
}) {
  const copy = t()
  const sessions = listSessions(profile.email)
  const [editing, setEditing] = useState(false)
  const [busy, setBusy] = useState(false)
  const [info, setInfo] = useState('')
  const [error, setError] = useState('')
  const [draftFirst, setDraftFirst] = useState(profile.firstName)
  const [draftLast, setDraftLast] = useState(profile.lastName)
  const [draftPhone, setDraftPhone] = useState(profile.phone)

  useEffect(() => {
    if (!editing) {
      setDraftFirst(profile.firstName)
      setDraftLast(profile.lastName)
      setDraftPhone(profile.phone)
    }
  }, [profile, editing])

  const displayName =
    [profile.firstName.trim(), profile.lastName.trim()].filter(Boolean).join(' ') ||
    profile.email.trim() ||
    'Sonique'
  const initials = (
    (profile.firstName.trim().charAt(0) || profile.email.trim().charAt(0) || 'S') +
    (profile.lastName.trim().charAt(0) || '')
  ).toUpperCase()
  const sessionsLabel =
    sessions.length === 0
      ? copy.accountSessionsEmpty
      : copy.accountSessionsCount.replace('{n}', String(sessions.length))

  const startEdit = () => {
    setError('')
    setInfo('')
    setDraftFirst(profile.firstName)
    setDraftLast(profile.lastName)
    setDraftPhone(profile.phone)
    setEditing(true)
  }

  const cancelEdit = () => {
    setEditing(false)
    setError('')
  }

  const saveEdit = async () => {
    setBusy(true)
    setError('')
    setInfo('')
    try {
      const result = await updateUserProfile({
        firstName: draftFirst,
        lastName: draftLast,
        email: profile.email,
        phone: draftPhone,
      })
      if (!result.ok || !result.profile) {
        setError(result.error || copy.loginFailed)
        return
      }
      onProfileSaved(result.profile)
      setEditing(false)
      setInfo(copy.profileSaved)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="slide account-slide">
      <button type="button" className="account-back-link" onClick={onBack}>
        ← {copy.accountBack}
      </button>

      <div className="account-hero">
        <div className="account-avatar" aria-hidden>
          {initials}
        </div>
        <div className="account-hero-text">
          <span className="eyebrow">{copy.accountEyebrow}</span>
          <h1>{displayName}</h1>
          <p className="account-email">{profile.email.trim()}</p>
          <p className="lead account-lead">{copy.accountLead}</p>
        </div>
      </div>

      <div className="account-section">
        <div className="account-section-head">
          <h2 className="account-section-title">{copy.accountPersonal}</h2>
          {!editing ? (
            <button type="button" className="account-edit-btn" onClick={startEdit}>
              {copy.editProfile}
            </button>
          ) : null}
        </div>
        {editing ? (
          <div className="stack account-edit-form">
            <label className="field">
              <span>{copy.firstName}</span>
              <input
                type="text"
                value={draftFirst}
                onChange={(e) => setDraftFirst(e.target.value)}
                autoComplete="off"
              />
            </label>
            <label className="field">
              <span>{copy.lastName}</span>
              <input
                type="text"
                value={draftLast}
                onChange={(e) => setDraftLast(e.target.value)}
                autoComplete="off"
              />
            </label>
            <label className="field">
              <span>{copy.email}</span>
              <input type="email" value={profile.email} readOnly />
            </label>
            <p className="footer-note" style={{ margin: 0, opacity: 0.75 }}>
              {copy.emailLockedHint}
            </p>
            <label className="field">
              <span>{copy.phoneOptional}</span>
              <input
                type="tel"
                value={draftPhone}
                onChange={(e) => setDraftPhone(e.target.value)}
                placeholder="+33…"
                autoComplete="off"
              />
            </label>
            {error ? (
              <p className="lead" style={{ color: 'var(--warn)', margin: 0 }}>
                {error}
              </p>
            ) : null}
            <div className="actions" style={{ marginTop: '0.75rem' }}>
              <button type="button" className="btn btn-ghost" onClick={cancelEdit} disabled={busy}>
                {copy.cancelEdit}
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => void saveEdit()}
                disabled={busy || !draftFirst.trim()}
              >
                {busy ? copy.authBusy : copy.saveProfile}
              </button>
            </div>
          </div>
        ) : (
          <ul className="account-list">
            <li className="account-list-item">
              <span className="account-list-label">{copy.firstName}</span>
              <span className="account-list-value">
                {profile.firstName.trim() || copy.nameMissing}
              </span>
            </li>
            <li className="account-list-item">
              <span className="account-list-label">{copy.lastName}</span>
              <span className="account-list-value">
                {profile.lastName.trim() || copy.nameMissing}
              </span>
            </li>
            <li className="account-list-item">
              <span className="account-list-label">{copy.email}</span>
              <span className="account-list-value">
                {profile.email.trim() || copy.nameMissing}
              </span>
            </li>
            <li className="account-list-item">
              <span className="account-list-label">{copy.phoneOptional}</span>
              <span className="account-list-value">
                {profile.phone.trim() || copy.phoneMissing}
              </span>
            </li>
          </ul>
        )}
        {info && !editing ? (
          <p className="footer-note" style={{ marginTop: '0.65rem' }}>
            {info}
          </p>
        ) : null}
      </div>

      <div className="account-section">
        <h2 className="account-section-title">{copy.accountSecurity}</h2>
        <ul className="account-list">
          <li className="account-list-item">
            <span className="account-list-label">{copy.accountPasswordLabel}</span>
            <span className="account-list-value muted">{copy.accountPasswordValue}</span>
          </li>
        </ul>
      </div>

      <div className="account-section">
        <h2 className="account-section-title">{copy.accountActivity}</h2>
        <button type="button" className="account-nav-row" onClick={onOpenSessions}>
          <span className="account-nav-main">
            <strong>{copy.accountSessions}</strong>
            <small>{copy.accountSessionsHint}</small>
          </span>
          <span className="account-nav-meta">
            {sessionsLabel}
            <span className="account-chevron" aria-hidden>
              ›
            </span>
          </span>
        </button>
      </div>

      <div className="account-footer">
        <SupportMail />
        <button type="button" className="btn btn-ghost account-logout" onClick={onLogOut}>
          {copy.logOut}
        </button>
      </div>
    </section>
  )
}

function formatSessionHeadline(headline: string, pieceName: string) {
  const copy = t()
  const cleaned = headline
    .replace(/^Compte\s*rendu\s*[—–-]\s*/i, '')
    .replace(/^Retour\s*[—–-]\s*/i, '')
    .replace(/^Feedback\s*[—–-]\s*/i, '')
    .trim()
  const title = cleaned || pieceName
  return `${copy.feedbackPrefix} · ${title}`
}

function feedbackFromSession(session: StoredSession): AriaFeedback {
  if (session.feedback) {
    return {
      ...session.feedback,
      headline: formatSessionHeadline(session.feedback.headline, session.pieceName),
    }
  }
  return {
    headline: formatSessionHeadline(session.feedbackHeadline, session.pieceName),
    greeting: '',
    overview: session.feedbackHeadline || session.pieceName,
    atmosphere: '',
    technique: '',
    rhythm: '',
    strengths: [],
    weaknesses: [],
    improvements: [],
    nextFocus: '',
    takesLeft: 0,
  }
}

function groupSessionsByPiece(sessions: StoredSession[]) {
  const map = new Map<string, StoredSession[]>()
  for (const s of sessions) {
    const key = s.pieceName.trim() || '—'
    const group = map.get(key)
    if (group) group.push(s)
    else map.set(key, [s])
  }
  return [...map.entries()].map(([piece, items]) => ({ piece, items }))
}

function formatSessionWhen(iso: string) {
  const copy = t()
  const locale = 'fr-FR'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const now = new Date()
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const startThat = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
  const diffDays = Math.round((startToday - startThat) / 86400000)
  const time = d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })
  if (diffDays === 0) return `${copy.historyToday} · ${time}`
  if (diffDays === 1) return `${copy.historyYesterday} · ${time}`
  return d.toLocaleString(locale, {
    day: 'numeric',
    month: 'short',
    year: d.getFullYear() === now.getFullYear() ? undefined : 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function sessionTeaser(session: StoredSession) {
  const fb = session.feedback
  if (fb?.nextFocus?.trim()) return fb.nextFocus.trim()
  if (fb?.weaknesses?.[0]) return fb.weaknesses[0]
  if (fb?.greeting?.trim()) return fb.greeting.trim()
  if (fb?.overview?.trim()) return fb.overview.trim()
  return formatSessionHeadline(session.feedbackHeadline, session.pieceName)
}

function SessionNotes({ session }: { session: StoredSession }) {
  const copy = t()
  const fb = feedbackFromSession(session)
  const strengths = (fb.strengths || []).slice(0, 3)
  const weaknesses = (fb.weaknesses || []).slice(0, 3)
  const improvements = (fb.improvements || []).slice(0, 3)
  const hasBody = Boolean(
    fb.greeting || weaknesses.length || improvements.length || fb.nextFocus || strengths.length,
  )
  if (!hasBody) {
    return <p className="history-notes-fallback">{fb.headline}</p>
  }
  return (
    <div className="history-notes">
      {fb.greeting ? <p className="report-greeting">{fb.greeting}</p> : null}
      {weaknesses.length > 0 ? (
        <div className="report-block">
          <h3>{copy.weaknesses}</h3>
          <ul>
            {weaknesses.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {improvements.length > 0 ? (
        <div className="report-block">
          <h3>{copy.improvements}</h3>
          <ul>
            {improvements.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {fb.nextFocus ? (
        <div className="report-block report-next">
          <h3>{copy.nextFocus}</h3>
          <p>{fb.nextFocus}</p>
        </div>
      ) : null}
      {strengths.length > 0 ? (
        <div className="report-block report-strengths">
          <h3>{copy.strengths}</h3>
          <ul>
            {strengths.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  )
}

function HistoryView({
  email,
  onBack,
  onOpenFeedback,
  onStartPiece,
}: {
  email: string
  onBack: () => void
  onOpenFeedback: (session: StoredSession) => void
  onStartPiece: () => void
}) {
  const [sessions, setSessions] = useState(() => listSessions(email))
  const [audioUrls, setAudioUrls] = useState<Record<string, string>>({})
  const [audioReady, setAudioReady] = useState(false)
  const [syncing, setSyncing] = useState(true)
  const [openId, setOpenId] = useState<string | null>(
    () => listSessions(email)[0]?.id ?? null,
  )
  const sessionKey = sessions.map((s) => s.id).join('|')

  useEffect(() => {
    let cancelled = false
    attachSessionsToEmail(email)
    setSessions(listSessions(email))
    setSyncing(true)
    void syncAccountSessions(email).finally(() => {
      if (cancelled) return
      const next = listSessions(email)
      setSessions(next)
      setOpenId((id) => id ?? next[0]?.id ?? null)
      setSyncing(false)
    })
    return () => {
      cancelled = true
    }
  }, [email])

  useEffect(() => {
    let cancelled = false
    const urls: Record<string, string> = {}
    setAudioReady(false)
    ;(async () => {
      for (const s of sessions) {
        if (!s.hasAudio) continue
        const blob = await getRecordingBlob(s.id)
        if (blob && !cancelled) urls[s.id] = URL.createObjectURL(blob)
      }
      if (!cancelled) {
        setAudioUrls(urls)
        setAudioReady(true)
      }
    })()
    return () => {
      cancelled = true
      Object.values(urls).forEach((u) => URL.revokeObjectURL(u))
    }
    // sessionKey captures identity; sessions is read inside
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email, sessionKey])

  const copy = t()
  const groups = groupSessionsByPiece(sessions)

  return (
    <section className="slide history-slide">
      <button type="button" className="account-back-link" onClick={onBack}>
        ← {copy.historyBack}
      </button>

      <div className="history-hero">
        <span className="eyebrow">{copy.historyEyebrow}</span>
        <h1>{copy.historyTitle}</h1>
        <p className="lead history-lead">{copy.historyLead}</p>
        {sessions.length > 0 ? (
          <p className="history-count">
            {copy.historyCount.replace('{n}', String(sessions.length))}
          </p>
        ) : null}
      </div>

      {syncing && sessions.length === 0 ? (
        <p className="history-syncing">{copy.historySyncing}</p>
      ) : sessions.length === 0 ? (
        <div className="history-empty">
          <p className="history-empty-title">{copy.noSessions}</p>
          <p className="lead history-lead">{copy.historyEmptyHint}</p>
          <button type="button" className="btn btn-primary" onClick={onStartPiece}>
            {copy.historyStart}
          </button>
        </div>
      ) : (
        <div className="history-list">
          {groups.map((group) => (
            <section key={group.piece} className="history-group">
              <div className="history-group-head">
                <h2>{group.piece}</h2>
                <span>
                  {copy.historyTakesOnPiece.replace('{n}', String(group.items.length))}
                </span>
              </div>
              {group.items.map((s) => {
                const open = openId === s.id
                return (
                  <article
                    key={s.id}
                    className={`history-item ${open ? 'is-open' : ''}`}
                  >
                    <div className="history-item-top">
                      <span className="history-take-chip">
                        {copy.takeLabel} {s.takeNumber}
                      </span>
                      <time className="history-when" dateTime={s.createdAt}>
                        {formatSessionWhen(s.createdAt)}
                      </time>
                      <span className="history-mode-chip">
                        {s.hasPartition ? copy.withPartition : copy.byEar}
                      </span>
                    </div>
                    {!open ? <p className="history-teaser">{sessionTeaser(s)}</p> : null}
                    {open ? <SessionNotes session={s} /> : null}
                    {audioUrls[s.id] ? (
                      <div className="history-audio">
                        <span className="history-audio-label">{copy.historyListen}</span>
                        <audio controls preload="metadata" src={audioUrls[s.id]} />
                      </div>
                    ) : s.hasAudio && audioReady ? (
                      <p className="history-no-audio">{copy.historyNoAudio}</p>
                    ) : null}
                    <div className="history-item-actions">
                      <button
                        type="button"
                        className="btn btn-ghost"
                        onClick={() => setOpenId(open ? null : s.id)}
                      >
                        {open ? copy.historyHideNotes : copy.historyShowNotes}
                      </button>
                      {open ? (
                        <button
                          type="button"
                          className="btn btn-primary"
                          onClick={() => onOpenFeedback(s)}
                        >
                          {copy.historyOpenReport}
                        </button>
                      ) : null}
                    </div>
                  </article>
                )
              })}
            </section>
          ))}
        </div>
      )}
    </section>
  )
}

export default function App() {
  const [state, setState] = useState<AppState>(() => {
    const existing = getCurrentProfile()
    const instrument = readInstrument()
    return existing
      ? { ...initialState, profile: existing, instrument }
      : { ...initialState, instrument }
  })
  const [theme, setTheme] = useState<ThemeId>(() => {
    if (!SHOW_THEME_DOCK) return 'noir'
    const saved = localStorage.getItem('sonique-theme') as ThemeId | null
    return saved && THEMES.some((t) => t.id === saved) ? saved : 'noir'
  })
  const [showHistory, setShowHistory] = useState(() => {
    try {
      if (sessionStorage.getItem('sonique.openHistory') === '1') {
        sessionStorage.removeItem('sonique.openHistory')
        return true
      }
    } catch {
      /* ignore */
    }
    return false
  })
  const [showAccount, setShowAccount] = useState(false)
  const [authSkipped, setAuthSkipped] = useState(false)
  const [instrumentPicked, setInstrumentPicked] = useState(readInstrumentPicked)
  const [historyFromAccount, setHistoryFromAccount] = useState(false)
  const [historyRev, setHistoryRev] = useState(0)
  const [scoreRev, setScoreRev] = useState(0)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    document.documentElement.setAttribute('data-themes', SHOW_THEME_DOCK ? 'full' : 'noir')
    if (SHOW_THEME_DOCK) localStorage.setItem('sonique-theme', theme)
  }, [theme])

  useEffect(() => {
    const boot = async () => {
      if (import.meta.env.DEV && new URLSearchParams(window.location.search).has('demoBeginner')) {
        writePianoLevel('beginner')
        const preview = {
          firstName: 'Élodie',
          lastName: '',
          email: 'preview@sonique.local',
          phone: '',
        }
        saveProfile(preview)
        writeInstrument('piano')
        writeInstrumentPicked(true)
        setInstrumentPicked(true)
        setState((s) => ({
          ...s,
          slide: 3,
          instrument: 'piano',
          pianoLevel: 'beginner',
          profile: preview,
        }))
        return
      }
      if (sessionStorage.getItem('sonique.forceFresh') === '1') {
        sessionStorage.removeItem('sonique.forceFresh')
        await signOut()
        setState((s) => ({
          ...s,
          profile: { firstName: '', lastName: '', email: '', phone: '' },
        }))
        return
      }
      setState((s) => ({
        ...s,
        pianoLevel: s.pianoLevel ?? readPianoLevel(),
        instrument: readInstrument(),
      }))
      const existing = getCurrentProfile()
      if (existing) {
        attachSessionsToEmail(existing.email)
        attachSavedScoresToEmail(existing.email)
        setState((s) => ({ ...s, profile: existing }))
        setAuthSkipped(true)
      }
      const remote = await getSessionProfile()
      if (remote) {
        attachSessionsToEmail(remote.email)
        attachSavedScoresToEmail(remote.email)
        let afterAuth = false
        try {
          afterAuth = sessionStorage.getItem('sonique.afterAuth') === '1'
          if (afterAuth) sessionStorage.removeItem('sonique.afterAuth')
        } catch {
          /* ignore */
        }
        setAuthSkipped(true)
        if (afterAuth) {
          writeInstrumentPicked(false)
          setInstrumentPicked(false)
        }
        setState((s) => ({
          ...s,
          profile: remote,
          slide: afterAuth && s.slide < 2 ? 2 : s.slide,
        }))
        await syncAccountSessions(remote.email)
        setHistoryRev((n) => n + 1)
      } else if (existing?.email) {
        await syncAccountSessions(existing.email)
        setHistoryRev((n) => n + 1)
      }
    }
    void boot()
  }, [])

  const withPartition = state.hasPartition !== false
  const phase = phaseFromSlide(state.slide, state.hasPartition)

  const go = (slide: number) => setState((s) => ({ ...s, slide }))
  const patch = (partial: Partial<AppState>) => setState((s) => ({ ...s, ...partial }))

  const handleLogOut = () => {
    setShowHistory(false)
    setShowAccount(false)
    void (async () => {
      await signOut()
      setAuthSkipped(false)
      writeInstrument('piano')
      writeInstrumentPicked(false)
      setInstrumentPicked(false)
      setState({ ...initialState, slide: 1, pianoLevel: readPianoLevel(), instrument: 'piano' })
    })()
  }

  const finishTake = (
    audioBlob: Blob | null,
    meta?: Omit<PerformanceMeta, 'features'>,
  ) => {
    const analyzeSlide = 7
    setState((s) => ({ ...s, slide: analyzeSlide, isRecording: false, feedback: null }))
    void (async () => {
      let features
      try {
        features = await extractAudioFeatures(audioBlob)
      } catch {
        features = await extractAudioFeatures(null)
      }
      setState((s) => {
        try {
          const takesUsed = s.takesUsed + 1
          const fullMeta: PerformanceMeta = {
            playedSec: meta?.playedSec ?? features.durationSec ?? 0,
            totalSec: meta?.totalSec ?? null,
            demoSync: meta?.demoSync ?? false,
            pieceId: meta?.pieceId ?? s.selectedPresetId,
            features,
          }
          const feedback = analyzePerformance({
            pieceName: s.pieceName,
            hasPartition: s.hasPartition === true,
            firstName: s.profile.firstName,
            arrangement: s.arrangement,
            pianoLevel: s.pianoLevel,
            takesUsed,
            maxTakes: MAX_TAKES,
            meta: fullMeta,
          })
          try {
            const saved = saveSession({
              email: s.profile.email,
              pieceName: s.pieceName,
              hasPartition: s.hasPartition === true,
              feedbackHeadline: feedback.headline,
              takeNumber: takesUsed,
              feedback,
              hasAudio: Boolean(audioBlob),
            })
            void pushCloudSession(saved)
            if (audioBlob) {
              void saveRecordingBlob(saved.id, audioBlob)
            }
          } catch {
            /* storage optional for demo */
          }
          return { ...s, takesUsed, feedback }
        } catch {
          const takesUsed = s.takesUsed + 1
          const feedback = analyzePerformance({
            pieceName: s.pieceName,
            hasPartition: s.hasPartition === true,
            firstName: s.profile.firstName,
            arrangement: s.arrangement,
            pianoLevel: s.pianoLevel,
            takesUsed,
            maxTakes: MAX_TAKES,
            meta: {
              playedSec: meta?.playedSec ?? 0,
              totalSec: meta?.totalSec ?? null,
              demoSync: meta?.demoSync ?? false,
              pieceId: meta?.pieceId ?? s.selectedPresetId,
              features: null,
            },
          })
          return { ...s, takesUsed, feedback }
        }
      })
    })()
  }

  const afterAnalyze = useCallback(() => {
    setState((s) => {
      if (s.feedback) return { ...s, slide: 8 }
      const takesUsed = Math.max(s.takesUsed, 1)
      const feedback = analyzePerformance({
        pieceName: s.pieceName,
        hasPartition: s.hasPartition === true,
        firstName: s.profile.firstName,
        arrangement: s.arrangement,
        pianoLevel: s.pianoLevel,
        takesUsed,
        maxTakes: MAX_TAKES,
        meta: {
          playedSec: 0,
          totalSec: null,
          demoSync: false,
          pieceId: s.selectedPresetId,
          features: null,
        },
      })
      return { ...s, takesUsed, feedback, slide: 8 }
    })
  }, [])

  const replay = () => {
    setState((s) => ({
      ...s,
      slide: 6,
      feedback: null,
    }))
  }

  const revokeIfBlob = (url: string | null) => {
    if (url?.startsWith('blob:')) URL.revokeObjectURL(url)
  }

  const newPiece = () => {
    setState((s) => {
      revokeIfBlob(s.partitionPreview)
      return {
        ...s,
        slide: 3,
        pieceName: '',
        partitionName: '',
        partitionPreview: null,
        partitionMime: null,
        selectedPresetId: null,
        previewAudio: null,
        performanceAudio: null,
        practicePeekSec: null,
        scrollCapRatio: null,
        repeatEverySec: null,
        scrollDurationSec: null,
        scrollKeyframes: null,
        hasPartition: null,
        arrangement: null,
        takesUsed: 0,
        feedback: null,
      }
    })
  }

  const onUpload = (file: File | null) => {
    setState((s) => {
      revokeIfBlob(s.partitionPreview)
      if (!file) {
        return {
          ...s,
          partitionName: '',
          partitionPreview: null,
          partitionMime: null,
          selectedPresetId: null,
          previewAudio: null,
          performanceAudio: null,
          hasPartition: null,
        }
      }
      const preview = URL.createObjectURL(file)
      const pieceName = s.pieceName || file.name.replace(/\.[^.]+$/, '')
      void saveScoreFile({
        email: s.profile.email,
        pieceName,
        file,
      }).then(() => setScoreRev((n) => n + 1))
      return {
        ...s,
        pieceName,
        partitionName: file.name,
        partitionPreview: preview,
        partitionMime:
          file.type ||
          (file.name.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/*'),
        selectedPresetId: null,
        previewAudio: null,
        performanceAudio: null,
        scrollCapRatio: null,
        repeatEverySec: null,
        scrollDurationSec: null,
        hasPartition: true,
      }
    })
  }

  const openSavedScore = (score: SavedScore) => {
    void (async () => {
      const blob = await getScoreFile(score.id)
      if (!blob) return
      setState((s) => {
        revokeIfBlob(s.partitionPreview)
        return {
          ...s,
          pieceName: score.pieceName,
          partitionName: score.fileName,
          partitionPreview: URL.createObjectURL(blob),
          partitionMime: score.mime,
          selectedPresetId: null,
          previewAudio: null,
          performanceAudio: null,
          hasPartition: true,
        }
      })
    })()
  }

  let body: ReactNode = null

  if (showAccount) {
    body = !state.profile.email.trim() ? (
      <AuthGate
        profile={state.profile}
        onProfileLoaded={(profile) => {
          attachSessionsToEmail(profile.email)
          attachSavedScoresToEmail(profile.email)
          setState((s) => ({ ...s, profile }))
          void syncAccountSessions(profile.email).then(() => setHistoryRev((n) => n + 1))
          setScoreRev((n) => n + 1)
        }}
        onNext={() => setShowAccount(false)}
        onCancel={() => setShowAccount(false)}
      />
    ) : (
      <AccountView
        key={`account-${historyRev}`}
        profile={state.profile}
        onProfileSaved={(profile) => setState((s) => ({ ...s, profile }))}
        onBack={() => setShowAccount(false)}
        onOpenSessions={() => {
          attachSessionsToEmail(state.profile.email)
          void syncAccountSessions(state.profile.email).then(() => setHistoryRev((n) => n + 1))
          setHistoryFromAccount(true)
          setShowAccount(false)
          setShowHistory(true)
        }}
        onLogOut={handleLogOut}
      />
    )
  } else if (showHistory) {
    body = (
      <HistoryView
        key={`history-${historyRev}`}
        email={state.profile.email}
        onBack={() => {
          setShowHistory(false)
          if (historyFromAccount) setShowAccount(true)
        }}
        onStartPiece={() => {
          setShowHistory(false)
          setShowAccount(false)
          go(3)
        }}
        onOpenFeedback={(session) => {
          setState((s) => ({
            ...s,
            pieceName: session.pieceName,
            hasPartition: session.hasPartition,
            feedback: feedbackFromSession(session),
            slide: 8,
          }))
          setShowHistory(false)
        }}
      />
    )
  } else if (state.slide === 1)
    body = (
      <Welcome
        onNext={() => {
          writeInstrumentPicked(false)
          setInstrumentPicked(false)
          go(2)
        }}
      />
    )
  else if (state.slide === 2 && !state.profile.email.trim() && !authSkipped) {
    body = (
      <AuthGate
        profile={state.profile}
        onProfileLoaded={(profile) => {
          attachSessionsToEmail(profile.email)
          attachSavedScoresToEmail(profile.email)
          setState((s) => ({ ...s, profile }))
          void syncAccountSessions(profile.email).then(() => setHistoryRev((n) => n + 1))
          setScoreRev((n) => n + 1)
          setAuthSkipped(true)
        }}
        onNext={() => setAuthSkipped(true)}
        onCancel={() => go(1)}
        onSkip={() => setAuthSkipped(true)}
      />
    )
  } else if (state.slide === 2 && !instrumentPicked) {
    body = (
      <InstrumentSlide
        onPick={(instrument) => {
          writeInstrument(instrument)
          writeInstrumentPicked(true)
          setInstrumentPicked(true)
          patch({ instrument })
        }}
      />
    )
  } else if (state.slide === 2 && isStrings(state.instrument)) {
    body = (
      <StringsStudio
        instrument={state.instrument}
        onBack={() => {
          writeInstrumentPicked(false)
          setInstrumentPicked(false)
        }}
      />
    )
  } else if (state.slide === 2) {
    body = (
      <PianoLevelSlide
        pianoLevel={state.pianoLevel}
        onSelect={(level) => {
          writePianoLevel(level)
          patch({ pianoLevel: level })
        }}
        onNext={() => go(3)}
      />
    )
  } else if (state.slide === 3) {
    body = (
      <PieceSetupClassic
        key={`scores-${scoreRev}`}
        pieceName={state.pieceName}
        hasPartition={state.hasPartition}
        partitionName={state.partitionName}
        partitionPreview={state.partitionPreview}
        partitionMime={state.partitionMime}
        savedScores={listSavedScores(state.profile.email)}
        onOpenSaved={openSavedScore}
        onPieceName={(pieceName) => patch({ pieceName })}
        onToggleNoPartition={(checked) =>
          setState((s) => {
            if (checked) revokeIfBlob(s.partitionPreview)
            return {
              ...s,
              hasPartition: checked ? false : s.partitionName ? true : null,
              partitionName: checked ? '' : s.partitionName,
              partitionPreview: checked ? null : s.partitionPreview,
              partitionMime: checked ? null : s.partitionMime,
              selectedPresetId: null,
              previewAudio: null,
              performanceAudio: null,
              practicePeekSec: null,
              scrollCapRatio: null,
              repeatEverySec: null,
              scrollDurationSec: null,
              scrollKeyframes: null,
            }
          })
        }
        onUpload={onUpload}
        onNext={() => go(4)}
      />
    )
  } else if (state.slide === 4 && withPartition) {
    body = (
      <HowItWorks
        firstName={state.profile.firstName}
        beginner={state.pianoLevel === 'beginner'}
        onNext={() => go(5)}
      />
    )
  } else if (state.slide === 4 && !withPartition) {
    body = (
      <NoPartitionQuestions
        arrangement={state.arrangement}
        onSelect={(arrangement) => patch({ arrangement })}
        onNext={() => go(5)}
      />
    )
  } else if (state.slide === 5) {
    body = (
      <PracticeStage
        pieceName={state.pieceName}
        pieceId={state.selectedPresetId}
        partitionPreview={state.hasPartition === false ? null : state.partitionPreview}
        partitionMime={state.hasPartition === false ? null : state.partitionMime}
        partitionName={state.hasPartition === false ? '' : state.partitionName}
        previewAudio={state.previewAudio}
        practicePeekSec={state.practicePeekSec}
        scrollCapRatio={state.scrollCapRatio ?? undefined}
        repeatEverySec={state.repeatEverySec ?? undefined}
        scrollKeyframes={state.scrollKeyframes}
        pianoLevel={state.pianoLevel}
        takesUsed={state.takesUsed}
        onNext={() => go(6)}
      />
    )
  } else if (state.slide === 6 && withPartition) {
    body = (
      <RecordStage
        pieceName={state.pieceName}
        pieceId={state.selectedPresetId}
        partitionPreview={state.partitionPreview}
        partitionMime={state.partitionMime}
        partitionName={state.partitionName}
        hasPartition
        takesUsed={state.takesUsed}
        performanceAudio={state.performanceAudio}
        scrollCapRatio={state.scrollCapRatio}
        repeatEverySec={state.repeatEverySec}
        scrollDurationSec={state.scrollDurationSec}
        scrollKeyframes={state.scrollKeyframes}
        demoSync={IS_YC_FLOW && Boolean(state.performanceAudio) && state.pianoLevel !== 'beginner'}
        pianoLevel={state.pianoLevel}
        onFinish={finishTake}
      />
    )
  } else if (state.slide === 6 && !withPartition) {
    body = (
      <RecordStage
        pieceName={state.pieceName}
        pieceId={state.selectedPresetId}
        partitionPreview={null}
        partitionMime={null}
        partitionName=""
        hasPartition={false}
        takesUsed={state.takesUsed}
        demoSync={false}
        pianoLevel={state.pianoLevel}
        onFinish={finishTake}
      />
    )
  } else if (state.slide === 7) {
    body = (
      <Analyzing
        firstName={state.profile.firstName}
        ready={Boolean(state.feedback)}
        onDone={afterAnalyze}
      />
    )
  } else if (state.slide === 8) {
    body = (
      <Report
        state={state}
        onReplay={replay}
        onNewPiece={newPiece}
        onOpenHistory={() => {
          setHistoryFromAccount(false)
          setShowHistory(true)
        }}
      />
    )
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <button
          type="button"
          className="brand-mark"
          onClick={() => {
            setShowHistory(false)
            setShowAccount(false)
            if (state.slide === 2 && !state.profile.email.trim() && !authSkipped) {
              go(1)
              return
            }
            if (state.slide === 2 && !instrumentPicked) {
              go(1)
              return
            }
            if (state.slide === 2 && instrumentPicked) {
              writeInstrumentPicked(false)
              setInstrumentPicked(false)
              return
            }
            // Dans le parcours piano, le logo ramène au morceau — pas à l’accueil.
            if (state.pianoLevel) go(3)
            else go(1)
          }}
          aria-label={
            state.slide <= 2
              ? t().backHome
              : state.pianoLevel
                ? t().backToPiece
                : t().backHome
          }
        >
          Sonique
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {(showAccount && !state.profile.email.trim()) ||
          (state.slide === 2 && !state.profile.email.trim() && !authSkipped && !showAccount) ? null : (
            <button
              type="button"
              className="top-link"
              onClick={() => {
                setShowHistory(false)
                setShowAccount(true)
              }}
            >
              {state.profile.email.trim() ? t().myAccount : t().headerSignIn}
            </button>
          )}
          {!showHistory &&
          !showAccount &&
          state.slide > 2 &&
          !isStrings(state.instrument) ? (
            <PhaseNav phase={phase} />
          ) : null}
        </div>
      </header>
      {body}
      {SHOW_THEME_DOCK ? <ThemeDock theme={theme} onChange={setTheme} /> : null}
    </div>
  )
}
