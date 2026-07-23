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
    scrollDurationSec: 55,
  },
  {
    id: 'clair',
    title: 'Clair de lune',
    blurb: {
      fr: 'Debussy — l’élégance à la française',
      en: 'Debussy — French elegance',
    },
    partitionSrc: './presets/clair-de-lune.jpg',
    performanceAudioSrc: './presets/clair-de-lune.mp3',
    mime: 'image/jpeg',
    scrollCapRatio: 0.22,
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
    performanceAudioSrc: './presets/the-entertainer.mp3',
    mime: 'image/jpeg',
    scrollCapRatio: 0.28,
    scrollDurationSec: 55,
  },
]

const FR = {
  choosePiece: 'Choisis un morceau',
  chooseLead: 'Trois titres connus, partitions prêtes. Joue ou chante — idéal pour une démo rapide.',
  continue: 'Continuer',
  stepPiece: 'Étape 1 · Morceau',
  training: 'Étape 2 · Entraînement',
  followRef: 'Suis la référence',
  yourTurn: 'À toi de jouer',
  refPlaying:
    'Un pianiste joue — la partition suit la musique. Écoute, puis reprends.',
  yourTurnLead: 'Joue ou chante maintenant. Aria chuchote — rien n’est enregistré ici.',
  refOn: 'Référence en cours',
  cutRef: 'Couper la référence',
  restartRef: 'Relancer la référence',
  cutWhispers: 'Couper les chuchotements',
  reviveAria: 'Réactiver Aria',
  readyRecord: 'Je suis prêt·e à enregistrer',
  performance: 'Ta performance',
  perfLead:
    'Lance la prise : la musique joue, la partition défile au tempo. Aria se base sur cette performance.',
  startPerf: 'Lancer la performance',
  startMic: 'Lancer mon enregistrement',
  finishPerf: 'Terminer et recevoir mon retour',
  listening: 'En écoute — vas-y tranquillement',
  demoNote: 'Démo : performance synchronisée (musique + partition).',
  sessions: 'Mes sessions',
} as const

const EN: { [K in keyof typeof FR]: string } = {
  choosePiece: 'Choose a piece',
  chooseLead: 'Three well-known pieces with sheet music ready. Play or sing — perfect for a quick demo.',
  continue: 'Continue',
  stepPiece: 'Step 1 · Piece',
  training: 'Step 2 · Practice',
  followRef: 'Follow the reference',
  yourTurn: 'Your turn to play',
  refPlaying: 'A pianist is playing — the score follows the music. Listen, then join in.',
  yourTurnLead: 'Play or sing now. Aria whispers — nothing is recorded here.',
  refOn: 'Reference playing',
  cutRef: 'Stop reference',
  restartRef: 'Replay reference',
  cutWhispers: 'Mute whispers',
  reviveAria: 'Bring Aria back',
  readyRecord: "I'm ready to record",
  performance: 'Your performance',
  perfLead:
    'Start the take: music plays and the score scrolls in time. Aria reviews this performance.',
  startPerf: 'Start performance',
  startMic: 'Start my recording',
  finishPerf: 'Finish and get my feedback',
  listening: 'Listening — take your time',
  demoNote: 'Demo: synced performance (music + scrolling score).',
  sessions: 'My sessions',
}

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
