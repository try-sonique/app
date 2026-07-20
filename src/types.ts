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
  strengths: string[]
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
