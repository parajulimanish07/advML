import type { Boss, Cheat, Level, Question, WorldMeta } from '../types'

const files = import.meta.glob('./*/*.json', { eager: true, import: 'default' }) as Record<string, unknown>
const order = (import.meta.glob('./worlds.json', { eager: true, import: 'default' }) as Record<string, string[]>)[
  './worlds.json'
]

// Deterministically shuffle answer options (per question id) so the correct answer isn't
// always in the same slot. Short enumerations (e.g. "0 hops / 1 hop / ...") keep their order.
function hash(str: string) {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619)
  return h >>> 0
}
function prep(q: Question): Question {
  if (q.type === 'numeric' || !q.options || q.correct === undefined) return q
  if (Math.max(...q.options.map((o) => o.length)) < 28) return q
  const idx = q.options.map((_, i) => i)
  let s = hash(q.id) || 1
  for (let i = idx.length - 1; i > 0; i--) {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0
    const j = s % (i + 1)
    ;[idx[i], idx[j]] = [idx[j], idx[i]]
  }
  return { ...q, options: idx.map((i) => q.options![i]), correct: idx.indexOf(q.correct) }
}

function get<T>(world: string, name: string): T | undefined {
  return files[`./${world}/${name}.json`] as T | undefined
}

export type LoadedWorld = {
  meta: WorldMeta
  levels: Level[]
  boss?: Boss
  cheat?: Cheat
}

export const WORLDS: LoadedWorld[] = order
  .map((id): LoadedWorld | null => {
    const meta = get<WorldMeta>(id, 'world')
    if (!meta) return null
    const levels = meta.levels.map((n) => get<Level>(id, n)!).filter(Boolean).map((l) => ({ ...l, questions: l.questions.map(prep) }))
    const boss = get<Boss>(id, 'boss')
    return { meta, levels, boss: boss && { ...boss, questions: boss.questions.map(prep) }, cheat: get<Cheat>(id, 'cheatsheet') }
  })
  .filter((w): w is LoadedWorld => w !== null)

export const worldById = (id: string) => WORLDS.find((w) => w.meta.id === id)
export const levelById = (id: string) => {
  for (const w of WORLDS) {
    const l = w.levels.find((x) => x.id === id)
    if (l) return { world: w, level: l }
  }
}

export type QRef = { q: Question; context: string; hookRecall?: string; world: string }
export const QUESTION_INDEX: Record<string, QRef> = {}
for (const w of WORLDS) {
  for (const l of w.levels)
    for (const q of l.questions)
      QUESTION_INDEX[q.id] = { q, context: `${w.meta.week} · ${l.title}`, hookRecall: l.hook.recall, world: w.meta.id }
  if (w.boss) for (const q of w.boss.questions) QUESTION_INDEX[q.id] = { q, context: `${w.meta.week} · Boss`, world: w.meta.id }
}
