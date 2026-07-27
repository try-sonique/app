import { useEffect, useRef } from 'react'
import { t } from '../lib/presets'

type PartitionViewerProps = {
  src: string | null
  mime: string | null
  name?: string
  compact?: boolean
  /** Défile seulement si true */
  autoScroll?: boolean
  /** Énergie audio 0–1 : plus tu joues, plus ça avance ; silence ≈ pause */
  energy?: number
  /**
   * Si défini (0–1), position absolue dans la zone scrollable (mode référence).
   * Ignore l’énergie tant que cette valeur est fournie.
   */
  scrollProgress?: number | null
  /** Plafond de descente (0–1 de la hauteur scrollable). Utile si reprise. */
  scrollCapRatio?: number
  /** Affiche un repère de lecture pour anticiper les mesures. */
  showReadingLine?: boolean
  /** Viewport plus haut (performance) pour voir plus de mesures. */
  tall?: boolean
}

export function PartitionViewer({
  src,
  mime,
  name,
  compact,
  autoScroll = false,
  energy = 0,
  scrollProgress = null,
  scrollCapRatio = 1,
  showReadingLine = false,
  tall = false,
}: PartitionViewerProps) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)
  const energyRef = useRef(energy)
  energyRef.current = energy
  const progressRef = useRef(scrollProgress)
  progressRef.current = scrollProgress
  const capRef = useRef(scrollCapRatio)
  capRef.current = Math.min(1, Math.max(0.05, scrollCapRatio))

  const isPdf =
    Boolean(src) &&
    (mime === 'application/pdf' ||
      name?.toLowerCase().endsWith('.pdf') ||
      src!.toLowerCase().includes('.pdf'))

  useEffect(() => {
    if (!autoScroll) return
    const viewport = viewportRef.current
    const inner = innerRef.current
    if (!viewport || !inner) return

    let raf = 0
    let last = performance.now()
    let offset = viewport.scrollTop

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const maxScroll = Math.max(0, inner.scrollHeight - viewport.clientHeight)
      const cap = maxScroll * capRef.current
      const guided = progressRef.current

      if (guided != null && maxScroll > 0) {
        // Ligne de lecture ~28% du viewport → on décale le scroll pour anticiper
        const leadPx = showReadingLine ? viewport.clientHeight * 0.12 : 0
        const target = Math.min(cap, Math.max(0, guided) * cap)
        offset = Math.min(cap, target + leadPx)
        // Lerp léger pour éviter les sauts
        const cur = viewport.scrollTop
        viewport.scrollTop = cur + (offset - cur) * 0.35
      } else {
        const e = energyRef.current
        // Plus doux : suit le jeu sans filer sur la partition
        const pxPerSec = e < 0.05 ? 0 : 3.5 + e * 22
        if (cap > 0 && pxPerSec > 0) {
          offset = Math.min(cap, offset + pxPerSec * dt)
          viewport.scrollTop = offset
        }
      }
      raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [autoScroll, src, compact, showReadingLine, tall])

  return (
    <div
      ref={viewportRef}
      className={`partition-viewport ${compact ? 'is-compact' : ''} ${tall ? 'is-tall' : ''} ${autoScroll ? 'is-scrolling' : ''}`}
      aria-label="Partition"
    >
      <div ref={innerRef} className="partition-scroll-inner">
        {!src ? (
          <div className="sheet-empty">
            <p className="sheet-empty-title">{t().noScoreStageTitle}</p>
            <p className="sheet-empty-body">{t().noScoreStageBody}</p>
          </div>
        ) : isPdf ? (
          <iframe
            className="partition-pdf-doc"
            src={src}
            title={name || 'Score PDF'}
          />
        ) : (
          <img
            className="partition-image"
            src={src}
            alt={name ? `Score ${name}` : 'Uploaded score'}
          />
        )}
      </div>
      {showReadingLine && autoScroll ? <div className="reading-line" aria-hidden /> : null}
      {autoScroll ? (
        <div className="scroll-hint">
          {scrollProgress != null ? t().scrollHintRef : t().scrollHintPlay}
        </div>
      ) : null}
    </div>
  )
}
