import type { ScrollKeyframe } from './audioFeatures'

export type Locale = 'fr' | 'en'

export type DemoPiece = {
  id: string
  title: string
  blurb: { fr: string; en: string }
  partitionSrc: string
  /** Court repère optionnel (entraînement) — pas la prise complète. */
  audioSrc?: string
  /** Audio joué pendant la performance démo (V2). */
  performanceAudioSrc?: string
  /** Secondes max du repère entraînement. */
  practicePeekSec?: number
  mime: string
  scrollCapRatio?: number
  repeatEverySec?: number
  scrollDurationSec?: number
  /** Courbe temps→scroll (0–1) pour caler le tempo perçu. */
  scrollKeyframes?: ScrollKeyframe[]
}

export const DEMO_PIECES: DemoPiece[] = [
  {
    id: 'elise',
    title: 'Lettre à Élise',
    blurb: {
      fr: 'Beethoven — le classique pour tous les âges',
      en: 'Beethoven — the classic piece for every age',
    },
    partitionSrc: './presets/lettre-a-elise.png',
    audioSrc: './presets/lettre-a-elise.mp3',
    performanceAudioSrc: './presets/lettre-a-elise.mp3',
    practicePeekSec: 12,
    mime: 'image/png',
    scrollCapRatio: 0.42,
    repeatEverySec: 18,
    scrollDurationSec: 38,
    scrollKeyframes: [
      { t: 0, p: 0 },
      { t: 0.25, p: 0.22 },
      { t: 0.55, p: 0.55 },
      { t: 0.85, p: 0.88 },
      { t: 1, p: 1 },
    ],
  },
  {
    id: 'clair',
    title: 'Clair de lune',
    blurb: {
      fr: 'Debussy — une ode à l’impressionnisme français',
      en: 'Debussy — an ode to French impressionism',
    },
    partitionSrc: './presets/clair-de-lune.jpg',
    performanceAudioSrc: './presets/clair-de-lune.mp3',
    practicePeekSec: 12,
    mime: 'image/jpeg',
    scrollCapRatio: 0.135,
    scrollDurationSec: 55,
    scrollKeyframes: [
      { t: 0, p: 0 },
      { t: 0.18, p: 0.12 },
      { t: 0.4, p: 0.36 },
      { t: 0.65, p: 0.62 },
      { t: 0.88, p: 0.88 },
      { t: 1, p: 1 },
    ],
  },
  {
    id: 'entertainer',
    title: 'The Entertainer',
    blurb: {
      fr: 'Scott Joplin — le classique américain que tout le monde connaît',
      en: 'Scott Joplin — the American classic everyone knows',
    },
    partitionSrc: './presets/the-entertainer.jpg',
    performanceAudioSrc: './presets/the-entertainer.mp3',
    practicePeekSec: 12,
    mime: 'image/jpeg',
    scrollCapRatio: 0.2,
    scrollDurationSec: 55,
    scrollKeyframes: [
      { t: 0, p: 0 },
      { t: 0.2, p: 0.2 },
      { t: 0.45, p: 0.45 },
      { t: 0.7, p: 0.72 },
      { t: 0.9, p: 0.92 },
      { t: 1, p: 1 },
    ],
  },
]

const FR = {
  // Nav / chrome
  phasePiece: 'Morceau',
  phasePlay: 'Jouer',
  phaseFeedback: 'Retour',
  sessions: 'Mes sessions',
  backToPiece: 'Retour au choix du morceau',
  backHome: 'Retour à l’accueil Sonique',
  footerWithScore:
    'Sonique écoute ce que tu joues et le compare à ta partition — pour te faire progresser, jamais pour te juger.',
  footerNoScore: 'Sonique écoute ce que tu joues au piano — et te répond fidèlement.',

  // Welcome
  readyToPlay: 'Prêt·e à jouer',
  heroTagline: 'L’app qui te permet de jouer tes morceaux préférés.',
  start: 'Commencer',

  // Auth
  accessEyebrow: 'Slide 2 · Accès',
  haveAccount: 'Tu as déjà un compte Sonique ?',
  haveAccountLead: 'Comme ça, tu n’as pas à tout retaper si tu reviens.',
  login: 'Connexion',
  loginHint: 'J’ai déjà un compte — email suffisant.',
  firstTime: 'Créer un compte',
  firstTimeHint: 'Première fois — seuls prénom et email sont obligatoires.',
  loginEyebrow: 'Connexion',
  welcomeBack: 'Bon retour',
  loginLead: "Entre l'email utilisé à l'inscription. On retrouve ton profil sur cet appareil.",
  email: 'Email',
  back: 'Retour',
  continue: 'Continuer',
  createAccountLink: 'Première fois ? Créer un compte',
  signupEyebrow: 'Première fois',
  createSpace: 'Crée ton espace Sonique',
  signupLead:
    'Seulement prénom et email sont requis. Le reste est facultatif — tout reste sur ton appareil.',
  firstName: 'Prénom',
  lastName: 'Nom',
  phoneOptional: 'Téléphone',
  optional: 'facultatif',
  createAndContinue: 'Créer et continuer',
  loginNotFound:
    "Aucun compte trouvé avec cet email. Choisis « C'est ma première fois » pour t'inscrire.",

  // Piece pick
  choosePiece: 'Choisis un morceau',
  chooseLead:
    'Choisis un titre prêt avec sa partition, ou importe la tienne — tu joueras avec à l’écran.',
  downloadScore: 'Télécharger la partition',
  orUploadOwn: 'Ou importe ta propre partition',
  backToPresets: 'Retour aux morceaux proposés',
  stepPiece: 'Étape 1 · Morceau',

  // How it works
  withScore: 'Avec partition',
  howTitle: 'Comment ça marche',
  howLead:
    'Sur Sonique, tu joues avec ta partition à l’écran. Aria t’accompagne avant l’enregistrement — pour corriger sans te juger.',
  howStep1Title: 'Choisis le passage travaillé',
  howStep1Body: 'On ne traite pas toute la partition d’un coup.',
  howStep2Title: 'Entraîne-toi avec ta partition',
  howStep2Body:
    'La partition reste à l’écran et suit ton jeu. Prends ton instrument — aussi longtemps que tu veux, sans enregistrer.',
  howStep3Title: 'Aria chuchote en live',
  howStep3Body: 'Tempo, rythme… elle te le dit pendant que tu joues.',
  howStep4Title: 'Enregistre une trace',
  howStep4Body: 'Quand tu es prêt·e, passe à l’enregistrement — partition syncée sur ta prise.',
  howStep5Title: 'Reçois ton retour',
  howStep5Body: 'Max 3 essais par morceau, pour digérer ce qu’Aria t’a dit.',
  goToPractice: 'Passer à l’entraînement',

  // No partition (legacy copy keys kept for type parity)
  noScoreEyebrow: 'Sans partition',
  noScoreTitle: 'Aide Sonique à t’écouter',
  noScoreLead:
    'Dis si tu joues un arrangement ou la version originale — pour qu’Aria te réponde plus juste.',
  originalVersion: 'Version originale',
  originalHint: 'Je vise la version connue / standard.',
  arrangement: 'Arrangement',
  arrangementHint: 'C’est une version adaptée / arrangée.',
  startRecording: 'Lancer l’enregistrement',

  // Classic setup
  classicTitle: 'Quel morceau vas-tu travailler ?',
  classicLead:
    'Importe ta partition pour jouer avec elle à l’écran — ou continue à l’oreille sans.',
  pieceNameLabel: 'Nom du morceau',
  pieceNamePlaceholder: 'Ex. Clair de Lune',
  dropScore: 'Glisse ta partition ici, ou choisis un fichier',
  uploadHint: 'Image / PDF — préfère un fichier sans page de couverture pour le défilement',
  fileLabel: 'Fichier',
  previewLabel: 'Aperçu de ta partition',
  noScoreContinue: 'Je n’ai pas de partition — continuer quand même',
  noScoreContinueHint: 'Aria écoutera à l’oreille.',
  noScoreStageTitle: 'Pas de partition à l’écran',
  noScoreStageBody: 'Tu joues à l’oreille — Aria chuchote. Rien n’est enregistré ici.',
  historyBack: 'Retour',

  // Practice
  training: 'Étape 2 · Entraînement',
  followRef: 'Repère court',
  yourTurn: 'Salle d’entraînement',
  refPlaying:
    'Repère court (quelques secondes) — juste pour te placer. Ce n’est pas ta prise.',
  yourTurnLead:
    'Joue avec ta partition à l’écran. Aria chuchote — rien n’est enregistré. Quand tu es prêt·e, tu passes à la performance.',
  practiceNote:
    'Ta partition suit ton jeu : silence = pause, tu joues = elle descend. La prise syncée = l’étape suivante.',
  practiceNoteNoScore:
    'Ici : entraînement — rien n’est enregistré. Quand tu es prêt·e, passe à ta prise.',
  refOn: 'Repère en cours',
  cutRef: 'Arrêter le repère',
  restartRef: 'Écouter 12s de repère',
  cutWhispers: 'Couper les chuchotements',
  reviveAria: 'Réactiver Aria',
  readyRecord: 'Je suis prêt·e — passer à la performance',
  accessReturning: 'Content de te revoir',
  accessReturningLead: 'Connecte-toi ou crée un espace — puis on choisit un morceau.',
  micDeniedPractice:
    'Micro refusé : la partition ne peut pas suivre ton jeu. Autorise le micro pour synchroniser.',
  scrollHintRef: 'Défilement calé sur la référence — reprise = retour en haut',
  scrollHintPlay: 'Défilement calé sur ton jeu — silence = pause, tu joues = la partition s’abaisse',

  // Performance
  stepPlay: 'Étape 2 · Jouer',
  performance: 'Ta performance',
  perfLead:
    'C’est ta prise : la musique joue, la partition avance avec toi. Différent de l’entraînement — Aria juge cette performance.',
  perfLeadMic:
    'C’est ta prise — pas le repère. Aria se base uniquement sur ce que tu joues maintenant.',
  perfLeadEar: 'C’est ta prise. Aria écoute à l’oreille ce que tu joues au piano.',
  startPerf: 'Lancer la performance',
  startMic: 'Lancer mon enregistrement',
  finishPerf: 'Terminer et recevoir mon retour',
  listening: 'En écoute — vas-y tranquillement',
  demoNote: 'Musique et partition calées sur le tempo — c’est la prise qu’Aria écoute.',
  continueWithoutMic: 'Continuer sans micro (démo)',
  micHint: 'Autorise le micro si ton navigateur le demande — tu pourras arrêter quand tu veux.',
  perfReadyEyebrow: 'Prêt·e ?',
  perfScoreLabel: 'Ta partition',
  takeOf: 'Essai',

  // Analyzing / report
  ariaListening: 'Aria écoute…',
  oneMoment: 'Un instant.',
  reportEyebrow: 'Retour Aria',
  takesLeft: 'Essais restants',
  strengths: 'Points positifs',
  weaknesses: 'Points à corriger',
  improvements: 'Axes & pistes de travail',
  nextFocus: 'Consigne pour le prochain essai',
  replayPiece: 'Rejouer le morceau',
  chooseOther: 'Choisir un autre morceau',
  viewSessions: 'Voir mes sessions',
  takesExhausted: '3 essais atteints — retour à la sélection du morceau.',

  // History
  historyEyebrow: 'Mon compte · Sessions',
  historyTitle: 'Historique de travail',
  historyLead: 'Rejoue tes sessions et relis tes retours. Tout reste sur ton appareil (interne).',
  noSessions: 'Aucune session enregistrée pour l’instant.',
  withPartition: 'avec partition',
  byEar: 'à l’oreille',
  takeLabel: 'Essai',
  viewFeedback: 'Voir le retour',
  feedbackPrefix: 'Retour',
  you: 'toi',
} as const

const EN: { [K in keyof typeof FR]: string } = {
  phasePiece: 'Piece',
  phasePlay: 'Play',
  phaseFeedback: 'Feedback',
  sessions: 'My sessions',
  backToPiece: 'Back to piece selection',
  backHome: 'Back to Sonique home',
  footerWithScore:
    'Sonique listens to what you play and compares it to your score — to help you improve, never to judge you.',
  footerNoScore: 'Sonique listens to what you play on the piano — and answers honestly.',

  readyToPlay: 'Ready to play',
  heroTagline: 'The app that lets you play your favorite pieces.',
  start: 'Get started',

  accessEyebrow: 'Step 2 · Access',
  haveAccount: 'Already have a Sonique account?',
  haveAccountLead: 'So you don’t have to type everything again when you come back.',
  login: 'Log in',
  loginHint: 'I already have an account — email is enough.',
  firstTime: 'Create an account',
  firstTimeHint: 'First time here — only first name and email are mandatory.',
  loginEyebrow: 'Log in',
  welcomeBack: 'Welcome back',
  loginLead: 'Enter the email you used to sign up. We find your profile on this device.',
  email: 'Email',
  back: 'Back',
  continue: 'Continue',
  createAccountLink: 'First time? Create an account',
  signupEyebrow: 'First time',
  createSpace: 'Create your Sonique space',
  signupLead: 'Only first name and email are required. The rest is optional — everything stays on your device.',
  firstName: 'First name',
  lastName: 'Last name',
  phoneOptional: 'Phone',
  optional: 'optional',
  createAndContinue: 'Create and continue',
  loginNotFound: 'No account found with that email. Choose “First time here” to sign up.',

  choosePiece: 'Choose a piece',
  chooseLead:
    'Pick a ready piece with its score on screen, or upload yours — you play with the score.',
  downloadScore: 'Download score',
  orUploadOwn: 'Or upload your own score',
  backToPresets: 'Back to suggested pieces',
  stepPiece: 'Step 1 · Piece',

  withScore: 'With score',
  howTitle: 'How it works',
  howLead:
    'On Sonique, you play with your score on screen. Aria guides you before recording — to correct without judging.',
  howStep1Title: 'Pick the passage you’re working on',
  howStep1Body: 'We don’t tackle the whole score at once.',
  howStep2Title: 'Practice with your score',
  howStep2Body:
    'Your score stays on screen and follows your playing. Pick up your instrument — as long as you want, nothing is recorded.',
  howStep3Title: 'Aria whispers live',
  howStep3Body: 'Tempo, rhythm… she flags it while you play.',
  howStep4Title: 'Record a take',
  howStep4Body: 'When you’re ready, move on to recording — score synced to your take.',
  howStep5Title: 'Get your feedback',
  howStep5Body: 'Max 3 takes per piece, so you can digest what Aria said.',
  goToPractice: 'Go to practice',

  noScoreEyebrow: 'No score',
  noScoreTitle: 'Help Sonique listen',
  noScoreLead: 'Tell us if you’re playing an arrangement or the original — so Aria answers more accurately.',
  originalVersion: 'Original version',
  originalHint: 'I’m aiming for the standard / known version.',
  arrangement: 'Arrangement',
  arrangementHint: 'This is an adapted / arranged version.',
  startRecording: 'Start recording',

  classicTitle: 'Which piece will you work on?',
  classicLead: 'Upload your score to play with it on screen — or continue by ear without one.',
  pieceNameLabel: 'Piece name',
  pieceNamePlaceholder: 'e.g. Clair de Lune',
  dropScore: 'Drop your score here, or choose a file',
  uploadHint: 'Image / PDF — prefer a file without a cover page for scrolling',
  fileLabel: 'File',
  previewLabel: 'Score preview',
  noScoreContinue: 'I don’t have a score — continue anyway',
  noScoreContinueHint: 'Aria will listen by ear.',
  noScoreStageTitle: 'No score on screen',
  noScoreStageBody: 'Practice freely by ear — Aria whispers. Nothing is recorded here.',
  historyBack: 'Back',

  training: 'Step 2 · Practice',
  followRef: 'Short cue',
  yourTurn: 'Practice room',
  refPlaying: 'Short cue (a few seconds) — just to get oriented. This is not your take.',
  yourTurnLead:
    'Play with your score on screen. Aria whispers — nothing is recorded. When you’re ready, move on to the performance.',
  practiceNote:
    'Your score follows your playing: silence = pause, you play = it moves down. Synced take = next step.',
  practiceNoteNoScore:
    'This is practice — nothing is recorded. When you’re ready, move on to your take.',
  refOn: 'Cue playing',
  cutRef: 'Stop cue',
  restartRef: 'Hear a 12s cue',
  cutWhispers: 'Mute whispers',
  reviveAria: 'Bring Aria back',
  readyRecord: "I'm ready — go to performance",
  accessReturning: 'Good to see you again',
  accessReturningLead: 'Log in or create a space — then we pick a piece.',
  micDeniedPractice:
    'Mic denied: the score can’t follow your playing. Allow the microphone to sync.',
  scrollHintRef: 'Scrolling locked to the reference — repeat = back to top',
  scrollHintPlay: 'Scrolling locked to your playing — silence = pause, you play = the score moves down',

  stepPlay: 'Step 2 · Play',
  performance: 'Your performance',
  perfLead: 'This is your take: music plays, the score moves with you. Different from practice — Aria reviews this performance.',
  perfLeadMic: 'This is your take — not the cue. Aria reviews only what you play now.',
  perfLeadEar: 'This is your take. Aria listens by ear to what you play on the piano.',
  startPerf: 'Start performance',
  startMic: 'Start my recording',
  finishPerf: 'Finish and get my feedback',
  listening: 'Listening — take your time',
  demoNote: 'Music and score locked to tempo — this is the take Aria hears.',
  continueWithoutMic: 'Continue without mic (demo)',
  micHint: 'Allow the microphone if asked — you can stop anytime.',
  perfReadyEyebrow: 'Ready?',
  perfScoreLabel: 'Your score',
  takeOf: 'Take',

  ariaListening: 'Aria is listening…',
  oneMoment: 'Just a moment.',
  reportEyebrow: 'Aria feedback',
  takesLeft: 'Takes left',
  strengths: 'What worked',
  weaknesses: 'What to fix',
  improvements: 'Focus & practice tips',
  nextFocus: 'Brief for the next take',
  replayPiece: 'Replay this piece',
  chooseOther: 'Choose another piece',
  viewSessions: 'View my sessions',
  takesExhausted: '3 takes used — back to piece selection.',

  historyEyebrow: 'My account · Sessions',
  historyTitle: 'Practice history',
  historyLead: 'Replay your sessions and reread feedback. Everything stays on this device.',
  noSessions: 'No sessions saved yet.',
  withPartition: 'with score',
  byEar: 'by ear',
  takeLabel: 'Take',
  viewFeedback: 'View feedback',
  feedbackPrefix: 'Feedback',
  you: 'you',
}

export type CopyKey = keyof typeof FR

export function getLocale(): Locale {
  const raw = (import.meta.env.VITE_LOCALE as string) || 'fr'
  return raw === 'en' ? 'en' : 'fr'
}

export function t() {
  return getLocale() === 'en' ? EN : FR
}

export function pieceBlurb(piece: DemoPiece) {
  return piece.blurb[getLocale()]
}
