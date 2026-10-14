import { useState } from 'react'
import type { Question } from '../types'
import { srcLabel, srcTitle } from '../sources'
import { recordAnswer, addXp } from '../store'
import { Rich } from './Rich'

const TYPE_LABEL: Record<Question['type'], string> = {
  mcq: 'Multiple choice',
  numeric: 'Numeric',
  bug: '🐞 Spot the bug in this reasoning',
  false: '⚠️ Which statement is FALSE?',
}

export function parseNum(s: string): number {
  const t = s.trim().replace(/,/g, '')
  const f = t.match(/^(-?[\d.]+)\s*\/\s*(-?[\d.]+)$/)
  if (f) return Number(f[1]) / Number(f[2])
  return Number(t)
}

export function SourceTag({ s }: { s: Question['source'] }) {
  return (
    <span className={'src' + (s.extra ? ' extra' : '')} title={srcTitle(s)}>
      {srcLabel(s)}
    </span>
  )
}

export function QuestionCard({
  q,
  context,
  hookRecall,
  onSubmit,
  onNext,
  nextLabel = 'Next →',
  record = true,
}: {
  q: Question
  context: string
  hookRecall?: string
  onSubmit?: (correct: boolean) => void
  onNext: (correct: boolean) => void
  nextLabel?: string
  record?: boolean
}) {
  const [sel, setSel] = useState<number | null>(null)
  const [num, setNum] = useState('')
  const [done, setDone] = useState<null | boolean>(null)

  const isChoice = q.type !== 'numeric'
  const canSubmit = isChoice ? sel !== null : num.trim() !== '' && !Number.isNaN(parseNum(num))

  const submit = () => {
    let ok: boolean
    if (isChoice) ok = sel === q.correct
    else ok = Math.abs(parseNum(num) - (q.value ?? NaN)) <= (q.tol ?? 0.01)
    setDone(ok)
    if (record) {
      const correctText = isChoice ? q.options![q.correct!] : `${q.value}${q.unit ? ' ' + q.unit : ''}`
      const chosen = isChoice ? q.options![sel!] : num
      recordAnswer(
        q.id,
        ok,
        ok ? undefined : { qid: q.id, at: Date.now(), chosen, correctText, prompt: q.prompt, explanation: q.explanation, context },
      )
      if (ok) addXp(10)
    }
    onSubmit?.(ok)
  }

  return (
    <div className="qcard">
      <div className="qmeta">
        <span className="qtype">{TYPE_LABEL[q.type]}</span>
        {q.step && <span className="qstep">{q.step}</span>}
      </div>
      {q.scenario && (
        <div className="scenario">
          <Rich t={q.scenario} />
        </div>
      )}
      <div className="qprompt">
        <Rich t={q.prompt} />
      </div>
      {isChoice ? (
        <div className="opts">
          {q.options!.map((o, i) => {
            let cls = 'opt'
            if (done !== null) {
              if (i === q.correct) cls += ' right'
              else if (i === sel) cls += ' wrong'
            } else if (i === sel) cls += ' sel'
            return (
              <button key={i} className={cls} disabled={done !== null} onClick={() => setSel(i)}>
                <span className="optkey">{String.fromCharCode(65 + i)}</span>
                <Rich t={o} />
              </button>
            )
          })}
        </div>
      ) : (
        <div className="numrow">
          <input
            className="numin"
            inputMode="decimal"
            placeholder="your answer (fractions like 3/4 ok)"
            value={num}
            disabled={done !== null}
            onChange={(e) => setNum(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && canSubmit && done === null && submit()}
          />
          {q.unit && <span className="unit">{q.unit}</span>}
        </div>
      )}
      {done === null ? (
        <button className="btn primary" disabled={!canSubmit} onClick={submit}>
          Lock it in
        </button>
      ) : (
        <div className={'feedback ' + (done ? 'good' : 'bad')}>
          <div className="fbhead">{done ? '✅ Correct' : '❌ Not quite'}
            {!done && !isChoice && <span className="fbans"> · answer: {q.value}{q.unit ? ' ' + q.unit : ''}</span>}
          </div>
          <div className="fbbody">
            <Rich t={q.explanation} />
          </div>
          {hookRecall && (
            <div className="fbhook">
              💡 <Rich t={hookRecall} />
            </div>
          )}
          <div className="fbfoot">
            <SourceTag s={q.source} />
            <button className="btn primary" onClick={() => onNext(done)}>
              {nextLabel}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
