export type ArrangementKind = 'arrangement' | 'original' | null

export type UserProfile = {
  firstName: string
  lastName: string
  email: string
  phone: string
}

export type AriaFeedback = {
  headline: string
  greeting: string
  overview: string
  atmosphere: string
  technique: string
  rhythm: string
  /** Points positifs */
  strengths: string[]
  /** Points fragiles / à corriger */
  weaknesses?: string[]
  /** Axes d'amélioration avec pistes de travail */
  improvements: string[]
  nextFocus: string
  takesLeft: number
}

export type AppState = {
  slide: number
  hasPartition: boolean | null
  profile: UserProfile
  pieceName: string
  partitionName: string
  partitionPreview: string | null
  partitionMime: string | null
  /** Id d’un morceau démo préchargé, si choisi */
  selectedPresetId: string | null
  /** Extrait audio à écouter à l’entraînement */
  previewAudio: string | null
  arrangement: ArrangementKind
  takesUsed: number
  isRecording: boolean
  liveCue: string | null
  feedback: AriaFeedback | null
}

export const MAX_TAKES = 3

export const initialState: AppState = {
  slide: 1,
  hasPartition: null,
  profile: {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  },
  pieceName: '',
  partitionName: '',
  partitionPreview: null,
  partitionMime: null,
  selectedPresetId: null,
  previewAudio: null,
  arrangement: null,
  takesUsed: 0,
  isRecording: false,
  liveCue: null,
  feedback: null,
}

export function totalSlides(hasPartition: boolean | null): number {
  if (hasPartition === false) return 7
  return 8
}
