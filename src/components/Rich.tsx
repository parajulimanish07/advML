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

// Renders text with $inline$, $$display$$, **bold**, *italic*, `code`, and \n line breaks.
// Math is lifted out first so that bold/italic spans can wrap around formulas.
export function toHtml(text: string): string {
  const esc = (x: string) => x.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const math: string[] = []
  const stripped = text.replace(/\\\$/g, '\u0001').replace(/\$\$([\s\S]+?)\$\$|\$([^$\n]+?)\$/g, (_m, d, i) => {
    math.push(d !== undefined ? tex(d, true) : tex(i, false))
    return `\u0000${math.length - 1}\u0000`
  })
  const html = esc(stripped)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*\w])\*([^*\n]+?)\*(?!\w)/g, '$1<em>$2</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/\n/g, '<br/>')
  return html.replace(/\u0000(\d+)\u0000/g, (_m, k) => math[+k]).replace(/\u0001/g, '$')
}

export function Rich({ t, className }: { t: string; className?: string }) {
  const html = useMemo(() => toHtml(t), [t])
  return <span className={className} dangerouslySetInnerHTML={{ __html: html }} />
}

export function M({ t, block }: { t: string; block?: boolean }) {
  const html = useMemo(() => tex(t, !!block), [t, block])
  return <span dangerouslySetInnerHTML={{ __html: html }} />
}
