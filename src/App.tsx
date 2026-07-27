import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from 'react'
import { PartitionViewer } from './components/PartitionViewer'
import { analyzePerformance, useAriaCues, type PerformanceMeta } from './lib/aria'
import { extractAudioFeatures, mapScrollProgress } from './lib/audioFeatures'
import { usePlayEnergy } from './lib/playEnergy'
import { DEMO_PIECES, getLocale, pieceBlurb, t } from './lib/presets'

function downloadScoreFile(src: string, title: string) {
  const ext = src.includes('.png') ? 'png' : src.includes('.pdf') ? 'pdf' : 'jpg'
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
  findProfileByEmail,
  getCurrentProfile,
  getRecordingBlob,
  listSessions,
  saveProfile,
  saveRecordingBlob,
  saveSession,
  type StoredSession,
} from './lib/storage'
import {
  MAX_TAKES,
  initialState,
  type ArrangementKind,
  type AppState,
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

function phaseFromSlide(slide: number, hasPartition: boolean | null): Phase {
  if (hasPartition === false) {
    if (slide <= 4) return 'partition'
    if (slide <= 5) return 'jouer'
    return 'retour'
  }
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

function FooterLine({ withPartition }: { withPartition?: boolean }) {
  const copy = t()
  return (
    <p className="footer-note">{withPartition ? copy.footerWithScore : copy.footerNoScore}</p>
  )
}

function Welcome({ onNext }: { onNext: () => void }) {
  const copy = t()
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    const audio = new Audio('./presets/lettre-a-elise.mp3')
    audio.loop = true
    audio.volume = 0.28
    audioRef.current = audio
    const tryPlay = () => {
      void audio.play().catch(() => {
        /* autoplay may be blocked until a gesture */
      })
    }
    tryPlay()
    const unlock = () => {
      tryPlay()
      window.removeEventListener('pointerdown', unlock)
    }
    window.addEventListener('pointerdown', unlock)
    return () => {
      window.removeEventListener('pointerdown', unlock)
      audio.pause()
      audio.src = ''
      audioRef.current = null
    }
  }, [])

  const go = () => {
    const audio = audioRef.current
    if (audio) {
      // short fade then stop so Get Started feels intentional with the VO
      const startVol = audio.volume
      const t0 = performance.now()
      const fade = (now: number) => {
        const u = Math.min(1, (now - t0) / 350)
        audio.volume = startVol * (1 - u)
        if (u < 1) requestAnimationFrame(fade)
        else {
          audio.pause()
          audio.currentTime = 0
        }
      }
      requestAnimationFrame(fade)
    }
    onNext()
  }

  return (
    <section className="slide slide-welcome">
      <div className="welcome-core">
        <span className="eyebrow">{copy.readyToPlay}</span>
        <p className="hero-brand">Sonique</p>
        <p className="hero-tagline">{copy.heroTagline}</p>
        <button type="button" className="btn btn-hero" onClick={go}>
          {copy.start}
        </button>
      </div>
      <FooterLine />
    </section>
  )
}


type AuthMode = 'choose' | 'login' | 'signup'

function AuthSlide({
  profile,
  onChange,
  onProfileLoaded,
  onNext,
}: {
  profile: AppState['profile']
  onChange: (key: keyof AppState['profile'], value: string) => void
  onProfileLoaded: (profile: UserProfile) => void
  onNext: () => void
}) {
  const copy = t()
  const [mode, setMode] = useState<AuthMode>('choose')
  const [loginEmail, setLoginEmail] = useState(profile.email)
  const [loginError, setLoginError] = useState('')

  const signupValid = Boolean(profile.firstName.trim() && profile.email.trim())

  const submitSignup = (e: FormEvent) => {
    e.preventDefault()
    if (!signupValid) return
    saveProfile(profile)
    onNext()
  }

  const submitLogin = (e: FormEvent) => {
    e.preventDefault()
    const found = findProfileByEmail(loginEmail)
    if (!found) {
      setLoginError(copy.loginNotFound)
      return
    }
    setLoginError('')
    onProfileLoaded(found)
    saveProfile(found)
    onNext()
  }

  if (mode === 'choose') {
    const returning = Boolean(profile.firstName.trim() || profile.email.trim())
    return (
      <section className="slide">
        <span className="eyebrow">{copy.accessEyebrow}</span>
        <h1>
          {returning
            ? `${copy.accessReturning}${profile.firstName.trim() ? `, ${profile.firstName.trim()}` : ''}`
            : copy.haveAccount}
        </h1>
        <p className="lead">{returning ? copy.accessReturningLead : copy.haveAccountLead}</p>
        <div className="choice-grid" style={{ marginInline: 'auto' }}>
          <button type="button" className="choice" onClick={() => setMode('login')}>
            {copy.login}
            <small>{copy.loginHint}</small>
          </button>
          <button type="button" className="choice" onClick={() => setMode('signup')}>
            {copy.firstTime}
            <small>{copy.firstTimeHint}</small>
          </button>
        </div>
        <p className="footer-note">
          Support :{' '}
          <a className="support" href="mailto:sonique@contact.co">
            sonique@contact.co
          </a>
        </p>
      </section>
    )
  }

  if (mode === 'login') {
    return (
      <section className="slide slide-left">
        <span className="eyebrow">{copy.loginEyebrow}</span>
        <h1>{copy.welcomeBack}</h1>
        <p className="lead">{copy.loginLead}</p>
        <form className="stack" onSubmit={submitLogin}>
          <label className="field">
            <span>{copy.email}</span>
            <input
              type="email"
              autoComplete="email"
              value={loginEmail}
              onChange={(e) => {
                setLoginEmail(e.target.value)
                setLoginError('')
              }}
              required
            />
          </label>
          {loginError ? (
            <p className="lead" style={{ color: 'var(--warn)', margin: 0 }}>
              {loginError}
            </p>
          ) : null}
          <div className="actions">
            <button type="button" className="btn btn-ghost" onClick={() => setMode('choose')}>
              {copy.back}
            </button>
            <button type="submit" className="btn btn-primary" disabled={!loginEmail.trim()}>
              {copy.continue}
            </button>
          </div>
        </form>
        <button
          type="button"
          className="linkish"
          style={{ marginTop: '1rem' }}
          onClick={() => setMode('signup')}
        >
          {copy.createAccountLink}
        </button>
      </section>
    )
  }

  return (
    <section className="slide slide-left">
      <span className="eyebrow">{copy.signupEyebrow}</span>
      <h1>{copy.createSpace}</h1>
      <p className="lead">{copy.signupLead}</p>
      <form className="stack" onSubmit={submitSignup}>
        <label className="field">
          <span>{copy.firstName}</span>
          <input
            type="text"
            autoComplete="given-name"
            value={profile.firstName}
            onChange={(e) => onChange('firstName', e.target.value)}
            required
          />
        </label>
        <label className="field">
          <span>{copy.email}</span>
          <input
            type="email"
            autoComplete="email"
            value={profile.email}
            onChange={(e) => onChange('email', e.target.value)}
            required
          />
        </label>
        <label className="field">
          <span>
            {copy.lastName} <em className="optional-tag">{copy.optional}</em>
          </span>
          <input
            type="text"
            autoComplete="family-name"
            value={profile.lastName}
            onChange={(e) => onChange('lastName', e.target.value)}
          />
        </label>
        <label className="field">
          <span>
            {copy.phoneOptional} <em className="optional-tag">{copy.optional}</em>
          </span>
          <input
            type="tel"
            autoComplete="tel"
            placeholder="+1…"
            value={profile.phone}
            onChange={(e) => onChange('phone', e.target.value)}
          />
        </label>
        <div className="actions">
          <button type="button" className="btn btn-ghost" onClick={() => setMode('choose')}>
            {copy.back}
          </button>
          <button type="submit" className="btn btn-primary" disabled={!signupValid}>
            {copy.continue}
          </button>
        </div>
      </form>
      <p className="footer-note">
        Support :{' '}
        <a className="support" href="mailto:sonique@contact.co">
          sonique@contact.co
        </a>
      </p>
    </section>
  )
}

function PieceSetupClassic({
  pieceName,
  hasPartition,
  partitionName,
  partitionPreview,
  partitionMime,
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
  onPieceName: (v: string) => void
  onToggleNoPartition: (checked: boolean) => void
  onUpload: (file: File | null) => void
  onNext: () => void
}) {
  const noPartition = hasPartition === false
  const canContinue =
    pieceName.trim().length > 0 && (noPartition || Boolean(partitionName))

  const copy = t()

  return (
    <section className="slide slide-left">
      <span className="eyebrow">{copy.stepPiece}</span>
      <h1>{copy.classicTitle}</h1>
      <p className="lead">{copy.classicLead}</p>

      <div className="stack">
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
            accept="image/*,.pdf"
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

function PieceSetupYC({
  selectedPresetId,
  onSelectPreset,
  onNext,
}: {
  selectedPresetId: string | null
  onSelectPreset: (id: string) => void
  onNext: () => void
}) {
  const canContinue = Boolean(selectedPresetId)
  const copy = t()

  return (
    <section className="slide slide-left">
      <span className="eyebrow">{copy.stepPiece}</span>
      <h1>{copy.choosePiece}</h1>
      <p className="lead">{copy.chooseLead}</p>

      <div className="preset-grid" role="list">
        {DEMO_PIECES.map((p) => {
          const active = selectedPresetId === p.id
          return (
            <div key={p.id} className={`preset-card-wrap ${active ? 'active' : ''}`} role="listitem">
              <button
                type="button"
                className={`preset-card ${active ? 'active' : ''}`}
                onClick={() => onSelectPreset(p.id)}
              >
                <strong>{p.title}</strong>
                <span>{pieceBlurb(p)}</span>
              </button>
              <button
                type="button"
                className="btn-download-score"
                onClick={(e) => {
                  e.stopPropagation()
                  downloadScoreFile(p.partitionSrc, p.title)
                }}
              >
                {copy.downloadScore}
              </button>
            </div>
          )
        })}
      </div>

      <div className="actions">
        <button type="button" className="btn btn-primary" disabled={!canContinue} onClick={onNext}>
          {copy.continue}
        </button>
      </div>
      <FooterLine withPartition />
    </section>
  )
}

function HowItWorks({ firstName, onNext }: { firstName: string; onNext: () => void }) {
  const copy = t()
  const name = firstName || copy.you
  return (
    <section className="slide slide-left">
      <span className="eyebrow">{copy.withScore}</span>
      <h1>
        {copy.howTitle}, {name} ?
      </h1>
      <p className="lead">{copy.howLead}</p>
      <ol className="steps">
        <li>
          <span className="step-num">1</span>
          <div>
            <strong>{copy.howStep1Title}</strong>
            <p>{copy.howStep1Body}</p>
          </div>
        </li>
        <li>
          <span className="step-num">2</span>
          <div>
            <strong>{copy.howStep2Title}</strong>
            <p>{copy.howStep2Body}</p>
          </div>
        </li>
        <li>
          <span className="step-num">3</span>
          <div>
            <strong>{copy.howStep3Title}</strong>
            <p>{copy.howStep3Body}</p>
          </div>
        </li>
        <li>
          <span className="step-num">4</span>
          <div>
            <strong>{copy.howStep4Title}</strong>
            <p>{copy.howStep4Body}</p>
          </div>
        </li>
        <li>
          <span className="step-num">5</span>
          <div>
            <strong>{copy.howStep5Title}</strong>
            <p>{copy.howStep5Body}</p>
          </div>
        </li>
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
          <span style={{ color: 'var(--rec)', marginRight: '0.45rem' }}>●</span>
          {copy.startRecording}
        </button>
      </div>
      <FooterLine />
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
  onNext: () => void
}) {
  const [active, setActive] = useState(true)
  const [refPlaying, setRefPlaying] = useState(false)
  const [refProgress, setRefProgress] = useState<number | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const cue = useAriaCues(active, 'practice', pieceId)
  const { energy, denied } = usePlayEnergy(active && !refPlaying)
  const peekSec = Math.max(6, practicePeekSec ?? 12)

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
        <p className="lead play-lead">{refPlaying ? copy.refPlaying : copy.yourTurnLead}</p>
        <p className="footer-note" style={{ paddingTop: 0 }}>
          {copy.practiceNote}
        </p>
        <div className="meta-row">
          <span>{pieceName}</span>
          {refPlaying ? <span className="ref-pill">{copy.refOn}</span> : null}
        </div>
      </div>
      <div className="stage stage-score">
        <PartitionViewer
          src={partitionPreview}
          mime={partitionMime}
          name={partitionName}
          autoScroll={active}
          energy={refPlaying ? 0 : energy}
          scrollProgress={refPlaying ? refProgress : null}
          scrollCapRatio={scrollCapRatio ?? 1}
        />
        {cue ? <div className={`cue-bubble ${cue.tone}`}>{cue.text}</div> : null}
      </div>
      {denied && !refPlaying ? (
        <p className="footer-note" style={{ paddingTop: '0.75rem' }}>
          {copy.micDeniedPractice}
        </p>
      ) : null}
      <div className="actions play-actions">
        {partitionPreview ? (
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => downloadScoreFile(partitionPreview, pieceName)}
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
      <FooterLine withPartition />
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
  onFinish: (audioBlob: Blob | null, meta?: Omit<PerformanceMeta, 'features'>) => void
}) {
  const copy = t()
  const { status, seconds, errorMessage, start, stop } = useMediaRecorder()
  const micRecording = status === 'recording'
  const [demoPlaying, setDemoPlaying] = useState(false)
  const [demoSeconds, setDemoSeconds] = useState(0)
  const [scrollProgress, setScrollProgress] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const recording = demoSync ? demoPlaying : micRecording
  const cue = useAriaCues(recording, 'record', pieceId)
  const { energy } = usePlayEnergy(!demoSync && micRecording)

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
              {copy.takeOf} {takesUsed + 1}/{MAX_TAKES}
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
                {copy.takeOf} {takesUsed + 1}/{MAX_TAKES}
              </span>
            </p>
            <p className="lead perf-ready-lead">
              {demoSync
                ? copy.perfLead
                : hasPartition
                  ? copy.perfLeadMic
                  : copy.perfLeadEar}
            </p>
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
  useEffect(() => {
    if (!ready) return
    const id = window.setTimeout(onDone, 900)
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
  const exhausted = feedback.takesLeft <= 0
  const copy = t()
  const strengths = (feedback.strengths || []).slice(0, 3)
  const weaknesses = (feedback.weaknesses || []).slice(0, 3)
  const improvements = (feedback.improvements || []).slice(0, 3)

  return (
    <section className="slide">
      <span className="eyebrow">{copy.reportEyebrow}</span>
      <h1>{feedback.headline}</h1>
      <div className="takes-pill">
        {copy.takesLeft} : {feedback.takesLeft}/{MAX_TAKES}
      </div>

      <div className="report-card report-card-compact">
        <p className="report-greeting">{feedback.greeting}</p>
        {strengths.length > 0 ? (
          <div className="report-block">
            <h3>{copy.strengths}</h3>
            <ul>
              {strengths.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </div>
        ) : null}
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
          <div className="report-block">
            <h3>{copy.nextFocus}</h3>
            <p>{feedback.nextFocus}</p>
          </div>
        ) : null}
      </div>

      <div className="actions">
        {!exhausted ? (
          <button type="button" className="btn btn-gold" onClick={onReplay}>
            {copy.replayPiece}
          </button>
        ) : (
          <button type="button" className="btn btn-gold" onClick={onNewPiece}>
            {copy.chooseOther}
          </button>
        )}
        <button type="button" className="btn btn-ghost" onClick={onOpenHistory}>
          {copy.viewSessions}
        </button>
      </div>
      {exhausted ? (
        <p className="footer-note">{copy.takesExhausted}</p>
      ) : (
        <FooterLine withPartition={state.hasPartition === true} />
      )}
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
  return `${copy.feedbackPrefix} — ${title}`
}

function HistoryView({
  email,
  onBack,
  onOpenFeedback,
}: {
  email: string
  onBack: () => void
  onOpenFeedback: (session: StoredSession) => void
}) {
  const sessions = listSessions(email)
  const [audioUrls, setAudioUrls] = useState<Record<string, string>>({})

  useEffect(() => {
    let cancelled = false
    const urls: Record<string, string> = {}
    ;(async () => {
      for (const s of sessions) {
        if (!s.hasAudio) continue
        const blob = await getRecordingBlob(s.id)
        if (blob && !cancelled) {
          urls[s.id] = URL.createObjectURL(blob)
        }
      }
      if (!cancelled) setAudioUrls(urls)
    })()
    return () => {
      cancelled = true
      Object.values(urls).forEach((u) => URL.revokeObjectURL(u))
    }
  }, [email])

  const copy = t()
  const dateLocale = getLocale() === 'en' ? 'en-US' : 'fr-FR'

  return (
    <section className="slide">
      <span className="eyebrow">{copy.historyEyebrow}</span>
      <h1>{copy.historyTitle}</h1>
      <p className="lead">{copy.historyLead}</p>
      {sessions.length === 0 ? (
        <p className="lead">{copy.noSessions}</p>
      ) : (
        <div className="history-list">
          {sessions.map((s) => (
            <article key={s.id} className="history-item">
              <h3>{s.pieceName}</h3>
              <div className="meta">
                {new Date(s.createdAt).toLocaleString(dateLocale)} · {copy.takeLabel}{' '}
                {s.takeNumber}
                {s.hasPartition ? ` · ${copy.withPartition}` : ` · ${copy.byEar}`}
              </div>
              <p className="lead" style={{ margin: 0 }}>
                {formatSessionHeadline(s.feedbackHeadline, s.pieceName)}
              </p>
              {audioUrls[s.id] ? <audio controls src={audioUrls[s.id]} /> : null}
              <div className="actions" style={{ marginTop: '0.85rem' }}>
                <button type="button" className="btn btn-ghost" onClick={() => onOpenFeedback(s)}>
                  {copy.viewFeedback}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
      <div className="actions">
        <button type="button" className="btn btn-primary" onClick={onBack}>
          {copy.historyBack}
        </button>
      </div>
    </section>
  )
}

export default function App() {
  const [state, setState] = useState<AppState>(initialState)
  const [theme, setTheme] = useState<ThemeId>(() => {
    if (!SHOW_THEME_DOCK) return 'noir'
    const saved = localStorage.getItem('sonique-theme') as ThemeId | null
    return saved && THEMES.some((t) => t.id === saved) ? saved : 'noir'
  })
  const [showHistory, setShowHistory] = useState(false)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    document.documentElement.setAttribute('data-themes', SHOW_THEME_DOCK ? 'full' : 'noir')
    if (SHOW_THEME_DOCK) localStorage.setItem('sonique-theme', theme)
  }, [theme])

  useEffect(() => {
    const existing = getCurrentProfile()
    if (existing) {
      setState((s) => ({ ...s, profile: existing }))
    }
  }, [])

  const withPartition = state.hasPartition !== false
  const phase = phaseFromSlide(state.slide, state.hasPartition)

  const go = (slide: number) => setState((s) => ({ ...s, slide }))
  const patch = (partial: Partial<AppState>) => setState((s) => ({ ...s, ...partial }))

  const finishTake = (
    audioBlob: Blob | null,
    meta?: Omit<PerformanceMeta, 'features'>,
  ) => {
    const analyzeSlide = state.hasPartition === false ? 6 : 7
    setState((s) => ({ ...s, slide: analyzeSlide, isRecording: false, feedback: null }))
    void (async () => {
      const features = await extractAudioFeatures(audioBlob)
      setState((s) => {
        const takesUsed = s.takesUsed + 1
        const fullMeta: PerformanceMeta = {
          playedSec: meta?.playedSec ?? 0,
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
          takesUsed,
          maxTakes: MAX_TAKES,
          meta: fullMeta,
        })
        const saved = saveSession({
          email: s.profile.email,
          pieceName: s.pieceName,
          hasPartition: s.hasPartition === true,
          feedbackHeadline: feedback.headline,
          takeNumber: takesUsed,
          feedback,
          hasAudio: Boolean(audioBlob),
        })
        if (audioBlob) {
          void saveRecordingBlob(saved.id, audioBlob)
        }
        return { ...s, takesUsed, feedback }
      })
    })()
  }

  const afterAnalyze = useCallback(() => {
    setState((s) => ({ ...s, slide: s.hasPartition === false ? 7 : 8 }))
  }, [])

  const replay = () => {
    setState((s) => ({
      ...s,
      slide: s.hasPartition === false ? 5 : 6,
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

  const onSelectPreset = (id: string) => {
    const piece = DEMO_PIECES.find((p) => p.id === id)
    if (!piece) return
    setState((s) => {
      revokeIfBlob(s.partitionPreview)
      return {
        ...s,
        pieceName: piece.title,
        partitionName: `${piece.title}`,
        partitionPreview: piece.partitionSrc,
        partitionMime: piece.mime,
        selectedPresetId: piece.id,
        // Peek source only (short cue) — full track reserved for performance
        previewAudio: piece.audioSrc ?? piece.performanceAudioSrc ?? null,
        performanceAudio: piece.performanceAudioSrc ?? piece.audioSrc ?? null,
        practicePeekSec: piece.practicePeekSec ?? 12,
        scrollCapRatio: piece.scrollCapRatio ?? null,
        repeatEverySec: piece.repeatEverySec ?? null,
        scrollDurationSec: piece.scrollDurationSec ?? null,
        scrollKeyframes: piece.scrollKeyframes ?? null,
        hasPartition: true,
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
      return {
        ...s,
        pieceName: s.pieceName || file.name.replace(/\.[^.]+$/, ''),
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

  let body: ReactNode = null

  if (showHistory) {
    body = (
      <HistoryView
        email={state.profile.email}
        onBack={() => setShowHistory(false)}
        onOpenFeedback={(session) => {
          if (session.feedback) {
            const feedback = {
              ...session.feedback,
              headline: formatSessionHeadline(session.feedback.headline, session.pieceName),
            }
            setState((s) => ({
              ...s,
              feedback,
              slide: s.hasPartition === false ? 7 : 8,
            }))
          }
          setShowHistory(false)
        }}
      />
    )
  } else if (state.slide === 1)
    body = (
      <Welcome
        onNext={() => go(2)}
      />
    )
  else if (state.slide === 2) {
    body = (
      <AuthSlide
        profile={state.profile}
        onChange={(key, value) =>
          setState((s) => ({ ...s, profile: { ...s.profile, [key]: value } }))
        }
        onProfileLoaded={(profile) => setState((s) => ({ ...s, profile }))}
        onNext={() => go(3)}
      />
    )
  } else if (state.slide === 3) {
    body = IS_YC_FLOW ? (
      <PieceSetupYC
        selectedPresetId={state.selectedPresetId}
        onSelectPreset={onSelectPreset}
        onNext={() => go(4)}
      />
    ) : (
      <PieceSetupClassic
        pieceName={state.pieceName}
        hasPartition={state.hasPartition}
        partitionName={state.partitionName}
        partitionPreview={state.partitionPreview}
        partitionMime={state.partitionMime}
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
            }
          })
        }
        onUpload={onUpload}
        onNext={() => go(4)}
      />
    )
  } else if (state.slide === 4 && withPartition) {
    body = <HowItWorks firstName={state.profile.firstName} onNext={() => go(5)} />
  } else if (state.slide === 4 && !withPartition) {
    body = (
      <NoPartitionQuestions
        arrangement={state.arrangement}
        onSelect={(arrangement) => patch({ arrangement })}
        onNext={() => go(5)}
      />
    )
  } else if (state.slide === 5 && withPartition) {
    body = (
      <PracticeStage
        pieceName={state.pieceName}
        pieceId={state.selectedPresetId}
        partitionPreview={state.partitionPreview}
        partitionMime={state.partitionMime}
        partitionName={state.partitionName}
        previewAudio={state.previewAudio}
        practicePeekSec={state.practicePeekSec}
        scrollCapRatio={state.scrollCapRatio ?? undefined}
        repeatEverySec={state.repeatEverySec ?? undefined}
        scrollKeyframes={state.scrollKeyframes}
        onNext={() => go(6)}
      />
    )
  } else if (state.slide === 5 && !withPartition) {
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
        onFinish={finishTake}
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
        demoSync={IS_YC_FLOW}
        onFinish={finishTake}
      />
    )
  } else if (state.slide === 6 && !withPartition) {
    body = (
      <Analyzing
        firstName={state.profile.firstName}
        ready={Boolean(state.feedback)}
        onDone={afterAnalyze}
      />
    )
  } else if (state.slide === 7 && withPartition) {
    body = (
      <Analyzing
        firstName={state.profile.firstName}
        ready={Boolean(state.feedback)}
        onDone={afterAnalyze}
      />
    )
  } else if (state.slide === 7 && !withPartition) {
    body = <Report state={state} onReplay={replay} onNewPiece={newPiece} onOpenHistory={() => setShowHistory(true)} />
  } else if (state.slide === 8 && withPartition) {
    body = <Report state={state} onReplay={replay} onNewPiece={newPiece} onOpenHistory={() => setShowHistory(true)} />
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <button
          type="button"
          className="brand-mark"
          onClick={() => {
            setShowHistory(false)
            // Ne pas renvoyer à l’accueil après connexion (bug ressenti slide 2→1)
            if (state.profile.email.trim()) go(3)
            else go(1)
          }}
          aria-label={state.profile.email.trim() ? t().backToPiece : t().backHome}
        >
          Sonique
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {state.profile.email ? (
            <button type="button" className="top-link" onClick={() => setShowHistory(true)}>
              {t().sessions}
            </button>
          ) : null}
          {!showHistory && state.slide > 1 ? <PhaseNav phase={phase} /> : null}
        </div>
      </header>
      {body}
      {SHOW_THEME_DOCK ? <ThemeDock theme={theme} onChange={setTheme} /> : null}
    </div>
  )
}
