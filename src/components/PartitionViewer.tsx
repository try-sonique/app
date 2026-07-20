import { useEffect, useRef } from 'react'

type PartitionViewerProps = {
  src: string | null
  mime: string | null
  name?: string
  compact?: boolean
  /** Auto-scroll / abaisse la partition pendant le jeu */
  autoScroll?: boolean
  /** Vitesse en px/s */
  speed?: number
}

export function PartitionViewer({
  src,
  mime,
  name,
  compact,
  autoScroll = false,
  speed = 28,
}: PartitionViewerProps) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)

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
    let offset = 0

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const max = Math.max(0, inner.scrollHeight - viewport.clientHeight)
      if (max > 0) {
        offset = Math.min(max, offset + speed * dt)
        viewport.scrollTop = offset
        // Boucle douce quand on arrive en bas
        if (offset >= max - 1) {
          offset = 0
          viewport.scrollTop = 0
        }
      }
      raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [autoScroll, speed, src, compact])

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
      {autoScroll ? <div className="scroll-hint">La partition s’abaisse pendant que tu joues</div> : null}
    </div>
  )
}
