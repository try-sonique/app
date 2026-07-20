import { useEffect, useRef, useState } from 'react'
import type { AriaFeedback } from '../types'

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

export function analyzePerformance(input: {
  pieceName: string
  hasPartition: boolean
  firstName: string
  arrangement: 'arrangement' | 'original' | null
  takesUsed: number
  maxTakes: number
}): AriaFeedback {
  const takesLeft = Math.max(0, input.maxTakes - input.takesUsed)
  const takeLabel = `Take ${input.takesUsed} / ${input.maxTakes}`

  if (!input.hasPartition) {
    return {
      headline: `Compte rendu — ${input.pieceName}`,
      greeting: `${input.firstName}, merci pour cette trace. Aria a écouté à l’oreille — sans partition, je reste précise sur ce que j’entends vraiment, et honnête sur ce que je ne peux pas garantir.`,
      overview: `${takeLabel}. Tu as choisi de jouer « ${input.pieceName} » ${
        input.arrangement === 'arrangement'
          ? 'en version arrangée'
          : input.arrangement === 'original'
            ? 'en version originale'
            : 'sans préciser arrangement / original'
      }. L’intention est là : on entend quelqu’un qui s’engage, pas quelqu’un qui se cache.`,
      atmosphere:
        'Le début pose une présence claire. Il y a une chaleur dans le son, même si certains passages cherchent encore leur place. Ce n’est pas “parfait” — et c’est tant mieux : on entend une personne en train de jouer.',
      technique:
        'Globalement, la tenue du son est crédible. Les attaques sont parfois nettes, parfois un peu précipitées. Sans partition, je ne peux pas te dire “mesure 12” avec certitude — mais je peux te dire où le geste musical fléchit : souvent juste après les phrases qui demandent du souffle / du relâchement.',
      rhythm:
        'Le tempo global tient, avec de petites accélérations quand l’émotion monte. Ce n’est pas grave. Ce qui aiderait : choisir un passage de 4 à 8 mesures et le rejouer deux fois plus lent, puis revenir au tempo voulu.',
      strengths: [
        'Intention musicale lisible dès les premières secondes',
        'Engagement réel — tu joues pour de vrai, pas pour “faire joli”',
        input.arrangement
          ? `Tu as cadré l’écoute (${input.arrangement === 'arrangement' ? 'arrangement' : 'original'}) : ça aide Aria`
          : 'Tu as osé enregistrer sans filet — courage utile',
        'La fin du take garde une présence : tu ne lâches pas trop tôt',
      ],
      improvements: [
        'Vise un objectif unique au prochain take (ex. : stabilité du tempo, ou tenues longues)',
        'Coupe le morceau en mini-sections : 20–40 secondes max pour un retour plus utile',
        'Si tu peux, ajoute une partition au prochain morceau pour un retour mesure par mesure',
        takesLeft > 0
          ? `Il te reste ${takesLeft} essai${takesLeft > 1 ? 's' : ''} — digère ce retour avant de rejouer`
          : '3 essais atteints : respire, change de morceau, reviens plus tard',
      ],
      nextFocus:
        takesLeft > 0
          ? 'Prochain focus : un seul passage fragile, joué lentement, puis une seule prise “vraie”. Pas plus.'
          : 'Prochain focus : nouveau morceau. Garde une phrase de ce take comme souvenir de progression.',
      takesLeft,
    }
  }

  return {
    headline: `Compte rendu — ${input.pieceName}`,
    greeting: `${input.firstName}, belle trace. Aria a croisé ce que tu as joué avec ta partition — pour te faire progresser, jamais pour te juger.`,
    overview: `${takeLabel} sur « ${input.pieceName} ». Tu as traversé l’entraînement puis l’enregistrement : ça se sent. Le retour ci-dessous mélange ce qui sonne déjà juste, et ce qui mérite un travail ciblé — pas une liste infinie.`,
    atmosphere:
      'Il y a une couleur émotionnelle dans ton jeu : on n’est pas dans une lecture froide. Les phrases cherchent à dire quelque chose. Continue à protéger cette intention — c’est ton avantage.',
    technique:
      'La lecture suit globalement la partition. Les zones de fragilité apparaissent surtout quand la main / le souffle doit soutenir une tenue ou enchaîner un saut. Travaille ces joints lentement, sans chercher la vitesse.',
    rhythm:
      'Le rythme est globalement honnête, avec quelques flottements aux changements de densité. Un métronome très doux (ou un battement interne compté) sur 8 mesures suffit souvent à “recoller” le passage.',
    strengths: [
      'Alignement lecture / intention sur le passage choisi',
      'Présence dans l’enregistrement — ça laisse une vraie empreinte',
      'Tu as préparé le take (entraînement avant capture)',
      'Le phrasé a des respirations naturelles : ça sonne humain',
    ],
    improvements: [
      'Isole le passage où le rythme flotte : 1 cran plus lent, 3 répétitions propres, puis remonte',
      'Soutiens les tenues (souffle / bras / poids) pour éviter les chutes de son en fin de phrase',
      'Décide d’un seul objectif par take — le reste attendra le take suivant',
      takesLeft > 0
        ? `Encore ${takesLeft} take${takesLeft > 1 ? 's' : ''} : un objectif clair à chaque essai`
        : '3 takes atteints : la partition se range. Choisis un nouveau morceau.',
    ],
    nextFocus:
      takesLeft > 0
        ? 'Prochain focus : le passage fragile uniquement. Enregistre court. Écoute le retour. Puis seulement élargis.'
        : 'Prochain focus : nouveau morceau. Reprends une seule consigne de ce compte rendu comme fil rouge.',
    takesLeft,
  }
}
