import type { Src } from './types'

// PDF page => printed slide number offset (printed = page - offset)
export const SOURCES: Record<string, { label: string; file: string; offset: number }> = {
  W1: { label: 'Week 1', file: '2026_S2_MQ_COMP8221_Week1.pdf', offset: 1 },
  W2: { label: 'Week 2', file: '2026_S2_MQ_COMP8221_Week2.pdf', offset: 1 },
  W3: { label: 'Week 3', file: '2026_S2_MQ_COMP8221_Week3.pdf', offset: 1 },
  W6: { label: 'Week 6', file: 'GraphNN-w6.pdf', offset: 0 },
  W7: { label: 'Week 7', file: 'COMP8221_Week 7.pdf', offset: 0 },
  W8: { label: 'Week 8', file: 'COMP8221_Week 8.pdf', offset: 0 },
  W9: { label: 'Week 9', file: 'COMP8221_week9.pdf', offset: 0 },
}

export function srcLabel(s: Src): string {
  if (s.extra) return 'extra (not in lecture)'
  const m = SOURCES[s.file]
  if (!m) return s.file
  const slide = s.page - m.offset
  return `📖 ${m.label}, slide ${slide}` + (m.offset ? ` (PDF p.${s.page})` : '')
}

export function srcTitle(s: Src): string {
  const m = SOURCES[s.file]
  return m ? `${m.file}, PDF page ${s.page}` : s.file
}
