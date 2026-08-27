import { supabase } from './supabaseAuth'
import { mergeSessions, type StoredSession } from './storage'

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
    if (error || !data) return
    mergeSessions((data as Row[]).map(rowToSession))
  } catch {
    /* table may not exist yet */
  }
}

export async function pushCloudSession(session: StoredSession) {
  if (!supabase) return
  try {
    const { data: auth } = await supabase.auth.getUser()
    const user = auth.user
    if (!user) return
    await supabase.from('practice_sessions').upsert(
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
  } catch {
    /* table may not exist yet */
  }
}
