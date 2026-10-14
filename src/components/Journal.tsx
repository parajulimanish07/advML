import { Rich } from './Rich'
import { QUESTION_INDEX } from '../content/load'
import { SourceTag } from './QuestionCard'
import { clearJournalEntry, useProgress } from '../store'

export function Journal({ onExit }: { onExit: () => void }) {
  const p = useProgress()
  return (
    <div className="level">
      <button className="btn ghost" onClick={onExit}>← Map</button>
      <div className="panel">
        <h2>📓 Mistake Journal</h2>
        <p className="muted">Every wrong answer, with the explanation. Mark one as understood to clear it. It stays in the Review Dungeon either way.</p>
        {p.journal.length === 0 && <p>No mistakes logged. Suspiciously good.</p>}
        {p.journal.map((m, i) => {
          const ref = QUESTION_INDEX[m.qid]
          return (
            <div className="jentry" key={m.qid + m.at + i}>
              <div className="jctx">{m.context} · {new Date(m.at).toLocaleString()}</div>
              <div className="jq"><Rich t={m.prompt} /></div>
              <div className="jrow bad">Your answer: <Rich t={m.chosen} /></div>
              <div className="jrow good">Correct: <Rich t={m.correctText} /></div>
              <div className="jexp"><Rich t={m.explanation} /></div>
              <div className="fbfoot">
                {ref && <SourceTag s={ref.q.source} />}
                <button className="btn" onClick={() => clearJournalEntry(m.qid)}>Got it ✓</button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
