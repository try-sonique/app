import type { UserProfile } from '../types'

const PROFILES_KEY = 'sonique.profiles'
const CURRENT_KEY = 'sonique.currentEmail'
const SESSIONS_KEY = 'sonique.sessions'

export type StoredSession = {
  id: string
  email: string
  pieceName: string
  hasPartition: boolean
  createdAt: string
  feedbackHeadline: string
  takeNumber: number
}

function readProfiles(): Record<string, UserProfile> {
  try {
    const raw = localStorage.getItem(PROFILES_KEY)
    if (!raw) return {}
    return JSON.parse(raw) as Record<string, UserProfile>
  } catch {
    return {}
  }
}

function writeProfiles(map: Record<string, UserProfile>) {
  localStorage.setItem(PROFILES_KEY, JSON.stringify(map))
}

export function saveProfile(profile: UserProfile) {
  const email = profile.email.trim().toLowerCase()
  if (!email) return
  const map = readProfiles()
  map[email] = { ...profile, email }
  writeProfiles(map)
  localStorage.setItem(CURRENT_KEY, email)
}

export function findProfileByEmail(email: string): UserProfile | null {
  const key = email.trim().toLowerCase()
  if (!key) return null
  return readProfiles()[key] ?? null
}

export function getCurrentProfile(): UserProfile | null {
  const email = localStorage.getItem(CURRENT_KEY)
  if (!email) return null
  return findProfileByEmail(email)
}

export function saveSession(session: Omit<StoredSession, 'id' | 'createdAt'>) {
  try {
    const raw = localStorage.getItem(SESSIONS_KEY)
    const list: StoredSession[] = raw ? (JSON.parse(raw) as StoredSession[]) : []
    list.unshift({
      ...session,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      createdAt: new Date().toISOString(),
    })
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(list.slice(0, 50)))
  } catch {
    // ignore quota errors in demo
  }
}

export function exportUserData(): string {
  return JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      currentEmail: localStorage.getItem(CURRENT_KEY),
      profiles: readProfiles(),
      sessions: JSON.parse(localStorage.getItem(SESSIONS_KEY) || '[]'),
    },
    null,
    2,
  )
}

export function downloadUserData() {
  const blob = new Blob([exportUserData()], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `sonique-donnees-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}
