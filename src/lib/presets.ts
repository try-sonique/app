export type DemoPiece = {
  id: string
  title: string
  blurb: string
  partitionSrc: string
  /** Ref audio optionnelle (entraînement). Absente = silence / jeu live. */
  audioSrc?: string
  mime: string
  /**
   * Pendant la référence : ne pas scroller au-delà de ce ratio de la page
   * (ex. barre de reprise mesure 9 ≈ haut de page).
   */
  scrollCapRatio?: number
  /** Durée (s) de la section avant reprise — au-delà, retour en haut. */
  repeatEverySec?: number
}

/** Morceaux démo — connus des adultes (partitions + ref audio légale). */
export const DEMO_PIECES: DemoPiece[] = [
  {
    id: 'elise',
    title: 'Lettre à Élise',
    blurb: 'Beethoven — tout le monde le reconnaît',
    partitionSrc: './presets/lettre-a-elise.png',
    audioSrc: './presets/lettre-a-elise.mp3',
    mime: 'image/png',
    // 1ʳᵉ page : reprise ~mesure 9 — on ne descend pas plus bas
    scrollCapRatio: 0.4,
    repeatEverySec: 17,
  },
  {
    id: 'clair',
    title: 'Clair de lune',
    blurb: 'Debussy — ambiance, idéal à chanter doucement',
    partitionSrc: './presets/clair-de-lune.jpg',
    audioSrc: './presets/clair-de-lune.wav',
    mime: 'image/jpeg',
    // Partition complète : en démo on ne descend que le début (~1–1,5 min de jeu)
    scrollCapRatio: 0.22,
  },
  {
    id: 'entertainer',
    title: 'The Entertainer',
    blurb: 'Scott Joplin — classique US, parfait pour YC',
    partitionSrc: './presets/the-entertainer.jpg',
    mime: 'image/jpeg',
    scrollCapRatio: 0.28,
  },
]
