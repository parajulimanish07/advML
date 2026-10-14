import { useMemo, useState } from 'react'
import { QUESTION_INDEX } from '../content/load'
import { QuestionCard } from './QuestionCard'
import { BOX_DAYS, useProgress } from '../store'

export function Review({ onExit }: { onExit: () => void }) {
  const p = useProgress()
  const [session, setSession] = useState<string[] | null>(null)
  const [i, setI] = useState(0)
  const [right, setRight] = useState(0)

  const entries = useMemo(() => Object.entries(p.cards).filter(([id]) => QUESTION_INDEX[id]), [p.cards])
  const due = entries.filter(([, c]) => c.due <= Date.now()).map(([id]) => id)
  const weak = entries.filter(([, c]) => c.box <= 2).map(([id]) => id)
  const boxes = [1, 2, 3, 4, 5].map((b) => entries.filter(([, c]) => c.box === b).length)

  const start = (ids: string[]) => {
    const shuffled = ids.slice().sort(() => Math.random() - 0.5).slice(0, 10)
    setSession(shuffled); setI(0); setRight(0)
  }

  if (session && i < session.length) {
    const ref = QUESTION_INDEX[session[i]]
    return (
      <div className="level">
        <button className="btn ghost" onClick={() => setSession(null)}>← Leave dungeon</button>
        <div className="panel fadein" key={session[i]}>
          <div className="hooktag">🕳️ Review Dungeon · {i + 1}/{session.length}</div>
          <QuestionCard
            q={ref.q}
            context={ref.context}
            hookRecall={ref.hookRecall}
            onSubmit={(ok) => ok && setRight((r) => r + 1)}
            onNext={() => setI(i + 1)}
          />
        </div>
      </div>
    )
  }
  if (session) {
    return (
      <div className="level">
        <div className="panel center fadein">
          <div className="bigstars">🗝️</div>
          <h3>Dungeon cleared: {right}/{session.length}</h3>
          <p className="muted">Correct answers move up a Leitner box (reviewed less often). Wrong ones drop back to box 1.</p>
          <div className="row">
            <button className="btn" onClick={() => setSession(null)}>Done</button>
            <button className="btn primary" onClick={() => start(due.length ? due : weak.length ? weak : entries.map(([id]) => id))}>Another round</button>
          </div>
        </div>
      </div>
    )
  }
  return (
    <div className="level">
      <button className="btn ghost" onClick={onExit}>← Map</button>
      <div className="panel">
        <h2>🕳️ Review Dungeon</h2>
        <p className="muted">
          Spaced repetition (Leitner system). Every question you answer lands in box 1–5. Boxes review after {BOX_DAYS.slice(1).map((d) => (d ? `${d}d` : 'now')).join(' / ')}. Correct → up one box; wrong → back to box 1.
        </p>
        <div className="boxes">
          {boxes.map((n, k) => (
            <div key={k} className="box">
              <div className="boxn">{n}</div>
              <div className="boxl">Box {k + 1}</div>
            </div>
          ))}
        </div>
        {entries.length === 0 ? (
          <p>Nothing to review yet. Answer some level questions first.</p>
        ) : (
          <div className="row">
            <button className="btn primary" disabled={!due.length} onClick={() => start(due)}>
              Enter with {due.length} due
            </button>
            <button className="btn" disabled={!weak.length} onClick={() => start(weak)}>
              Drill {weak.length} weak (boxes 1–2)
            </button>
            <button className="btn" onClick={() => start(entries.map(([id]) => id))}>
              Random mix
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
