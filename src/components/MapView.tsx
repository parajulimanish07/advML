import { WORLDS } from '../content/load'
import { bossUnlocked, cheatUnlocked, levelCleared, levelUnlocked, worldUnlocked } from '../lock'
import { levelInfo, useProgress } from '../store'

export function MapView({ go }: { go: (hash: string) => void }) {
  const p = useProgress()
  const li = levelInfo(p.xp)
  return (
    <div className="map">
      <div className="hero">
        <div>
          <h1>ADVML Quest</h1>
          <p className="muted">COMP8221 Advanced Machine Learning · one world per lecture, one level per topic. Clear a world’s levels to unlock its boss.</p>
        </div>
        <div className="stats">
          <div className="stat"><div className="sv">Lv {li.level}</div><div className="sl">{li.title}</div></div>
          <div className="stat">
            <div className="sv">{p.xp} XP</div>
            <div className="xpbar"><div style={{ width: `${(li.into / li.next) * 100}%` }} /></div>
          </div>
          <div className="stat"><div className="sv">🔥 {p.streak.count}</div><div className="sl">day streak</div></div>
        </div>
      </div>

      {WORLDS.map((w, wi) => {
        const m = w.meta
        const unlocked = worldUnlocked(p, w)
        const cleared = w.levels.filter((l) => levelCleared(p, l.id)).length
        const stars = w.levels.reduce((a, l) => a + (p.levels[l.id]?.stars ?? 0), 0)
        const bossOk = bossUnlocked(p, w)
        return (
          <section key={m.id} className={'world' + (unlocked ? '' : ' locked') + (m.status === 'missing' ? ' missing' : '')} style={{ ['--wc' as string]: m.color }}>
            <div className="worldhead">
              <div className="wemoji">{m.emoji}</div>
              <div className="wtitle">
                <div className="wweek">World {wi + 1} · {m.week}</div>
                <h2>{m.title}</h2>
                <div className="muted">{m.subtitle}</div>
              </div>
              {m.status === 'ready' && (
                <div className="wprog">
                  {cleared}/{w.levels.length} levels · ⭐ {stars}/{w.levels.length * 3}
                  {p.bosses[m.id]?.passed && ' · 🏆'}
                </div>
              )}
            </div>
            {m.status === 'missing' ? (
              <div className="missingnote">📭 {m.missingNote}</div>
            ) : !unlocked ? (
              <div className="missingnote">🔒 Defeat the previous world’s boss to enter.</div>
            ) : (
              <div className="path">
                {w.levels.map((l, i) => {
                  const ok = levelUnlocked(p, w, i)
                  const s = p.levels[l.id]?.stars ?? 0
                  return (
                    <button key={l.id} className={'node' + (ok ? '' : ' off') + (s > 0 ? ' done' : '')} disabled={!ok} onClick={() => go(`#/level/${l.id}`)} title={l.blurb}>
                      <div className="nidx">{ok ? i + 1 : '🔒'}</div>
                      <div className="nname">{l.title}</div>
                      <div className="nstars">{[1, 2, 3].map((n) => (n <= s ? '⭐' : '☆'))}</div>
                    </button>
                  )
                })}
                <button className={'node boss' + (bossOk ? '' : ' off') + (p.bosses[m.id]?.passed ? ' done' : '')} disabled={!bossOk} onClick={() => go(`#/boss/${m.id}`)}>
                  <div className="nidx">{bossOk ? '👹' : '🔒'}</div>
                  <div className="nname">Boss: {w.boss?.title ?? 'World exam'}</div>
                  <div className="nstars">{p.bosses[m.id] ? `best ${Math.round(p.bosses[m.id].best * 100)}%` : '≥80% to pass'}</div>
                </button>
                <button className={'node cheat' + (cheatUnlocked(p, w) ? '' : ' off')} disabled={!cheatUnlocked(p, w)} onClick={() => go(`#/cheat/${m.id}`)}>
                  <div className="nidx">{cheatUnlocked(p, w) ? '📜' : '🔒'}</div>
                  <div className="nname">Cheat Sheet</div>
                  <div className="nstars">{cheatUnlocked(p, w) ? 'unlocked' : 'beat the boss'}</div>
                </button>
              </div>
            )}
          </section>
        )
      })}
    </div>
  )
}
