import React from 'react'

function renderInline(text: string, keyPrefix: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={`${keyPrefix}-${i}`}>{part.slice(2, -2)}</strong>
    }
    return <React.Fragment key={`${keyPrefix}-${i}`}>{part}</React.Fragment>
  })
}

export function renderMarkdown(content: string): React.ReactNode {
  const lines = content.split('\n')
  const blocks: React.ReactNode[] = []
  let i = 0
  let key = 0

  while (i < lines.length) {
    const line = lines[i]

    if (line.trim() === '') {
      i++
      continue
    }

    if (line.startsWith('### ')) {
      blocks.push(<h3 key={key++} className="text-base font-semibold text-ink mt-5 mb-2">{renderInline(line.slice(4), `h3-${key}`)}</h3>)
      i++
      continue
    }
    if (line.startsWith('## ')) {
      blocks.push(<h2 key={key++} className="text-lg font-bold text-ink mt-6 mb-2">{renderInline(line.slice(3), `h2-${key}`)}</h2>)
      i++
      continue
    }

    if (line.startsWith('> ')) {
      const quoteLines: string[] = []
      while (i < lines.length && lines[i].startsWith('> ')) {
        quoteLines.push(lines[i].slice(2))
        i++
      }
      blocks.push(
        <blockquote key={key++} className="border-l-4 border-gold pl-4 py-1 my-3 text-sm text-muted italic">
          {renderInline(quoteLines.join(' '), `bq-${key}`)}
        </blockquote>
      )
      continue
    }

    if (/^\d+\.\s/.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s/, ''))
        i++
      }
      blocks.push(
        <ol key={key++} className="list-decimal list-inside space-y-1.5 my-3 text-sm text-ink">
          {items.map((item, idx) => <li key={idx}>{renderInline(item, `ol-${key}-${idx}`)}</li>)}
        </ol>
      )
      continue
    }

    if (/^-\s/.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^-\s/.test(lines[i])) {
        items.push(lines[i].replace(/^-\s/, ''))
        i++
      }
      blocks.push(
        <ul key={key++} className="list-disc list-inside space-y-1.5 my-3 text-sm text-ink">
          {items.map((item, idx) => <li key={idx}>{renderInline(item, `ul-${key}-${idx}`)}</li>)}
        </ul>
      )
      continue
    }

    const paraLines: string[] = []
    while (i < lines.length && lines[i].trim() !== '' && !lines[i].startsWith('#') && !lines[i].startsWith('>') && !/^\d+\.\s/.test(lines[i]) && !/^-\s/.test(lines[i])) {
      paraLines.push(lines[i])
      i++
    }
    blocks.push(<p key={key++} className="text-sm text-ink leading-relaxed my-3">{renderInline(paraLines.join(' '), `p-${key}`)}</p>)
  }

  return <div>{blocks}</div>
}
