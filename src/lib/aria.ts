import { useEffect, useRef, useState } from 'react'
import type { AriaFeedback } from '../types'
import type { AudioFeatures } from './audioFeatures'
import {
  BY_EAR_CUES_EN,
  BY_EAR_CUES_FR,
  PIECE_CUES,
  PRACTICE_CUES_EN,
  PRACTICE_CUES_FR,
  RECORD_CUES_EN,
  RECORD_CUES_FR,
  type Cue,
} from './ariaCues'
import { getLocale, t } from './presets'

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
    const pool = mode === 'practice' ? [...piecePool, ...base] : record

    index.current = 0
    const tick = () => {
      const item = pool[index.current % pool.length]
      index.current += 1
      setCue(item)
    }

    tick()
    const id = window.setInterval(tick, mode === 'practice' ? 4500 : 3800)
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

/** Fill list up to `need` from `source` without hanging on duplicates. */
function fillTo(target: string[], source: string[], need: number, seed: number) {
  if (target.length >= need || !source.length) return
  for (const item of pickN(source, seed, source.length)) {
    if (target.length >= need) return
    uniquePush(target, item, need)
  }
}

/** Stable “character” hints from the piece title (not a real music model). */
function titleFlavor(pieceName: string, en: boolean): PiecePack {
  const n = pieceName.toLowerCase()
  if (/rhapsod|bohemian|queen|mercury/.test(n)) {
    return en
      ? {
          strengths: [
            'You commit to the theatrical shifts. this piece needs that courage',
            'The quieter pockets already feel intentional, not shy',
            'You hold long lines without collapsing the drama into mush',
          ],
          weaknesses: [
            'Big section changes still wobble before the new character lands',
            'Power moments can flatten the quieter answer that should follow',
            'Some transitions arrive early. the theatre needs a beat to breathe',
          ],
          improvements: [
            'Character tip: mark 2 mood changes, play only the bar before/after each',
            'Contrast tip: one pass soft-only, one pass bold-only, then stitch',
            'Landing tip: freeze 1 beat at each section joint, then release',
          ],
        }
      : {
          strengths: [
            'Tu assumes les changements théâtraux. ce morceau en a besoin',
            'Les poches plus douces sonnent déjà choisies, pas timides',
            'Tu tiens les grandes lignes sans noyer le drame',
          ],
          weaknesses: [
            'Les gros changements de section tremblent avant le nouveau caractère',
            'Les moments de puissance aplatissent parfois la réponse douce',
            'Certaines transitions arrivent tôt. le théâtre a besoin d’un temps',
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
            'The soft atmosphere is believable. you don’t force the hush',
            'You leave air between gestures; the night-piece needs that',
            'Tone stays rounded instead of poking every attack',
          ],
          weaknesses: [
            'When the line rises, the soft color can break into a harder edge',
            'Phrase endings thin out before the next harmony arrives',
            'Pedal / sustain blur can wash the middle voices for a bar',
          ],
          improvements: [
            'Color tip: 4 bars pp → p only. listen for overtones, not volume',
            'Ending tip: sing the last note of each phrase, then match it on keys',
            'Space tip: mark two breath bars and protect them like gold',
          ],
        }
      : {
          strengths: [
            'L’atmosphère douce est crédible. tu ne forces pas le chuchotement',
            'Tu laisses de l’air entre les gestes ; ce morceau nocturne en a besoin',
            'Le son reste rond au lieu de piquer chaque attaque',
          ],
          weaknesses: [
            'Quand la ligne monte, la couleur douce peut durcir',
            'Les fins de phrase s’amincissent avant l’harmonie suivante',
            'Sustain / pédale peut brouiller le medium une mesure',
          ],
          improvements: [
            'Piste couleur : 4 mesures pp → p seulement. écoute les harmoniques',
            'Piste fin : chante la dernière note de chaque phrase, puis retrouve-la',
            'Piste souffle : marque deux mesures respiration et protège-les',
          ],
        }
  }
  if (/rag|entertain|joplin|swing|blues|jazz|funk|groove/.test(n)) {
    return en
      ? {
          strengths: [
            'The pulse already dances. left-hand feel carries the room',
            'Syncopation has character, not just correctness',
            'You commit to the groove instead of smoothing it flat',
          ],
          weaknesses: [
            'When the right hand densifies, the pulse rushes a hair',
            'Some off-beats arrive early. swing flattens briefly',
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
            'Le pulse danse déjà. la main gauche porte la pièce',
            'La syncope a du caractère, pas seulement de la justesse',
            'Tu assumes le groove au lieu de le lisser',
          ],
          weaknesses: [
            'Quand la droite densifie, le pulse accélère d’un cheveu',
            'Certains contretemps arrivent tôt. le swing s’aplatit un instant',
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
            'Drive is clear. the take doesn’t apologize for power',
            'Accents already carve a shape inside the density',
          ],
          weaknesses: [
            'Dense passages can crush the quieter joint that sells the drama',
            'Attacks stack too evenly. peaks need hierarchy',
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
            'L’élan est clair. la prise n’excuse pas sa puissance',
            'Les accents sculptent déjà une forme dans la densité',
          ],
          weaknesses: [
            'Les passages denses écrasent parfois le joint plus doux',
            'Les attaques sont trop égales. les pics ont besoin d’une hiérarchie',
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
        'You prepare before recording. audible in the stable opening',
        'Phrasing has natural breaths: it sounds human',
        'Intention is readable even when the notes are still settling',
        'You stay with the line instead of abandoning mid-phrase',
        'The take has a clear start. listeners know where they are',
        'Touch already has personality; it isn’t generic practice noise',
      ]
    : [
        'Tu prépares avant d’enregistrer. ça s’entend dans le début',
        'Le phrasé a des respirations naturelles : ça sonne humain',
        'L’intention se lit même si les notes se placent encore',
        'Tu restes avec la ligne au lieu d’abandonner au milieu',
        'La prise a un vrai départ. on sait où on est',
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
            'The opening haze is already there. Debussy needs that soft attack',
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
            'Pedal tip: change on the harmony, not on every note. half-pedal once',
            'Space tip: mark two breath bars, then take only those in the next run',
          ],
        }
      : {
          strengths: [
            'La brume du début est déjà là. Debussy a besoin de cette attaque douce',
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
            'The ragtime bounce is readable. left hand keeps the dance floor',
            'Syncopations land with character, not just accuracy',
            'You commit to the stride pulse instead of smoothing it away',
          ],
          weaknesses: [
            'When the right hand densifies, the left-hand stride rushes a hair',
            'Some off-beats arrive early. swing flattens into straight eighths',
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
            'Le rebond ragtime se lit. la main gauche tient la piste',
            'Les syncopes ont du caractère, pas seulement de la justesse',
            'Tu assumes le stride au lieu de le lisser',
          ],
          weaknesses: [
            'Quand la droite densifie, le stride gauche accélère d’un cheveu',
            'Certains contretemps arrivent tôt. le swing devient des croches droites',
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
            'The motif speaks clearly. Beethoven’s earworm stays articulate',
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
            'Le motif parle clairement. l’air de Beethoven reste articulé',
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

/** Map take signals → concrete coaching. Prefer “do this next” over apologies. */
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
    notes.weaknesses.push(
      en
        ? 'This take is too thin or too short to coach in detail'
        : 'Cette prise est trop fine ou trop courte pour un coaching détaillé',
    )
    notes.improvements.push(
      en
        ? 'Do this: mic closer, 25–40 steady seconds, one short passage only'
        : 'À faire: micro plus près, 25–40 secondes stables, un seul passage court',
    )
    notes.honesty.push(
      en
        ? 'I need a clearer take before I can get specific.'
        : 'Il me faut une prise plus claire avant d’être précise.',
    )
    return notes
  }

  if (completion < 0.45 && total > 0) {
    notes.weaknesses.push(
      en
        ? `You stopped early (~${Math.round(played)}s). I mainly heard the opening.`
        : `Tu as coupé tôt (~${Math.round(played)}s). J’ai surtout entendu le début.`,
    )
    notes.improvements.push(
      en
        ? 'Do this: same opening + 8 more bars. Don’t stop mid-arc.'
        : 'À faire: même début + 8 mesures de plus. Ne coupe pas au milieu.',
    )
  } else if (f.durationSec >= 20) {
    notes.strengths.push(
      en
        ? `You held ${Math.round(f.durationSec)}s. Stamina is there.`
        : `Tu as tenu ${Math.round(f.durationSec)}s. L’endurance est là.`,
    )
  } else if (f.durationSec < 12) {
    notes.weaknesses.push(
      en
        ? `Short take (${Math.round(f.durationSec)}s). Hard to judge the middle.`
        : `Prise courte (${Math.round(f.durationSec)}s). Difficile de juger le milieu.`,
    )
    notes.improvements.push(
      en
        ? 'Do this: one full phrase start-to-end, no restart mid-way.'
        : 'À faire: une phrase complète du début à la fin, sans reprendre au milieu.',
    )
  }

  if (f.silenceRatio > 0.45) {
    notes.weaknesses.push(
      en
        ? 'Long gaps between phrases. The line breaks.'
        : 'Longs silences entre les phrases. La ligne se casse.',
    )
    notes.improvements.push(
      en
        ? 'Do this: connect 2 phrases with one soft bridge note. No full stop.'
        : 'À faire: relie 2 phrases avec une note-pont douce. Pas d’arrêt total.',
    )
  } else if (f.silenceRatio < 0.1 && f.attacksPerSec > 3.2) {
    notes.weaknesses.push(
      en
        ? 'Too dense. Almost no recovery between gestures.'
        : 'Trop dense. Presque aucune récupération entre les gestes.',
    )
    notes.improvements.push(
      en
        ? 'Do this: one intentional rest every 4 bars. Count it out loud once.'
        : 'À faire: un silence volontaire toutes les 4 mesures. Compte-le à voix haute une fois.',
    )
  } else if (f.silenceRatio >= 0.18 && f.silenceRatio <= 0.35) {
    notes.strengths.push(
      en
        ? 'Breathing between phrases sounds natural.'
        : 'Les respirations entre phrases sonnent naturelles.',
    )
  }

  if (f.dynamicRange < 0.035) {
    notes.weaknesses.push(
      en
        ? 'Dynamics stay flat. Soft and loud barely differ.'
        : 'Dynamique trop plate. Le doux et le fort se ressemblent trop.',
    )
    notes.improvements.push(
      en
        ? 'Do this: same 4 bars twice. Pass 1 soft. Pass 2 fuller. Then stitch.'
        : 'À faire: les mêmes 4 mesures deux fois. Passe 1 douce. Passe 2 plus pleine. Puis assemble.',
    )
  } else if (f.dynamicRange > 0.11) {
    notes.strengths.push(
      en
        ? 'Clear dynamic contrast. Soft and full talk to each other.'
        : 'Beau contraste dynamique. Le doux et le plein se parlent.',
    )
  }

  if (f.endingEnergy < f.openingEnergy * 0.55 && f.durationSec > 10) {
    notes.weaknesses.push(
      en
        ? 'The ending loses body. You fade when the phrase still needs weight.'
        : 'La fin perd du corps. Tu t’éteins alors que la phrase a encore besoin de poids.',
    )
    notes.improvements.push(
      en
        ? 'Do this: loop only the last 8 seconds until they stay alive 3 times.'
        : 'À faire: boucle seulement les 8 dernières secondes jusqu’à 3 fois vivantes.',
    )
  } else if (f.endingEnergy > f.openingEnergy * 1.35 && f.durationSec > 10) {
    notes.strengths.push(
      en
        ? 'The ending is stronger than the opening. You build.'
        : 'La fin est plus forte que le début. Tu construis.',
    )
  }

  if (f.openingEnergy > f.middleEnergy * 1.4 && f.durationSec > 12) {
    notes.weaknesses.push(
      en
        ? 'Opening clearer than the middle. Focus drops after the first lift.'
        : 'Début plus clair que le milieu. L’attention baisse après l’élan.',
    )
    notes.improvements.push(
      en
        ? 'Do this: start at the middle dip. 5 slow reps, then one real take.'
        : 'À faire: commence au creux du milieu. 5 reps lentes, puis une vraie prise.',
    )
  }

  if (f.attacksPerSec > 0.4 && f.attacksPerSec < 1.1) {
    notes.strengths.push(
      en
        ? 'Attack pacing is measured. Not frantic.'
        : 'Rythme d’attaques mesuré. Pas frénétique.',
    )
  } else if (f.attacksPerSec >= 2.8) {
    notes.weaknesses.push(
      en
        ? `High density (${f.attacksPerSec.toFixed(1)} attacks/s). Tempo is likely pushing.`
        : `Densité élevée (${f.attacksPerSec.toFixed(1)} attaques/s). Le tempo pousse probablement.`,
    )
    notes.improvements.push(
      en
        ? 'Do this: same passage at −15% metronome until it feels boring-stable.'
        : 'À faire: même passage à −15% métronome jusqu’à ce que ce soit ennuyeusement stable.',
    )
  }

  if (f.energyVariance > 0.0025 && f.dynamicRange > 0.08) {
    notes.strengths.push(
      en
        ? 'The take has a shape. Not a flat line.'
        : 'La prise a une forme. Pas une ligne plate.',
    )
  }

  return notes
}

function stripTipLabel(s: string): string {
  return s
    .replace(/^(Do this:\s*|À faire:\s*)/i, '')
    .replace(
      /^(Pulse tip:\s*|Tone tip:\s*|Listen tip:\s*|Rhythm tip:\s*|Shape tip:\s*|Focus tip:\s*|Space tip:\s*|Flow tip:\s*|Close tip:\s*|Tempo tip:\s*|Contrast tip:\s*|Groove tip:\s*|Swing tip:\s*|Landing tip:\s*|Color tip:\s*|Ending tip:\s*|Character tip:\s*|Power tip:\s*|Hierarchy tip:\s*|Recovery tip:\s*|Piste [^:]+:\s*)/i,
      '',
    )
    .trim()
}

/**
 * Aria report: signal-first, then piece flavor.
 * Goal: actionable weaknesses + one clear next-take job.
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

  for (const s of pickN(base.strengths, seed + take * 3, 1)) uniquePush(strengths, s)
  for (const w of pickN(base.weaknesses, seed + 17 + take * 5, 1)) uniquePush(weaknesses, w)
  for (const i of pickN(base.improvements, seed + 41 + take * 7, 1)) uniquePush(improvements, i)

  if (take >= 2) {
    uniquePush(
      strengths,
      en
        ? `Take ${take}: I’m comparing to take ${take - 1}. Keep what already stabilized.`
        : `Essai ${take}: je compare à l’essai ${take - 1}. Garde ce qui s’est déjà stabilisé.`,
      4,
    )
  }

  if (input.arrangement === 'arrangement' && !input.hasPartition) {
    uniquePush(
      improvements,
      en
        ? 'Do this: judge your arrangement on feel, not a fixed original.'
        : 'À faire: juge ton arrangement sur le feeling, pas un original figé.',
      4,
    )
  }

  fillTo(strengths, base.strengths, 2, seed + 91)
  fillTo(weaknesses, base.weaknesses, 3, seed + 193)
  fillTo(improvements, base.improvements, 3, seed + 281)

  const dur = features?.durationSec
  const dens =
    features && !features.weakSignal && features.attacksPerSec >= 0.2
      ? en
        ? `${features.attacksPerSec.toFixed(1)} attacks/s`
        : `${features.attacksPerSec.toFixed(1)} attaques/s`
      : null

  let greeting: string
  if (signals.honesty.length && (!features || features.weakSignal)) {
    greeting = en
      ? `${name}, on “${piece}”: ${signals.honesty[0]}`
      : `${name}, sur « ${piece} »: ${signals.honesty[0]}`
  } else {
    const topIssue = weaknesses[0]
      ? stripTipLabel(weaknesses[0]).replace(/\.$/, '')
      : en
        ? 'we refine one joint'
        : 'on affine un joint'
    greeting = en
      ? `${name}, take ${take} on “${piece}”${dur ? ` (${Math.round(dur)}s)` : ''}${dens ? ` · ${dens}` : ''}. Priority: ${topIssue}.`
      : `${name}, essai ${take} sur « ${piece} »${dur ? ` (${Math.round(dur)}s)` : ''}${dens ? ` · ${dens}` : ''}. Priorité: ${topIssue}.`
  }

  const primaryDrill = improvements[0]
    ? stripTipLabel(improvements[0])
    : en
      ? 'one short passage, steady tempo only'
      : 'un passage court, tempo stable seulement'

  const nextFocus =
    takesLeft > 0
      ? en
        ? `Take ${take + 1}: only this. ${primaryDrill}`
        : `Essai ${take + 1}: uniquement ça. ${primaryDrill}`
      : en
        ? '3 takes done. Keep one drill from this report. Rest or switch pieces.'
        : '3 essais faits. Garde un exercice de ce retour. Repose-toi ou change de morceau.'

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
    nextFocus,
    takesLeft,
  }
}
