export type DemoPiece = {
  id: string
  title: string
  blurb: string
  /** Path under public/ */
  partitionSrc: string
  mime: string
}

/** Morceaux prêts pour la démo — partitions sans page de couverture. */
export const DEMO_PIECES: DemoPiece[] = [
  {
    id: 'ode',
    title: 'Ode to Joy',
    blurb: 'Extrait simple — idéal pour tester vite',
    partitionSrc: './presets/ode-to-joy.svg',
    mime: 'image/svg+xml',
  },
  {
    id: 'twinkle',
    title: 'Twinkle Twinkle',
    blurb: 'Très accessible — voix ou instrument',
    partitionSrc: './presets/twinkle.svg',
    mime: 'image/svg+xml',
  },
  {
    id: 'clair',
    title: 'Au clair de la lune',
    blurb: 'Classique débutant — tu peux aussi chanter',
    partitionSrc: './presets/clair-de-lune.svg',
    mime: 'image/svg+xml',
  },
]
