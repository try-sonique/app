import type { HeardNote } from './tuner'

export type StringSnapshot = {
  instrument: 'guitar' | 'bass'
  heard: boolean
  energy: number
  note: HeardNote | null
  denied: boolean
}

export type ChatMsg = {
  id: string
  from: 'aria' | 'you'
  text: string
}

export const STRING_PROMPTS = [
  'Tu m’entends ?',
  'Je suis accordé ?',
  'Le son est-il bon pour enregistrer ?',
  'Tu peux me dire si je joue juste ?',
]

function instrumentWord(instrument: 'guitar' | 'bass') {
  return instrument === 'bass' ? 'basse' : 'guitare'
}

export function openingLine(instrument: 'guitar' | 'bass') {
  const w = instrumentWord(instrument)
  return `Je ne suis pas prof de ${w}. Deux choses : tu es accordé, et ta prise est assez nette pour te réécouter. Joue une corde à vide près du micro.`
}

export function liveLine(snap: StringSnapshot, last: string | null): string | null {
  if (snap.denied) {
    const line = 'Le micro est refusé. Autorise-le, sinon je ne peux rien te dire du son.'
    return line === last ? null : line
  }
  if (!snap.heard) {
    const line = 'Là, c’est trop calme. Rapproche le micro, ou joue un peu plus fort.'
    return line === last ? null : line
  }
  const n = snap.note
  if (!n) {
    const line = 'Je t’entends. Pose une corde à vide, je te dis si elle est juste.'
    return line === last ? null : line
  }
  if (n.string && n.inTune) {
    const line = `${n.string.label} : juste.`
    return line === last ? null : line
  }
  if (n.string) {
    const dir = n.cents > 0 ? 'trop haut' : 'trop bas'
    const line = `${n.string.label} : ${dir} (${Math.abs(n.cents)} cents).`
    return line === last ? null : line
  }
  const line = `J’entends ${n.name}. Ce n’est pas une corde à vide, ou tu es loin de l’accord.`
  return line === last ? null : line
}

export function replyToMusician(text: string, snap: StringSnapshot) {
  const q = text.trim().toLowerCase()
  const w = instrumentWord(snap.instrument)

  if (/riff|solo|tablature|doigt|gamme|cours|apprendre|grok|chatgpt|voix|eleven/.test(q)) {
    return `Je n’enseigne pas la ${w}. Pas de doigtés, pas de riffs, pas de voix magique. Seulement : tu es accordé, et le son de ta prise tient-il.`
  }

  if (/entend|micro|son|volume|enregistre|prise|écoute/.test(q)) {
    if (snap.denied) return 'Le micro est bloqué. Sans ça, impossible de savoir si ta prise sera audible.'
    if (!snap.heard) {
      return 'Non : trop faible. Rapproche le micro de la caisse ou de l’ampli. Une prise trop calme, tu ne pourras pas la réécouter.'
    }
    if (snap.energy < 0.18) {
      return 'Oui, mais juste. Pour une prise, joue un peu plus près — tu dois pouvoir te réécouter sans monter le volume à fond.'
    }
    return 'Oui. Le niveau est bon pour enregistrer. Enregistre une courte prise et réécoute-la : c’est ça, le test.'
  }

  if (/accord|tuner|juste|corde|désaccord/.test(q)) {
    if (!snap.heard) return 'Je n’entends pas assez pour accorder. Une corde à vide, près du micro.'
    const n = snap.note
    if (!n) return 'Joue une corde à vide, une à la fois. Je te dis si elle est trop haute ou trop basse.'
    if (n.string && n.inTune) return `${n.string.label} est juste. Passe à la suivante.`
    if (n.string) {
      const dir = n.cents > 0 ? 'baisse' : 'monte'
      return `${n.string.label} : ${dir} un peu (${Math.abs(n.cents)} cents).`
    }
    return `J’entends ${n.name}. Accorde d’abord les cordes à vide.`
  }

  if (/pourquoi|c’est tout|c'est tout|seulement/.test(q)) {
    return 'Parce que sans un instrument accordé et un son qu’on peut réécouter, le reste ne sert à rien. Le coaching notes, c’est le piano pour l’instant.'
  }

  if (snap.denied) return 'Autorise le micro. Ensuite je te réponds sur ce que j’entends vraiment.'
  if (!snap.heard) return 'Joue. Si je n’entends rien, ta prise ne vaudra rien non plus.'
  if (snap.note?.string && snap.note.inTune) {
    return `${snap.note.string.label} est juste, et je t’entends. Tu peux enregistrer une courte prise pour te réécouter.`
  }
  return 'Deux questions : tu es accordé ? le son de ta prise tient-il ? Pose-les, ou joue — je te réponds sur ce que le micro capte.'
}

export function afterPlayback(opts: {
  heardOnTake: boolean
  rmsMean?: number
  silenceRatio?: number
  weakSignal?: boolean
}) {
  if (!opts.heardOnTake || opts.weakSignal) {
    return 'Cette prise est trop faible. Tu ne pourras pas te réécouter. Rapproche le micro, refais vingt secondes.'
  }
  if (opts.silenceRatio != null && opts.silenceRatio > 0.55) {
    return 'Beaucoup de silence. Joue plus près, ou plus longtemps d’une traite. Le son, c’est le matériau — pas un détail.'
  }
  if (opts.rmsMean != null && opts.rmsMean < 0.045) {
    return 'On t’entend, mais c’est mince. Pour une prise utile, rapproche le micro de la caisse ou de l’ampli.'
  }
  return 'Le niveau tient. Réécoute : si c’est lointain, étouffé ou saturé, change le micro avant la prochaine.'
}
