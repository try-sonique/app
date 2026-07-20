type PartitionViewerProps = {
  src: string | null
  mime: string | null
  name?: string
  compact?: boolean
}

export function PartitionViewer({ src, mime, name, compact }: PartitionViewerProps) {
  if (!src) {
    return (
      <div className="sheet-scroll">
        <div className="sheet-scroll-inner">
          <div className="sheet-lines">
            {Array.from({ length: compact ? 6 : 10 }, (_, i) => (
              <div className="staff" key={i} />
            ))}
          </div>
        </div>
      </div>
    )
  }

  const isPdf =
    mime === 'application/pdf' ||
    name?.toLowerCase().endsWith('.pdf') ||
    src.toLowerCase().includes('.pdf')

  if (isPdf) {
    return (
      <object
        className={`partition-preview partition-pdf ${compact ? 'is-compact' : ''}`}
        data={`${src}#toolbar=0&navpanes=0`}
        type="application/pdf"
        aria-label={name ? `Partition ${name}` : 'Partition PDF'}
      >
        <iframe
          className={`partition-preview partition-pdf ${compact ? 'is-compact' : ''}`}
          src={src}
          title={name ? `Partition ${name}` : 'Partition PDF'}
        />
      </object>
    )
  }

  return (
    <img
      className={`partition-preview ${compact ? 'is-compact' : ''}`}
      src={src}
      alt={name ? `Partition ${name}` : 'Partition importée'}
    />
  )
}
