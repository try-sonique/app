export type Locale = 'fr' | 'en'

export type DemoPiece = {
  id: string
  title: string
  blurb: { fr: string; en: string }
  partitionSrc: string
  /** Ref audio optionnelle (entraînement). */
  audioSrc?: string
  /** Audio joué pendant la performance démo (V2). */
  performanceAudioSrc?: string
  mime: string
  scrollCapRatio?: number
  repeatEverySec?: number
  /** Durée de sync scroll sur la perf (secondes), si pas de reprise. */
  scrollDurationSec?: number
}

export const DEMO_PIECES: DemoPiece[] = [
  {
    id: 'elise',
    title: 'Lettre à Élise',
    blurb: {
      fr: 'Beethoven — le classique pour tous les âges',
      en: 'Beethoven — the classic for every age',
    },
    partitionSrc: './presets/lettre-a-elise.png',
    audioSrc: './presets/lettre-a-elise.mp3',
    performanceAudioSrc: './presets/lettre-a-elise.mp3',
    mime: 'image/png',
    scrollCapRatio: 0.4,
    repeatEverySec: 17,
    scrollDurationSec: 38,
  },
  {
    id: 'clair',
    title: 'Clair de lune',
    blurb: {
      fr: 'Debussy — l’élégance à la française',
      en: 'Debussy — French elegance',
    },
    partitionSrc: './presets/clair-de-lune.jpg',
    audioSrc: './presets/clair-de-lune.mp3',
    performanceAudioSrc: './presets/clair-de-lune.mp3',
    mime: 'image/jpeg',
    // Extrait ~55s : ouverture lente → peu de systèmes sur une partition très haute
    scrollCapRatio: 0.1,
    scrollDurationSec: 55,
  },
  {
    id: 'entertainer',
    title: 'The Entertainer',
    blurb: {
      fr: 'Scott Joplin — le danseur américain que tout le monde connaît',
      en: 'Scott Joplin — the American dance classic everyone knows',
    },
    partitionSrc: './presets/the-entertainer.jpg',
    audioSrc: './presets/the-entertainer.mp3',
    performanceAudioSrc: './presets/the-entertainer.mp3',
    mime: 'image/jpeg',
    scrollCapRatio: 0.16,
    scrollDurationSec: 55,
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
  firstTime: 'C’est ma première fois',
  firstTimeHint: 'Prénom + email. Le reste est facultatif.',
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
    'Trois titres connus, partitions prêtes. Au piano — idéal pour une démo rapide.',
  stepPiece: 'Étape 1 · Morceau',

  // How it works
  withScore: 'Avec partition',
  howTitle: 'Comment ça marche',
  howLead:
    'Sur Sonique, Aria t’accompagne pas à pas avant l’enregistrement — pour corriger sans te juger.',
  howStep1Title: 'Choisis le passage travaillé',
  howStep1Body: 'On ne traite pas toute la partition d’un coup.',
  howStep2Title: 'Entraîne-toi librement',
  howStep2Body: 'Prends ton instrument et joue — aussi longtemps que tu veux, sans enregistrer.',
  howStep3Title: 'Aria chuchote en live',
  howStep3Body: 'Tempo, rythme… elle te le dit pendant que tu joues.',
  howStep4Title: 'Enregistre une trace',
  howStep4Body: 'Quand tu es prêt·e, passe à l’enregistrement pour garder ta prise.',
  howStep5Title: 'Reçois ton retour',
  howStep5Body: 'Max 3 essais par morceau, pour digérer ce qu’Aria t’a dit.',
  goToPractice: 'Passer à l’entraînement',

  // No partition
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
    'Importe ta partition, ou continue sans — Aria s’adapte. Au piano.',
  pieceNameLabel: 'Nom du morceau',
  pieceNamePlaceholder: 'Ex. Clair de Lune',
  dropScore: 'Glisse ta partition ici, ou choisis un fichier',
  uploadHint: 'Image / PDF — préfère un fichier sans page de couverture pour le défilement',
  fileLabel: 'Fichier',
  previewLabel: 'Aperçu de ta partition',
  noScoreContinue: 'Je n’ai pas de partition — continuer quand même',
  noScoreContinueHint: 'Aria écoutera à l’oreille.',
  historyBack: 'Retour',

  // Practice
  training: 'Étape 2 · Entraînement',
  followRef: 'Suis la référence',
  yourTurn: 'À toi de jouer',
  refPlaying:
    'Un pianiste joue — la partition suit la musique. Écoute, puis reprends au piano.',
  yourTurnLead:
    'Prends ton instrument et entraîne-toi. Aria chuchote — rien n’est enregistré ici. Quand tu es prêt·e, passe à l’enregistrement.',
  refOn: 'Référence en cours',
  cutRef: 'Couper la référence',
  restartRef: 'Relancer la référence',
  cutWhispers: 'Couper les chuchotements',
  reviveAria: 'Réactiver Aria',
  readyRecord: 'Je suis prêt·e — passer à l’enregistrement',
  micDeniedPractice:
    'Micro refusé : la partition ne peut pas suivre ton jeu. Autorise le micro pour synchroniser.',
  scrollHintRef: 'Défilement calé sur la référence — reprise = retour en haut',
  scrollHintPlay: 'Défilement calé sur ton jeu — silence = pause, tu joues = la partition s’abaisse',

  // Performance
  stepPlay: 'Étape 2 · Jouer',
  performance: 'Ta performance',
  perfLead:
    'Lance la prise : la musique joue, la partition défile au tempo. Aria se base sur cette performance.',
  perfLeadMic:
    'C’est ta prise — pas la référence. Aria se base sur ce que tu joues maintenant.',
  perfLeadEar: 'C’est ta prise. Aria écoute à l’oreille ce que tu joues au piano.',
  startPerf: 'Lancer la performance',
  startMic: 'Lancer mon enregistrement',
  finishPerf: 'Terminer et recevoir mon retour',
  listening: 'En écoute — vas-y tranquillement',
  demoNote: 'Démo : performance synchronisée (musique + partition).',
  continueWithoutMic: 'Continuer sans micro (démo)',
  micHint: 'Autorise le micro si ton navigateur le demande — tu pourras arrêter quand tu veux.',

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
  firstTime: 'First time here',
  firstTimeHint: 'First name + email. The rest is optional.',
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
  chooseLead: 'Three well-known pieces with sheet music ready. Piano only — perfect for a quick demo.',
  stepPiece: 'Step 1 · Piece',

  withScore: 'With score',
  howTitle: 'How it works',
  howLead: 'On Sonique, Aria guides you step by step before recording — to correct without judging.',
  howStep1Title: 'Pick the passage you’re working on',
  howStep1Body: 'We don’t tackle the whole score at once.',
  howStep2Title: 'Practice freely',
  howStep2Body: 'Pick up your instrument and play — as long as you want, nothing is recorded.',
  howStep3Title: 'Aria whispers live',
  howStep3Body: 'Tempo, rhythm… she flags it while you play.',
  howStep4Title: 'Record a take',
  howStep4Body: 'When you’re ready, move on to recording to keep today’s performance.',
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
  classicLead: 'Upload your score, or continue without — Aria adapts. Piano only.',
  pieceNameLabel: 'Piece name',
  pieceNamePlaceholder: 'e.g. Clair de Lune',
  dropScore: 'Drop your score here, or choose a file',
  uploadHint: 'Image / PDF — prefer a file without a cover page for scrolling',
  fileLabel: 'File',
  previewLabel: 'Score preview',
  noScoreContinue: 'I don’t have a score — continue anyway',
  noScoreContinueHint: 'Aria will listen by ear.',
  historyBack: 'Back',

  training: 'Step 2 · Practice',
  followRef: 'Follow the reference',
  yourTurn: 'Your turn to play',
  refPlaying: 'A pianist is playing — the score follows the music. Listen, then join in on the piano.',
  yourTurnLead:
    'Pick up your instrument and practice. Aria whispers tips — nothing is recorded here. When you’re ready, move on to recording.',
  refOn: 'Reference playing',
  cutRef: 'Stop reference',
  restartRef: 'Replay reference',
  cutWhispers: 'Mute whispers',
  reviveAria: 'Bring Aria back',
  readyRecord: "I'm ready — go to recording",
  micDeniedPractice:
    'Mic denied: the score can’t follow your playing. Allow the microphone to sync.',
  scrollHintRef: 'Scrolling locked to the reference — repeat = back to top',
  scrollHintPlay: 'Scrolling locked to your playing — silence = pause, you play = the score moves down',

  stepPlay: 'Step 2 · Play',
  performance: 'Your performance',
  perfLead: 'Start the take: music plays and the score scrolls in time. Aria reviews this performance.',
  perfLeadMic: 'This is your take — not the reference. Aria reviews what you play now.',
  perfLeadEar: 'This is your take. Aria listens by ear to what you play on the piano.',
  startPerf: 'Start performance',
  startMic: 'Start my recording',
  finishPerf: 'Finish and get my feedback',
  listening: 'Listening — take your time',
  demoNote: 'Demo: synced performance (music + scrolling score).',
  continueWithoutMic: 'Continue without mic (demo)',
  micHint: 'Allow the microphone if asked — you can stop anytime.',

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
