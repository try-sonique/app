import { createClient, type Session, type User } from '@supabase/supabase-js'
import type { UserProfile } from '../types'
import { findProfileByEmail, saveProfile } from './storage'

const url = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim() || ''
const anon = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim() || ''

export const isSupabaseConfigured = Boolean(url && anon)

export const supabase = isSupabaseConfigured
  ? createClient(url, anon, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null

export type AuthResult = {
  ok: boolean
  profile?: UserProfile
  error?: string
  /** User must confirm email before session is active */
  needsEmailConfirm?: boolean
}

function profileFromUser(user: User, fallback?: Partial<UserProfile>): UserProfile {
  const meta = (user.user_metadata || {}) as Record<string, string>
  return {
    firstName: String(meta.first_name || fallback?.firstName || '').trim(),
    lastName: String(meta.last_name || fallback?.lastName || '').trim(),
    email: String(user.email || fallback?.email || '').trim(),
    phone: String(meta.phone || fallback?.phone || '').trim(),
  }
}

async function upsertProfileRow(user: User, profile: UserProfile) {
  if (!supabase) return
  try {
    await supabase.from('profiles').upsert(
      {
        id: user.id,
        email: profile.email,
        first_name: profile.firstName,
        last_name: profile.lastName,
        phone: profile.phone || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' },
    )
  } catch {
    /* table may not exist yet — auth still works via user_metadata */
  }
}

export async function signUpWithPassword(input: {
  profile: UserProfile
  password: string
}): Promise<AuthResult> {
  const email = input.profile.email.trim().toLowerCase()
  const password = input.password

  if (!isSupabaseConfigured || !supabase) {
    // Local fallback until Supabase keys are set (keeps /yc/ usable)
    saveProfile({ ...input.profile, email })
    return { ok: true, profile: { ...input.profile, email } }
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        first_name: input.profile.firstName.trim(),
        last_name: input.profile.lastName.trim(),
        phone: input.profile.phone.trim(),
      },
      emailRedirectTo: `${window.location.origin}${window.location.pathname}`,
    },
  })

  if (error) return { ok: false, error: error.message }

  const user = data.user
  if (!user) return { ok: false, error: 'Signup failed' }

  const profile = profileFromUser(user, input.profile)
  saveProfile(profile)
  await upsertProfileRow(user, profile)

  if (!data.session) {
    return { ok: true, profile, needsEmailConfirm: true }
  }

  return { ok: true, profile }
}

export async function signInWithPassword(input: {
  email: string
  password: string
}): Promise<AuthResult> {
  const email = input.email.trim().toLowerCase()
  const password = input.password

  if (!isSupabaseConfigured || !supabase) {
    const found = findProfileByEmail(email)
    if (!found) return { ok: false, error: 'not_found' }
    saveProfile(found)
    return { ok: true, profile: found }
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) return { ok: false, error: error.message }
  const user = data.user
  if (!user) return { ok: false, error: 'Login failed' }

  let profile = profileFromUser(user)
  try {
    const { data: row } = await supabase
      .from('profiles')
      .select('first_name,last_name,phone,email')
      .eq('id', user.id)
      .maybeSingle()
    if (row) {
      profile = {
        firstName: row.first_name || profile.firstName,
        lastName: row.last_name || profile.lastName,
        email: row.email || profile.email,
        phone: row.phone || profile.phone,
      }
    }
  } catch {
    /* ignore */
  }

  saveProfile(profile)
  await upsertProfileRow(user, profile)
  return { ok: true, profile }
}

export async function requestPasswordReset(email: string): Promise<AuthResult> {
  if (!isSupabaseConfigured || !supabase) {
    return { ok: false, error: 'Supabase is not configured yet' }
  }
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
    redirectTo: `${window.location.origin}${window.location.pathname}`,
  })
  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

export async function getSessionProfile(): Promise<UserProfile | null> {
  if (!isSupabaseConfigured || !supabase) return null
  const { data } = await supabase.auth.getSession()
  const session: Session | null = data.session
  if (!session?.user) return null
  return profileFromUser(session.user)
}

/** Clears Supabase session + local Sonique profile cache. */
export async function signOut(): Promise<void> {
  if (supabase) {
    try {
      await supabase.auth.signOut()
    } catch {
      /* ignore */
    }
  }
  try {
    localStorage.removeItem('sonique.profiles')
    localStorage.removeItem('sonique.currentEmail')
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith('sb-') && key.includes('auth-token')) {
        localStorage.removeItem(key)
      }
    }
  } catch {
    /* ignore */
  }
}
