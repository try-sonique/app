import { useEffect, useState, type FormEvent } from 'react'
import { t } from '../lib/presets'
import { signInWithEmailLink, signInWithSocial } from '../lib/supabaseAuth'
import type { AppState, UserProfile } from '../types'

type AuthMode = 'login' | 'signup'
type LastAuth = 'google' | 'facebook' | 'instagram' | 'email'

const LAST_AUTH_KEY = 'sonique.lastAuthMethod'

function readLastAuth(): LastAuth | null {
  try {
    const v = localStorage.getItem(LAST_AUTH_KEY)
    if (v === 'google' || v === 'facebook' || v === 'instagram' || v === 'email') return v
  } catch {
    /* ignore */
  }
  return null
}

function writeLastAuth(method: LastAuth) {
  try {
    localStorage.setItem(LAST_AUTH_KEY, method)
  } catch {
    /* ignore */
  }
}

function GoogleMark() {
  return (
    <svg className="oauth-svg" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  )
}

function FacebookMark() {
  return (
    <svg className="oauth-svg" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#1877F2"
        d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047v-2.66c0-3.017 1.792-4.688 4.533-4.688 1.312 0 2.686.236 2.686.236v2.97H15.83c-1.491 0-1.956.93-1.956 1.886v2.256h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"
      />
    </svg>
  )
}

function InstagramMark() {
  return (
    <svg className="oauth-svg" viewBox="0 0 24 24" aria-hidden>
      <defs>
        <linearGradient id="ig" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#f58529" />
          <stop offset="50%" stopColor="#dd2a7b" />
          <stop offset="100%" stopColor="#8134af" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="20" height="20" rx="6" fill="url(#ig)" />
      <circle cx="12" cy="12" r="4.2" fill="none" stroke="#fff" strokeWidth="1.7" />
      <circle cx="17.2" cy="6.8" r="1.1" fill="#fff" />
    </svg>
  )
}

export function AuthGate({
  profile,
  onProfileLoaded,
  onNext,
  onCancel,
  onSkip,
}: {
  profile: AppState['profile']
  onProfileLoaded: (profile: UserProfile) => void
  onNext: () => void
  onCancel?: () => void
  onSkip?: () => void
}) {
  const copy = t()
  const [mode, setMode] = useState<AuthMode>('login')
  const [loginEmail, setLoginEmail] = useState('')
  const [signupFirstName, setSignupFirstName] = useState('')
  const [signupEmail, setSignupEmail] = useState('')
  const [authError, setAuthError] = useState('')
  const [authInfo, setAuthInfo] = useState('')
  const [awaitingLink, setAwaitingLink] = useState(false)
  const [busy, setBusy] = useState(false)
  const [legal, setLegal] = useState<'terms' | 'privacy' | null>(null)
  const [lastAuth, setLastAuth] = useState<LastAuth | null>(readLastAuth)

  useEffect(() => {
    try {
      if (sessionStorage.getItem('sonique.authFlash') === 'link_expired') {
        sessionStorage.removeItem('sonique.authFlash')
        setMode('login')
        setAuthError(copy.emailLinkExpired)
      }
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one-shot flash on mount
  }, [])

  const friendlyAuthError = (code?: string) => {
    if (!code) return copy.loginFailed
    if (code === 'rate_limited') return copy.emailRateLimited
    if (code === 'email_not_confirmed') return copy.emailNotConfirmed
    if (code === 'link_expired') return copy.emailLinkExpired
    if (code === 'google_unavailable') return copy.googleUnavailable
    if (code === 'facebook_unavailable') return copy.facebookUnavailable
    if (code === 'instagram_unavailable') return copy.instagramUnavailable
    if (code === 'oauth_unavailable') return copy.googleUnavailable
    if (code === 'not_found') return copy.loginNotFound
    return code
  }

  const afterLinkSent = (email: string) => {
    writeLastAuth('email')
    setLastAuth('email')
    setAwaitingLink(true)
    setAuthInfo(copy.magicLinkSent.replace('{email}', email))
    setMode('login')
    setLoginEmail(email)
  }

  const sendLoginLink = async () => {
    setAuthError('')
    setAuthInfo('')
    if (!loginEmail.trim()) {
      setAuthError(copy.loginFailed)
      return
    }
    setBusy(true)
    try {
      const email = loginEmail.trim().toLowerCase()
      const result = await signInWithEmailLink(email)
      if (!result.ok) {
        setAuthError(friendlyAuthError(result.error))
        return
      }
      if (result.profile && !result.needsEmailConfirm) {
        onProfileLoaded(result.profile)
        writeLastAuth('email')
        onNext()
        return
      }
      afterLinkSent(email)
    } finally {
      setBusy(false)
    }
  }

  const sendSignupLink = async (e: FormEvent) => {
    e.preventDefault()
    setAuthError('')
    setAuthInfo('')
    if (!signupFirstName.trim() || !signupEmail.trim()) return
    setBusy(true)
    try {
      const email = signupEmail.trim().toLowerCase()
      const result = await signInWithEmailLink(email, { firstName: signupFirstName.trim() })
      if (!result.ok) {
        setAuthError(friendlyAuthError(result.error))
        return
      }
      if (result.profile && !result.needsEmailConfirm) {
        onProfileLoaded(result.profile)
        writeLastAuth('email')
        onNext()
        return
      }
      afterLinkSent(email)
    } finally {
      setBusy(false)
    }
  }

  const onSocial = async (provider: 'google' | 'facebook' | 'instagram') => {
    setAuthError('')
    setAuthInfo('')
    if (provider === 'instagram') {
      writeLastAuth('instagram')
      setLastAuth('instagram')
      setAuthError(copy.instagramUnavailable)
      return
    }
    setBusy(true)
    writeLastAuth(provider)
    setLastAuth(provider)
    try {
      const result = await signInWithSocial(provider)
      if (!result.ok) setAuthError(friendlyAuthError(result.error))
    } finally {
      setBusy(false)
    }
  }

  const returning = Boolean(profile.firstName.trim() || profile.email.trim())
  const title = awaitingLink
    ? copy.checkEmailTitle
    : mode === 'signup'
      ? copy.createSpace
      : returning && profile.firstName.trim()
        ? `${copy.accessReturning}, ${profile.firstName.trim()}`
        : copy.welcomeToSonique
  const lead = awaitingLink
    ? copy.magicLinkLead
    : mode === 'signup'
      ? copy.signupLead
      : copy.authGateLead

  return (
    <section className="slide auth-gate">
      {onCancel ? (
        <button type="button" className="account-back-link auth-gate-back" onClick={onCancel}>
          ← {copy.accountBack}
        </button>
      ) : null}

      <div className="auth-gate-core">
        <h1>{title}</h1>
        <p className="auth-gate-tagline">{lead}</p>

        <div className="auth-social-row">
          <button
            type="button"
            className="auth-social-btn"
            disabled={busy}
            onClick={() => void onSocial('google')}
            aria-label={copy.googleContinue}
            title={copy.googleContinue}
          >
            <GoogleMark />
            {lastAuth === 'google' ? <span className="auth-recent">{copy.authRecent}</span> : null}
          </button>
          <button
            type="button"
            className="auth-social-btn"
            disabled={busy}
            onClick={() => void onSocial('facebook')}
            aria-label={copy.facebookContinue}
            title={copy.facebookContinue}
          >
            <FacebookMark />
            {lastAuth === 'facebook' ? <span className="auth-recent">{copy.authRecent}</span> : null}
          </button>
          <button
            type="button"
            className="auth-social-btn"
            disabled={busy}
            onClick={() => void onSocial('instagram')}
            aria-label={copy.instagramContinue}
            title={copy.instagramContinue}
          >
            <InstagramMark />
            {lastAuth === 'instagram' ? <span className="auth-recent">{copy.authRecent}</span> : null}
          </button>
        </div>

        {authInfo ? <p className="auth-banner">{authInfo}</p> : null}
        {authError ? (
          <p className="auth-banner auth-banner-error" role="alert">
            {authError}
          </p>
        ) : null}

        {mode === 'login' && !awaitingLink ? (
          <form className="auth-gate-form" autoComplete="off" onSubmit={(e) => {
            e.preventDefault()
            void sendLoginLink()
          }}>
            <label className="field">
              <span>{copy.emailLabel}</span>
              <input
                type="email"
                name="sonique-login-email"
                autoComplete="username"
                placeholder={copy.emailPlaceholder}
                value={loginEmail}
                onChange={(e) => {
                  setLoginEmail(e.target.value)
                  setAuthError('')
                }}
                required
              />
            </label>
            <button type="submit" className="btn auth-continue" disabled={busy || !loginEmail.trim()}>
              {busy ? copy.authBusy : copy.continueWithEmail}
            </button>
          </form>
        ) : null}

        {mode === 'login' && awaitingLink ? (
          <button
            type="button"
            className="btn auth-continue"
            disabled={busy || !loginEmail.trim()}
            onClick={() => void sendLoginLink()}
          >
            {copy.resendConfirmEmail}
          </button>
        ) : null}

        {mode === 'signup' && !awaitingLink ? (
          <form className="auth-gate-form" autoComplete="off" onSubmit={(e) => void sendSignupLink(e)}>
            <label className="field">
              <span>{copy.pseudo}</span>
              <input
                type="text"
                name="sonique-signup-firstname"
                autoComplete="off"
                value={signupFirstName}
                onChange={(e) => setSignupFirstName(e.target.value)}
                required
              />
            </label>
            <label className="field">
              <span>{copy.emailLabel}</span>
              <input
                type="email"
                name="sonique-signup-email"
                autoComplete="off"
                placeholder={copy.emailPlaceholder}
                value={signupEmail}
                onChange={(e) => setSignupEmail(e.target.value)}
                required
              />
            </label>
            <button
              type="submit"
              className="btn auth-continue"
              disabled={busy || !signupFirstName.trim() || !signupEmail.trim()}
            >
              {busy ? copy.authBusy : copy.continueWithEmail}
            </button>
          </form>
        ) : null}

        {mode === 'login' ? (
          <p className="auth-switch">
            {copy.noAccountSignup}{' '}
            <button
              type="button"
              className="auth-switch-link"
              onClick={() => {
                setMode('signup')
                setAwaitingLink(false)
                setAuthError('')
                setAuthInfo('')
              }}
            >
              {copy.signupNow}
            </button>
          </p>
        ) : (
          <p className="auth-switch">
            {copy.haveAccountSignin}{' '}
            <button
              type="button"
              className="auth-switch-link"
              onClick={() => {
                setMode('login')
                setAwaitingLink(false)
                setAuthError('')
                setAuthInfo('')
              }}
            >
              {copy.signinNow}
            </button>
          </p>
        )}

        {onSkip ? (
          <button type="button" className="linkish" style={{ marginTop: '1.1rem' }} onClick={onSkip}>
            {copy.skipAccount}
          </button>
        ) : null}
      </div>

      <p className="auth-legal">
        {copy.supportLabel}{' '}
        <a className="support" href={`mailto:${copy.supportEmail}`}>
          {copy.supportEmail}
        </a>
        <br />
        <button type="button" onClick={() => setLegal('terms')}>
          {copy.authTerms}
        </button>
        {' et '}
        <button type="button" onClick={() => setLegal('privacy')}>
          {copy.authPrivacy}
        </button>
      </p>

      {legal ? (
        <div className="auth-legal-overlay" role="dialog" aria-modal>
          <div className="auth-legal-card">
            <h2>{legal === 'terms' ? copy.authTerms : copy.authPrivacy}</h2>
            <p>{legal === 'terms' ? copy.authTermsBody : copy.authPrivacyBody}</p>
            <button type="button" className="btn btn-primary" onClick={() => setLegal(null)}>
              {copy.accountBack}
            </button>
          </div>
        </div>
      ) : null}
    </section>
  )
}
