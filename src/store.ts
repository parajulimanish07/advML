import { useSyncExternalStore } from 'react'

export type Mistake = {
  qid: string
  at: number
  chosen: string
  correctText: string
  prompt: string
  explanation: string
  context: string
}
export type Card = { box: number; due: number }
export type Progress = {
  xp: number
  levels: Record<string, { stars: number; best: number }>
  builds: Record<string, boolean>
  bosses: Record<string, { passed: boolean; best: number }>
  streak: { count: number; last: string }
  journal: Mistake[]
  cards: Record<string, Card>
  unlockAll: boolean
}

const KEY = 'advml-quest-v1'
const empty = (): Progress => ({
  xp: 0,
  levels: {},
  builds: {},
  bosses: {},
  streak: { count: 0, last: '' },
  journal: [],
  cards: {},
  unlockAll: false,
})

function load(): Progress {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return { ...empty(), ...JSON.parse(raw) }
  } catch {
    /* storage unavailable */
  }
  return empty()
}

let state: Progress = load()
const subs = new Set<() => void>()

function commit(next: Progress) {
  state = next
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    /* ignore */
  }
  subs.forEach((f) => f())
}

export function useProgress(): Progress {
  return useSyncExternalStore(
    (cb) => {
      subs.add(cb)
      return () => subs.delete(cb)
    },
    () => state,
  )
}

export const getProgress = () => state

const DAY = 86400000
// Leitner boxes 1..5 -> days until next review
export const BOX_DAYS = [0, 0, 1, 3, 7, 14]

function today() {
  return new Date().toISOString().slice(0, 10)
}

function touchStreak(p: Progress): Progress {
  const t = today()
  if (p.streak.last === t) return p
  const y = new Date(Date.now() - DAY).toISOString().slice(0, 10)
  const count = p.streak.last === y ? p.streak.count + 1 : 1
  return { ...p, streak: { count, last: t } }
}

export function addXp(n: number) {
  commit(touchStreak({ ...state, xp: state.xp + n }))
}

export function recordAnswer(qid: string, correct: boolean, mistake?: Mistake) {
  const cur = state.cards[qid] ?? { box: 1, due: 0 }
  const box = correct ? Math.min(5, cur.box + 1) : 1
  const card = { box, due: Date.now() + BOX_DAYS[box] * DAY }
  const journal = !correct && mistake ? [mistake, ...state.journal].slice(0, 500) : state.journal
  commit({ ...state, cards: { ...state.cards, [qid]: card }, journal })
}

export function finishLevel(id: string, score: number, total: number) {
  const pct = total ? score / total : 0
  const stars = pct >= 1 ? 3 : pct >= 0.8 ? 2 : pct >= 0.6 ? 1 : 0
  const prev = state.levels[id]
  const best = Math.max(prev?.best ?? 0, pct)
  const bestStars = Math.max(prev?.stars ?? 0, stars)
  const bonus = prev ? 0 : stars * 10
  commit(
    touchStreak({
      ...state,
      xp: state.xp + bonus,
      levels: { ...state.levels, [id]: { stars: bestStars, best } },
    }),
  )
  return { stars, pct }
}

export function finishBuild(id: string) {
  if (state.builds[id]) return
  commit({ ...state, builds: { ...state.builds, [id]: true }, xp: state.xp + 15 })
}

export function finishBoss(id: string, pct: number) {
  const passed = pct >= 0.8
  const prev = state.bosses[id]
  commit(
    touchStreak({
      ...state,
      xp: state.xp + (passed && !prev?.passed ? 100 : 0),
      bosses: { ...state.bosses, [id]: { passed: passed || !!prev?.passed, best: Math.max(prev?.best ?? 0, pct) } },
    }),
  )
  return passed
}

export function clearJournalEntry(qid: string) {
  commit({ ...state, journal: state.journal.filter((m) => m.qid !== qid) })
}

export function setUnlockAll(v: boolean) {
  commit({ ...state, unlockAll: v })
}

export function resetAll() {
  commit(empty())
}

export const levelInfo = (xp: number) => {
  const names = ['Initiate', 'Apprentice', 'Adept', 'Scholar', 'Researcher', 'Expert', 'Master', 'Grandmaster']
  const lv = Math.floor(xp / 150)
  return { level: lv + 1, title: names[Math.min(lv, names.length - 1)], into: xp % 150, next: 150 }
}
