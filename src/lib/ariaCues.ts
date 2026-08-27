/** Live whispers during practice / performance — short, actionable, no fluff. */

export type Cue = { text: string; tone: 'good' | 'warn' | 'neutral' }

export const PRACTICE_CUES_FR: Cue[] = [
  { text: 'Phrase plus longue. Tiens jusqu’au bout.', tone: 'good' },
  { text: 'Tempo qui avance. Pose le pied sur le temps.', tone: 'warn' },
  { text: 'Attaque trop dure. Pose la note, ne la frappe pas.', tone: 'warn' },
  { text: 'Belle tenue. Garde ce calme.', tone: 'good' },
  { text: 'Respire entre les phrases. Deux temps vides.', tone: 'warn' },
  { text: 'Main gauche plus discrète. Mélodie devant.', tone: 'warn' },
]

export const PRACTICE_CUES_EN: Cue[] = [
  { text: 'Longer phrase. Hold it through.', tone: 'good' },
  { text: 'Tempo pushing. Plant your foot on the beat.', tone: 'warn' },
  { text: 'Attack too hard. Place the note, don’t hit it.', tone: 'warn' },
  { text: 'Nice sustain. Keep that calm.', tone: 'good' },
  { text: 'Breathe between phrases. Two empty beats.', tone: 'warn' },
  { text: 'Quieter left hand. Melody in front.', tone: 'warn' },
]

export const BY_EAR_CUES_FR: Cue[] = [
  { text: 'Ligne claire. Continue comme ça.', tone: 'good' },
  { text: 'Tempo trop vite. Ralentis d’un cran.', tone: 'warn' },
  { text: 'Graves flous. Pose chaque basse.', tone: 'warn' },
  { text: 'Coupe nette entre les phrases.', tone: 'good' },
]

export const BY_EAR_CUES_EN: Cue[] = [
  { text: 'Clear line. Keep going.', tone: 'good' },
  { text: 'Too fast. One notch slower.', tone: 'warn' },
  { text: 'Bass muddy. Place each low note.', tone: 'warn' },
  { text: 'Clean cut between phrases.', tone: 'good' },
]

export const PIECE_CUES: Record<string, { fr: Cue[]; en: Cue[] }> = {
  clair: {
    fr: [
      { text: 'Silence entre les accords. Laisse-le parler.', tone: 'good' },
      { text: 'Pédale trop longue. Change sur l’harmonie.', tone: 'warn' },
      { text: 'Tenues plus velours. Moins de percussif.', tone: 'warn' },
    ],
    en: [
      { text: 'Silence between chords. Let it speak.', tone: 'good' },
      { text: 'Pedal too long. Change on the harmony.', tone: 'warn' },
      { text: 'More velvet on sustains. Less percussive.', tone: 'warn' },
    ],
  },
  entertainer: {
    fr: [
      { text: 'Swing souple. Pas trop carré.', tone: 'good' },
      { text: 'Syncope en avant. Recule le contretemps.', tone: 'warn' },
      { text: 'Gauche stable. Droite qui danse.', tone: 'good' },
    ],
    en: [
      { text: 'Loose swing. Don’t square it.', tone: 'good' },
      { text: 'Syncopation early. Delay the off-beat.', tone: 'warn' },
      { text: 'Left hand steady. Right hand dances.', tone: 'good' },
    ],
  },
  elise: {
    fr: [
      { text: 'Motif net. Chaque note compte.', tone: 'good' },
      { text: 'Retour du thème trop vite. Attends.', tone: 'warn' },
      { text: 'Legato sur la ligne droite.', tone: 'good' },
    ],
    en: [
      { text: 'Motif clear. Every note counts.', tone: 'good' },
      { text: 'Theme return too soon. Wait.', tone: 'warn' },
      { text: 'Legato on the right-hand line.', tone: 'good' },
    ],
  },
}

export const RECORD_CUES_FR: Cue[] = [
  { text: 'Reste dans le tempo.', tone: 'warn' },
  { text: 'Finis la phrase.', tone: 'good' },
  { text: 'Ne précipite pas.', tone: 'warn' },
  { text: 'Présence. Continue.', tone: 'good' },
  { text: 'Une respiration. Puis repars.', tone: 'warn' },
]

export const RECORD_CUES_EN: Cue[] = [
  { text: 'Stay in tempo.', tone: 'warn' },
  { text: 'Finish the phrase.', tone: 'good' },
  { text: 'Don’t rush.', tone: 'warn' },
  { text: 'Presence. Keep going.', tone: 'good' },
  { text: 'One breath. Then go.', tone: 'warn' },
]
