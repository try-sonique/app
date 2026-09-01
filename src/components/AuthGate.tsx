import { useEffect, useState, type FormEvent } from 'react'
import { t } from '../lib/presets'
import { getRememberedEmail, setRememberedEmail } from '../lib/storage'
import {
  requestPasswordReset,
  resendSignupEmail,
  signInWithGoogle,
  signInWithPassword,
  signOut,
  signUpWithPassword,
} from '../lib/supabaseAuth'
import type { AppState, UserProfile } from '../types'

type AuthMode = 'login' | 'signup'
type LoginStep = 'email' | 'password'
type LastAuth = 'google' | 'email'

const LAST_AUTH_KEY = 'sonique.lastAuthMethod'

function readLastAuth(): LastAuth | null {
  try {
    const v = localStorage.getItem(LAST_AUTH_KEY)
    if (v === 'google' || v === 'email') return v
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

export function AuthGate({
  profile,
  onProfileLoaded,
  onNext,
  onCancel,
}: {
  profile: AppState['profile']
  onProfileLoaded: (profile: UserProfile) => void
  onNext: () => void
  onCancel?: () => void
}) {
  const copy = t()
  const remembered = getRememberedEmail()
  const [mode, setMode] = useState<AuthMode>('login')
  const [loginStep, setLoginStep] = useState<LoginStep>(remembered ? 'password' : 'email')
  const [loginEmail, setLoginEmail] = useState(remembered)
  const [rememberEmail, setRememberEmail] = useState(Boolean(remembered))
  const [loginPassword, setLoginPassword] = useState('')
  const [signupFirstName, setSignupFirstName] = useState('')
  const [signupLastName, setSignupLastName] = useState('')
  const [signupEmail, setSignupEmail] = useState('')
  const [signupPhone, setSignupPhone] = useState('')
  const [signupPassword, setSignupPassword] = useState('')
  const [signupPassword2, setSignupPassword2] = useState('')
  const [authError, setAuthError] = useState('')
  const [authInfo, setAuthInfo] = useState('')
  const [awaitingEmailConfirm, setAwaitingEmailConfirm] = useState(false)
  const [busy, setBusy] = useState(false)
  const [legal, setLegal] = useState<'terms' | 'privacy' | null>(null)
  const [lastAuth, setLastAuth] = useState<LastAuth | null>(readLastAuth)

  useEffect(() => {
    try {
      if (sessionStorage.getItem('sonique.authFlash') === 'link_expired') {
        sessionStorage.removeItem('sonique.authFlash')
        setMode('login')
        setLoginStep('email')
        setAuthError(copy.emailLinkExpired)
      }
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one-shot flash on mount
  }, [])

  const signupValid = Boolean(
    signupFirstName.trim() &&
      signupEmail.trim() &&
      signupPassword.length >= 6 &&
      signupPassword === signupPassword2,
  )

  const blankSignupFields = () => {
    setSignupFirstName('')
    setSignupLastName('')
    setSignupEmail('')
    setSignupPhone('')
    setSignupPassword('')
    setSignupPassword2('')
    setLoginPassword('')
    setAuthError('')
    setAuthInfo('')
    setAwaitingEmailConfirm(false)
  }

  const persistRememberPreference = (email: string) => {
    if (rememberEmail) setRememberedEmail(email)
    else setRememberedEmail(null)
  }

  const friendlyAuthError = (code?: string) => {
    if (!code) return copy.loginFailed
    if (code === 'rate_limited') return copy.emailRateLimited
    if (code === 'email_not_confirmed') return copy.emailNotConfirmed
    if (code === 'link_expired') return copy.emailLinkExpired
    if (code === 'already_registered') return copy.alreadyRegistered
    if (code === 'google_unavailable') return copy.googleUnavailable
    if (code === 'not_found') return copy.loginNotFound
    return code
  }

  const submitSignup = async (e: FormEvent) => {
    e.preventDefault()
    setAuthError('')
    setAuthInfo('')
    if (signupPassword.length < 6) {
      setAuthError(copy.passwordTooShort)
      return
    }
    if (signupPassword !== signupPassword2) {
      setAuthError(copy.passwordMismatch)
      return
    }
    if (!signupFirstName.trim() || !signupEmail.trim()) return
    setBusy(true)
    try {
      const draft: UserProfile = {
        firstName: signupFirstName.trim(),
        lastName: signupLastName.trim(),
        email: signupEmail.trim(),
        phone: signupPhone.trim(),
      }
      const result = await signUpWithPassword({ profile: draft, password: signupPassword })
      if (!result.ok || !result.profile) {
        const msg = friendlyAuthError(result.error)
        setAuthError(msg)
        if (result.error === 'already_registered') {
          const email = draft.email.trim().toLowerCase()
          setLoginEmail(email)
          setRememberEmail(true)
          setRememberedEmail(email)
          setMode('login')
          setLoginStep('password')
          setAuthInfo(msg)
          setAuthError('')
        }
        return
      }
      onProfileLoaded(result.profile)
      writeLastAuth('email')
      setLastAuth('email')
      if (result.needsEmailConfirm) {
        const email = result.profile.email
        blankSignupFields()
        setLoginEmail(email)
        setRememberEmail(true)
        setRememberedEmail(email)
        setLoginPassword('')
        setAwaitingEmailConfirm(true)
        setAuthInfo(copy.checkEmailConfirm.replace('{email}', email))
        setMode('login')
        setLoginStep('password')
        return
      }
      setRememberedEmail(result.profile.email)
      onNext()
    } finally {
      setBusy(false)
    }
  }

  const continueWithEmail = (e: FormEvent) => {
    e.preventDefault()
    setAuthError('')
    if (!loginEmail.trim()) {
      setAuthError(copy.loginFailed)
      return
    }
    setLoginStep('password')
  }

  const submitLogin = async (e: FormEvent) => {
    e.preventDefault()
    setAuthError('')
    if (!loginEmail.trim() || !loginPassword) {
      setAuthError(copy.loginFailed)
      return
    }
    setBusy(true)
    try {
      const email = loginEmail.trim().toLowerCase()
      persistRememberPreference(email)
      const result = await signInWithPassword({ email, password: loginPassword })
      if (!result.ok || !result.profile) {
        setAuthError(friendlyAuthError(result.error))
        if (result.error === 'email_not_confirmed' || awaitingEmailConfirm) {
          setAuthInfo(copy.checkEmailConfirm.replace('{email}', email))
          setAwaitingEmailConfirm(true)
        }
        return
      }
      setAwaitingEmailConfirm(false)
      setAuthInfo('')
      writeLastAuth('email')
      setLastAuth('email')
      onProfileLoaded(result.profile)
      onNext()
    } finally {
      setBusy(false)
    }
  }

  const onForgot = async () => {
    setAuthError('')
    setAuthInfo('')
    if (!loginEmail.trim()) {
      setAuthError(copy.loginFailed)
      return
    }
    setBusy(true)
    try {
      const result = await requestPasswordReset(loginEmail)
      if (!result.ok) {
        setAuthError(friendlyAuthError(result.error))
        return
      }
      setAuthInfo(copy.resetSent)
    } finally {
      setBusy(false)
    }
  }

  const onResendConfirm = async () => {
    setAuthError('')
    if (!loginEmail.trim()) {
      setAuthError(copy.loginFailed)
      return
    }
    setBusy(true)
    try {
      const result = await resendSignupEmail(loginEmail)
      if (!result.ok) {
        setAuthError(friendlyAuthError(result.error))
        return
      }
      setAuthInfo(copy.resendConfirmSent)
      setAwaitingEmailConfirm(true)
    } finally {
      setBusy(false)
    }
  }

  const startSignup = () => {
    blankSignupFields()
    void signOut()
    setMode('signup')
  }

  const startLogin = () => {
    const saved = getRememberedEmail()
    setLoginEmail(saved)
    setRememberEmail(Boolean(saved))
    setLoginPassword('')
    setAuthError('')
    setAuthInfo('')
    setAwaitingEmailConfirm(false)
    setMode('login')
    setLoginStep(saved ? 'password' : 'email')
  }

  const onGoogle = async () => {
    setAuthError('')
    setBusy(true)
    writeLastAuth('google')
    setLastAuth('google')
    try {
      const result = await signInWithGoogle()
      if (!result.ok) setAuthError(friendlyAuthError(result.error))
    } finally {
      setBusy(false)
    }
  }

  const returning = Boolean(profile.firstName.trim() || profile.email.trim())
  const title =
    mode === 'signup'
      ? copy.createSpace
      : awaitingEmailConfirm
        ? copy.checkEmailTitle
        : returning && profile.firstName.trim()
          ? `${copy.accessReturning}, ${profile.firstName.trim()}`
          : copy.welcomeToSonique
  const lead =
    mode === 'signup'
      ? copy.signupLead
      : awaitingEmailConfirm
        ? copy.checkEmailLead
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
            onClick={() => void onGoogle()}
            aria-label={copy.googleContinue}
            title={copy.googleContinue}
          >
            <GoogleMark />
            {lastAuth === 'google' ? <span className="auth-recent">{copy.authRecent}</span> : null}
          </button>
        </div>

        {authInfo ? <p className="auth-banner">{authInfo}</p> : null}
        {authError ? (
          <p className="auth-banner auth-banner-error" role="alert">
            {authError}
          </p>
        ) : null}

        {mode === 'login' && loginStep === 'email' ? (
          <form className="auth-gate-form" autoComplete="off" onSubmit={continueWithEmail}>
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

        {mode === 'login' && loginStep === 'password' ? (
          <form className="auth-gate-form" autoComplete="off" onSubmit={(e) => void submitLogin(e)}>
            <label className="field">
              <span>{copy.emailLabel}</span>
              <input
                type="email"
                name="sonique-login-email"
                autoComplete="username"
                value={loginEmail}
                readOnly={awaitingEmailConfirm && Boolean(loginEmail)}
                onChange={(e) => {
                  setLoginEmail(e.target.value)
                  setAuthError('')
                }}
                required
              />
            </label>
            <label className="field">
              <span>
                {copy.password}
                {awaitingEmailConfirm ? (
                  <em className="optional-tag"> ({copy.afterEmailConfirm})</em>
                ) : null}
              </span>
              <input
                type="password"
                name="sonique-login-password"
                autoComplete="current-password"
                value={loginPassword}
                onChange={(e) => {
                  setLoginPassword(e.target.value)
                  setAuthError('')
                }}
                required
              />
            </label>
            <label className="check-row">
              <input
                type="checkbox"
                checked={rememberEmail}
                onChange={(e) => setRememberEmail(e.target.checked)}
              />
              <span>{copy.rememberEmail}</span>
            </label>
            <button
              type="submit"
              className="btn auth-continue"
              disabled={busy || !loginEmail.trim() || !loginPassword}
            >
              {busy ? copy.authBusy : copy.signIn}
            </button>
            <button
              type="button"
              className="linkish"
              onClick={() => {
                setLoginStep('email')
                setLoginPassword('')
                setAuthError('')
              }}
            >
              {copy.changeEmail}
            </button>
          </form>
        ) : null}

        {mode === 'signup' ? (
          <form className="auth-gate-form" autoComplete="off" onSubmit={(e) => void submitSignup(e)}>
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
            <label className="field">
              <span>
                {copy.password}
                <em className="optional-tag"> ({copy.passwordHint})</em>
              </span>
              <input
                type="password"
                name="sonique-signup-password"
                autoComplete="new-password"
                value={signupPassword}
                onChange={(e) => {
                  setSignupPassword(e.target.value)
                  setAuthError('')
                }}
                required
                minLength={6}
              />
            </label>
            <label className="field">
              <span>{copy.passwordConfirm}</span>
              <input
                type="password"
                name="sonique-signup-password2"
                autoComplete="new-password"
                value={signupPassword2}
                onChange={(e) => {
                  setSignupPassword2(e.target.value)
                  setAuthError('')
                }}
                required
                minLength={6}
              />
            </label>
            <button type="submit" className="btn auth-continue" disabled={busy || !signupValid}>
              {busy ? copy.authBusy : copy.createAndContinue}
            </button>
          </form>
        ) : null}

        {awaitingEmailConfirm && mode === 'login' ? (
          <button type="button" className="linkish" disabled={busy} onClick={() => void onResendConfirm()}>
            {copy.resendConfirmEmail}
          </button>
        ) : null}

        {mode === 'login' && loginStep === 'password' ? (
          <button type="button" className="linkish" disabled={busy} onClick={() => void onForgot()}>
            {copy.forgotPassword}
          </button>
        ) : null}

        {mode === 'login' ? (
          <p className="auth-switch">
            {copy.noAccountSignup}{' '}
            <button type="button" className="auth-switch-link" onClick={startSignup}>
              {copy.signupNow}
            </button>
          </p>
        ) : (
          <p className="auth-switch">
            {copy.haveAccountSignin}{' '}
            <button type="button" className="auth-switch-link" onClick={startLogin}>
              {copy.signinNow}
            </button>
          </p>
        )}
      </div>

      <p className="auth-legal">
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
