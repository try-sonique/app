import type { AriaFeedback, UserProfile } from '../types'

const PROFILES_KEY = 'sonique.profiles'
const CURRENT_KEY = 'sonique.currentEmail'
const REMEMBER_EMAIL_KEY = 'sonique.rememberEmail'
const SESSIONS_KEY = 'sonique.sessions'
const DB_NAME = 'sonique-db'
const DB_STORE = 'recordings'

export type StoredSession = {
  id: string
  email: string
  pieceName: string
  hasPartition: boolean
  createdAt: string
  feedbackHeadline: string
  takeNumber: number
  feedback: AriaFeedback | null
  hasAudio: boolean
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

export function getCurrentEmail(): string | null {
  return localStorage.getItem(CURRENT_KEY)
}

/** Email to prefill on the login screen (opt-in “remember me”). */
export function getRememberedEmail(): string {
  try {
    return (localStorage.getItem(REMEMBER_EMAIL_KEY) || '').trim().toLowerCase()
  } catch {
    return ''
  }
}

export function setRememberedEmail(email: string | null) {
  try {
    const v = (email || '').trim().toLowerCase()
    if (v) localStorage.setItem(REMEMBER_EMAIL_KEY, v)
    else localStorage.removeItem(REMEMBER_EMAIL_KEY)
  } catch {
    /* ignore */
  }
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(DB_STORE)) {
        db.createObjectStore(DB_STORE)
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function saveRecordingBlob(sessionId: string, blob: Blob) {
  try {
    const db = await openDb()
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(DB_STORE, 'readwrite')
      tx.objectStore(DB_STORE).put(blob, sessionId)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
    db.close()
  } catch {
    // demo: ignore storage failures
  }
}

export async function getRecordingBlob(sessionId: string): Promise<Blob | null> {
  try {
    const db = await openDb()
    const blob = await new Promise<Blob | null>((resolve, reject) => {
      const tx = db.transaction(DB_STORE, 'readonly')
      const req = tx.objectStore(DB_STORE).get(sessionId)
      req.onsuccess = () => resolve((req.result as Blob) ?? null)
      req.onerror = () => reject(req.error)
    })
    db.close()
    return blob
  } catch {
    return null
  }
}

export function listSessions(email?: string | null): StoredSession[] {
  try {
    const raw = localStorage.getItem(SESSIONS_KEY)
    const list: StoredSession[] = raw ? (JSON.parse(raw) as StoredSession[]) : []
    if (!email) return list
    const key = email.trim().toLowerCase()
    return list.filter((s) => s.email.trim().toLowerCase() === key)
  } catch {
    return []
  }
}

export function saveSession(
  session: Omit<StoredSession, 'id' | 'createdAt'>,
): StoredSession {
  const entry: StoredSession = {
    ...session,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
  }
  try {
    const list = listSessions()
    list.unshift(entry)
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(list.slice(0, 50)))
  } catch {
    // ignore
  }
  return entry
}

export function exportUserData(): string {
  return JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      currentEmail: localStorage.getItem(CURRENT_KEY),
      profiles: readProfiles(),
      sessions: listSessions(),
      note: 'Les fichiers audio sont stockés en interne (IndexedDB) sur cet appareil uniquement.',
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
