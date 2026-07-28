import { useEffect, useRef, useState } from 'react'
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

function isPdfSource(src: string | null, mime: string | null, name?: string) {
  if (!src) return false
  return (
    mime === 'application/pdf' ||
    Boolean(name?.toLowerCase().endsWith('.pdf')) ||
    src.toLowerCase().includes('.pdf')
  )
}

/** Render PDF pages as crisp bitmaps (avoids Chrome’s tiny 66% iframe viewer). */
function PdfPages({ src, name }: { src: string; name?: string }) {
  const [pages, setPages] = useState<string[]>([])
  const [error, setError] = useState(false)
  const urlsRef = useRef<string[]>([])

  useEffect(() => {
    let cancelled = false
    urlsRef.current.forEach((u) => URL.revokeObjectURL(u))
    urlsRef.current = []
    setPages([])
    setError(false)

    void (async () => {
      try {
        const pdfjs = await import('pdfjs-dist')
        pdfjs.GlobalWorkerOptions.workerSrc = new URL(
          'pdfjs-dist/build/pdf.worker.min.mjs',
          import.meta.url,
        ).toString()

        const doc = await pdfjs.getDocument({ url: src }).promise
        const rendered: string[] = []
        const dpr = Math.min(2.5, window.devicePixelRatio || 1)

        for (let i = 1; i <= doc.numPages; i += 1) {
          const page = await doc.getPage(i)
          const base = page.getViewport({ scale: 1 })
          // Target ~1200 CSS px wide for readable notation
          const cssWidth = Math.min(1400, Math.max(900, base.width * 1.35))
          const scale = (cssWidth / base.width) * dpr
          const viewport = page.getViewport({ scale })
          const canvas = document.createElement('canvas')
          canvas.width = Math.floor(viewport.width)
          canvas.height = Math.floor(viewport.height)
          const ctx = canvas.getContext('2d')
          if (!ctx) continue
          await page.render({ canvasContext: ctx, viewport }).promise
          const blob = await new Promise<Blob | null>((resolve) =>
            canvas.toBlob((b) => resolve(b), 'image/png'),
          )
          if (!blob) continue
          const url = URL.createObjectURL(blob)
          rendered.push(url)
        }

        if (cancelled) {
          rendered.forEach((u) => URL.revokeObjectURL(u))
          return
        }
        urlsRef.current = rendered
        setPages(rendered)
      } catch {
        if (!cancelled) setError(true)
      }
    })()

    return () => {
      cancelled = true
      urlsRef.current.forEach((u) => URL.revokeObjectURL(u))
      urlsRef.current = []
    }
  }, [src])

  if (error) {
    // Fallback: native viewer, page-width zoom, no chrome clutter
    const embed = `${src}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`
    return (
      <iframe className="partition-pdf-doc" src={embed} title={name || 'Score PDF'} />
    )
  }

  if (!pages.length) {
    return <div className="partition-pdf-loading">{t().previewLabel}…</div>
  }

  return (
    <div className="partition-pdf-pages">
      {pages.map((url, i) => (
        <img
          key={url}
          className="partition-image"
          src={url}
          alt={name ? `Score ${name} — page ${i + 1}` : `Score page ${i + 1}`}
        />
      ))}
    </div>
  )
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

  const isPdf = isPdfSource(src, mime, name)

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
        const leadPx = showReadingLine ? viewport.clientHeight * 0.12 : 0
        const target = Math.min(cap, Math.max(0, guided) * cap)
        offset = Math.min(cap, target + leadPx)
        const cur = viewport.scrollTop
        viewport.scrollTop = cur + (offset - cur) * 0.35
      } else {
        const e = energyRef.current
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
          <PdfPages src={src} name={name} />
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
