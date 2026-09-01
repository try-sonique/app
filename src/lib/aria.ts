import { useEffect, useRef, useState } from 'react'
import type { AriaFeedback } from '../types'
import type { AudioFeatures } from './audioFeatures'
import {
  BY_EAR_CUES_FR,
  PIECE_CUES,
  PRACTICE_CUES_FR,
  RECORD_CUES_FR,
  type Cue,
} from './ariaCues'
import { beginnerMission, BEGINNER_PRACTICE_CUES, BEGINNER_RECORD_CUES, type PianoLevel } from './coachScripts'
import { t } from './presets'

export function useAriaCues(
  active: boolean,
  mode: 'practice' | 'record',
  pieceId?: string | null,
  byEar = false,
  heard = true,
  pianoLevel: PianoLevel | null = null,
) {
  const [cue, setCue] = useState<Cue | null>(null)
  const index = useRef(0)

  useEffect(() => {
    if (!active) {
      setCue(null)
      return
    }

    if (!heard) {
      setCue({
        text:
          mode === 'record'
            ? 'Je n’entends pas. Rapproche le micro, puis joue.'
            : 'Je t’écoute dès que tu joues. Là, c’est trop calme.',
        tone: 'warn',
      })
      return
    }

    const beginner = pianoLevel === 'beginner'
    const piecePool = !beginner && pieceId && PIECE_CUES[pieceId] ? PIECE_CUES[pieceId].fr : []
    const base = beginner
      ? BEGINNER_PRACTICE_CUES
      : byEar && !pieceId
        ? BY_EAR_CUES_FR
        : PRACTICE_CUES_FR
    const pool =
      mode === 'practice' ? [...piecePool, ...base] : beginner ? BEGINNER_RECORD_CUES : RECORD_CUES_FR

    index.current = 0
    const tick = () => {
      const item = pool[index.current % pool.length]
      index.current += 1
      setCue(item)
    }

    tick()
    const id = window.setInterval(tick, beginner ? (mode === 'practice' ? 8000 : 6000) : mode === 'practice' ? 6000 : 5000)
    return () => window.clearInterval(id)
  }, [active, mode, pieceId, byEar, heard, pianoLevel])

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
            'Exercice caractère : marque 2 changements d’humeur, ne joue que la mesure avant/après',
            'Exercice contraste : une passe tout doux, une passe tout fort, puis assemble',
            'Exercice appui : fige 1 temps à chaque jointure de section, puis relâche',
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
            'Exercice couleur : 4 mesures pp → p seulement. écoute les harmoniques',
            'Exercice fin : chante la dernière note de chaque phrase, puis retrouve-la',
            'Exercice souffle : marque deux mesures respiration et protège-les',
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
            'La pulsation danse déjà. la main gauche porte la pièce',
            'La syncope a du caractère, pas seulement de la justesse',
            'Tu assumes le groove au lieu de le lisser',
          ],
          weaknesses: [
            'Quand la main droite joue plus de notes, le tempo accélère d’un cheveu',
            'Certains contretemps arrivent tôt. le swing s’aplatit un instant',
            'Les fins de phrase coupent au lieu de basculer',
          ],
          improvements: [
            'Exercice groove : main gauche seule, métronome sur 2 et 4, puis mélodie',
            'Exercice swing : compte 1-e-2-e sur 8 mesures, puis coupe la voix',
            'Exercice appui : exagère le dernier contretemps de chaque unité de 4',
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
            'Les accents sculptent déjà une forme dans les passages plus chargés',
          ],
          weaknesses: [
            'Les passages denses écrasent parfois le joint plus doux',
            'Les attaques sont trop égales. les pics ont besoin d’une hiérarchie',
            'La récupération après un geste fort est courte',
          ],
          improvements: [
            'Exercice puissance : un geste fort, puis une mesure-réponse volontairement douce',
            'Exercice hiérarchie : entoure 3 accents seulement ; le reste les sert',
            'Exercice récupération : une demi-respiration avant chaque mesure la plus dense',
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
        'Quand l’écriture s’épaissit, le tempo flotte un instant',
        'Les notes tenues perdent un peu de corps en fin de phrase',
        'Les enchaînements sont encore précipités par endroits',
        'Le milieu de la prise est moins clair que le début',
        'Certains gestes démarrent fort puis perdent leur forme',
        'La pulsation se déforme quand les deux mains jouent plus serré',
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
        'Exercice rythme : 2 mesures fragiles, métronome lent, 3 fois propres',
        'Exercice son : tenues piano → mezzo, sans lâcher la dernière note',
        'Exercice : le passage difficile, lent, mains posées, puis une vraie prise',
        'Exercice : 4 mesures seulement. Le reste de la page, tu l’ignores.',
        'Exercice tempo : une passe en tapant le temps du pied, puis sans taper',
        'Exercice : 20 secondes, tu réécoutes une fois, tu rejoues seulement ça',
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
            'Quand il y a plus de notes, la pédale brouille un instant les voix internes',
            'Les tenues s’amincissent juste avant l’harmonie suivante',
            'Le medium peut être couvert quand la basse s’approfondit',
          ],
          improvements: [
            'Exercice couleur : 4 premières mesures doux → un peu plus plein',
            'Exercice pédale : change sur l’harmonie, pas sur chaque note',
            'Exercice souffle : marque 2 mesures respiration, puis ne rejoue que celles-là',
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
            'Exercice swing : compte 1-e-2-e à voix haute sur 8 mesures',
            'Exercice stride : main gauche seule, métronome sur 2 et 4',
            'Exercice appui : exagère le dernier contretemps de chaque unité de 4',
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
            'Exercice motif : 3 passes lentes de la cellule d’ouverture',
            'Exercice pont : isole les 2 mesures avant le milieu, métronome −20 %',
            'Exercice balance : mélodie plus forte / accompagnement plus doux',
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
  /** Ranked issues: severity high first. used to pick THE next-take mission */
  ranked: { severity: number; weakness: string; drill: string; success: string }[]
}

/** Map take signals → ranked musical issues + drills with success criteria. */
function signalNotes(
  features: AudioFeatures | null,
  meta: PerformanceMeta | undefined,
  en: boolean,
): SignalNotes {
  const notes: SignalNotes = {
    strengths: [],
    weaknesses: [],
    improvements: [],
    honesty: [],
    ranked: [],
  }
  const f = features
  const played = meta?.playedSec ?? f?.durationSec ?? 0
  const total = meta?.totalSec ?? f?.durationSec ?? 0
  const completion = total > 0 ? played / total : 1

  const pushIssue = (
    severity: number,
    weakness: string,
    drill: string,
    success: string,
  ) => {
    notes.ranked.push({ severity, weakness, drill, success })
    uniquePush(notes.weaknesses, weakness)
    uniquePush(notes.improvements, en ? `Do this: ${drill}` : `À faire: ${drill}`)
  }

  if (!f || f.weakSignal || f.durationSec < 1.2) {
    pushIssue(
      100,
      en
        ? 'Audio too thin or too short to coach this take precisely'
        : 'Audio trop fin ou trop court pour coacher cette prise précisément',
      en
        ? 'mic closer, 30–40 steady seconds, one short passage only'
        : 'micro plus près, 30–40 secondes stables, un seul passage court',
      en
        ? 'Success: Aria hears a continuous line for 30s+'
        : 'Réussi si: Aria entend une ligne continue 30s+',
    )
    notes.honesty.push(
      en
        ? 'I need a clearer take before I can get more specific.'
        : 'Il me faut une prise plus claire avant d’être plus précise.',
    )
    notes.ranked.sort((a, b) => b.severity - a.severity)
    return notes
  }

  const peakRatio = f.rmsMean > 0.0001 ? f.rmsPeak / f.rmsMean : 1

  if (completion < 0.45 && total > 0) {
    pushIssue(
      90,
      en
        ? `You stopped early (~${Math.round(played)}s of ~${Math.round(total)}s). I mainly heard the opening.`
        : `Tu as coupé tôt (~${Math.round(played)}s sur ~${Math.round(total)}s). J’ai surtout entendu le début.`,
      en
        ? 'replay from the same start and add 8 more bars before stopping'
        : 'repars du même début et ajoute 8 mesures avant d’arrêter',
      en
        ? 'Success: you pass the previous stop point without cutting'
        : 'Réussi si: tu dépasses le point d’arrêt précédent sans couper',
    )
  } else if (f.durationSec >= 20) {
    uniquePush(
      notes.strengths,
      en
        ? `You held ${Math.round(f.durationSec)}s. Stamina is usable.`
        : `Tu as tenu ${Math.round(f.durationSec)}s. L’endurance est utilisable.`,
    )
  } else if (f.durationSec < 12) {
    pushIssue(
      85,
      en
        ? `Short take (${Math.round(f.durationSec)}s). The middle never appears.`
        : `Prise courte (${Math.round(f.durationSec)}s). Le milieu n’apparaît pas.`,
      en
        ? 'one full phrase start-to-end, no restart mid-way'
        : 'une phrase complète du début à la fin, sans reprendre au milieu',
      en
        ? 'Success: one continuous phrase >15s'
        : 'Réussi si: une phrase continue >15s',
    )
  }

  if (f.silenceRatio > 0.45) {
    pushIssue(
      80,
      en
        ? `Long gaps (~${Math.round(f.silenceRatio * 100)}% quiet). The musical line breaks.`
        : `Longs silences (~${Math.round(f.silenceRatio * 100)}% calme). La ligne musicale se casse.`,
      en
        ? 'connect 2 phrases with one soft bridge note; no full stop between them'
        : 'relie 2 phrases avec une note-pont douce; pas d’arrêt total entre elles',
      en
        ? 'Success: two phrases feel like one idea'
        : 'Réussi si: deux phrases sonnent comme une seule idée',
    )
  } else if (f.silenceRatio < 0.1 && f.attacksPerSec > 3.0) {
    pushIssue(
      88,
      en
        ? `Too dense (${f.attacksPerSec.toFixed(1)} attacks/s). Almost no recovery.`
        : `Trop dense (${f.attacksPerSec.toFixed(1)} attaques/s). Presque aucune récupération.`,
      en
        ? 'play the same passage with one intentional rest every 4 bars; count the rest out loud once'
        : 'rejoue le même passage avec un silence volontaire toutes les 4 mesures; compte le silence à voix haute une fois',
      en
        ? 'Success: you can point to 2 rests you chose on purpose'
        : 'Réussi si: tu peux montrer 2 silences choisis volontairement',
    )
  } else if (f.silenceRatio >= 0.18 && f.silenceRatio <= 0.35) {
    uniquePush(
      notes.strengths,
      en
        ? 'Breathing between phrases sounds natural.'
        : 'Les respirations entre phrases sonnent naturelles.',
    )
  }

  if (f.dynamicRange < 0.035) {
    pushIssue(
      78,
      en
        ? 'Dynamics stay flat. Soft and loud barely differ.'
        : 'Dynamique trop plate. Le doux et le fort se ressemblent trop.',
      en
        ? 'same 4 bars twice. pass 1 soft, pass 2 fuller. then stitch once'
        : 'les mêmes 4 mesures deux fois. passe 1 douce, passe 2 plus pleine. puis assemble une fois',
      en
        ? 'Success: a listener hears two clear dynamic levels'
        : 'Réussi si: on entend clairement deux niveaux dynamiques',
    )
  } else if (f.dynamicRange > 0.11) {
    uniquePush(
      notes.strengths,
      en
        ? 'Clear dynamic contrast. Soft and full talk to each other.'
        : 'Beau contraste dynamique. Le doux et le plein se parlent.',
    )
  }

  if (f.endingEnergy < f.openingEnergy * 0.55 && f.durationSec > 10) {
    pushIssue(
      82,
      en
        ? 'The ending loses body. You fade when the phrase still needs weight.'
        : 'La fin perd du corps. Tu t’éteins alors que la phrase a encore besoin de poids.',
      en
        ? 'loop only the last 8 seconds until they stay alive 3 times in a row'
        : 'boucle seulement les 8 dernières secondes jusqu’à 3 fois vivantes d’affilée',
      en
        ? 'Success: last 8s feel as present as the opening'
        : 'Réussi si: les 8 dernières secondes sont aussi présentes que le début',
    )
  } else if (f.endingEnergy > f.openingEnergy * 1.35 && f.durationSec > 10) {
    uniquePush(
      notes.strengths,
      en
        ? 'The ending is stronger than the opening. You build.'
        : 'La fin est plus forte que le début. Tu construis.',
    )
  }

  if (f.openingEnergy > f.middleEnergy * 1.4 && f.durationSec > 12) {
    pushIssue(
      76,
      en
        ? 'Opening clearer than the middle. Focus drops after the first lift.'
        : 'Début plus clair que le milieu. L’attention baisse après l’élan.',
      en
        ? 'start at the middle dip; 5 slow reps, then one real take of that zone only'
        : 'commence au creux du milieu; 5 reps lentes, puis une vraie prise de cette zone seulement',
      en
        ? 'Success: middle bars sound as intentional as bar 1'
        : 'Réussi si: le milieu sonne aussi intentionnel que la mesure 1',
    )
  }

  if (f.middleEnergy > f.openingEnergy * 1.45 && f.endingEnergy < f.middleEnergy * 0.6 && f.durationSec > 14) {
    pushIssue(
      74,
      en
        ? 'Strong middle, weak landing. The arc peaks too early.'
        : 'Milieu fort, atterrissage faible. L’arc culmine trop tôt.',
      en
        ? 'practice the last third only at −10% tempo, then attach it to the middle once'
        : 'travaille le dernier tiers seul à −10% tempo, puis raccroche-le au milieu une fois',
      en
        ? 'Success: energy stays through the final phrase'
        : 'Réussi si: l’énergie tient jusqu’à la phrase finale',
    )
  }

  if (f.attacksPerSec > 0.4 && f.attacksPerSec < 1.15) {
    uniquePush(
      notes.strengths,
      en
        ? 'Attack pacing is measured. Not frantic.'
        : 'Rythme d’attaques mesuré. Pas frénétique.',
    )
  } else if (f.attacksPerSec >= 2.6) {
    pushIssue(
      86,
      en
        ? `High density (${f.attacksPerSec.toFixed(1)} attacks/s). Tempo is likely pushing.`
        : `Densité élevée (${f.attacksPerSec.toFixed(1)} attaques/s). Le tempo pousse probablement.`,
      en
        ? 'same passage with metronome at −15% until it feels boring-stable, then one take at that speed'
        : 'même passage au métronome −15% jusqu’à ennuyeusement stable, puis une prise à cette vitesse',
      en
        ? 'Success: you finish without speeding in the last bars'
        : 'Réussi si: tu finis sans accélérer dans les dernières mesures',
    )
  }

  if (peakRatio > 4.5 && f.rmsMean > 0.01) {
    pushIssue(
      72,
      en
        ? 'Attacks spike hard vs the average sound. Touches may be hitting, not placing.'
        : 'Les attaques piquent fort vs le son moyen. Tu frappes peut-être plus que tu ne poses.',
      en
        ? 'one phrase mezzo only; every note same weight; no accents for 8 bars'
        : 'une phrase tout mezzo; chaque note même poids; aucun accent pendant 8 mesures',
      en
        ? 'Success: the line feels even under your hands'
        : 'Réussi si: la ligne te paraît égale sous les doigts',
    )
  }

  if (f.energyVariance > 0.0025 && f.dynamicRange > 0.08) {
    uniquePush(
      notes.strengths,
      en
        ? 'The take has a shape. Not a flat line.'
        : 'La prise a une forme. Pas une ligne plate.',
    )
  }

  notes.ranked.sort((a, b) => b.severity - a.severity)
  // Keep lists aligned to ranked order
  if (notes.ranked.length) {
    notes.weaknesses = notes.ranked.map((r) => r.weakness).slice(0, 3)
    notes.improvements = notes.ranked
      .map((r) => (en ? `Do this: ${r.drill}` : `À faire: ${r.drill}`))
      .slice(0, 3)
  }
  return notes
}

function stripTipLabel(s: string): string {
  return s
    .replace(/^(Do this:\s*|À faire:\s*)/i, '')
    .replace(
      /^(Pulse tip:\s*|Tone tip:\s*|Listen tip:\s*|Rhythm tip:\s*|Shape tip:\s*|Focus tip:\s*|Space tip:\s*|Flow tip:\s*|Close tip:\s*|Tempo tip:\s*|Contrast tip:\s*|Groove tip:\s*|Swing tip:\s*|Landing tip:\s*|Color tip:\s*|Ending tip:\s*|Character tip:\s*|Power tip:\s*|Hierarchy tip:\s*|Recovery tip:\s*|Piste [^:]+:\s*|Exercice [^:]+:\s*)/i,
      '',
    )
    .trim()
}

/**
 * Aria report: ranked signal issues first.
 * Generic piece flavor only fills empty gaps. never overrides real take signals.
 */
export function analyzePerformance(input: {
  pieceName: string
  hasPartition: boolean
  firstName: string
  arrangement: 'arrangement' | 'original' | null
  takesUsed: number
  maxTakes: number
  meta?: PerformanceMeta
  pianoLevel?: PianoLevel | null
}): AriaFeedback {
  const copy = t()
  const en = false
  const takesLeft = Math.max(0, input.maxTakes - input.takesUsed)
  const name = input.firstName.trim() || copy.you
  const piece = input.pieceName.trim() || 'ton morceau'
  const take = input.takesUsed
  const pieceId = input.meta?.pieceId ?? null
  const features = input.meta?.features ?? null
  const silent = !features || features.weakSignal || features.durationSec < 1.2
  const beginner = input.pianoLevel === 'beginner'
  const mission = beginner ? beginnerMission(take) : null

  if (silent) {
    return {
      headline: piece,
      greeting: `${name}, je n’ai pas assez entendu « ${piece} ».`,
      overview: 'Sans une prise claire, je ne peux pas te dire quoi corriger.',
      atmosphere: '',
      technique: '',
      rhythm: '',
      strengths: [],
      weaknesses: ['Cette prise est trop courte ou trop faible pour entendre une ligne.'],
      improvements: ['Micro près de l’instrument. Un seul passage, vingt secondes, sans t’arrêter.'],
      nextFocus: mission
        ? `Micro près, vingt secondes. Puis : ${mission.drill}`
        : 'Prochaine prise : vingt secondes du passage que tu travailles. Micro près. Ensuite on corrige.',
      takesLeft,
    }
  }

  if (beginner && mission) {
    const signals = signalNotes(features, input.meta, en)
    const strengths: string[] = [...signals.strengths].slice(0, 1)
    if (!strengths.length) {
      uniquePush(
        strengths,
        'Tu as joué un passage. À ton niveau, une petite prise vaut mieux que tout le morceau.',
      )
    }
    const weaknesses: string[] = [...signals.weaknesses].slice(0, 1)
    if (!weaknesses.length) uniquePush(weaknesses, mission.weakness)
    const improvements = [`${mission.title} : ${mission.drill}`]
    const dur = features?.durationSec
    return {
      headline: piece,
      greeting: `${name}, essai ${take} sur « ${piece} »${dur ? ` (${Math.round(dur)}s)` : ''}. Aujourd’hui : ${mission.title.toLowerCase()}.`,
      overview: '',
      atmosphere: '',
      technique: '',
      rhythm: '',
      strengths: strengths.slice(0, 2),
      weaknesses: weaknesses.slice(0, 2),
      improvements: improvements.slice(0, 2),
      nextFocus: `${mission.drill} ${mission.success}`,
      takesLeft,
    }
  }

  const seed = hashStr(`${piece}|${pieceId ?? ''}|${take}|${input.hasPartition}`)
  const base = presetPack(pieceId, en) ?? titleFlavor(piece, en)
  const signals = signalNotes(features, input.meta, en)

  const strengths: string[] = [...signals.strengths]
  const weaknesses: string[] = [...signals.weaknesses]
  const improvements: string[] = [...signals.improvements]
  const hasRanked = signals.ranked.length > 0

  if (!hasRanked) {
    const w = pickN(base.weaknesses, seed + 17 + take * 5, 1)[0]
    const i = pickN(base.improvements, seed + 41 + take * 7, 1)[0]
    if (w) uniquePush(weaknesses, w)
    if (i) uniquePush(improvements, i)
  }
  if (strengths.length < 1) {
    const s = pickN(base.strengths, seed + take * 3, 1)[0]
    if (s) uniquePush(strengths, s)
  }

  const dur = features?.durationSec
  const top = signals.ranked[0]
  const greeting = top
    ? `${name}, essai ${take} sur « ${piece} »${dur ? ` (${Math.round(dur)}s)` : ''}. ${top.weakness.replace(/\.$/, '')}.`
    : `${name}, essai ${take} sur « ${piece} »${dur ? ` (${Math.round(dur)}s)` : ''}.`

  let nextFocus: string
  if (takesLeft <= 0) {
    nextFocus = top
      ? `${top.drill}. ${top.success}`
      : 'Garde un seul exercice de ce retour. Reprends le même passage.'
  } else if (top) {
    nextFocus = `${top.drill}. ${top.success}`
  } else {
    const primaryDrill = improvements[0]
      ? stripTipLabel(improvements[0])
      : 'Un passage court, tempo stable, rien d’autre.'
    nextFocus = primaryDrill
  }

  return {
    headline: piece,
    greeting,
    overview: '',
    atmosphere: '',
    technique: '',
    rhythm: '',
    strengths: strengths.slice(0, 2),
    weaknesses: weaknesses.slice(0, 2),
    improvements: improvements.slice(0, 2),
    nextFocus,
    takesLeft,
  }
}
