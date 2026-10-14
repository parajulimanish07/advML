import { useMemo, useState } from 'react'
import type { Build } from '../types'
import { Rich } from './Rich'
import { SourceTag, parseNum } from './QuestionCard'

function shuffleDet<T>(arr: T[], seed: number): T[] {
  const a = arr.slice()
  let s = seed || 7
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 1103515245 + 12345) & 0x7fffffff
    const j = s % (i + 1)
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  // never return the identity order
  if (a.every((x, i) => x === arr[i]) && a.length > 1) a.push(a.shift()!)
  return a
}

export function BuildStep({ b, id, onDone }: { b: Build; id: string; onDone: () => void }) {
  if (b.type === 'order') return <OrderBuild b={b} id={id} onDone={onDone} />
  if (b.type === 'fill') return <FillBuild b={b} onDone={onDone} />
  return <PredictBuild b={b} onDone={onDone} />
}

function OrderBuild({ b, id, onDone }: { b: Extract<Build, { type: 'order' }>; id: string; onDone: () => void }) {
  const seed = useMemo(() => [...id].reduce((a, c) => a + c.charCodeAt(0), 0), [id])
  const pool = useMemo(() => shuffleDet(b.items, seed), [b.items, seed])
  const [picked, setPicked] = useState<string[]>([])
  const [tries, setTries] = useState(0)
  const [ok, setOk] = useState(false)
  const [msg, setMsg] = useState('')
  const remaining = pool.filter((x) => !picked.includes(x))

  const check = () => {
    const wrong = picked.map((x, i) => (x === b.items[i] ? -1 : i)).filter((i) => i >= 0)
    if (!wrong.length) {
      setOk(true)
      setMsg('')
    } else {
      setTries(tries + 1)
      setMsg(`Steps ${wrong.map((i) => i + 1).join(', ')} are out of place. Click a step in your list to remove it and everything after it.`)
    }
  }
  return (
    <div className="build">
      <div className="bprompt">
        <Rich t={b.prompt} />
      </div>
      <div className="orderwrap">
        <div className="orderlist">
          <h4>Your sequence</h4>
          {picked.length === 0 && <div className="muted">Click the steps below in the correct order.</div>}
          {picked.map((x, i) => (
            <button
              key={x}
              data-k={x}
              className={'chip placed' + (ok ? ' right' : '')}
              disabled={ok}
              onClick={() => setPicked(picked.slice(0, i))}
            >
              <span className="num">{i + 1}</span>
              <Rich t={x} />
            </button>
          ))}
        </div>
        <div className="orderpool">
          <h4>Steps</h4>
          {remaining.map((x) => (
            <button key={x} data-k={x} className="chip" disabled={ok} onClick={() => setPicked([...picked, x])}>
              <Rich t={x} />
            </button>
          ))}
        </div>
      </div>
      {msg && <div className="hint bad">{msg}</div>}
      {!ok && tries >= 2 && <div className="hint">Stuck? The first step is: <Rich t={b.items[0]} /></div>}
      {!ok ? (
        <button className="btn primary" disabled={picked.length !== b.items.length} onClick={check}>
          Check order
        </button>
      ) : (
        <div className="feedback good">
          <div className="fbhead">✅ Built it</div>
          <div className="fbbody">
            <Rich t={b.explanation} />
          </div>
          <div className="fbfoot">
            <SourceTag s={b.source} />
            <button className="btn primary" onClick={onDone}>
              On to the challenge →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function FillBuild({ b, onDone }: { b: Extract<Build, { type: 'fill' }>; onDone: () => void }) {
  const [vals, setVals] = useState<number[]>(b.blanks.map(() => -1))
  const [checked, setChecked] = useState(false)
  const [ok, setOk] = useState(false)
  const parts = b.template.split(/\{(\d+)\}/)
  const check = () => {
    setChecked(true)
    setOk(vals.every((v, i) => v === b.blanks[i].correct))
  }
  return (
    <div className="build">
      <div className="bprompt">
        <Rich t={b.prompt} />
      </div>
      <div className="fillline">
        {parts.map((p, i) =>
          i % 2 === 0 ? (
            <Rich key={i} t={p} />
          ) : (
            <select
              key={i}
              className={'fillsel' + (checked ? (vals[+p] === b.blanks[+p].correct ? ' right' : ' wrong') : '')}
              value={vals[+p]}
              disabled={ok}
              onChange={(e) => {
                const v = vals.slice()
                v[+p] = +e.target.value
                setVals(v)
                setChecked(false)
              }}
            >
              <option value={-1}>— choose —</option>
              {b.blanks[+p].options.map((o, k) => (
                <option key={k} value={k}>
                  {o.replace(/\$/g, '')}
                </option>
              ))}
            </select>
          ),
        )}
      </div>
      {checked && !ok && <div className="hint bad">Not all blanks are right yet. Red ones need another look.</div>}
      {!ok ? (
        <button className="btn primary" disabled={vals.some((v) => v < 0)} onClick={check}>
          Check
        </button>
      ) : (
        <div className="feedback good">
          <div className="fbhead">✅ Built it</div>
          <div className="fbbody">
            <Rich t={b.explanation} />
          </div>
          <div className="fbfoot">
            <SourceTag s={b.source} />
            <button className="btn primary" onClick={onDone}>
              On to the challenge →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function PredictBuild({ b, onDone }: { b: Extract<Build, { type: 'predict' }>; onDone: () => void }) {
  const [sel, setSel] = useState<number | null>(null)
  const [num, setNum] = useState('')
  const [shown, setShown] = useState(false)
  const ok = shown && (b.kind === 'mcq' ? sel === b.correct : Math.abs(parseNum(num) - (b.value ?? NaN)) <= (b.tol ?? 0.01))
  const can = b.kind === 'mcq' ? sel !== null : num.trim() !== '' && !Number.isNaN(parseNum(num))
  return (
    <div className="build">
      <div className="bprompt">
        <Rich t={b.prompt} />
      </div>
      {b.kind === 'mcq' ? (
        <div className="opts">
          {b.options!.map((o, i) => (
            <button
              key={i}
              className={'opt' + (shown ? (i === b.correct ? ' right' : i === sel ? ' wrong' : '') : i === sel ? ' sel' : '')}
              disabled={shown}
              onClick={() => setSel(i)}
            >
              <span className="optkey">{String.fromCharCode(65 + i)}</span>
              <Rich t={o} />
            </button>
          ))}
        </div>
      ) : (
        <input className="numin" placeholder="predict the value" value={num} disabled={shown} onChange={(e) => setNum(e.target.value)} />
      )}
      {!shown ? (
        <button className="btn primary" disabled={!can} onClick={() => setShown(true)}>
          Reveal
        </button>
      ) : (
        <div className={'feedback ' + (ok ? 'good' : 'bad')}>
          <div className="fbhead">{ok ? '🎯 Your prediction was right' : '🔍 Not what you predicted — here is why'}</div>
          <div className="fbbody">
            <Rich t={b.reveal} />
          </div>
          <div className="fbfoot">
            <SourceTag s={b.source} />
            <button className="btn primary" onClick={onDone}>
              On to the challenge →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
