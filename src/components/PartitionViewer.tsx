import { useEffect, useRef } from 'react'

type PartitionViewerProps = {
  src: string | null
  mime: string | null
  name?: string
  compact?: boolean
  /** Défile seulement si true */
  autoScroll?: boolean
  /** Énergie audio 0–1 : plus tu joues, plus ça avance ; silence ≈ pause */
  energy?: number
}

export function PartitionViewer({
  src,
  mime,
  name,
  compact,
  autoScroll = false,
  energy = 0,
}: PartitionViewerProps) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)
  const energyRef = useRef(energy)
  energyRef.current = energy

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
      const max = Math.max(0, inner.scrollHeight - viewport.clientHeight)
      const e = energyRef.current
      // Silence / quasi-silence : quasi à l’arrêt. Jeu clair : avance mesurée.
      const pxPerSec = e < 0.05 ? 0 : 6 + e * 38
      if (max > 0 && pxPerSec > 0) {
        offset = Math.min(max, offset + pxPerSec * dt)
        viewport.scrollTop = offset
      }
      raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [autoScroll, src, compact])

  return (
    <div
      ref={viewportRef}
      className={`partition-viewport ${compact ? 'is-compact' : ''} ${autoScroll ? 'is-scrolling' : ''}`}
      aria-label="Partition"
    >
      <div ref={innerRef} className="partition-scroll-inner">
        {!src ? (
          <div className="sheet-lines tall">
            {Array.from({ length: compact ? 14 : 22 }, (_, i) => (
              <div className="staff" key={i} />
            ))}
          </div>
        ) : isPdf ? (
          <object
            className="partition-pdf-doc"
            data={`${src}#toolbar=0&navpanes=0`}
            type="application/pdf"
            aria-label={name ? `Partition ${name}` : 'Partition PDF'}
          >
            <iframe className="partition-pdf-doc" src={src} title={name || 'Partition PDF'} />
          </object>
        ) : (
          <img
            className="partition-image"
            src={src}
            alt={name ? `Partition ${name}` : 'Partition importée'}
          />
        )}
      </div>
      {autoScroll ? (
        <div className="scroll-hint">
          Défilement calé sur ton jeu — silence = pause, tu joues = la partition s’abaisse
        </div>
      ) : null}
    </div>
  )
}
