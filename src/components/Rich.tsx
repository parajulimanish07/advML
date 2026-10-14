import katex from 'katex'
import 'katex/dist/katex.min.css'
import { useMemo } from 'react'

function tex(src: string, display: boolean) {
  try {
    return katex.renderToString(src, { displayMode: display, throwOnError: false, strict: false })
  } catch {
    return src
  }
}

// Renders text with $inline$, $$display$$, **bold**, `code`, and \n line breaks.
export function toHtml(text: string): string {
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const out: string[] = []
  const re = /\$\$([\s\S]+?)\$\$|\$([^$\n]+?)\$/g
  let last = 0
  let m: RegExpExecArray | null
  const fmt = (s: string) =>
    esc(s)
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/`(.+?)`/g, '<code>$1</code>')
      .replace(/\n/g, '<br/>')
  while ((m = re.exec(text))) {
    out.push(fmt(text.slice(last, m.index)))
    out.push(m[1] !== undefined ? tex(m[1], true) : tex(m[2], false))
    last = m.index + m[0].length
  }
  out.push(fmt(text.slice(last)))
  return out.join('')
}

export function Rich({ t, className }: { t: string; className?: string }) {
  const html = useMemo(() => toHtml(t), [t])
  return <span className={className} dangerouslySetInnerHTML={{ __html: html }} />
}

export function M({ t, block }: { t: string; block?: boolean }) {
  const html = useMemo(() => tex(t, !!block), [t, block])
  return <span dangerouslySetInnerHTML={{ __html: html }} />
}
