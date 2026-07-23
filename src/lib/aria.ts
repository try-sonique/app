import { useEffect, useRef, useState } from 'react'
import type { AriaFeedback } from '../types'
import { getLocale, t } from './presets'

const PRACTICE_CUES_FR = [
  { text: 'Bien — le phrasé respire.', tone: 'good' as const },
  { text: 'Attention au rythme ici.', tone: 'warn' as const },
  { text: 'Tiens la tenue jusqu’au bout.', tone: 'good' as const },
  { text: 'Stabilise un peu le tempo.', tone: 'warn' as const },
  { text: 'Ça sonne juste ici.', tone: 'good' as const },
]

const PRACTICE_CUES_EN = [
  { text: 'Nice — the phrasing breathes.', tone: 'good' as const },
  { text: 'Watch the rhythm here.', tone: 'warn' as const },
  { text: 'Hold the sustain all the way through.', tone: 'good' as const },
  { text: 'Steady the tempo a little.', tone: 'warn' as const },
  { text: 'That sounds right here.', tone: 'good' as const },
]

const RECORD_CUES_FR = ['Continue.', 'Belle présence.', 'Tu y es.', 'Nice.']
const RECORD_CUES_EN = ['Keep going.', 'Nice presence.', 'You’ve got this.', 'Nice.']

export function useAriaCues(active: boolean, mode: 'practice' | 'record') {
  const [cue, setCue] = useState<{ text: string; tone: 'good' | 'warn' | 'neutral' } | null>(null)
  const index = useRef(0)
  const locale = getLocale()

  useEffect(() => {
    if (!active) {
      setCue(null)
      return
    }

    const practice = locale === 'en' ? PRACTICE_CUES_EN : PRACTICE_CUES_FR
    const record = locale === 'en' ? RECORD_CUES_EN : RECORD_CUES_FR
    const pool =
      mode === 'practice'
        ? practice
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
  }, [active, mode, locale])

  return cue
}

/**
 * Retour type prof de piano : précis, structuré, chaleureux.
 * Pas un rapport IA — des points concrets + des pistes de travail.
 */
export function analyzePerformance(input: {
  pieceName: string
  hasPartition: boolean
  firstName: string
  arrangement: 'arrangement' | 'original' | null
  takesUsed: number
  maxTakes: number
}): AriaFeedback {
  const copy = t()
  const en = getLocale() === 'en'
  const takesLeft = Math.max(0, input.maxTakes - input.takesUsed)
  const name = input.firstName.trim() || copy.you
  const piece = input.pieceName.trim() || (en ? 'your piece' : 'ton morceau')
  const take = input.takesUsed

  if (!input.hasPartition) {
    if (en) {
      const greetings = [
        `${name}, I listened to “${piece}”. It already feels like someone playing for real.`,
        `${name}, thank you for that take. The intention is clear — now we refine.`,
        `${name}, solid foundation on “${piece}”. Let’s see what holds and what drifts.`,
      ]
      return {
        headline: piece,
        greeting: greetings[(take - 1) % greetings.length],
        overview: '',
        atmosphere: '',
        technique: '',
        rhythm: '',
        strengths: [
          'You commit from the first notes — the presence is there',
          'The sound has warmth: this isn’t a cold reading',
          take >= 2
            ? 'Compared to the last take, you hold phrase endings better'
            : 'You see the gesture through without dropping it',
        ],
        weaknesses: [
          'Tempo pushes a little when emotion rises',
          'Some sustained notes thin out at the end of the phrase',
          'Without a score, transitions between phrases are still finding their place',
        ],
        improvements: [
          'Tempo tip: pick 20–30 seconds, play slower, count out loud, then speed up',
          'Sustain tip: one long note a day, steady release all the way through',
          'Structure tip: split the piece into 3 mini-sections and link them one by one',
        ],
        nextFocus:
          takesLeft > 0
            ? `Take ${take + 1}: one goal only — steady tempo on a short passage. Nothing else.`
            : '3 takes done. Keep one cue (tempo or sustains), switch pieces, come back tomorrow.',
        takesLeft,
      }
    }

    const greetings = [
      `${name}, j’ai écouté « ${piece} ». On sent déjà quelqu’un qui joue pour de vrai.`,
      `${name}, merci pour cette prise. L’intention est claire — maintenant on affine.`,
      `${name}, c’est une belle base sur « ${piece} ». Voyons ce qui tient et ce qui flotte.`,
    ]
    return {
      headline: piece,
      greeting: greetings[(take - 1) % greetings.length],
      overview: '',
      atmosphere: '',
      technique: '',
      rhythm: '',
      strengths: [
        'Tu t’engages dès les premières notes — la présence est là',
        'Le son a une chaleur : on n’est pas dans une lecture froide',
        take >= 2
          ? 'Par rapport à l’essai d’avant, tu tiens mieux la fin de phrase'
          : 'Tu vas jusqu’au bout sans abandonner le geste',
      ],
      weaknesses: [
        'Le tempo accélère un peu quand l’émotion monte',
        'Certaines tenues s’essoufflent en fin de phrase',
        'Sans partition, les transitions entre phrases cherchent encore leur place',
      ],
      improvements: [
        'Piste tempo : choisis 20–30 secondes, joue plus lent, compte à voix haute, puis remonte',
        'Piste tenues : une note longue par jour, souffle/relâchement stable jusqu’au bout',
        'Piste structure : découpe le morceau en 3 mini-sections et enchaîne-les une par une',
      ],
      nextFocus:
        takesLeft > 0
          ? `Essai ${take + 1} : un seul objectif — tempo stable sur un passage court. Rien d’autre.`
          : '3 essais faits. Garde une consigne (tempo ou tenues), change de morceau, reviens demain.',
      takesLeft,
    }
  }

  if (en) {
    const greetings = [
      `${name}, nice take on “${piece}”. Reading and intention are already talking to each other.`,
      `${name}, I followed along with the score. There’s real work here — you can feel it.`,
      `${name}, “${piece}” sounds committed. We refine the joints, not the whole page.`,
    ]
    return {
      headline: piece,
      greeting: greetings[(take - 1) % greetings.length],
      overview: '',
      atmosphere: '',
      technique: '',
      rhythm: '',
      strengths: [
        'You prepare before recording — you can hear it in the stable opening',
        'The phrasing has natural breaths: it sounds human',
        input.arrangement === 'arrangement'
          ? 'You framed the version (arrangement): the listening is more accurate'
          : input.arrangement === 'original'
            ? 'You’re aiming for the original: good instinct for precise work'
            : 'Score reading and gesture stay aligned on the chosen passage',
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
      nextFocus:
        takesLeft > 0
          ? `Take ${take + 1}: only the fragile passage. Short. One cue. Then we listen.`
          : '3 takes done. New piece, one cue in mind (rhythm or sustains).',
      takesLeft,
    }
  }

  const greetings = [
    `${name}, belle prise sur « ${piece} ». Lecture et intention se parlent déjà.`,
    `${name}, j’ai suivi avec la partition. Il y a du vrai travail — on le sent.`,
    `${name}, « ${piece} » sonne engagé. On affine les joints, pas toute la page.`,
  ]

  return {
    headline: piece,
    greeting: greetings[(take - 1) % greetings.length],
    overview: '',
    atmosphere: '',
    technique: '',
    rhythm: '',
    strengths: [
      'Tu prépares avant d’enregistrer — ça s’entend dans la stabilité du début',
      'Le phrasé a des respirations naturelles : ça sonne humain',
      input.arrangement === 'arrangement'
        ? 'Tu as cadré la version (arrangement) : l’écoute est plus juste'
        : input.arrangement === 'original'
          ? 'Tu vises l’original : bon réflexe pour un travail précis'
          : 'L’alignement lecture / geste tient sur le passage choisi',
    ],
    weaknesses: [
      'Aux changements de densité, le rythme flotte un instant',
      'Les tenues perdent un peu de corps en fin de phrase',
      'Les enchaînements (sauts / liaisons) sont encore précipités par endroits',
    ],
    improvements: [
      'Piste rythme : isole 2 mesures fragiles, métronnome lent, 3 répétitions propres, puis remonte',
      'Piste son : travaille les tenues piano → mezzo, sans “tomber” à la fin',
      'Piste lecture : un seul passage difficile, lent, doigts/voix posés, puis une prise “vraie”',
    ],
    nextFocus:
      takesLeft > 0
        ? `Essai ${take + 1} : uniquement le passage fragile. Court. Une consigne. Puis on écoute.`
        : '3 essais faits. Nouveau morceau, une seule consigne en tête (rythme ou tenues).',
    takesLeft,
  }
}
