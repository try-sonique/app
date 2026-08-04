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
      fr: 'Beethoven. Le classique pour tous les âges.',
      en: 'Beethoven. The classic for every age.',
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
      fr: 'Debussy. Une ode à l’impressionnisme français.',
      en: 'Debussy. An ode to French impressionism.',
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
      fr: 'Scott Joplin. Le classique américain que tout le monde connaît.',
      en: 'Scott Joplin. The American classic everyone knows.',
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
  logOut: 'Se déconnecter',
  myAccount: 'Mon compte',
  accountEyebrow: 'Compte',
  accountTitle: 'Ton profil',
  accountLead: 'Gère ton espace Sonique.',
  accountPersonal: 'Informations',
  accountSecurity: 'Sécurité',
  accountPasswordLabel: 'Mot de passe',
  accountPasswordValue: 'Défini · non affiché',
  accountActivity: 'Activité',
  accountSessions: 'Mes sessions',
  accountSessionsHint: 'Historique de tes prises',
  accountSessionsEmpty: 'Aucune session pour l’instant',
  accountSessionsCount: '{n} session(s)',
  accountBack: 'Retour',
  phoneMissing: 'Non renseigné',
  nameMissing: '—',
  backToPiece: 'Retour au choix du morceau',
  backHome: 'Retour à l’accueil Sonique',
  footerWithScore:
    'Sonique écoute ce que tu joues, le compare à ta partition, et te fait progresser sans te juger.',
  footerNoScore: 'Sonique écoute ce que tu joues. Et te répond franchement.',

  // Welcome
  readyToPlay: 'Prêt·e à jouer',
  heroTagline: 'L’app qui te permet de jouer tes morceaux préférés.',
  start: 'Commencer',

  // Auth
  accessEyebrow: 'Slide 2 · Accès',
  haveAccount: 'Tu as déjà un compte Sonique ?',
  haveAccountLead: 'Comme ça, tu n’as pas à tout retaper si tu reviens.',
  login: 'Connexion',
  loginHint: 'J’ai déjà un compte. Email et mot de passe.',
  firstTime: 'Créer un compte',
  firstTimeHint: 'Première fois. Prénom, email, mot de passe.',
  loginEyebrow: 'Connexion',
  welcomeBack: 'Bon retour',
  loginLead: 'Entre ton email et ton mot de passe pour retrouver ton espace Sonique.',
  rememberEmail: 'Mémoriser mon email sur cet appareil',
  loginEmailContinue: 'Continuer',
  checkEmailTitle: 'Vérifie ta boîte mail',
  checkEmailLead:
    'Avant le mot de passe : ouvre le mail Sonique, clique le lien, puis reviens ici.',
  checkEmailConfirm:
    'Compte créé. Mail envoyé à {email}. Confirme le lien, puis entre le même mot de passe qu’à l’inscription.',
  afterEmailConfirm: 'après avoir confirmé le mail',
  email: 'Email',
  password: 'Mot de passe',
  passwordConfirm: 'Confirme le mot de passe',
  passwordHint: 'min. 6 caractères',
  forgotPassword: 'Mot de passe oublié ?',
  resetSent: 'Si un compte existe, un email de réinitialisation a été envoyé.',
  passwordMismatch: 'Les mots de passe ne correspondent pas.',
  passwordTooShort: 'Le mot de passe doit faire au moins 6 caractères.',
  authBusy: 'Un instant…',
  back: 'Retour',
  continue: 'Continuer',
  createAccountLink: 'Première fois ? Créer un compte',
  signupEyebrow: 'Première fois',
  createSpace: 'Crée ton espace Sonique',
  signupLead: 'Prénom, email et mot de passe : obligatoires. Le reste est facultatif.',
  firstName: 'Prénom',
  lastName: 'Nom',
  phoneOptional: 'Téléphone',
  optional: 'facultatif',
  createAndContinue: 'Créer et continuer',
  loginNotFound:
    "Aucun compte trouvé avec cet email. Choisis « Créer un compte » pour t’inscrire.",
  loginFailed: 'Email ou mot de passe incorrect.',
  emailRateLimited: 'Trop d’essais. Réessaie dans un instant, ou change d’email.',
  emailNotConfirmed:
    'Email pas encore confirmé. Ouvre le lien dans ta boîte mail, puis reviens avec ton mot de passe.',
  emailLinkExpired:
    'Lien expiré. Demande un nouveau mail, puis reconnecte-toi.',
  alreadyRegistered:
    'Compte déjà activé. Pas de nouveau mail. Connecte-toi, ou « Mot de passe oublié ».',
  resendConfirmEmail: 'Renvoyer le mail de confirmation',
  resendConfirmSent: 'Mail renvoyé. Vérifie ta boîte (et les spams).',

  // Piece pick
  choosePiece: 'Choisis un morceau',
  chooseLead: 'Un titre prêt, ou ta propre partition à l’écran.',
  downloadScore: 'Télécharger la partition',
  orUploadOwn: 'Ou importe ta propre partition',
  backToPresets: 'Retour aux morceaux proposés',
  stepPiece: 'Étape 1 · Morceau',

  // How it works
  withScore: 'Avec partition',
  howTitle: 'Comment ça marche',
  howLead: 'Partition à l’écran. Aria t’accompagne. Tu corriges sans te juger.',
  howStep1Title: 'Choisis le passage travaillé',
  howStep1Body: 'On ne traite pas toute la partition d’un coup.',
  howStep2Title: 'Entraîne-toi avec ta partition',
  howStep2Body: 'La partition suit ton jeu. Prends ton instrument. Rien n’est enregistré.',
  howStep3Title: 'Aria chuchote en live',
  howStep3Body: 'Tempo, rythme… elle te le dit pendant que tu joues.',
  howStep4Title: 'Enregistre une trace',
  howStep4Body: 'Quand tu es prêt·e, enregistre. Partition syncée sur ta prise.',
  howStep5Title: 'Reçois ton retour',
  howStep5Body: 'Max 3 essais par morceau. Digère ce qu’Aria t’a dit.',
  goToPractice: 'Passer à l’entraînement',

  // No partition (legacy copy keys kept for type parity)
  noScoreEyebrow: 'Sans partition',
  noScoreTitle: 'Aide Sonique à t’écouter',
  noScoreLead: 'Arrangement ou original ? Aria répond plus juste.',
  originalVersion: 'Version originale',
  originalHint: 'Je vise la version connue / standard.',
  arrangement: 'Arrangement',
  arrangementHint: 'C’est une version adaptée / arrangée.',
  startRecording: 'Lancer l’enregistrement',

  // Classic setup
  classicTitle: 'Quel morceau vas-tu travailler ?',
  classicLead: 'Importe ta partition à l’écran. Ou joue à l’oreille.',
  pieceNameLabel: 'Nom du morceau',
  pieceNamePlaceholder: 'Ex. Clair de Lune',
  dropScore: 'Glisse ta partition ici, ou choisis un fichier',
  uploadHint: 'Image ou PDF. Sans page de couverture, le défilement est plus net.',
  fileLabel: 'Fichier',
  previewLabel: 'Aperçu de ta partition',
  noScoreContinue: 'Pas de partition. Continuer quand même.',
  noScoreContinueHint: 'Aria écoutera à l’oreille.',
  noScoreStageTitle: 'Pas de partition à l’écran',
  noScoreStageBody: 'Tu joues à l’oreille. Aria chuchote. Rien n’est enregistré ici.',
  historyBack: 'Retour',

  // Practice
  training: 'Étape 2 · Entraînement',
  followRef: 'Repère court',
  yourTurn: 'Salle d’entraînement',
  refPlaying: 'Repère court. Juste pour te placer. Ce n’est pas ta prise.',
  yourTurnLead:
    'Partition à l’écran. Aria chuchote. Rien n’est enregistré. Prêt·e ? Passe à la performance.',
  yourTurnLeadNoScore:
    'Joue à l’oreille. Aria chuchote. Rien n’est enregistré. Prêt·e ? Passe à la performance.',
  practiceNote:
    'Ta partition suit ton jeu : silence = pause, tu joues = elle descend.',
  practiceNoteNoScore: '',
  scrollHintListen: 'À l’oreille. Aria écoute pendant que tu joues.',
  refOn: 'Repère en cours',
  cutRef: 'Arrêter le repère',
  restartRef: 'Écouter 12s de repère',
  cutWhispers: 'Couper les chuchotements',
  reviveAria: 'Réactiver Aria',
  readyRecord: 'Je suis prêt·e. Passer à la performance.',
  accessReturning: 'Content de te revoir',
  accessReturningLead: 'Connecte-toi ou crée un espace. Ensuite, on choisit un morceau.',
  micDeniedPractice:
    'Micro refusé : la partition ne peut pas suivre ton jeu. Autorise le micro pour synchroniser.',
  scrollHintRef: 'Défilement calé sur la référence. Reprise = retour en haut.',
  scrollHintPlay: 'Défilement calé sur ton jeu. Silence = pause. Tu joues = la partition descend.',

  // Performance
  stepPlay: 'Étape 2 · Jouer',
  performance: 'Ta performance',
  perfLead: 'C’est ta prise. Musique et partition avancent avec toi. Aria juge cette performance.',
  perfLeadMic: 'C’est ta prise. Pas le repère. Aria écoute uniquement ce que tu joues maintenant.',
  perfLeadEar: 'C’est ta prise. Aria écoute à l’oreille ce que tu joues.',
  startPerf: 'Lancer la performance',
  startMic: 'Lancer mon enregistrement',
  finishPerf: 'Terminer et recevoir mon retour',
  listening: 'En écoute. Vas-y tranquillement.',
  demoNote: 'Musique et partition calées sur le tempo. C’est la prise qu’Aria écoute.',
  continueWithoutMic: 'Continuer sans micro (démo)',
  micHint: 'Autorise le micro si ton navigateur le demande. Tu pourras arrêter quand tu veux.',
  perfReadyEyebrow: 'Prêt·e ?',
  perfScoreLabel: 'Ta partition',
  takeOf: 'Essai',

  // Analyzing / report
  ariaListening: 'Aria écoute…',
  oneMoment: 'Un instant.',
  seeFeedback: 'Voir mon retour',
  reportEyebrow: 'Retour Aria',
  takesLeft: 'Essais restants',
  strengths: 'Points positifs',
  weaknesses: 'Points à corriger',
  improvements: 'À travailler concrètement',
  nextFocus: 'Prochaine prise: une seule consigne',
  replayPiece: 'Rejouer le morceau',
  chooseOther: 'Choisir un autre morceau',
  viewSessions: 'Voir mes sessions',
  takesExhausted: '3 essais atteints. Retour au choix du morceau.',

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
  logOut: 'Log out',
  myAccount: 'My account',
  accountEyebrow: 'Account',
  accountTitle: 'Your profile',
  accountLead: 'Manage your Sonique space.',
  accountPersonal: 'Personal info',
  accountSecurity: 'Security',
  accountPasswordLabel: 'Password',
  accountPasswordValue: 'Set · not shown',
  accountActivity: 'Activity',
  accountSessions: 'My sessions',
  accountSessionsHint: 'History of your takes',
  accountSessionsEmpty: 'No sessions yet',
  accountSessionsCount: '{n} session(s)',
  accountBack: 'Back',
  phoneMissing: 'Not set',
  nameMissing: '—',
  backToPiece: 'Back to piece selection',
  backHome: 'Back to Sonique home',
  footerWithScore:
    'Sonique listens to what you play, matches it to your score, and helps you improve without judging.',
  footerNoScore: 'Sonique listens to what you play. And answers honestly.',

  readyToPlay: 'Ready to play',
  heroTagline: 'The app that lets you play your favorite pieces.',
  start: 'Get started',

  accessEyebrow: 'Step 2 · Access',
  haveAccount: 'Already have a Sonique account?',
  haveAccountLead: 'So you don’t have to type everything again when you come back.',
  login: 'Log in',
  loginHint: 'I already have an account. Email and password.',
  firstTime: 'Create an account',
  firstTimeHint: 'First time. First name, email, password.',
  loginEyebrow: 'Log in',
  welcomeBack: 'Welcome back',
  loginLead: 'Enter your email and password to open your Sonique space.',
  rememberEmail: 'Remember my email on this device',
  loginEmailContinue: 'Continue',
  email: 'Email',
  password: 'Password',
  passwordConfirm: 'Confirm password',
  passwordHint: 'min. 6 characters',
  forgotPassword: 'Forgot password?',
  resetSent: 'If an account exists, a reset email was sent.',
  passwordMismatch: 'Passwords do not match.',
  passwordTooShort: 'Password must be at least 6 characters.',
  authBusy: 'One moment…',
  checkEmailTitle: 'Check your inbox',
  checkEmailLead:
    'Before the password: open the Sonique email, click the link, then come back here.',
  checkEmailConfirm:
    'Account created. Email sent to {email}. Confirm the link, then enter the same password as signup.',
  afterEmailConfirm: 'after confirming the email',
  back: 'Back',
  continue: 'Continue',
  createAccountLink: 'First time? Create an account',
  signupEyebrow: 'First time',
  createSpace: 'Create your Sonique space',
  signupLead: 'First name, email and password: required. The rest is optional.',
  firstName: 'First name',
  lastName: 'Last name',
  phoneOptional: 'Phone',
  optional: 'optional',
  createAndContinue: 'Create and continue',
  loginNotFound: 'No account found with that email. Choose “Create an account” to sign up.',
  loginFailed: 'Incorrect email or password.',
  emailRateLimited: 'Too many attempts. Try again in a moment, or use another email.',
  emailNotConfirmed:
    'Email not confirmed yet. Open the link in your inbox, then come back with your password.',
  emailLinkExpired: 'Link expired. Request a new email, then log in again.',
  alreadyRegistered:
    'Account already activated. No new email. Log in, or use “Forgot password”.',
  resendConfirmEmail: 'Resend confirmation email',
  resendConfirmSent: 'Email sent again. Check your inbox (and spam).',

  choosePiece: 'Choose a piece',
  chooseLead: 'A ready title, or your own score on screen.',
  downloadScore: 'Download score',
  orUploadOwn: 'Or upload your own score',
  backToPresets: 'Back to suggested pieces',
  stepPiece: 'Step 1 · Piece',

  withScore: 'With score',
  howTitle: 'How it works',
  howLead: 'Score on screen. Aria with you. You correct without judging yourself.',
  howStep1Title: 'Pick the passage you’re working on',
  howStep1Body: 'We don’t tackle the whole score at once.',
  howStep2Title: 'Practice with your score',
  howStep2Body: 'Your score follows your playing. Pick up your instrument. Nothing is recorded.',
  howStep3Title: 'Aria whispers live',
  howStep3Body: 'Tempo, rhythm… she flags it while you play.',
  howStep4Title: 'Record a take',
  howStep4Body: 'When you’re ready, record. Score synced to your take.',
  howStep5Title: 'Get your feedback',
  howStep5Body: 'Max 3 takes per piece. Digest what Aria said.',
  goToPractice: 'Go to practice',

  noScoreEyebrow: 'No score',
  noScoreTitle: 'Help Sonique listen',
  noScoreLead: 'Arrangement or original? Aria answers more accurately.',
  originalVersion: 'Original version',
  originalHint: 'I’m aiming for the standard / known version.',
  arrangement: 'Arrangement',
  arrangementHint: 'This is an adapted / arranged version.',
  startRecording: 'Start recording',

  classicTitle: 'Which piece will you work on?',
  classicLead: 'Upload your score on screen. Or play by ear.',
  pieceNameLabel: 'Piece name',
  pieceNamePlaceholder: 'e.g. Clair de Lune',
  dropScore: 'Drop your score here, or choose a file',
  uploadHint: 'Image or PDF. Skip the cover page for cleaner scrolling.',
  fileLabel: 'File',
  previewLabel: 'Score preview',
  noScoreContinue: 'No score. Continue anyway.',
  noScoreContinueHint: 'Aria will listen by ear.',
  noScoreStageTitle: 'No score on screen',
  noScoreStageBody: 'Play by ear. Aria whispers. Nothing is recorded here.',
  historyBack: 'Back',

  training: 'Step 2 · Practice',
  followRef: 'Short cue',
  yourTurn: 'Practice room',
  refPlaying: 'Short cue. Just to get oriented. This is not your take.',
  yourTurnLead:
    'Score on screen. Aria whispers. Nothing is recorded. Ready? Go to performance.',
  yourTurnLeadNoScore:
    'Play by ear. Aria whispers. Nothing is recorded. Ready? Go to performance.',
  practiceNote:
    'Your score follows your playing: silence = pause, you play = it moves down.',
  practiceNoteNoScore: '',
  scrollHintListen: 'By ear. Aria listens while you play.',
  refOn: 'Cue playing',
  cutRef: 'Stop cue',
  restartRef: 'Hear a 12s cue',
  cutWhispers: 'Mute whispers',
  reviveAria: 'Bring Aria back',
  readyRecord: "I'm ready. Go to performance.",
  accessReturning: 'Good to see you again',
  accessReturningLead: 'Log in or create a space. Then we pick a piece.',
  micDeniedPractice:
    'Mic denied: the score can’t follow your playing. Allow the microphone to sync.',
  scrollHintRef: 'Scrolling locked to the reference. Repeat = back to top.',
  scrollHintPlay: 'Scrolling locked to your playing. Silence = pause. You play = the score moves down.',

  stepPlay: 'Step 2 · Play',
  performance: 'Your performance',
  perfLead: 'This is your take. Music and score move with you. Aria reviews this performance.',
  perfLeadMic: 'This is your take. Not the cue. Aria reviews only what you play now.',
  perfLeadEar: 'This is your take. Aria listens by ear to what you play.',
  startPerf: 'Start performance',
  startMic: 'Start my recording',
  finishPerf: 'Finish and get my feedback',
  listening: 'Listening. Take your time.',
  demoNote: 'Music and score locked to tempo. This is the take Aria hears.',
  continueWithoutMic: 'Continue without mic (demo)',
  micHint: 'Allow the microphone if asked. You can stop anytime.',
  perfReadyEyebrow: 'Ready?',
  perfScoreLabel: 'Your score',
  takeOf: 'Take',

  ariaListening: 'Aria is listening…',
  oneMoment: 'Just a moment.',
  seeFeedback: 'See my feedback',
  reportEyebrow: 'Aria feedback',
  takesLeft: 'Takes left',
  strengths: 'What worked',
  weaknesses: 'What to fix',
  improvements: 'What to practice next',
  nextFocus: 'Next take: one job only',
  replayPiece: 'Replay this piece',
  chooseOther: 'Choose another piece',
  viewSessions: 'View my sessions',
  takesExhausted: '3 takes used. Back to piece selection.',

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
