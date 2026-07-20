import { useEffect, useRef, useState } from 'react'

const PRACTICE_CUES = [
  { text: 'Good job — le phrasé respire bien.', tone: 'good' as const },
  { text: 'Attention au rythme sur ce passage.', tone: 'warn' as const },
  { text: 'Nice — tiens la tenue jusqu’au bout.', tone: 'good' as const },
  { text: 'Un peu plus de stabilité sur le tempo.', tone: 'warn' as const },
  { text: 'Bravo, ça sonne juste ici.', tone: 'good' as const },
]

const RECORD_CUES = [
  'Nice job !',
  'Tu y es… continue.',
  'Belle présence.',
  'Good job !',
]

export function useAriaCues(active: boolean, mode: 'practice' | 'record') {
  const [cue, setCue] = useState<{ text: string; tone: 'good' | 'warn' | 'neutral' } | null>(null)
  const index = useRef(0)

  useEffect(() => {
    if (!active) {
      setCue(null)
      return
    }

    const pool = mode === 'practice' ? PRACTICE_CUES : RECORD_CUES.map((text) => ({ text, tone: 'good' as const }))

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

export function analyzePerformance(input: {
  pieceName: string
  hasPartition: boolean
  firstName: string
  arrangement: 'arrangement' | 'original' | null
  takesUsed: number
  maxTakes: number
}) {
  const takesLeft = Math.max(0, input.maxTakes - input.takesUsed)

  if (!input.hasPartition) {
    return {
      headline: `Compte rendu — ${input.pieceName}`,
      encouragement: `${input.firstName}, j’ai bien entendu ta performance. Sans partition, je reste honnête : je peux t’encourager, mais mon analyse est plus globale.`,
      strengths: [
        'Intention musicale perceptible dès les premières mesures',
        'Engagement dans le jeu — tu ne te caches pas',
        input.arrangement === 'arrangement'
          ? 'Tu as précisé que c’est un arrangement : utile pour cadrer mon écoute'
          : 'Tu as indiqué la version originale : je m’appuie sur cette piste',
      ],
      improvements: [
        'Pour un retour plus précis (notes / rythme mesure par mesure), ajoute une partition au prochain morceau',
        'Refais un take plus court et ciblé sur le passage qui te semble fragile',
        takesLeft > 0
          ? `Il te reste ${takesLeft} essai${takesLeft > 1 ? 's' : ''} sur ce morceau — digère ce retour avant de rejouer`
          : 'Tu as utilisé tes 3 essais : respire, change de morceau, reviens plus tard',
      ],
      takesLeft,
    }
  }

  return {
    headline: `Compte rendu — ${input.pieceName}`,
    encouragement: `${input.firstName}, belle trace. Aria a écouté ta performance avec la partition sous les yeux.`,
    strengths: [
      'Lecture et intention alignées sur le passage choisi',
      'Présence dans l’enregistrement — ça laisse une vraie empreinte',
      'Tu as pris le temps de t’entraîner avant de graver le take',
    ],
    improvements: [
      'Travaille le passage où le rythme a flotté — un cran plus lent, puis remonte',
      'Soutiens le souffle / le bras sur les tenues pour éviter les chutes de son',
      takesLeft > 0
        ? `Encore ${takesLeft} take${takesLeft > 1 ? 's' : ''} possible${takesLeft > 1 ? 's' : ''} : un seul objectif clair par essai`
        : '3 takes atteints : la partition se range. Choisis un nouveau morceau.',
    ],
    takesLeft,
  }
}
