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
 * Ordre pédagogique : mains séparées d’abord (le plus actionnable),
 * puis posture, puis placement des mains.
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
    title: 'Posture',
    whisper: 'Milieu du banc. Dos droit, épaules basses, pieds à plat.',
    weakness:
      'Avant les notes : le corps. Si tu es recroquevillé, les mains n’ont pas d’appui.',
    drill: 'Assieds-toi au milieu du banc. Dos droit sans raideur, épaules basses, pieds à plat un peu en avant. Puis pose les mains.',
    success: 'Réussi si tu tiens 8 mesures sans t’affaisser.',
  },
  {
    id: 'hands',
    title: 'Placement des mains',
    whisper: 'Doigts ronds. Poignet souple. Pas une main plate.',
    weakness:
      'La main plate et le poignet cassé fatiguent tout de suite. On place d’abord, on joue après.',
    drill: 'Main comme sur une petite balle : doigts courbés, poignet dans l’axe de l’avant-bras, pouce sur le côté. Main droite d’abord.',
    success: 'Réussi si le poignet ne s’affaisse pas pendant 4 mesures.',
  },
]

export function beginnerMission(takeNumber: number): CoachScript {
  const i = Math.max(0, takeNumber - 1) % BEGINNER_SCRIPTS.length
  return BEGINNER_SCRIPTS[i]
}

export const BEGINNER_PRACTICE_CUES: Cue[] = [
  { text: 'Main droite seule. Quatre mesures. Lent.', tone: 'warn' },
  { text: 'Milieu du banc. Épaules basses.', tone: 'warn' },
  { text: 'Doigts ronds. Poignet dans l’axe.', tone: 'warn' },
  { text: 'Maintenant la main gauche seule. Même passage.', tone: 'warn' },
  { text: 'Pieds à plat. Tu ne te penches pas vers les graves.', tone: 'warn' },
  { text: 'Les deux mains seulement si chaque main est propre.', tone: 'good' },
]

export const BEGINNER_RECORD_CUES: Cue[] = [
  { text: 'Une main à la fois.', tone: 'warn' },
  { text: 'Reste assis au milieu.', tone: 'warn' },
  { text: 'Pose la note. Ne la frappe pas.', tone: 'warn' },
  { text: 'Finis les quatre mesures.', tone: 'good' },
]
