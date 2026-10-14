import type { Cheat } from '../types'
import { M, Rich } from './Rich'
import { SourceTag } from './QuestionCard'

export function CheatSheet({ cheat, onExit }: { cheat: Cheat; onExit: () => void }) {
  return (
    <div className="level cheat">
      <div className="noprint">
        <button className="btn ghost" onClick={onExit}>← Back</button>
        <button className="btn" onClick={() => window.print()}>🖨 Print / save PDF</button>
      </div>
      <div className="panel">
        <h2>📜 {cheat.title}</h2>
        <div className="cheatgrid">
          {cheat.items.map((it, i) => (
            <div className="cheatitem" key={i}>
              <div className="cl">{it.label}</div>
              {it.latex && <div className="ceq"><M t={it.latex} block /></div>}
              <div className="cn"><Rich t={it.note} /></div>
              <SourceTag s={it.source} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
