import type { Boss, Cheat, Level, Question, WorldMeta } from '../types'

const files = import.meta.glob('./*/*.json', { eager: true, import: 'default' }) as Record<string, unknown>
const order = (import.meta.glob('./worlds.json', { eager: true, import: 'default' }) as Record<string, string[]>)[
  './worlds.json'
]

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
    const levels = meta.levels.map((n) => get<Level>(id, n)!).filter(Boolean)
    return { meta, levels, boss: get<Boss>(id, 'boss'), cheat: get<Cheat>(id, 'cheatsheet') }
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
