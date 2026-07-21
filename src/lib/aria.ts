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

/** Retour court, ton coach — pas un rapport IA. */
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

  if (!input.hasPartition) {
    return {
      headline: input.pieceName,
      greeting: `${name}, j’ai écouté. L’intention est là.`,
      overview: '',
      atmosphere: '',
      technique: '',
      rhythm: '',
      strengths: [
        'Tu t’engages vraiment — on l’entend',
        'La présence tient jusqu’à la fin',
      ],
      improvements: [
        'Choisis un passage court et rejoue-le plus lent',
        'Un seul objectif pour le prochain essai (tempo ou tenues)',
      ],
      nextFocus:
        takesLeft > 0
          ? 'Prochain essai : un seul passage fragile, lent puis normal.'
          : '3 essais faits — change de morceau, reviens plus tard.',
      takesLeft,
    }
  }

  return {
    headline: input.pieceName,
    greeting: `${name}, belle prise. Lecture et intention se tiennent.`,
    overview: '',
    atmosphere: '',
    technique: '',
    rhythm: '',
    strengths: [
      'Tu prépares avant d’enregistrer — ça s’entend',
      'Le phrasé a des respirations naturelles',
    ],
    improvements: [
      'Isole le passage qui flotte : plus lent, 3 fois propres',
      'Soutiens les tenues jusqu’au bout de phrase',
    ],
    nextFocus:
      takesLeft > 0
        ? 'Prochain essai : uniquement le passage fragile, enregistrement court.'
        : '3 essais faits — nouveau morceau, une seule consigne en tête.',
    takesLeft,
  }
}
