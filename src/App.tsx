import {
  useCallback,
  useEffect,
  useState,
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
} from 'react'
import { PartitionViewer } from './components/PartitionViewer'
import { analyzePerformance, useAriaCues } from './lib/aria'
import { usePlayEnergy } from './lib/playEnergy'
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
  const items: { id: Phase; n: number; label: string }[] = [
    { id: 'partition', n: 1, label: 'Partition' },
    { id: 'jouer', n: 2, label: 'Jouer' },
    { id: 'retour', n: 3, label: 'Retour' },
  ]
  const order: Phase[] = ['partition', 'jouer', 'retour']
  const current = order.indexOf(phase)

  return (
    <nav className="phase-nav" aria-label="Étapes">
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
  return (
    <p className="footer-note">
      {withPartition
        ? 'Sonique écoute ce que tu joues et le compare à ta partition — pour te faire progresser, jamais pour te juger.'
        : 'Sonique écoute ce que tu joues ou chantes — et te répond fidèlement.'}
    </p>
  )
}

function Welcome({ onNext }: { onNext: () => void }) {
  return (
    <section className="slide slide-welcome">
      <div className="welcome-core">
        <span className="eyebrow">Prêt·e à jouer</span>
        <p className="hero-brand">Sonique</p>
        <p className="hero-tagline">
          L’app qui te permet de jouer tes morceaux préférés.
        </p>
        <button type="button" className="btn btn-hero" onClick={onNext}>
          Commencer
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
      setLoginError(
        "Aucun compte trouvé avec cet email. Choisis « C'est ma première fois » pour t'inscrire.",
      )
      return
    }
    setLoginError('')
    onProfileLoaded(found)
    saveProfile(found)
    onNext()
  }

  if (mode === 'choose') {
    return (
      <section className="slide">
        <span className="eyebrow">Slide 2 · Accès</span>
        <h1>Tu as déjà un compte Sonique ?</h1>
        <p className="lead">Comme ça, tu n’as pas à tout retaper si tu reviens.</p>
        <div className="choice-grid" style={{ marginInline: 'auto' }}>
          <button type="button" className="choice" onClick={() => setMode('login')}>
            Connexion
            <small>J’ai déjà un compte — email suffisant.</small>
          </button>
          <button type="button" className="choice" onClick={() => setMode('signup')}>
            C’est ma première fois
            <small>Prénom + email. Le reste est facultatif.</small>
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
        <span className="eyebrow">Connexion</span>
        <h1>Bon retour</h1>
        <p className="lead">Entre l'email utilisé à l'inscription. On retrouve ton profil sur cet appareil.</p>
        <form className="stack" onSubmit={submitLogin}>
          <label className="field">
            <span>Email</span>
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
              Retour
            </button>
            <button type="submit" className="btn btn-primary" disabled={!loginEmail.trim()}>
              Continuer
            </button>
          </div>
        </form>
        <button
          type="button"
          className="linkish"
          style={{ marginTop: '1rem' }}
          onClick={() => setMode('signup')}
        >
          Première fois ? Créer un compte
        </button>
      </section>
    )
  }

  return (
    <section className="slide slide-left">
      <span className="eyebrow">Première fois</span>
      <h1>Crée ton espace Sonique</h1>
      <p className="lead">
        Seulement prénom et email sont requis. Le reste est facultatif — tout reste sur ton appareil.
      </p>
      <form className="stack" onSubmit={submitSignup}>
        <label className="field">
          <span>Prénom</span>
          <input
            type="text"
            autoComplete="given-name"
            value={profile.firstName}
            onChange={(e) => onChange('firstName', e.target.value)}
            required
          />
        </label>
        <label className="field">
          <span>Email</span>
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
            Nom <em className="optional-tag">facultatif</em>
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
            Téléphone <em className="optional-tag">facultatif</em>
          </span>
          <input
            type="tel"
            autoComplete="tel"
            placeholder="+33…"
            value={profile.phone}
            onChange={(e) => onChange('phone', e.target.value)}
          />
        </label>
        <div className="actions">
          <button type="button" className="btn btn-ghost" onClick={() => setMode('choose')}>
            Retour
          </button>
          <button type="submit" className="btn btn-primary" disabled={!signupValid}>
            Continuer
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

function PieceSetup({
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

  const onFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null
    onUpload(file)
  }

  return (
    <section className="slide slide-left">
      <span className="eyebrow">Étape 1 · Partition</span>
      <h1>Quel morceau vas-tu travailler ?</h1>
      <p className="lead">
        Dépose la partition que tu comptes jouer — ou continue sans. Sonique écoute pour te faire
        progresser, jamais pour te juger.
      </p>

      <div className="stack">
        <label className="field">
          <span>Nom du morceau</span>
          <input
            type="text"
            value={pieceName}
            onChange={(e) => onPieceName(e.target.value)}
            placeholder="Ex. Clair de Lune"
          />
        </label>

        <div className="upload" style={{ opacity: noPartition ? 0.4 : 1 }}>
          <div className="upload-icon" aria-hidden>
            ♫
          </div>
          <strong>Glisse ta partition ici, ou choisis un fichier</strong>
          <p className="lead" style={{ margin: 0 }}>
            Image (JPG, PNG) ou PDF — 8 Mo max
          </p>
          <input type="file" accept="image/*,.pdf" disabled={noPartition} onChange={onFile} />
          {partitionName && !noPartition ? (
            <p className="footer-note" style={{ margin: 0, paddingTop: 0 }}>
              Fichier : {partitionName}
            </p>
          ) : null}
        </div>

        {!noPartition && partitionPreview ? (
          <div className="stage partition-stage">
            <p className="partition-label">Aperçu de ta partition</p>
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
            <strong>Je n’ai pas de partition — continuer quand même</strong>
            <p className="lead" style={{ margin: '0.25rem 0 0' }}>
              Sonique écoutera à l’oreille.
            </p>
          </div>
        </label>
      </div>

      <div className="actions">
        <button type="button" className="btn btn-primary" disabled={!canContinue} onClick={onNext}>
          Continuer
        </button>
      </div>
      <FooterLine withPartition={!noPartition} />
    </section>
  )
}

function HowItWorks({ firstName, onNext }: { firstName: string; onNext: () => void }) {
  return (
    <section className="slide slide-left">
      <span className="eyebrow">Avec partition</span>
      <h1>Comment ça marche, {firstName || 'toi'} ?</h1>
      <p className="lead">
        Sur Sonique, Aria t’accompagne pas à pas avant l’enregistrement — pour corriger sans te juger.
      </p>
      <ol className="steps">
        <li>
          <span className="step-num">1</span>
          <div>
            <strong>Choisis le passage travaillé</strong>
            <p>On ne traite pas toute la partition d’un coup.</p>
          </div>
        </li>
        <li>
          <span className="step-num">2</span>
          <div>
            <strong>Entraîne-toi librement</strong>
            <p>Aussi longtemps que tu veux — sans enregistrer.</p>
          </div>
        </li>
        <li>
          <span className="step-num">3</span>
          <div>
            <strong>Aria chuchote en live</strong>
            <p>Fausse note, rythme… elle te le dit pendant que tu joues.</p>
          </div>
        </li>
        <li>
          <span className="step-num">4</span>
          <div>
            <strong>Enregistre une trace</strong>
            <p>Pour garder ce que tu as fait aujourd’hui sur Sonique.</p>
          </div>
        </li>
        <li>
          <span className="step-num">5</span>
          <div>
            <strong>Reçois ton retour</strong>
            <p>Max 3 essais par morceau, pour digérer ce qu’Aria t’a dit.</p>
          </div>
        </li>
      </ol>
      <div className="actions">
        <button type="button" className="btn btn-primary" onClick={onNext}>
          Passer à l’entraînement
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
  return (
    <section className="slide slide-left">
      <span className="eyebrow">Sans partition</span>
      <h1>Aide Sonique à t’écouter</h1>
      <p className="lead">
        Dis si tu joues un arrangement ou la version originale — pour qu’Aria te réponde plus juste.
      </p>
      <div className="choice-grid">
        <button
          type="button"
          className={`choice ${arrangement === 'original' ? 'active' : ''}`}
          onClick={() => onSelect('original')}
        >
          Version originale
          <small>Je vise la version connue / standard.</small>
        </button>
        <button
          type="button"
          className={`choice ${arrangement === 'arrangement' ? 'active' : ''}`}
          onClick={() => onSelect('arrangement')}
        >
          Arrangement
          <small>C’est une version adaptée / arrangée.</small>
        </button>
      </div>
      <div className="actions">
        <button type="button" className="btn btn-primary" disabled={!arrangement} onClick={onNext}>
          <span style={{ color: 'var(--rec)', marginRight: '0.45rem' }}>●</span>
          Lancer l’enregistrement
        </button>
      </div>
      <FooterLine />
    </section>
  )
}

function PracticeStage({
  pieceName,
  partitionPreview,
  partitionMime,
  partitionName,
  onNext,
}: {
  pieceName: string
  partitionPreview: string | null
  partitionMime: string | null
  partitionName: string
  onNext: () => void
}) {
  const [active, setActive] = useState(true)
  const cue = useAriaCues(active, 'practice')
  const { energy, denied } = usePlayEnergy(active)

  return (
    <section className="slide slide-play">
      <div className="play-header">
        <span className="eyebrow">Étape 2 · Entraînement</span>
        <h1>Joue sans te soucier de l’app</h1>
        <p className="lead play-lead">Partition large. Aria chuchote dans Sonique — aucun enregistrement ici.</p>
        <div className="meta-row">
          <span>{pieceName}</span>
        </div>
      </div>
      <div className="stage stage-score">
        <PartitionViewer
          src={partitionPreview}
          mime={partitionMime}
          name={partitionName}
          autoScroll={active}
          energy={energy}
        />
        {cue ? <div className={`cue-bubble ${cue.tone}`}>{cue.text}</div> : null}
      </div>
      {denied ? (
        <p className="footer-note" style={{ paddingTop: '0.75rem' }}>
          Micro refusé : la partition ne peut pas suivre ton jeu. Autorise le micro pour synchroniser.
        </p>
      ) : null}
      <div className="actions play-actions">
        <button type="button" className="btn btn-ghost" onClick={() => setActive((v) => !v)}>
          {active ? 'Couper les chuchotements' : 'Réactiver Aria'}
        </button>
        <button type="button" className="btn btn-primary" onClick={onNext}>
          Je suis prêt·e à enregistrer
        </button>
      </div>
      <FooterLine withPartition />
    </section>
  )
}

function RecordStage({
  pieceName,
  partitionPreview,
  partitionMime,
  partitionName,
  hasPartition,
  takesUsed,
  onFinish,
}: {
  pieceName: string
  partitionPreview: string | null
  partitionMime: string | null
  partitionName: string
  hasPartition: boolean
  takesUsed: number
  onFinish: (audioBlob: Blob | null) => void
}) {
  const { status, seconds, errorMessage, start, stop } = useMediaRecorder()
  const recording = status === 'recording'
  const cue = useAriaCues(recording, 'record')
  const { energy } = usePlayEnergy(recording)
  const takesLeft = MAX_TAKES - takesUsed
  const [busy, setBusy] = useState(false)

  const toggle = async () => {
    if (busy) return
    setBusy(true)
    try {
      if (recording) {
        const blob = await stop()
        onFinish(blob)
        return
      }
      const ok = await start()
      if (!ok) {
        // stay on screen with error message from hook
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="slide slide-play">
      <span className="eyebrow">Étape 2 · Jouer</span>
      {recording ? (
        <>
          <div className="play-rec-bar">
            <div className="listen-status">
              <span className="rec-dot" />
              En écoute — vas-y tranquillement
            </div>
            <p className="timer">{formatTime(seconds)}</p>
          </div>
          {hasPartition && partitionPreview ? (
            <div className="stage stage-score">
              <PartitionViewer
                src={partitionPreview}
                mime={partitionMime}
                name={partitionName}
                autoScroll={recording}
                energy={energy}
              />
              {cue ? <div className={`cue-bubble good`}>{cue.text}</div> : null}
            </div>
          ) : cue ? (
            <div
              className={`cue-bubble good`}
              style={{ position: 'relative', left: 'auto', transform: 'none', marginTop: '1rem' }}
            >
              {cue.text}
            </div>
          ) : null}
          <div className="actions play-actions">
            <button type="button" className="btn btn-hero" onClick={toggle} disabled={busy}>
              Terminer et recevoir mon retour
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="welcome-core">
            <h1>Prêt·e à jouer ?</h1>
            <p className="lead">
              {pieceName} · essais restants : {takesLeft}/{MAX_TAKES}
            </p>
            <p className="lead">
              {hasPartition
                ? 'Partition sous les yeux. Lance l’enregistrement quand tu es prêt·e.'
                : 'Aucune partition — Aria écoute à l’oreille.'}
            </p>
            <div className="actions play-actions">
              <button type="button" className="btn btn-hero" onClick={toggle} disabled={busy}>
                <span style={{ color: 'var(--rec)', marginRight: '0.45rem' }}>●</span>
                Lancer l’enregistrement
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => onFinish(null)}>
                Continuer sans micro (démo)
              </button>
            </div>
            {errorMessage ? (
              <p className="footer-note" style={{ paddingTop: '1rem', color: 'var(--warn)' }}>
                {errorMessage}
              </p>
            ) : (
              <p className="footer-note" style={{ paddingTop: '1rem' }}>
                Autorise le micro si ton navigateur le demande — tu pourras arrêter quand tu veux.
              </p>
            )}
          </div>
        </>
      )}
      <FooterLine withPartition={hasPartition} />
    </section>
  )
}

function Analyzing({ firstName, onDone }: { firstName: string; onDone: () => void }) {
  useEffect(() => {
    const id = window.setTimeout(onDone, 1800)
    return () => window.clearTimeout(id)
  }, [onDone])

  return (
    <section className="slide">
      <div className="analyze">
        <div className="aria-orb" aria-hidden />
        <h1>Aria écoute…</h1>
        <p className="lead" style={{ marginInline: 'auto' }}>
          {firstName ? `${firstName}, un instant.` : 'Un instant.'}
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
  const strengths = (feedback.strengths || []).slice(0, 3)
  const weaknesses = (feedback.weaknesses || []).slice(0, 3)
  const improvements = (feedback.improvements || []).slice(0, 3)

  return (
    <section className="slide">
      <span className="eyebrow">Retour Aria</span>
      <h1>{feedback.headline}</h1>
      <div className="takes-pill">
        Essais restants : {feedback.takesLeft}/{MAX_TAKES}
      </div>

      <div className="report-card report-card-compact">
        <p className="report-greeting">{feedback.greeting}</p>
        {strengths.length > 0 ? (
          <div className="report-block">
            <h3>Points positifs</h3>
            <ul>
              {strengths.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </div>
        ) : null}
        {weaknesses.length > 0 ? (
          <div className="report-block">
            <h3>Points à corriger</h3>
            <ul>
              {weaknesses.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </div>
        ) : null}
        {improvements.length > 0 ? (
          <div className="report-block">
            <h3>Axes & pistes de travail</h3>
            <ul>
              {improvements.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </div>
        ) : null}
        {feedback.nextFocus ? (
          <div className="report-block">
            <h3>Consigne pour le prochain essai</h3>
            <p>{feedback.nextFocus}</p>
          </div>
        ) : null}
      </div>

      <div className="actions">
        {!exhausted ? (
          <button type="button" className="btn btn-gold" onClick={onReplay}>
            Rejouer le morceau
          </button>
        ) : (
          <button type="button" className="btn btn-gold" onClick={onNewPiece}>
            Choisir un autre morceau
          </button>
        )}
        <button type="button" className="btn btn-ghost" onClick={onOpenHistory}>
          Voir mes sessions
        </button>
      </div>
      {exhausted ? (
        <p className="footer-note">3 essais atteints — retour à la sélection du morceau.</p>
      ) : (
        <FooterLine withPartition={state.hasPartition === true} />
      )}
    </section>
  )
}


function formatSessionHeadline(headline: string, pieceName: string) {
  const cleaned = headline
    .replace(/^Compte\s*rendu\s*[—–-]\s*/i, '')
    .replace(/^Retour\s*[—–-]\s*/i, '')
    .replace(/\btakes?\b/gi, 'essai')
    .trim()
  const title = cleaned || pieceName
  return `Retour — ${title}`
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

  return (
    <section className="slide">
      <span className="eyebrow">Mon compte · Sessions</span>
      <h1>Historique de travail</h1>
      <p className="lead">
        Rejoue tes sessions et relis tes retours. Tout reste sur ton appareil (interne).
      </p>
      {sessions.length === 0 ? (
        <p className="lead">Aucune session enregistrée pour l’instant.</p>
      ) : (
        <div className="history-list">
          {sessions.map((s) => (
            <article key={s.id} className="history-item">
              <h3>{s.pieceName}</h3>
              <div className="meta">
                {new Date(s.createdAt).toLocaleString('fr-FR')} · Essai {s.takeNumber}
                {s.hasPartition ? ' · avec partition' : ' · à l’oreille'}
              </div>
              <p className="lead" style={{ margin: 0 }}>
                {formatSessionHeadline(s.feedbackHeadline, s.pieceName)}
              </p>
              {audioUrls[s.id] ? <audio controls src={audioUrls[s.id]} /> : null}
              <div className="actions" style={{ marginTop: '0.85rem' }}>
                <button type="button" className="btn btn-ghost" onClick={() => onOpenFeedback(s)}>
                  Voir le retour
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
      <div className="actions">
        <button type="button" className="btn btn-primary" onClick={onBack}>
          Retour
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

  const finishTake = (audioBlob: Blob | null) => {
    setState((s) => {
      const takesUsed = s.takesUsed + 1
      const feedback = analyzePerformance({
        pieceName: s.pieceName,
        hasPartition: s.hasPartition === true,
        firstName: s.profile.firstName,
        arrangement: s.arrangement,
        takesUsed,
        maxTakes: MAX_TAKES,
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
      const analyzeSlide = s.hasPartition === false ? 6 : 7
      return { ...s, takesUsed, feedback, slide: analyzeSlide, isRecording: false }
    })
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

  const newPiece = () => {
    setState((s) => {
      if (s.partitionPreview) URL.revokeObjectURL(s.partitionPreview)
      return {
        ...s,
        slide: 3,
        pieceName: '',
        partitionName: '',
        partitionPreview: null,
        partitionMime: null,
        hasPartition: null,
        arrangement: null,
        takesUsed: 0,
        feedback: null,
      }
    })
  }

  const onUpload = (file: File | null) => {
    setState((s) => {
      if (s.partitionPreview) URL.revokeObjectURL(s.partitionPreview)
      if (!file) {
        return {
          ...s,
          partitionName: '',
          partitionPreview: null,
          partitionMime: null,
          hasPartition: null,
        }
      }
      const preview = URL.createObjectURL(file)
      return {
        ...s,
        partitionName: file.name,
        partitionPreview: preview,
        partitionMime: file.type || (file.name.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/*'),
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
  } else if (state.slide === 1) body = <Welcome onNext={() => go(2)} />
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
    body = (
      <PieceSetup
        pieceName={state.pieceName}
        hasPartition={state.hasPartition}
        partitionName={state.partitionName}
        partitionPreview={state.partitionPreview}
        partitionMime={state.partitionMime}
        onPieceName={(pieceName) => patch({ pieceName })}
        onToggleNoPartition={(checked) =>
          setState((s) => {
            if (checked && s.partitionPreview) URL.revokeObjectURL(s.partitionPreview)
            return {
              ...s,
              hasPartition: checked ? false : s.partitionName ? true : null,
              partitionName: checked ? '' : s.partitionName,
              partitionPreview: checked ? null : s.partitionPreview,
              partitionMime: checked ? null : s.partitionMime,
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
        partitionPreview={state.partitionPreview}
        partitionMime={state.partitionMime}
        partitionName={state.partitionName}
        onNext={() => go(6)}
      />
    )
  } else if (state.slide === 5 && !withPartition) {
    body = (
      <RecordStage
        pieceName={state.pieceName}
        partitionPreview={null}
        partitionMime={null}
        partitionName=""
        hasPartition={false}
        takesUsed={state.takesUsed}
        onFinish={finishTake}
      />
    )
  } else if (state.slide === 6 && withPartition) {
    body = (
      <RecordStage
        pieceName={state.pieceName}
        partitionPreview={state.partitionPreview}
        partitionMime={state.partitionMime}
        partitionName={state.partitionName}
        hasPartition
        takesUsed={state.takesUsed}
        onFinish={finishTake}
      />
    )
  } else if (state.slide === 6 && !withPartition) {
    body = <Analyzing firstName={state.profile.firstName} onDone={afterAnalyze} />
  } else if (state.slide === 7 && withPartition) {
    body = <Analyzing firstName={state.profile.firstName} onDone={afterAnalyze} />
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
            go(1)
          }}
          aria-label="Retour à l’accueil Sonique"
        >
          Sonique
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {state.profile.email ? (
            <button type="button" className="top-link" onClick={() => setShowHistory(true)}>
              Mes sessions
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
