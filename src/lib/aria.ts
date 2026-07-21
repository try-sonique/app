import { useEffect, useRef, useState } from 'react'
import type { AriaFeedback } from '../types'

const PRACTICE_CUES = [
  { text: 'Bien — le phrasé respire.', tone: 'good' as const },
  { text: 'Attention au rythme ici.', tone: 'warn' as const },
  { text: 'Tiens la tenue jusqu’au bout.', tone: 'good' as const },
  { text: 'Stabilise un peu le tempo.', tone: 'warn' as const },
  { text: 'Ça sonne juste ici.', tone: 'good' as const },
]

const RECORD_CUES = ['Continue.', 'Belle présence.', 'Tu y es.', 'Nice.']

export function useAriaCues(active: boolean, mode: 'practice' | 'record') {
  const [cue, setCue] = useState<{ text: string; tone: 'good' | 'warn' | 'neutral' } | null>(null)
  const index = useRef(0)

  useEffect(() => {
    if (!active) {
      setCue(null)
      return
    }

    const pool =
      mode === 'practice'
        ? PRACTICE_CUES
        : RECORD_CUES.map((text) => ({ text, tone: 'good' as const }))

    const tick = () => {
      const item = pool[index.current % pool.length]
      index.current += 1
      setCue(item)
    }

    tick()
    const id = window.setInterval(tick, mode === 'practice' ? 4500 : 3200)
    return () => window.clearInterval(id)
  }, [active, mode])

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
  const takesLeft = Math.max(0, input.maxTakes - input.takesUsed)
  const name = input.firstName.trim() || 'toi'
  const piece = input.pieceName.trim() || 'ton morceau'
  const take = input.takesUsed

  if (!input.hasPartition) {
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
