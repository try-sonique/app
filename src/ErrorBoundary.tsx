import { Component, type ErrorInfo, type ReactNode } from 'react'

type Props = { children: ReactNode }
type State = { error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Sonique crashed', error, info.componentStack)
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <section style={{ padding: '2.5rem 1.25rem', maxWidth: 420, margin: '0 auto' }}>
        <p style={{ letterSpacing: '0.28em', textTransform: 'uppercase', fontSize: 12 }}>Sonique</p>
        <h1 style={{ fontSize: '1.4rem' }}>Un souci a bloqué l’écran</h1>
        <p>Recharge la page. Si ça revient, ouvre le lien avec le slash final : /app/</p>
        <button type="button" onClick={() => window.location.reload()}>
          Recharger
        </button>
      </section>
    )
  }
}
