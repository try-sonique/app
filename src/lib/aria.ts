import { useEffect, useRef, useState } from 'react'
import type { AriaFeedback } from '../types'
import type { AudioFeatures } from './audioFeatures'
import { getLocale, t } from './presets'

type Cue = { text: string; tone: 'good' | 'warn' | 'neutral' }

const PRACTICE_CUES_FR: Cue[] = [
  { text: 'Bien — le phrasé respire.', tone: 'good' },
  { text: 'Attention au rythme ici.', tone: 'warn' },
  { text: 'Tiens la tenue jusqu’au bout.', tone: 'good' },
  { text: 'Stabilise un peu le tempo.', tone: 'warn' },
  { text: 'Ça sonne juste ici.', tone: 'good' },
]

const PRACTICE_CUES_EN: Cue[] = [
  { text: 'Nice — the phrasing breathes.', tone: 'good' },
  { text: 'Watch the rhythm here.', tone: 'warn' },
  { text: 'Hold the sustain all the way through.', tone: 'good' },
  { text: 'Steady the tempo a little.', tone: 'warn' },
  { text: 'That sounds right here.', tone: 'good' },
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
    const base = locale === 'en' ? PRACTICE_CUES_EN : PRACTICE_CUES_FR
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
  }, [active, mode, locale, pieceId])

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

function piecePack(pieceId: string | null, en: boolean): PiecePack {
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
            'Color tip: play the first 4 bars pp → p, listen for the overtones to bloom',
            'Pedal tip: change on the harmony, not on every note — half-pedal once',
            'Space tip: mark two “breath bars”, then take only those in the next run',
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
            'Piste couleur : 4 premières mesures pp → p, écoute les harmoniques s’ouvrir',
            'Piste pédale : change sur l’harmonie, pas sur chaque note — un demi-pédale',
            'Piste souffle : marque 2 mesures “respiration”, puis ne rejoue que celles-là',
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
            'Le rebond ragtime se lit — la main gauche tient la piste de danse',
            'Les syncopes ont du caractère, pas seulement de la justesse',
            'Tu assumes le stride au lieu de le lisser',
          ],
          weaknesses: [
            'Quand la droite densifie, le stride gauche accélère d’un cheveu',
            'Certains contretemps arrivent tôt — le swing devient des croches droites',
            'Les fins de phrase coupent au lieu de basculer vers la mesure suivante',
          ],
          improvements: [
            'Piste swing : compte 1-e-2-e à voix haute sur 8 mesures, puis coupe la voix',
            'Piste stride : main gauche seule, métronome sur 2 et 4, puis ajoute la mélodie',
            'Piste appui : exagère le dernier contretemps de chaque unité de 4, puis relâche',
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
            'Balance tip: melody forte / accompaniment piano for one clean pass',
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
            'Les formules Alberti de gauche passent plus fort que la mélodie une mesure',
          ],
          improvements: [
            'Piste motif : 3 passes lentes de la cellule d’ouverture, puis a tempo sans pousser',
            'Piste pont : isole les 2 mesures avant le milieu, métronome −20 %',
            'Piste balance : mélodie forte / accompagnement piano sur une passe propre',
          ],
        }
  }

  // generic with-partition
  return en
    ? {
        strengths: [
          'You prepare before recording — audible in the stable opening',
          'Phrasing has natural breaths: it sounds human',
          'Score reading and gesture stay aligned on the chosen passage',
        ],
        weaknesses: [
          'At density changes, the rhythm floats for a moment',
          'Sustained notes lose a bit of body at phrase endings',
          'Transitions (jumps / slurs) still rush in places',
        ],
        improvements: [
          'Rhythm tip: isolate 2 fragile measures, slow metronome, 3 clean reps, then speed up',
          'Tone tip: work sustains piano → mezzo, without dropping at the end',
          'Reading tip: one hard passage, slow, hands settled, then one “real” take',
        ],
      }
    : {
        strengths: [
          'Tu prépares avant d’enregistrer — ça s’entend dans la stabilité du début',
          'Le phrasé a des respirations naturelles : ça sonne humain',
          'L’alignement lecture / geste tient sur le passage choisi',
        ],
        weaknesses: [
          'Aux changements de densité, le rythme flotte un instant',
          'Les tenues perdent un peu de corps en fin de phrase',
          'Les enchaînements (sauts / liaisons) sont encore précipités par endroits',
        ],
        improvements: [
          'Piste rythme : isole 2 mesures fragiles, métronome lent, 3 répétitions propres, puis remonte',
          'Piste son : travaille les tenues piano → mezzo, sans “tomber” à la fin',
          'Piste lecture : un seul passage difficile, lent, doigts posés, puis une prise “vraie”',
        ],
      }
}

function featureOverlays(
  features: AudioFeatures | null,
  meta: PerformanceMeta | undefined,
  en: boolean,
): { strength?: string; weakness?: string; improvement?: string; durationNote?: string } {
  const out: {
    strength?: string
    weakness?: string
    improvement?: string
    durationNote?: string
  } = {}

  const played = meta?.playedSec ?? features?.durationSec ?? 0
  const total = meta?.totalSec ?? features?.durationSec ?? 0
  const completion = total > 0 ? played / total : 1

  if (completion < 0.45) {
    out.durationNote = en
      ? 'You cut the take early — fine for a focus pass, but Aria only heard the opening.'
      : 'Tu as coupé la prise tôt — OK pour un focus, mais Aria n’a entendu que le début.'
    out.weakness = en
      ? 'The take is short: hard to judge how the middle section holds'
      : 'La prise est courte : difficile de juger comment tient le milieu'
  } else if (completion >= 0.92) {
    out.strength = en
      ? 'You carried the take to the end — stamina and intention both show'
      : 'Tu as mené la prise jusqu’au bout — endurance et intention se voient'
  }

  if (!features || features.durationSec < 1) return out

  if (features.silenceRatio > 0.42) {
    out.weakness = en
      ? 'Long gaps between phrases — the line loses continuity'
      : 'Longs silences entre les phrases — la ligne perd sa continuité'
    out.improvement = en
      ? 'Flow tip: join two phrases with a softer bridge note, no full stop'
      : 'Piste flux : relie deux phrases avec une note-pont plus douce, sans stop total'
  } else if (features.silenceRatio < 0.12 && features.attackCount > 40) {
    out.weakness = en
      ? 'Very dense attack stream — little recovery between gestures'
      : 'Flux d’attaques très dense — peu de récupération entre les gestes'
    out.improvement = en
      ? 'Space tip: insert one intentional rest every 4 bars on the next take'
      : 'Piste espace : une silence volontaire toutes les 4 mesures au prochain essai'
  }

  if (features.dynamicRange < 0.04) {
    out.weakness =
      out.weakness ||
      (en
        ? 'Dynamics stay in a narrow band — the story needs more contrast'
        : 'La dynamique reste dans une bande étroite — l’histoire demande plus de contraste')
  } else if (features.dynamicRange > 0.12) {
    out.strength =
      out.strength ||
      (en
        ? 'Clear dynamic contrast — soft and full actually talk to each other'
        : 'Beau contraste dynamique — le doux et le plein se parlent vraiment')
  }

  return out
}

/**
 * Retour type prof de piano : précis, structuré, chaleureux.
 * Personnalisé par morceau + signaux audio de la prise.
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
  const pack = piecePack(pieceId, en)
  const overlay = featureOverlays(input.meta?.features ?? null, input.meta, en)

  const strengths = [...pack.strengths]
  const weaknesses = [...pack.weaknesses]
  const improvements = [...pack.improvements]

  if (overlay.strength) strengths.unshift(overlay.strength)
  if (overlay.weakness) weaknesses.unshift(overlay.weakness)
  if (overlay.improvement) improvements.unshift(overlay.improvement)

  if (take >= 2) {
    strengths.splice(
      1,
      0,
      en
        ? 'Compared with the previous take, the opening sits more calmly'
        : 'Par rapport à l’essai d’avant, le début est plus posé',
    )
  }

  if (!input.hasPartition) {
    const greetings = en
      ? [
          `${name}, I listened to “${piece}”. It already feels like someone playing for real.`,
          `${name}, thank you for that take. The intention is clear — now we refine.`,
          `${name}, solid foundation on “${piece}”. Let’s see what holds and what drifts.`,
        ]
      : [
          `${name}, j’ai écouté « ${piece} ». On sent déjà quelqu’un qui joue pour de vrai.`,
          `${name}, merci pour cette prise. L’intention est claire — maintenant on affine.`,
          `${name}, c’est une belle base sur « ${piece} ». Voyons ce qui tient et ce qui flotte.`,
        ]
    return {
      headline: piece,
      greeting: greetings[(take - 1) % greetings.length],
      overview: overlay.durationNote || '',
      atmosphere: '',
      technique: '',
      rhythm: '',
      strengths: strengths.slice(0, 3),
      weaknesses: weaknesses.slice(0, 3),
      improvements: improvements.slice(0, 3),
      nextFocus:
        takesLeft > 0
          ? en
            ? `Take ${take + 1}: one goal only — steady tempo on a short passage. Nothing else.`
            : `Essai ${take + 1} : un seul objectif — tempo stable sur un passage court. Rien d’autre.`
          : en
            ? '3 takes done. Keep one cue (tempo or sustains), switch pieces, come back tomorrow.'
            : '3 essais faits. Garde une consigne (tempo ou tenues), change de morceau, reviens demain.',
      takesLeft,
    }
  }

  const greetings = en
    ? [
        `${name}, nice take on “${piece}”. Reading and intention are already talking.`,
        `${name}, I followed with the score. There’s real work here — you can feel it.`,
        `${name}, “${piece}” sounds committed. We refine the joints, not the whole page.`,
      ]
    : [
        `${name}, belle prise sur « ${piece} ». Lecture et intention se parlent déjà.`,
        `${name}, j’ai suivi avec la partition. Il y a du vrai travail — on le sent.`,
        `${name}, « ${piece} » sonne engagé. On affine les joints, pas toute la page.`,
      ]

  let greeting = greetings[(take - 1) % greetings.length]
  if (overlay.durationNote) {
    greeting = `${greeting} ${overlay.durationNote}`
  }

  return {
    headline: piece,
    greeting,
    overview: '',
    atmosphere: '',
    technique: '',
    rhythm: '',
    strengths: strengths.slice(0, 3),
    weaknesses: weaknesses.slice(0, 3),
    improvements: improvements.slice(0, 3),
    nextFocus:
      takesLeft > 0
        ? en
          ? `Take ${take + 1}: only the fragile passage. Short. One cue. Then we listen.`
          : `Essai ${take + 1} : uniquement le passage fragile. Court. Une consigne. Puis on écoute.`
        : en
          ? '3 takes done. New piece, one cue in mind (rhythm or color).'
          : '3 essais faits. Nouveau morceau, une seule consigne en tête (rythme ou couleur).',
    takesLeft,
  }
}
