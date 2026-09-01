import type { Cue } from './ariaCues'

/** Ce que tu dis au piano. Aria lit ce fichier — pas un modèle entraîné. */
export type PianoLevel = 'beginner' | 'playing'

export type BeginnerFocus = 'posture' | 'hands' | 'separate'

export type CoachScript = {
  id: BeginnerFocus
  title: string
  /** Phrase courte pendant le jeu */
  whisper: string
  /** Ce qu’on travaille à ce niveau — pas « j’ai vu ta posture dans le micro » */
  weakness: string
  drill: string
  success: string
}

const LEVEL_KEY = 'sonique.pianoLevel'

export function readPianoLevel(): PianoLevel | null {
  try {
    const v = localStorage.getItem(LEVEL_KEY)
    if (v === 'beginner' || v === 'playing') return v
  } catch {
    /* ignore */
  }
  return null
}

export function writePianoLevel(level: PianoLevel) {
  try {
    localStorage.setItem(LEVEL_KEY, level)
  } catch {
    /* ignore */
  }
}

/**
 * Phrases d’Élodie — à dire, plus tard à enregistrer.
 * Ce n’est pas un prompt pour un modèle.
 */
export const BEGINNER_SCRIPTS: CoachScript[] = [
  {
    id: 'separate',
    title: 'Mains séparées',
    whisper: 'Main droite seule. La gauche attend.',
    weakness:
      'À ton niveau, on n’assemble pas les deux mains trop tôt. D’abord une, puis l’autre.',
    drill: 'Quatre mesures, main droite seule, lent. Puis la même chose main gauche seule. Les deux ensemble seulement après.',
    success: 'Réussi si chaque main est propre avant d’assembler.',
  },
  {
    id: 'posture',
    title: 'En face du clavier',
    whisper: 'En face du clavier. Pose tes mains.',
    weakness:
      'Avant les notes : tu es en face du clavier, les deux mains posées. Si tu es de travers, rien ne tient.',
    drill:
      'Assieds-toi bien en face du clavier et pose tes mains sur le piano. La main droite, c’est la clé de sol. La main gauche, la clé de fa.',
    success: 'Réussi si tu restes en face, les deux mains posées, pendant 8 mesures.',
  },
  {
    id: 'hands',
    title: 'Placement des mains',
    whisper: 'Droite : clé de sol. Gauche : clé de fa.',
    weakness:
      'La main droite lit la clé de sol, la gauche la clé de fa. Si tu mélanges, tu cherches les notes trop bas ou trop haut.',
    drill: 'Main droite sur la clé de sol, main gauche sur la clé de fa. Doigts ronds, poignet souple. Une main à la fois.',
    success: 'Réussi si chaque main reste dans sa clé pendant 4 mesures.',
  },
]

export function beginnerMission(takeNumber: number): CoachScript {
  const i = Math.max(0, takeNumber - 1) % BEGINNER_SCRIPTS.length
  return BEGINNER_SCRIPTS[i]
}

export const BEGINNER_PRACTICE_CUES: Cue[] = [
  { text: 'Assieds-toi en face du clavier. Pose tes mains.', tone: 'warn' },
  { text: 'Droite : clé de sol. Gauche : clé de fa.', tone: 'warn' },
  { text: 'Main droite seule. Quatre mesures. Lent.', tone: 'warn' },
  { text: 'Maintenant la main gauche seule. Même passage.', tone: 'warn' },
  { text: 'Les deux mains seulement si chaque main est propre.', tone: 'good' },
]

export const BEGINNER_RECORD_CUES: Cue[] = [
  { text: 'Une main à la fois.', tone: 'warn' },
  { text: 'Reste assis au milieu.', tone: 'warn' },
  { text: 'Pose la note. Ne la frappe pas.', tone: 'warn' },
  { text: 'Finis les quatre mesures.', tone: 'good' },
]
