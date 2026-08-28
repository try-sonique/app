import { supabase } from './supabaseAuth'
import { listSessions, mergeSessions, type StoredSession } from './storage'

const META_KEY = 'sonique_sessions'

type Row = {
  id: string
  email: string | null
  piece_name: string | null
  has_partition: boolean | null
  created_at: string
  feedback_headline: string | null
  take_number: number | null
  feedback: StoredSession['feedback']
  has_audio: boolean | null
}

function rowToSession(row: Row): StoredSession {
  return {
    id: row.id,
    email: (row.email || '').toLowerCase(),
    pieceName: row.piece_name || '',
    hasPartition: Boolean(row.has_partition),
    createdAt: row.created_at,
    feedbackHeadline: row.feedback_headline || '',
    takeNumber: row.take_number || 1,
    feedback: row.feedback,
    hasAudio: Boolean(row.has_audio),
  }
}

async function pullFromUserMetadata() {
  if (!supabase) return
  const { data } = await supabase.auth.getUser()
  const raw = data.user?.user_metadata?.[META_KEY]
  if (!Array.isArray(raw) || raw.length === 0) return
  mergeSessions(raw as StoredSession[])
}

async function pushToUserMetadata(email: string) {
  if (!supabase) return
  const mine = listSessions(email).slice(0, 20)
  const { error } = await supabase.auth.updateUser({
    data: { [META_KEY]: mine },
  })
  if (error) return
}

export async function pullCloudSessions(email: string) {
  if (!supabase) return
  const key = email.trim().toLowerCase()
  if (!key) return
  try {
    const { data, error } = await supabase
      .from('practice_sessions')
      .select(
        'id,email,piece_name,has_partition,created_at,feedback_headline,take_number,feedback,has_audio',
      )
      .eq('email', key)
      .order('created_at', { ascending: false })
      .limit(80)
    if (!error && data?.length) {
      mergeSessions((data as Row[]).map(rowToSession))
    }
  } catch {
    /* table may not exist yet */
  }
  try {
    await pullFromUserMetadata()
  } catch {
    /* ignore */
  }
}

export async function pushCloudSession(session: StoredSession) {
  if (!supabase) return
  try {
    const { data: auth } = await supabase.auth.getUser()
    const user = auth.user
    if (!user) return
    const { error } = await supabase.from('practice_sessions').upsert(
      {
        id: session.id,
        user_id: user.id,
        email: session.email.trim().toLowerCase(),
        piece_name: session.pieceName,
        has_partition: session.hasPartition,
        created_at: session.createdAt,
        feedback_headline: session.feedbackHeadline,
        take_number: session.takeNumber,
        feedback: session.feedback,
        has_audio: session.hasAudio,
      },
      { onConflict: 'id' },
    )
    if (error) {
      await pushToUserMetadata(session.email)
      return
    }
    await pushToUserMetadata(session.email)
  } catch {
    try {
      await pushToUserMetadata(session.email)
    } catch {
      /* ignore */
    }
  }
}

export async function syncAccountSessions(email: string) {
  const key = email.trim().toLowerCase()
  if (!key || !supabase) return
  await pullCloudSessions(key)
  const mine = listSessions(key)
  if (!mine.length) return
  await pushToUserMetadata(key)
  try {
    const { data: auth } = await supabase.auth.getUser()
    if (!auth.user) return
    await supabase.from('practice_sessions').upsert(
      mine.map((session) => ({
        id: session.id,
        user_id: auth.user!.id,
        email: key,
        piece_name: session.pieceName,
        has_partition: session.hasPartition,
        created_at: session.createdAt,
        feedback_headline: session.feedbackHeadline,
        take_number: session.takeNumber,
        feedback: session.feedback,
        has_audio: session.hasAudio,
      })),
      { onConflict: 'id' },
    )
  } catch {
    /* table optional */
  }
}
