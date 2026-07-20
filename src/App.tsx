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
  MAX_TAKES,
  initialState,
  totalSlides,
  type ArrangementKind,
  type AppState,
} from './types'

function Progress({ slide, total }: { slide: number; total: number }) {
  return (
    <div className="progress" aria-label={`Étape ${slide} sur ${total}`}>
      {Array.from({ length: total }, (_, i) => {
        const n = i + 1
        const className = n === slide ? 'active' : n < slide ? 'done' : ''
        return <span key={n} className={className} />
      })}
    </div>
  )
}

function Welcome({ onNext }: { onNext: () => void }) {
  return (
    <section className="slide">
      <p className="hero-brand">Sonique</p>
      <p className="hero-tagline">L’app qui te permet de jouer tes morceaux préférés.</p>
      <div className="actions">
        <button type="button" className="btn btn-primary" onClick={onNext}>
          Commencer
        </button>
      </div>
    </section>
  )
}

function Signup({
  profile,
  onChange,
  onNext,
}: {
  profile: AppState['profile']
  onChange: (key: keyof AppState['profile'], value: string) => void
  onNext: () => void
}) {
  const valid =
    profile.firstName.trim() &&
    profile.lastName.trim() &&
    profile.email.trim() &&
    profile.phone.trim()

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (valid) onNext()
  }

  return (
    <section className="slide">
      <span className="eyebrow">Slide 2 · Connexion</span>
      <h1>Crée ton espace Sonique</h1>
      <p className="lead">
        Première inscription ou retour : mêmes champs. En cas de souci, écris à{' '}
        <a className="support" href="mailto:sonique@contact.co">
          sonique@contact.co
        </a>
        .
      </p>
      <form className="stack" onSubmit={submit}>
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
          <button type="submit" className="btn btn-primary" disabled={!valid}>
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
    <section className="slide">
      <span className="eyebrow">Slide 3 · Morceau</span>
      <h1>Quel morceau allez-vous jouer ?</h1>
      <p className="lead">Note le nom du morceau — pas une adresse.</p>

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

        <div className="upload" style={{ opacity: noPartition ? 0.45 : 1 }}>
          <strong>Upload ta partition</strong>
          <p className="lead" style={{ margin: 0 }}>
            PDF ou image. Optionnel si tu coches la case ci-dessous.
          </p>
          <input type="file" accept="image/*,.pdf" disabled={noPartition} onChange={onFile} />
          {partitionName && !noPartition ? (
            <p className="footer-note" style={{ margin: 0 }}>
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
            <strong>Je n’ai pas de partition</strong>
            <p className="lead" style={{ margin: '0.25rem 0 0' }}>
              Parcours plus direct : questions courtes, puis enregistrement.
            </p>
          </div>
        </label>
      </div>

      <div className="actions">
        <button type="button" className="btn btn-primary" disabled={!canContinue} onClick={onNext}>
          Continuer
        </button>
      </div>
    </section>
  )
}

function HowItWorks({ firstName, onNext }: { firstName: string; onNext: () => void }) {
  return (
    <section className="slide">
      <span className="eyebrow">Slide 4 · Avec partition</span>
      <h1>Comment ça marche, {firstName || 'toi'} ?</h1>
      <p className="lead">
        Une fois ta partition téléversée, <strong>Aria</strong> te guide pas à pas avant
        l’enregistrement.
      </p>
      <ol className="steps">
        <li>
          <span className="step-num">1</span>
          <div>
            <strong>Choisis le passage travaillé</strong>
            <p>Aria ne peut pas traiter toute la partition d’un coup de façon fiable.</p>
          </div>
        </li>
        <li>
          <span className="step-num">2</span>
          <div>
            <strong>Entraîne-toi librement</strong>
            <p>Aussi longtemps que tu veux — sans enregistrer, sans pression.</p>
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
            <strong>Passe en enregistrement</strong>
            <p>Pour laisser une trace du jour — pas pour tout apprendre d’un coup.</p>
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
    <section className="slide">
      <span className="eyebrow">Slide 4 · Sans partition</span>
      <h1>Aide Aria à t’écouter</h1>
      <p className="lead">
        Sans partition, Aria ne prétend pas tout savoir. Dis-lui si tu joues un arrangement ou
        la version originale.
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
          Enregistrer maintenant
        </button>
      </div>
      <p className="footer-note">
        Pas d’entraînement long ici : tu connais déjà ton morceau — on capture ta performance.
      </p>
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
      <span className="eyebrow">Slide 5 · Entraînement</span>
      <h1>Joue sans te soucier de l’app</h1>
      <p className="lead">
        Ta partition défile. Aria chuchote des consignes — aucun enregistrement ici.
      </p>
      <div className="meta-row">
        <span>{pieceName}</span>
        <span>Mode pratique</span>
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
    </section>
  )
}

function RecordStage({
  slideLabel,
  pieceName,
  partitionPreview,
  hasPartition,
  takesUsed,
  onFinish,
}: {
  slideLabel: string
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
    const ok = await start()
    if (!ok) {
      // Mic denied/unsupported: still allow demo finish via second click path
      return
    }
  }

  return (
    <section className="slide">
      <span className="eyebrow">{slideLabel}</span>
      <h1>{hasPartition ? 'Enregistre ta performance' : 'Capture ton morceau'}</h1>
      <p className="lead">
        {hasPartition
          ? 'Partition sous les yeux. Aria t’encourage pendant le take — ta voix de coach viendra plus tard.'
          : 'Sans partition, Aria reste humble : encouragements + lecture globale de ta perf.'}
      </p>
      <div className="meta-row">
        <span>{pieceName}</span>
        <span className="takes-pill">Essais restants avant ce take : {takesLeft}</span>
      </div>

      <div className={`record-orb ${recording ? 'live' : ''}`} aria-hidden>
        {recording ? formatTime(seconds) : 'REC'}
      </div>

      {hasPartition ? (
        <div className="stage" style={{ marginTop: '1.25rem' }}>
          {partitionPreview ? (
            <img className="partition-preview" src={partitionPreview} alt="Partition" />
          ) : (
            <div className="sheet-scroll">
              <div className="sheet-scroll-inner">
                <div className="sheet-lines">
                  {Array.from({ length: 8 }, (_, i) => (
                    <div className="staff" key={i} />
                  ))}
                </div>
              </div>
            </div>
          )}
          {cue ? <div className={`cue-bubble good`}>{cue.text}</div> : null}
        </div>
      ) : cue && recording ? (
        <div
          className="cue-bubble good"
          style={{ position: 'relative', left: 'auto', transform: 'none', margin: '1rem auto 0' }}
        >
          {cue.text}
        </div>
      ) : null}

      {status === 'denied' ? (
        <p className="footer-note">
          Micro refusé — utilise « Simuler un take » pour la démo du compte rendu.
        </p>
      ) : null}
      {status === 'unsupported' ? (
        <p className="footer-note">Enregistrement non supporté ici — le parcours démo continue.</p>
      ) : null}

      <div className="actions">
        <button
          type="button"
          className={`btn ${recording ? 'btn-danger' : 'btn-primary'}`}
          onClick={toggle}
        >
          {recording ? 'Terminer le take' : 'Démarrer l’enregistrement'}
        </button>
        {!recording ? (
          <button type="button" className="btn btn-ghost" onClick={onFinish}>
            Simuler un take (démo)
          </button>
        ) : null}
      </div>
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
        <span className="eyebrow">Aria travaille</span>
        <h1>Dans quelques instants…</h1>
        <div className="aria-ring" aria-hidden />
        <p className="lead" style={{ marginInline: 'auto' }}>
          {firstName}, Aria prépare le compte rendu de ta performance.
        </p>
      </div>
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
      <span className="eyebrow">Compte rendu</span>
      <h1>{feedback.headline}</h1>
      <p className="lead">{feedback.encouragement}</p>
      <div className="takes-pill">
        Takes restants sur ce morceau : {feedback.takesLeft}/{MAX_TAKES}
      </div>

      <div className="report">
        <div className="report-block">
          <h3>Ce qui fonctionne</h3>
          <ul>
            {feedback.strengths.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
        <div className="report-block">
          <h3>Axes d’amélioration</h3>
          <ul>
            {feedback.improvements.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="actions">
        {!exhausted ? (
          <button type="button" className="btn btn-primary" onClick={onReplay}>
            Rejouer le morceau
          </button>
        ) : (
          <button type="button" className="btn btn-primary" onClick={onNewPiece}>
            Choisir un autre morceau
          </button>
        )}
      </div>
      {exhausted ? (
        <p className="footer-note">
          3 essais atteints : la partition disparaît. Retour à la sélection du morceau.
        </p>
      ) : null}
    </section>
  )
}

export default function App() {
  const [state, setState] = useState<AppState>(initialState)

  const withPartition = state.hasPartition !== false
  const total = totalSlides(state.hasPartition)

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
      <Signup
        profile={state.profile}
        onChange={(key, value) =>
          setState((s) => ({ ...s, profile: { ...s.profile, [key]: value } }))
        }
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
        slideLabel="Slide 5 · Enregistrement"
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
        slideLabel="Slide 6 · Enregistrement"
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
        {state.slide > 1 ? <Progress slide={state.slide} total={total} /> : <span />}
      </header>
      {body}
    </div>
  )
}
