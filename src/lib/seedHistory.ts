import type { AriaFeedback } from '../types'
import { saveProfile, type StoredSession } from './storage'

const PREVIEW_EMAIL = 'preview@sonique.local'

function notes(
  partial: Pick<AriaFeedback, 'headline' | 'greeting' | 'weaknesses' | 'improvements' | 'nextFocus' | 'strengths'> & {
    takesLeft: number
  },
): AriaFeedback {
  return {
    overview: partial.greeting,
    atmosphere: '',
    technique: '',
    rhythm: '',
    ...partial,
  }
}

/** Local preview only (`?seedHistory=1`). Never runs in the production build. */
export function seedHistoryIfRequested() {
  if (!import.meta.env.DEV) return
  const params = new URLSearchParams(window.location.search)
  if (!params.has('seedHistory')) return

  try {
    saveProfile({
      firstName: 'Élodie',
      lastName: '',
      email: PREVIEW_EMAIL,
      phone: '',
    })

    const existing = localStorage.getItem('sonique.sessions')
    const list: StoredSession[] = existing ? (JSON.parse(existing) as StoredSession[]) : []
    const mine = list.filter((s) => s.email === PREVIEW_EMAIL)
    if (mine.length === 0) {
      const now = Date.now()
      const seeded: StoredSession[] = [
        {
          id: 'preview-mendelssohn-2',
          email: PREVIEW_EMAIL,
          pieceName: 'Romances sans paroles',
          hasPartition: true,
          createdAt: new Date(now - 36 * 60 * 1000).toISOString(),
          takeNumber: 2,
          hasAudio: false,
          feedbackHeadline: 'Le phrasé tient. Le milieu se serre encore.',
          feedback: notes({
            headline: 'Le phrasé tient. Le milieu se serre encore.',
            greeting: 'Deuxième prise plus posée. Le début respire. C’est le milieu qui se contracte.',
            weaknesses: [
              'Les mesures du milieu accélèrent dès que la main gauche s’épaissit.',
              'Les notes tenues se coupent trop tôt — la phrase n’arrive pas au bout.',
            ],
            improvements: [
              'Rejoue seulement le milieu, à 70 %, en comptant 4 temps larges avant de relancer.',
              'Sur chaque blanche, reste jusqu’au bout du temps. Pas de relâche anticipée.',
            ],
            nextFocus: 'Une prise du milieu seulement, lent, phrases tenues jusqu’au silence.',
            strengths: ['L’entrée est claire. On entend l’intention dès les premières mesures.'],
            takesLeft: 1,
          }),
        },
        {
          id: 'preview-mendelssohn-1',
          email: PREVIEW_EMAIL,
          pieceName: 'Romances sans paroles',
          hasPartition: true,
          createdAt: new Date(now - 90 * 60 * 1000).toISOString(),
          takeNumber: 1,
          hasAudio: false,
          feedbackHeadline: 'L’extrait est trop court pour juger le morceau.',
          feedback: notes({
            headline: 'L’extrait est trop court pour juger le morceau.',
            greeting: 'Il y a une intention, mais ça s’arrête avant qu’Aria puisse t’aider vraiment.',
            weaknesses: ['La prise dure trop peu pour entendre une phrase complète.'],
            improvements: [
              'Rejoue au moins 20 secondes d’un passage que tu travailles vraiment.',
              'Choisis 4 mesures, pas le début et la fin collés.',
            ],
            nextFocus: 'Même passage, plus long, sans t’arrêter au premier doute.',
            strengths: [],
            takesLeft: 2,
          }),
        },
        {
          id: 'preview-elise-1',
          email: PREVIEW_EMAIL,
          pieceName: 'Lettre à Élise',
          hasPartition: true,
          createdAt: new Date(now - 26 * 60 * 60 * 1000).toISOString(),
          takeNumber: 1,
          hasAudio: false,
          feedbackHeadline: 'Le thème est juste. Les reprises se précipitent.',
          feedback: notes({
            headline: 'Le thème est juste. Les reprises se précipitent.',
            greeting: 'On reconnaît le thème tout de suite. Les retours, eux, courent.',
            weaknesses: [
              'Chaque reprise part un cran plus vite que la précédente.',
              'La main gauche devient du tapis, plus une ligne.',
            ],
            improvements: [
              'Marque au crayon le tempo de la première phrase. Repars de là à chaque refrain.',
              'Gauche seule, deux fois, puis les deux mains au même tempo.',
            ],
            nextFocus: 'Trois refrains au même tempo. Si ça court, tu t’arrêtes et tu repars.',
            strengths: ['Le thème est propre. Les notes sont là, sans flou.'],
            takesLeft: 2,
          }),
        },
      ]
      localStorage.setItem('sonique.sessions', JSON.stringify([...seeded, ...list].slice(0, 50)))
    }

    sessionStorage.setItem('sonique.openHistory', '1')
    params.delete('seedHistory')
    const next = `${window.location.pathname}${params.toString() ? `?${params}` : ''}${window.location.hash}`
    window.history.replaceState({}, '', next)
  } catch {
    /* ignore */
  }
}
