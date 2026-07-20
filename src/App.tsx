import {
  useCallback,
  useEffect,
  useState,
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
} from 'react'
import { analyzePerformance, useAriaCues } from './lib/aria'
import { formatTime, useMediaRecorder } from './lib/recorder'
import {
  downloadUserData,
  findProfileByEmail,
  getCurrentProfile,
  saveProfile,
  saveSession,
} from './lib/storage'
import {
  MAX_TAKES,
  initialState,
  type ArrangementKind,
  type AppState,
  type UserProfile,
} from './types'

type ThemeId = 'noir' | 'noir-rose' | 'poussin' | 'acrylique' | 'rose' | 'turquoise' | 'arabesque'

const THEMES: { id: ThemeId; label: string }[] = [
  { id: 'noir', label: 'Noir or' },
  { id: 'noir-rose', label: 'Noir rose' },
  { id: 'poussin', label: 'Poussin' },
  { id: 'acrylique', label: 'Acrylique' },
  { id: 'rose', label: 'Rose' },
  { id: 'turquoise', label: 'Turquoise' },
  { id: 'arabesque', label: 'Arabesque' },
]

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
    <section className="slide">
      <span className="eyebrow">Prêt·e à jouer</span>
      <p className="hero-brand">Sonique</p>
      <p className="hero-tagline">
        Chante ou joue — Sonique t’écoute. Un enregistrement, un retour honnête, jamais générique.
      </p>
      <div className="actions">
        <button type="button" className="btn btn-primary" onClick={onNext}>
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

  const signupValid =
    profile.firstName.trim() &&
    profile.lastName.trim() &&
    profile.email.trim() &&
    profile.phone.trim()

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
        <p className="lead">Comme ça, tu n'as pas à retaper toutes tes infos si tu reviens.</p>
        <div className="choice-grid" style={{ marginInline: 'auto' }}>
          <button type="button" className="choice" onClick={() => setMode('login')}>
            Connexion
            <small>J'ai déjà un compte — email suffisant pour retrouver mon profil.</small>
          </button>
          <button type="button" className="choice" onClick={() => setMode('signup')}>
            C'est ma première fois
            <small>Je crée mon espace : prénom, nom, téléphone, email.</small>
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
        Ces infos restent sur ton appareil (exportables). Support :{' '}
        <a className="support" href="mailto:sonique@contact.co">
          sonique@contact.co
        </a>
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
          <span>Nom</span>
          <input
            type="text"
            autoComplete="family-name"
            value={profile.lastName}
            onChange={(e) => onChange('lastName', e.target.value)}
            required
          />
        </label>
        <label className="field">
          <span>Téléphone (indicatif FR / étranger)</span>
          <input
            type="tel"
            autoComplete="tel"
            placeholder="+33…"
            value={profile.phone}
            onChange={(e) => onChange('phone', e.target.value)}
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
        <div className="actions">
          <button type="button" className="btn btn-ghost" onClick={() => setMode('choose')}>
            Retour
          </button>
          <button type="submit" className="btn btn-primary" disabled={!signupValid}>
            Continuer
          </button>
        </div>
      </form>
    </section>
  )
}

function PieceSetup({
  pieceName,
  hasPartition,
  partitionName,
  onPieceName,
  onToggleNoPartition,
  onUpload,
  onNext,
}: {
  pieceName: string
  hasPartition: boolean | null
  partitionName: string
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
        Aria te guide pas à pas avant l’enregistrement — pour corriger sans te juger.
      </p>
      <ol className="steps">
        <li>
          <span className="step-num">1</span>
          <div>
            <strong>Choisis le passage travaillé</strong>
            <p>Aria ne traite pas toute la partition d’un coup.</p>
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
            <strong>Aria corrige en live</strong>
            <p>Fausse note, rythme… elle te le dit pendant que tu joues.</p>
          </div>
        </li>
        <li>
          <span className="step-num">4</span>
          <div>
            <strong>Enregistre une trace</strong>
            <p>Pour garder ce que tu as fait aujourd’hui.</p>
          </div>
        </li>
        <li>
          <span className="step-num">5</span>
          <div>
            <strong>Reçois le compte rendu</strong>
            <p>Max 3 takes par morceau, pour digérer le feedback.</p>
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
      <h1>Aide Aria à t’écouter</h1>
      <p className="lead">
        Dis-lui si tu joues un arrangement ou la version originale — pour un retour plus juste.
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
  onNext,
}: {
  pieceName: string
  partitionPreview: string | null
  onNext: () => void
}) {
  const [active, setActive] = useState(true)
  const cue = useAriaCues(active, 'practice')

  return (
    <section className="slide">
      <span className="eyebrow">Étape 2 · Entraînement</span>
      <h1>Joue sans te soucier de l’app</h1>
      <p className="lead">Partition qui défile. Aria chuchote — aucun enregistrement ici.</p>
      <div className="meta-row">
        <span>{pieceName}</span>
      </div>
      <div className="stage">
        {partitionPreview ? (
          <img className="partition-preview" src={partitionPreview} alt="Partition" />
        ) : (
          <div className="sheet-scroll">
            <div className="sheet-scroll-inner">
              <div className="sheet-lines">
                {Array.from({ length: 10 }, (_, i) => (
                  <div className="staff" key={i} />
                ))}
              </div>
            </div>
          </div>
        )}
        {cue ? <div className={`cue-bubble ${cue.tone}`}>{cue.text}</div> : null}
      </div>
      <div className="actions">
        <button type="button" className="btn btn-ghost" onClick={() => setActive((v) => !v)}>
          {active ? 'Mettre Aria en pause' : 'Réactiver Aria'}
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
  hasPartition,
  takesUsed,
  onFinish,
}: {
  pieceName: string
  partitionPreview: string | null
  hasPartition: boolean
  takesUsed: number
  onFinish: () => void
}) {
  const { status, seconds, start, stop } = useMediaRecorder()
  const recording = status === 'recording'
  const cue = useAriaCues(recording, 'record')
  const takesLeft = MAX_TAKES - takesUsed

  const toggle = async () => {
    if (recording) {
      stop()
      onFinish()
      return
    }
    await start()
  }

  return (
    <section className="slide">
      <span className="eyebrow">Étape 2 · Jouer</span>
      {recording ? (
        <>
          <div className="listen-status">
            <span className="rec-dot" />
            En écoute — vas-y tranquillement
          </div>
          <div className={`dot-wave live`} aria-hidden>
            {Array.from({ length: 24 }, (_, i) => (
              <span key={i} />
            ))}
          </div>
          <p className="timer">{formatTime(seconds)}</p>
          {hasPartition && partitionPreview ? (
            <div className="stage" style={{ marginTop: '1.25rem', minHeight: 160 }}>
              <img
                className="partition-preview"
                style={{ height: 160 }}
                src={partitionPreview}
                alt="Partition"
              />
              {cue ? <div className={`cue-bubble good`}>{cue.text}</div> : null}
            </div>
          ) : cue ? (
            <div className={`cue-bubble good`} style={{ position: 'relative', left: 'auto', transform: 'none', marginTop: '1rem' }}>
              {cue.text}
            </div>
          ) : null}
          <div className="actions">
            <button type="button" className="btn btn-primary" onClick={toggle}>
              Terminer et recevoir mon retour
            </button>
          </div>
        </>
      ) : (
        <>
          <h1>Prêt·e à jouer ?</h1>
          <p className="lead">
            {pieceName} · essais restants : {takesLeft}/{MAX_TAKES}
          </p>
          <p className="lead">
            {hasPartition
              ? 'Partition sous les yeux. Lance l’enregistrement quand tu es prêt·e.'
              : 'Aucune partition — Sonique écoutera à l’oreille.'}
          </p>
          <div className="actions">
            <button type="button" className="btn btn-primary" onClick={toggle}>
              <span style={{ color: 'var(--rec)', marginRight: '0.45rem' }}>●</span>
              Lancer l’enregistrement
            </button>
            <button type="button" className="btn btn-ghost" onClick={onFinish}>
              Simuler un take (démo)
            </button>
          </div>
          {status === 'denied' || status === 'unsupported' ? (
            <p className="footer-note" style={{ paddingTop: '1rem' }}>
              Micro indisponible — utilise « Simuler un take » pour la démo.
            </p>
          ) : (
            <p className="footer-note" style={{ paddingTop: '1rem' }}>
              Tu pourras arrêter quand tu veux.
            </p>
          )}
        </>
      )}
      <FooterLine withPartition={hasPartition} />
    </section>
  )
}

function Analyzing({ firstName, onDone }: { firstName: string; onDone: () => void }) {
  useEffect(() => {
    const id = window.setTimeout(onDone, 2800)
    return () => window.clearTimeout(id)
  }, [onDone])

  return (
    <section className="slide">
      <div className="analyze">
        <div className="aria-orb" aria-hidden />
        <h1>Aria écoute ta performance…</h1>
        <p className="lead" style={{ marginInline: 'auto' }}>
          {firstName}, Aria prend le temps de bien entendre avant de te répondre.
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
}: {
  state: AppState
  onReplay: () => void
  onNewPiece: () => void
}) {
  const feedback = state.feedback
  if (!feedback) return null
  const exhausted = feedback.takesLeft <= 0

  return (
    <section className="slide">
      <span className="eyebrow">Ton retour personnalisé</span>
      <h1>{feedback.headline}</h1>
      <div className="takes-pill">
        Takes restants : {feedback.takesLeft}/{MAX_TAKES}
      </div>

      <div className="report-card">
        <p>{feedback.greeting}</p>
        <div className="report-block">
          <h3>Vue d'ensemble</h3>
          <p>{feedback.overview}</p>
        </div>
        <div className="report-block">
          <h3>Atmosphère & intention</h3>
          <p>{feedback.atmosphere}</p>
        </div>
        <div className="report-block">
          <h3>Technique</h3>
          <p>{feedback.technique}</p>
        </div>
        <div className="report-block">
          <h3>Rythme & tempo</h3>
          <p>{feedback.rhythm}</p>
        </div>
        <div className="report-block">
          <h3>Ce qui fonctionne</h3>
          <ul>
            {feedback.strengths.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
        <div className="report-block">
          <h3>Axes d'amélioration</h3>
          <ul>
            {feedback.improvements.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
        <div className="report-block">
          <h3>Focus pour la suite</h3>
          <p>{feedback.nextFocus}</p>
        </div>
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
        <button type="button" className="btn btn-ghost" onClick={downloadUserData}>
          Exporter mes données
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

export default function App() {
  const [state, setState] = useState<AppState>(initialState)
  const [theme, setTheme] = useState<ThemeId>(() => {
    const saved = localStorage.getItem('sonique-theme') as ThemeId | null
    return saved && THEMES.some((t) => t.id === saved) ? saved : 'noir'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('sonique-theme', theme)
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

  const finishTake = () => {
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
      saveSession({
        email: s.profile.email,
        pieceName: s.pieceName,
        hasPartition: s.hasPartition === true,
        feedbackHeadline: feedback.headline,
        takeNumber: takesUsed,
      })
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
        return { ...s, partitionName: '', partitionPreview: null, hasPartition: null }
      }
      const preview = file.type.startsWith('image/') ? URL.createObjectURL(file) : null
      return {
        ...s,
        partitionName: file.name,
        partitionPreview: preview,
        hasPartition: true,
      }
    })
  }

  let body: ReactNode = null

  if (state.slide === 1) body = <Welcome onNext={() => go(2)} />
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
        onPieceName={(pieceName) => patch({ pieceName })}
        onToggleNoPartition={(checked) =>
          setState((s) => {
            if (checked && s.partitionPreview) URL.revokeObjectURL(s.partitionPreview)
            return {
              ...s,
              hasPartition: checked ? false : s.partitionName ? true : null,
              partitionName: checked ? '' : s.partitionName,
              partitionPreview: checked ? null : s.partitionPreview,
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
        onNext={() => go(6)}
      />
    )
  } else if (state.slide === 5 && !withPartition) {
    body = (
      <RecordStage
        pieceName={state.pieceName}
        partitionPreview={null}
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
    body = <Report state={state} onReplay={replay} onNewPiece={newPiece} />
  } else if (state.slide === 8 && withPartition) {
    body = <Report state={state} onReplay={replay} onNewPiece={newPiece} />
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-mark">Sonique</div>
        {state.slide > 1 ? <PhaseNav phase={phase} /> : <span />}
      </header>
      {body}
      <ThemeDock theme={theme} onChange={setTheme} />
    </div>
  )
}
