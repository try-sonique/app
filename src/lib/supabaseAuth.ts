import { createClient, type Session, type User } from '@supabase/supabase-js'
import type { UserProfile } from '../types'
import { findProfileByEmail, saveProfile } from './storage'

const url = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim() || ''
const anon = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim() || ''

export const isSupabaseConfigured = Boolean(url && anon)

/** Confirmation / reset emails must land on the app root, not a nested path. */
export function authRedirectUrl() {
  const { origin, pathname } = window.location
  if (pathname === '/app' || pathname.startsWith('/app/')) {
    return `${origin}/app/`
  }
  return `${origin}/`
}

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
  /** Stable code for UI copy, or a raw fallback message */
  error?: string
  /** User must confirm email before session is active */
  needsEmailConfirm?: boolean
}

/** Map Supabase Auth error text → stable codes the UI can translate. */
export function mapAuthError(message: string): string {
  const m = message.toLowerCase()
  if (m.includes('rate limit')) return 'rate_limited'
  if (
    m.includes('otp_expired') ||
    m.includes('email link is invalid') ||
    m.includes('link is invalid or has expired')
  ) {
    return 'link_expired'
  }
  if (m.includes('email not confirmed') || m.includes('not confirmed')) {
    return 'email_not_confirmed'
  }
  if (m.includes('invalid login credentials') || m.includes('invalid credentials')) {
    return 'invalid_credentials'
  }
  if (m.includes('user already registered') || m.includes('already been registered')) {
    return 'already_registered'
  }
  return message
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
    // Local fallback until Supabase keys are set (keeps Pages demo usable)
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
      emailRedirectTo: authRedirectUrl(),
    },
  })

  if (error) return { ok: false, error: mapAuthError(error.message) }

  const user = data.user
  if (!user) return { ok: false, error: 'Signup failed' }

  // Existing confirmed account: Auth returns a fake user (no identities) and sends no confirm mail.
  const identities = (user as { identities?: unknown[] }).identities
  if (Array.isArray(identities) && identities.length === 0) {
    return { ok: false, error: 'already_registered' }
  }

  const profile = profileFromUser(user, input.profile)
  saveProfile(profile)
  await upsertProfileRow(user, profile)

  if (!data.session) {
    return { ok: true, profile, needsEmailConfirm: true }
  }

  return { ok: true, profile }
}

export async function resendSignupEmail(email: string): Promise<AuthResult> {
  if (!isSupabaseConfigured || !supabase) {
    return { ok: false, error: 'Auth is not configured yet' }
  }
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email: email.trim().toLowerCase(),
    options: {
      emailRedirectTo: authRedirectUrl(),
    },
  })
  if (error) return { ok: false, error: mapAuthError(error.message) }
  return { ok: true }
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

  if (error) return { ok: false, error: mapAuthError(error.message) }
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

export async function updateUserProfile(profile: UserProfile): Promise<AuthResult> {
  const next = {
    firstName: profile.firstName.trim(),
    lastName: profile.lastName.trim(),
    email: profile.email.trim().toLowerCase(),
    phone: profile.phone.trim(),
  }
  saveProfile(next)

  if (!isSupabaseConfigured || !supabase) {
    return { ok: true, profile: next }
  }

  const { data: sessionData } = await supabase.auth.getSession()
  const user = sessionData.session?.user
  if (!user) {
    return { ok: true, profile: next }
  }

  const { error } = await supabase.auth.updateUser({
    data: {
      first_name: next.firstName,
      last_name: next.lastName,
      phone: next.phone,
    },
  })
  if (error) return { ok: false, error: mapAuthError(error.message), profile: next }

  await upsertProfileRow(user, next)
  return { ok: true, profile: next }
}

export async function requestPasswordReset(email: string): Promise<AuthResult> {
  if (!isSupabaseConfigured || !supabase) {
    return { ok: false, error: 'Auth is not configured yet' }
  }
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
    redirectTo: authRedirectUrl(),
  })
  if (error) return { ok: false, error: mapAuthError(error.message) }
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
