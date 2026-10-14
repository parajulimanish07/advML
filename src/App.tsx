import { useEffect, useState } from 'react'
import { WORLDS, levelById, worldById } from './content/load'
import { MapView } from './components/MapView'
import { LevelPlayer } from './components/LevelPlayer'
import { BossFight } from './components/BossFight'
import { Review } from './components/Review'
import { Journal } from './components/Journal'
import { CheatSheet } from './components/CheatSheet'
import { resetAll, setUnlockAll, useProgress } from './store'

function useHash() {
  const [h, setH] = useState(location.hash || '#/')
  useEffect(() => {
    const f = () => {
      setH(location.hash || '#/')
      window.scrollTo(0, 0)
    }
    window.addEventListener('hashchange', f)
    return () => window.removeEventListener('hashchange', f)
  }, [])
  return h
}

export default function App() {
  const hash = useHash()
  const p = useProgress()
  const go = (h: string) => {
    location.hash = h
  }
  const [, parts0, id] = hash.split('/')
  const view = parts0 ?? ''
  const due = Object.values(p.cards).filter((c) => c.due <= Date.now()).length

  let body
  if (view === 'level' && id) {
    const f = levelById(id)
    if (f) {
      const idx = f.world.levels.indexOf(f.level)
      const next = f.world.levels[idx + 1]
      body = (
        <LevelPlayer
          key={f.level.id}
          level={f.level}
          worldTitle={f.world.meta.title}
          onExit={() => go('#/')}
          onNext={next ? () => go(`#/level/${next.id}`) : undefined}
        />
      )
    }
  } else if (view === 'boss' && id) {
    const w = worldById(id)
    if (w?.boss) body = <BossFight key={id} boss={w.boss} worldId={id} worldTitle={w.meta.title} onExit={() => go('#/')} />
  } else if (view === 'review') body = <Review onExit={() => go('#/')} />
  else if (view === 'journal') body = <Journal onExit={() => go('#/')} />
  else if (view === 'cheat' && id) {
    const w = worldById(id)
    if (w?.cheat) body = <CheatSheet cheat={w.cheat} onExit={() => go('#/')} />
  }
  if (!body) body = <MapView go={go} />

  return (
    <>
      <nav className="nav noprint">
        <a href="#/" className="brand">🗺️ ADVML Quest</a>
        <a href="#/review">🕳️ Review Dungeon{due > 0 && <span className="badge">{due}</span>}</a>
        <a href="#/journal">📓 Mistakes{p.journal.length > 0 && <span className="badge">{p.journal.length}</span>}</a>
        <span className="spacer" />
        <label className="toggle" title="Testing: unlock every level, boss and cheat sheet">
          <input type="checkbox" checked={p.unlockAll} onChange={(e) => setUnlockAll(e.target.checked)} /> unlock all
        </label>
        <button className="btn ghost small" onClick={() => confirm('Erase all progress?') && resetAll()}>reset</button>
      </nav>
      <main>{body}</main>
      <footer className="noprint muted">{WORLDS.filter((w) => w.meta.status === 'ready').length} worlds loaded · content lives in src/content/*/*.json</footer>
    </>
  )
}
