export type DemoPiece = {
  id: string
  title: string
  blurb: string
  partitionSrc: string
  audioSrc: string
  mime: string
}

/** Morceaux démo — connus des adultes, domaine public (audio + partition). */
export const DEMO_PIECES: DemoPiece[] = [
  {
    id: 'elise',
    title: 'Lettre à Élise',
    blurb: 'Beethoven — partition réelle (1ʳᵉ page)',
    partitionSrc: './presets/lettre-a-elise.png',
    audioSrc: './presets/lettre-a-elise.wav',
    mime: 'image/png',
  },
  {
    id: 'clair',
    title: 'Clair de lune',
    blurb: 'Debussy — ambiance, idéal à chanter doucement',
    partitionSrc: './presets/clair-de-lune.svg',
    audioSrc: './presets/clair-de-lune.wav',
    mime: 'image/svg+xml',
  },
  {
    id: 'ode',
    title: 'Ode to Joy',
    blurb: 'Beethoven — hymne connu, simple à suivre',
    partitionSrc: './presets/ode-to-joy.svg',
    audioSrc: './presets/ode-to-joy.wav',
    mime: 'image/svg+xml',
  },
]
