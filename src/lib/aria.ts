import { useEffect, useRef, useState } from 'react'
import type { AriaFeedback } from '../types'
import type { AudioFeatures } from './audioFeatures'
import { getLocale, t } from './presets'

type Cue = { text: string; tone: 'good' | 'warn' | 'neutral' }

const PRACTICE_CUES_FR: Cue[] = [
  { text: 'Bien — le phrasé respire.', tone: 'good' },
  { text: 'Le rythme se décale un peu ici.', tone: 'warn' },
  { text: 'Tiens la tenue jusqu’au bout.', tone: 'good' },
  { text: 'Tempo : un cran plus stable.', tone: 'warn' },
  { text: 'Belle présence — continue comme ça.', tone: 'good' },
  { text: 'Assouplis l’attaque sur cette phrase.', tone: 'warn' },
]

const PRACTICE_CUES_EN: Cue[] = [
  { text: 'Nice — the phrasing breathes.', tone: 'good' },
  { text: 'The rhythm drifts a little here.', tone: 'warn' },
  { text: 'Hold the sustain all the way through.', tone: 'good' },
  { text: 'Tempo: keep it one notch steadier.', tone: 'warn' },
  { text: 'Strong presence — keep that.', tone: 'good' },
  { text: 'Soften the attack on this phrase.', tone: 'warn' },
]

const BY_EAR_CUES_FR: Cue[] = [
  { text: 'Je t’écoute à l’oreille — belle ligne.', tone: 'good' },
  { text: 'Le tempo avance un peu trop.', tone: 'warn' },
  { text: 'Clarté sur les notes graves.', tone: 'good' },
  { text: 'Respire entre les phrases.', tone: 'warn' },
]

const BY_EAR_CUES_EN: Cue[] = [
  { text: 'Listening by ear — lovely line.', tone: 'good' },
  { text: 'Tempo is pushing ahead a bit.', tone: 'warn' },
  { text: 'Clarity in the lower notes.', tone: 'good' },
  { text: 'Breathe between the phrases.', tone: 'warn' },
]

const PIECE_CUES: Record<string, { fr: Cue[]; en: Cue[] }> = {
  clair: {
    fr: [
      { text: 'Laisse le silence parler entre les accords.', tone: 'good' },
      { text: 'Pedale douce — ne noie pas le milieu.', tone: 'warn' },
      { text: 'Plus de velours sur les tenues.', tone: 'good' },
    ],
    en: [
      { text: 'Let the silence speak between the chords.', tone: 'good' },
      { text: 'Soft pedal — don’t wash out the middle.', tone: 'warn' },
      { text: 'More velvet on the sustained notes.', tone: 'good' },
    ],
  },
  entertainer: {
    fr: [
      { text: 'Garde le swing — pas trop carré.', tone: 'good' },
      { text: 'La syncope tire un peu en avant.', tone: 'warn' },
      { text: 'Main gauche stable, main droite danse.', tone: 'good' },
    ],
    en: [
      { text: 'Keep the swing — don’t square it off.', tone: 'good' },
      { text: 'The syncopation is pushing ahead a bit.', tone: 'warn' },
      { text: 'Left hand steady, right hand dances.', tone: 'good' },
    ],
  },
  elise: {
    fr: [
      { text: 'Clarté sur le motif — chaque note compte.', tone: 'good' },
      { text: 'Ne précipite pas le retour du thème.', tone: 'warn' },
      { text: 'Beau legato sur la ligne droite.', tone: 'good' },
    ],
    en: [
      { text: 'Clarity on the motif — every note counts.', tone: 'good' },
      { text: 'Don’t rush the theme’s return.', tone: 'warn' },
      { text: 'Nice legato on the right-hand line.', tone: 'good' },
    ],
  },
}

const RECORD_CUES_FR = ['Continue.', 'Belle présence.', 'Tu y es.', 'Nice.']
const RECORD_CUES_EN = ['Keep going.', 'Nice presence.', 'You’ve got this.', 'Nice.']

export function useAriaCues(
  active: boolean,
  mode: 'practice' | 'record',
  pieceId?: string | null,
  byEar = false,
) {
  const [cue, setCue] = useState<Cue | null>(null)
  const index = useRef(0)
  const locale = getLocale()

  useEffect(() => {
    if (!active) {
      setCue(null)
      return
    }

    const piecePool =
      pieceId && PIECE_CUES[pieceId]
        ? locale === 'en'
          ? PIECE_CUES[pieceId].en
          : PIECE_CUES[pieceId].fr
        : []
    const base =
      byEar && !pieceId
        ? locale === 'en'
          ? BY_EAR_CUES_EN
          : BY_EAR_CUES_FR
        : locale === 'en'
          ? PRACTICE_CUES_EN
          : PRACTICE_CUES_FR
    const record = locale === 'en' ? RECORD_CUES_EN : RECORD_CUES_FR
    const pool =
      mode === 'practice'
        ? [...piecePool, ...base]
        : record.map((text) => ({ text, tone: 'good' as const }))

    index.current = 0
    const tick = () => {
      const item = pool[index.current % pool.length]
      index.current += 1
      setCue(item)
    }

    tick()
    const id = window.setInterval(tick, mode === 'practice' ? 4500 : 3200)
    return () => window.clearInterval(id)
  }, [active, mode, locale, pieceId, byEar])

  return cue
}

export type PerformanceMeta = {
  playedSec: number
  totalSec: number | null
  demoSync: boolean
  pieceId: string | null
  features: AudioFeatures | null
}

type PiecePack = {
  strengths: string[]
  weaknesses: string[]
  improvements: string[]
}

function hashStr(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function pickN<T>(items: T[], seed: number, n: number): T[] {
  if (!items.length || n <= 0) return []
  const arr = [...items]
  let s = seed || 1
  for (let i = arr.length - 1; i > 0; i--) {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0
    const j = s % (i + 1)
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr.slice(0, Math.min(n, arr.length))
}

function uniquePush(list: string[], value: string | undefined, max = 6) {
  if (!value) return
  if (list.some((x) => x.toLowerCase() === value.toLowerCase())) return
  if (list.length >= max) return
  list.push(value)
}

/** Stable “character” hints from the piece title (not a real music model). */
function titleFlavor(pieceName: string, en: boolean): PiecePack {
  const n = pieceName.toLowerCase()
  if (/rhapsod|bohemian|queen|mercury/.test(n)) {
    return en
      ? {
          strengths: [
            'You commit to the theatrical shifts — this piece needs that courage',
            'The quieter pockets already feel intentional, not shy',
            'You hold long lines without collapsing the drama into mush',
          ],
          weaknesses: [
            'Big section changes still wobble before the new character lands',
            'Power moments can flatten the quieter answer that should follow',
            'Some transitions arrive early — the theatre needs a beat to breathe',
          ],
          improvements: [
            'Character tip: mark 2 mood changes, play only the bar before/after each',
            'Contrast tip: one pass soft-only, one pass bold-only, then stitch',
            'Landing tip: freeze 1 beat at each section joint, then release',
          ],
        }
      : {
          strengths: [
            'Tu assumes les changements théâtraux — ce morceau en a besoin',
            'Les poches plus douces sonnent déjà choisies, pas timides',
            'Tu tiens les grandes lignes sans noyer le drame',
          ],
          weaknesses: [
            'Les gros changements de section tremblent avant le nouveau caractère',
            'Les moments de puissance aplatissent parfois la réponse douce',
            'Certaines transitions arrivent tôt — le théâtre a besoin d’un temps',
          ],
          improvements: [
            'Piste caractère : marque 2 changements d’humeur, ne joue que la mesure avant/après',
            'Piste contraste : une passe tout doux, une passe tout fort, puis assemble',
            'Piste appui : fige 1 temps à chaque jointure de section, puis relâche',
          ],
        }
  }
  if (/moon|nocturne|lullab|dream|mellow|soft|claire|clair/.test(n)) {
    return en
      ? {
          strengths: [
            'The soft atmosphere is believable — you don’t force the hush',
            'You leave air between gestures; the night-piece needs that',
            'Tone stays rounded instead of poking every attack',
          ],
          weaknesses: [
            'When the line rises, the soft color can break into a harder edge',
            'Phrase endings thin out before the next harmony arrives',
            'Pedal / sustain blur can wash the middle voices for a bar',
          ],
          improvements: [
            'Color tip: 4 bars pp → p only — listen for overtones, not volume',
            'Ending tip: sing the last note of each phrase, then match it on keys',
            'Space tip: mark two breath bars and protect them like gold',
          ],
        }
      : {
          strengths: [
            'L’atmosphère douce est crédible — tu ne forces pas le chuchotement',
            'Tu laisses de l’air entre les gestes ; ce morceau nocturne en a besoin',
            'Le son reste rond au lieu de piquer chaque attaque',
          ],
          weaknesses: [
            'Quand la ligne monte, la couleur douce peut durcir',
            'Les fins de phrase s’amincissent avant l’harmonie suivante',
            'Sustain / pédale peut brouiller le medium une mesure',
          ],
          improvements: [
            'Piste couleur : 4 mesures pp → p seulement — écoute les harmoniques',
            'Piste fin : chante la dernière note de chaque phrase, puis retrouve-la',
            'Piste souffle : marque deux mesures respiration et protège-les',
          ],
        }
  }
  if (/rag|entertain|joplin|swing|blues|jazz|funk|groove/.test(n)) {
    return en
      ? {
          strengths: [
            'The pulse already dances — left-hand feel carries the room',
            'Syncopation has character, not just correctness',
            'You commit to the groove instead of smoothing it flat',
          ],
          weaknesses: [
            'When the right hand densifies, the pulse rushes a hair',
            'Some off-beats arrive early — swing flattens briefly',
            'Phrase endings clip instead of tipping into the next bar',
          ],
          improvements: [
            'Groove tip: left hand alone, metronome on 2 & 4, then add melody',
            'Swing tip: count 1-a-2-a on 8 bars out loud, then mute the voice',
            'Landing tip: exaggerate the last off-beat of each 4-bar unit',
          ],
        }
      : {
          strengths: [
            'Le pulse danse déjà — la main gauche porte la pièce',
            'La syncope a du caractère, pas seulement de la justesse',
            'Tu assumes le groove au lieu de le lisser',
          ],
          weaknesses: [
            'Quand la droite densifie, le pulse accélère d’un cheveu',
            'Certains contretemps arrivent tôt — le swing s’aplatit un instant',
            'Les fins de phrase coupent au lieu de basculer',
          ],
          improvements: [
            'Piste groove : main gauche seule, métronome sur 2 et 4, puis mélodie',
            'Piste swing : compte 1-e-2-e sur 8 mesures, puis coupe la voix',
            'Piste appui : exagère le dernier contretemps de chaque unité de 4',
          ],
        }
  }
  if (/tyrant|metal|rock|storm|fire|war|dark|heavy/.test(n)) {
    return en
      ? {
          strengths: [
            'You bring weight without turning every bar into shouting',
            'Drive is clear — the take doesn’t apologize for power',
            'Accents already carve a shape inside the density',
          ],
          weaknesses: [
            'Dense passages can crush the quieter joint that sells the drama',
            'Attacks stack too evenly — peaks need hierarchy',
            'Recovery after loud gestures is short; the next phrase arrives tired',
          ],
          improvements: [
            'Power tip: one loud gesture, then a deliberately soft answer bar',
            'Hierarchy tip: circle 3 accents only; everything else supports them',
            'Recovery tip: insert a half-breath before each densest bar',
          ],
        }
      : {
          strengths: [
            'Tu apportes du poids sans crier chaque mesure',
            'L’élan est clair — la prise n’excuse pas sa puissance',
            'Les accents sculptent déjà une forme dans la densité',
          ],
          weaknesses: [
            'Les passages denses écrasent parfois le joint plus doux',
            'Les attaques sont trop égales — les pics ont besoin d’une hiérarchie',
            'La récupération après un geste fort est courte',
          ],
          improvements: [
            'Piste puissance : un geste fort, puis une mesure-réponse volontairement douce',
            'Piste hiérarchie : entoure 3 accents seulement ; le reste les sert',
            'Piste récupération : une demi-respiration avant chaque mesure la plus dense',
          ],
        }
  }
  // default flavor varied by hash of title
  const seed = hashStr(pieceName || 'piece')
  const strengthsPool = en
    ? [
        'You prepare before recording — audible in the stable opening',
        'Phrasing has natural breaths: it sounds human',
        'Intention is readable even when the notes are still settling',
        'You stay with the line instead of abandoning mid-phrase',
        'The take has a clear start — listeners know where they are',
        'Touch already has personality; it isn’t generic practice noise',
      ]
    : [
        'Tu prépares avant d’enregistrer — ça s’entend dans le début',
        'Le phrasé a des respirations naturelles : ça sonne humain',
        'L’intention se lit même si les notes se placent encore',
        'Tu restes avec la ligne au lieu d’abandonner au milieu',
        'La prise a un vrai départ — on sait où on est',
        'Le toucher a déjà une personnalité ; ce n’est pas un bruit générique',
      ]
  const weaknessesPool = en
    ? [
        'At density changes, the rhythm floats for a moment',
        'Sustained notes lose a bit of body at phrase endings',
        'Transitions still rush in places',
        'The middle of the take is less clear than the opening',
        'Some gestures start strong then lose shape mid-way',
        'Pulse consistency dips when the texture thickens',
      ]
    : [
        'Aux changements de densité, le rythme flotte un instant',
        'Les tenues perdent un peu de corps en fin de phrase',
        'Les enchaînements sont encore précipités par endroits',
        'Le milieu de la prise est moins clair que le début',
        'Certains gestes démarrent fort puis perdent leur forme',
        'La stabilité du pulse baisse quand la texture s’épaissit',
      ]
  const improvementsPool = en
    ? [
        'Rhythm tip: isolate 2 fragile measures, slow metronome, 3 clean reps',
        'Tone tip: work sustains soft → medium without dropping at the end',
        'Shape tip: one hard passage, slow, hands settled, then one real take',
        'Focus tip: pick a 4-bar window and ignore the rest of the page',
        'Pulse tip: tap the beat with your foot for one pass, then stop tapping',
        'Listen tip: record 20 seconds, listen back once, then replay only that',
      ]
    : [
        'Piste rythme : isole 2 mesures fragiles, métronome lent, 3 répétitions',
        'Piste son : tenues doux → medium sans tomber à la fin',
        'Piste forme : un passage difficile, lent, doigts posés, puis une vraie prise',
        'Piste focus : une fenêtre de 4 mesures, ignore le reste de la page',
        'Piste pulse : tape le temps du pied une passe, puis arrête',
        'Piste écoute : 20 secondes, réécoute une fois, puis rejoue seulement ça',
      ]
  return {
    strengths: pickN(strengthsPool, seed, 3),
    weaknesses: pickN(weaknessesPool, seed + 11, 3),
    improvements: pickN(improvementsPool, seed + 29, 3),
  }
}

function presetPack(pieceId: string | null, en: boolean): PiecePack | null {
  if (pieceId === 'clair') {
    return en
      ? {
          strengths: [
            'The opening haze is already there — Debussy needs that soft attack',
            'You leave space between chords instead of filling every beat',
            'The right-hand line floats above a calm left hand',
          ],
          weaknesses: [
            'At density changes, pedaling blurs the inner voices for a moment',
            'Long notes thin out just before the next harmony arrives',
            'The middle register can get covered when the left hand deepens',
          ],
          improvements: [
            'Color tip: play the first 4 bars soft → a little fuller, listen for overtones',
            'Pedal tip: change on the harmony, not on every note — half-pedal once',
            'Space tip: mark two breath bars, then take only those in the next run',
          ],
        }
      : {
          strengths: [
            'La brume du début est déjà là — Debussy a besoin de cette attaque douce',
            'Tu laisses de l’air entre les accords au lieu de remplir chaque temps',
            'La ligne droite flotte au-dessus d’une main gauche calme',
          ],
          weaknesses: [
            'Aux changements de densité, la pédale brouille un instant les voix internes',
            'Les tenues s’amincissent juste avant l’harmonie suivante',
            'Le medium peut être couvert quand la basse s’approfondit',
          ],
          improvements: [
            'Piste couleur : 4 premières mesures doux → un peu plus plein',
            'Piste pédale : change sur l’harmonie, pas sur chaque note',
            'Piste souffle : marque 2 mesures respiration, puis ne rejoue que celles-là',
          ],
        }
  }
  if (pieceId === 'entertainer') {
    return en
      ? {
          strengths: [
            'The ragtime bounce is readable — left hand keeps the dance floor',
            'Syncopations land with character, not just accuracy',
            'You commit to the stride pulse instead of smoothing it away',
          ],
          weaknesses: [
            'When the right hand densifies, the left-hand stride rushes a hair',
            'Some off-beats arrive early — swing flattens into straight eighths',
            'Phrase endings clip instead of tipping into the next bar',
          ],
          improvements: [
            'Swing tip: count 1-a-2-a out loud on 8 bars, then mute the voice',
            'Stride tip: left hand alone, metronome on 2 and 4, then add melody',
            'Landing tip: exaggerate the last off-beat of each 4-bar unit, then relax',
          ],
        }
      : {
          strengths: [
            'Le rebond ragtime se lit — la main gauche tient la piste',
            'Les syncopes ont du caractère, pas seulement de la justesse',
            'Tu assumes le stride au lieu de le lisser',
          ],
          weaknesses: [
            'Quand la droite densifie, le stride gauche accélère d’un cheveu',
            'Certains contretemps arrivent tôt — le swing devient des croches droites',
            'Les fins de phrase coupent au lieu de basculer',
          ],
          improvements: [
            'Piste swing : compte 1-e-2-e à voix haute sur 8 mesures',
            'Piste stride : main gauche seule, métronome sur 2 et 4',
            'Piste appui : exagère le dernier contretemps de chaque unité de 4',
          ],
        }
  }
  if (pieceId === 'elise') {
    return en
      ? {
          strengths: [
            'The motif speaks clearly — Beethoven’s earworm stays articulate',
            'You shape the return of the theme instead of copying bar 1',
            'Fingers stay close to the keys on the quiet answers',
          ],
          weaknesses: [
            'The transition into the middle section still accelerates',
            'Ornaments can snatch time from the beat that follows',
            'Left-hand Alberti patterns get louder than the melody for a bar',
          ],
          improvements: [
            'Motif tip: 3 slow reps of the opening cell, then a tempo without pushing',
            'Bridge tip: isolate the 2 bars before the middle section, metronome −20%',
            'Balance tip: melody louder / accompaniment softer for one clean pass',
          ],
        }
      : {
          strengths: [
            'Le motif parle clairement — l’air de Beethoven reste articulé',
            'Tu sculptes le retour du thème au lieu de copier la mesure 1',
            'Les doigts restent près des touches sur les réponses douces',
          ],
          weaknesses: [
            'La transition vers le milieu accélère encore',
            'Les ornements grignotent le temps du temps suivant',
            'Les formules Alberti de gauche passent plus fort que la mélodie',
          ],
          improvements: [
            'Piste motif : 3 passes lentes de la cellule d’ouverture',
            'Piste pont : isole les 2 mesures avant le milieu, métronome −20 %',
            'Piste balance : mélodie plus forte / accompagnement plus doux',
          ],
        }
  }
  return null
}

type SignalNotes = {
  strengths: string[]
  weaknesses: string[]
  improvements: string[]
  honesty: string[]
}

/** Map real take signals → concrete coaching notes (truthful when signal is weak). */
function signalNotes(
  features: AudioFeatures | null,
  meta: PerformanceMeta | undefined,
  en: boolean,
): SignalNotes {
  const notes: SignalNotes = { strengths: [], weaknesses: [], improvements: [], honesty: [] }
  const f = features
  const played = meta?.playedSec ?? f?.durationSec ?? 0
  const total = meta?.totalSec ?? f?.durationSec ?? 0
  const completion = total > 0 ? played / total : 1

  if (!f || f.weakSignal || f.durationSec < 1.2) {
    notes.honesty.push(
      en
        ? 'Honest note: the audio signal was thin or very short — I’m coaching from limited evidence, not a full listen.'
        : 'Note honnête : le signal audio était faible ou très court — je coache avec peu de preuves, pas une écoute complète.',
    )
    notes.weaknesses.push(
      en
        ? 'I couldn’t hear a clear, sustained performance in this take'
        : 'Je n’ai pas entendu une performance claire et tenue sur cette prise',
    )
    notes.improvements.push(
      en
        ? 'Next take: closer to the mic, 20–40 steady seconds, one passage only'
        : 'Prochaine prise : plus près du micro, 20–40 secondes stables, un seul passage',
    )
    return notes
  }

  if (completion < 0.45 && total > 0) {
    notes.honesty.push(
      en
        ? 'You cut early — fine for a focus pass; I mainly heard the opening.'
        : 'Tu as coupé tôt — OK pour un focus ; j’ai surtout entendu le début.',
    )
    notes.weaknesses.push(
      en
        ? 'The take is short: hard to judge how the middle holds'
        : 'La prise est courte : difficile de juger le milieu',
    )
  } else if (f.durationSec >= 25 || completion >= 0.9) {
    notes.strengths.push(
      en
        ? `You carried ~${Math.round(f.durationSec)}s — stamina and intention both show`
        : `Tu as tenu ~${Math.round(f.durationSec)}s — endurance et intention se voient`,
    )
  } else if (f.durationSec < 12) {
    notes.weaknesses.push(
      en
        ? `Short take (${Math.round(f.durationSec)}s) — Aria heard a sketch, not a full arc`
        : `Prise courte (${Math.round(f.durationSec)}s) — Aria a entendu une esquisse, pas un arc`,
    )
  }

  if (f.silenceRatio > 0.45) {
    notes.weaknesses.push(
      en
        ? 'Long gaps between phrases — the line loses continuity'
        : 'Longs silences entre les phrases — la ligne perd sa continuité',
    )
    notes.improvements.push(
      en
        ? 'Flow tip: join two phrases with a softer bridge note, no full stop'
        : 'Piste flux : relie deux phrases avec une note-pont plus douce',
    )
  } else if (f.silenceRatio < 0.1 && f.attacksPerSec > 3.2) {
    notes.weaknesses.push(
      en
        ? 'Very dense attack stream — little recovery between gestures'
        : 'Flux d’attaques très dense — peu de récupération entre les gestes',
    )
    notes.improvements.push(
      en
        ? 'Space tip: insert one intentional rest every 4 bars'
        : 'Piste espace : un silence volontaire toutes les 4 mesures',
    )
  } else if (f.silenceRatio >= 0.18 && f.silenceRatio <= 0.35) {
    notes.strengths.push(
      en
        ? 'Breathing between phrases sounds natural, not empty'
        : 'Les respirations entre phrases sonnent naturelles, pas vides',
    )
  }

  if (f.dynamicRange < 0.035) {
    notes.weaknesses.push(
      en
        ? 'Dynamics stay in a narrow band — the story needs more contrast'
        : 'La dynamique reste étroite — l’histoire demande plus de contraste',
    )
    notes.improvements.push(
      en
        ? 'Contrast tip: same 4 bars twice — once soft, once fuller'
        : 'Piste contraste : les mêmes 4 mesures deux fois — doux, puis plus plein',
    )
  } else if (f.dynamicRange > 0.11) {
    notes.strengths.push(
      en
        ? 'Clear dynamic contrast — soft and full actually talk to each other'
        : 'Beau contraste dynamique — le doux et le plein se parlent',
    )
  }

  if (f.endingEnergy < f.openingEnergy * 0.55 && f.durationSec > 10) {
    notes.weaknesses.push(
      en
        ? 'Energy drops hard toward the end — the closing phrase loses body'
        : 'L’énergie chute fort vers la fin — la phrase de clôture perd du corps',
    )
    notes.improvements.push(
      en
        ? 'Close tip: practice only the last 8 seconds until it stays alive'
        : 'Piste fin : travaille seulement les 8 dernières secondes jusqu’à ce qu’elles restent vivantes',
    )
  } else if (f.endingEnergy > f.openingEnergy * 1.35 && f.durationSec > 10) {
    notes.strengths.push(
      en
        ? 'The ending is stronger than the opening — you build instead of fading'
        : 'La fin est plus forte que le début — tu construis au lieu de t’éteindre',
    )
  }

  if (f.openingEnergy > f.middleEnergy * 1.4 && f.durationSec > 12) {
    notes.weaknesses.push(
      en
        ? 'Opening is clearer than the middle — focus drifts after the first page of energy'
        : 'Le début est plus clair que le milieu — l’attention dérive après l’élan initial',
    )
  }

  if (f.attacksPerSec > 0.4 && f.attacksPerSec < 1.1) {
    notes.strengths.push(
      en
        ? 'Attack pacing is measured — not frantic, not sparse'
        : 'Le rythme d’attaques est mesuré — ni frénétique, ni trop rare',
    )
  } else if (f.attacksPerSec >= 2.8) {
    notes.weaknesses.push(
      en
        ? `High note density (~${f.attacksPerSec.toFixed(1)} attacks/s) — tempo may be pushing`
        : `Densité élevée (~${f.attacksPerSec.toFixed(1)} attaques/s) — le tempo pousse peut-être`,
    )
    notes.improvements.push(
      en
        ? 'Tempo tip: same passage at −15% metronome until it feels boring-stable'
        : 'Piste tempo : même passage à −15 % jusqu’à ce que ce soit ennuyeusement stable',
    )
  }

  if (f.energyVariance > 0.0025 && f.dynamicRange > 0.08) {
    notes.strengths.push(
      en
        ? 'The energy curve moves — the take has a shape, not a flat line'
        : 'La courbe d’énergie bouge — la prise a une forme, pas une ligne plate',
    )
  }

  return notes
}

/**
 * Aria report: piece-aware + take-aware + audio-signal-aware.
 * Still heuristic (no cloud LLM) — but two different uploads should not clone.
 */
export function analyzePerformance(input: {
  pieceName: string
  hasPartition: boolean
  firstName: string
  arrangement: 'arrangement' | 'original' | null
  takesUsed: number
  maxTakes: number
  meta?: PerformanceMeta
}): AriaFeedback {
  const copy = t()
  const en = getLocale() === 'en'
  const takesLeft = Math.max(0, input.maxTakes - input.takesUsed)
  const name = input.firstName.trim() || copy.you
  const piece = input.pieceName.trim() || (en ? 'your piece' : 'ton morceau')
  const take = input.takesUsed
  const pieceId = input.meta?.pieceId ?? null
  const features = input.meta?.features ?? null
  const seed = hashStr(`${piece}|${pieceId ?? ''}|${take}|${input.hasPartition}`)

  const base = presetPack(pieceId, en) ?? titleFlavor(piece, en)
  const signals = signalNotes(features, input.meta, en)

  const strengths: string[] = []
  const weaknesses: string[] = []
  const improvements: string[] = []

  for (const s of signals.strengths) uniquePush(strengths, s)
  for (const w of signals.weaknesses) uniquePush(weaknesses, w)
  for (const i of signals.improvements) uniquePush(improvements, i)

  // Piece-specific flavor (rotated by take so take 2 ≠ take 1)
  for (const s of pickN(base.strengths, seed + take * 3, 2)) uniquePush(strengths, s)
  for (const w of pickN(base.weaknesses, seed + 17 + take * 5, 2)) uniquePush(weaknesses, w)
  for (const i of pickN(base.improvements, seed + 41 + take * 7, 2)) uniquePush(improvements, i)

  if (take >= 2) {
    uniquePush(
      strengths,
      en
        ? `Take ${take}: compared with take ${take - 1}, I’m listening for what stabilized — opening calm is one candidate`
        : `Essai ${take} : par rapport à l’essai ${take - 1}, j’écoute ce qui s’est stabilisé — le calme du début en est un candidat`,
      4,
    )
  }

  if (input.arrangement === 'arrangement' && !input.hasPartition) {
    uniquePush(
      strengths,
      en
        ? 'You flagged this as an arrangement — I’m judging your version, not a fixed original'
        : 'Tu as signalé un arrangement — je juge ta version, pas un original figé',
      4,
    )
  }

  // Guarantee 3 each when possible
  while (strengths.length < 3) {
    const extra = pickN(base.strengths, seed + strengths.length * 13, 1)[0]
    if (!extra) break
    uniquePush(strengths, extra)
  }
  while (weaknesses.length < 3) {
    const extra = pickN(base.weaknesses, seed + weaknesses.length * 19, 1)[0]
    if (!extra) break
    uniquePush(weaknesses, extra)
  }
  while (improvements.length < 3) {
    const extra = pickN(base.improvements, seed + improvements.length * 23, 1)[0]
    if (!extra) break
    uniquePush(improvements, extra)
  }

  const dur = features?.durationSec
  const dens =
    features && !features.weakSignal
      ? en
        ? `~${features.attacksPerSec.toFixed(1)} attacks/s`
        : `~${features.attacksPerSec.toFixed(1)} attaques/s`
      : null

  let greeting: string
  if (signals.honesty.length) {
    greeting = en
      ? `${name}, on “${piece}” — ${signals.honesty[0]}`
      : `${name}, sur « ${piece} » — ${signals.honesty[0]}`
  } else if (!input.hasPartition) {
    const options = en
      ? [
          `${name}, I listened to “${piece}” by ear${dur ? ` (${Math.round(dur)}s)` : ''}. Here’s what this take actually shows.`,
          `${name}, take ${take} on “${piece}”${dens ? ` · ${dens}` : ''}. Intention is clear — now the joints.`,
          `${name}, “${piece}” without a score: I’m judging sound and shape only.`,
        ]
      : [
          `${name}, j’ai écouté « ${piece} » à l’oreille${dur ? ` (${Math.round(dur)}s)` : ''}. Voici ce que montre cette prise.`,
          `${name}, essai ${take} sur « ${piece} »${dens ? ` · ${dens}` : ''}. L’intention est claire — maintenant les joints.`,
          `${name}, « ${piece} » sans partition : je juge le son et la forme seulement.`,
        ]
    greeting = options[(take - 1 + seed) % options.length]
  } else {
    const options = en
      ? [
          `${name}, nice take on “${piece}”${dur ? ` (${Math.round(dur)}s)` : ''}. Reading and intention are already talking.`,
          `${name}, I followed “${piece}” with the score${dens ? ` · ${dens}` : ''}. Real work shows — we refine the joints.`,
          `${name}, “${piece}” sounds committed. We don’t rewrite the page — we fix what this take revealed.`,
        ]
      : [
          `${name}, belle prise sur « ${piece} »${dur ? ` (${Math.round(dur)}s)` : ''}. Lecture et intention se parlent déjà.`,
          `${name}, j’ai suivi « ${piece} » avec la partition${dens ? ` · ${dens}` : ''}. Il y a du vrai travail — on affine les joints.`,
          `${name}, « ${piece} » sonne engagé. On ne réécrit pas la page — on corrige ce que cette prise révèle.`,
        ]
    greeting = options[(take - 1 + seed) % options.length]
  }

  const focusOptions = en
    ? [
        `Take ${take + 1}: one goal only — steady tempo on a short passage. Nothing else.`,
        `Take ${take + 1}: only the fragile ending. Keep the body of the last notes.`,
        `Take ${take + 1}: contrast only — soft answer after every bold gesture.`,
        `Take ${take + 1}: density only — leave one intentional rest every 4 bars.`,
      ]
    : [
        `Essai ${take + 1} : un seul objectif — tempo stable sur un passage court.`,
        `Essai ${take + 1} : uniquement la fin fragile. Garde le corps des dernières notes.`,
        `Essai ${take + 1} : contraste seulement — réponse douce après chaque geste fort.`,
        `Essai ${take + 1} : densité seulement — un silence volontaire toutes les 4 mesures.`,
      ]

  const doneFocus = en
    ? '3 takes done. Keep one cue from this report, switch pieces or rest, come back tomorrow.'
    : '3 essais faits. Garde une consigne de ce retour, change de morceau ou repose-toi, reviens demain.'

  return {
    headline: piece,
    greeting,
    overview: signals.honesty[0] || '',
    atmosphere: '',
    technique: '',
    rhythm: dens || '',
    strengths: strengths.slice(0, 3),
    weaknesses: weaknesses.slice(0, 3),
    improvements: improvements.slice(0, 3),
    nextFocus: takesLeft > 0 ? focusOptions[(seed + take) % focusOptions.length] : doneFocus,
    takesLeft,
  }
}
