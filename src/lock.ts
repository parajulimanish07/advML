import { WORLDS, type LoadedWorld } from './content/load'
import type { Progress } from './store'

export const levelCleared = (p: Progress, id: string) => (p.levels[id]?.stars ?? 0) >= 1

export function worldUnlocked(p: Progress, w: LoadedWorld): boolean {
  if (w.meta.status !== 'ready') return false
  if (p.unlockAll) return true
  const i = WORLDS.indexOf(w)
  for (let k = 0; k < i; k++) {
    const prev = WORLDS[k]
    if (prev.meta.status !== 'ready') continue
    if (!p.bosses[prev.meta.id]?.passed) return false
  }
  return true
}

export function levelUnlocked(p: Progress, w: LoadedWorld, idx: number): boolean {
  if (!worldUnlocked(p, w)) return false
  if (p.unlockAll || idx === 0) return true
  return levelCleared(p, w.levels[idx - 1].id)
}

export function bossUnlocked(p: Progress, w: LoadedWorld): boolean {
  if (!worldUnlocked(p, w) || !w.boss) return false
  if (p.unlockAll) return true
  return w.levels.every((l) => levelCleared(p, l.id))
}

export const cheatUnlocked = (p: Progress, w: LoadedWorld) => !!w.cheat && (p.unlockAll || !!p.bosses[w.meta.id]?.passed)
