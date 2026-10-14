import { useEffect, useRef, useState } from 'react'
import type { Boss } from '../types'
import { QuestionCard } from './QuestionCard'
import { Rich } from './Rich'
import { finishBoss } from '../store'

const SECS_PER_Q = 75
const LIVES = 3

export function BossFight({ boss, worldId, worldTitle, onExit }: { boss: Boss; worldId: string; worldTitle: string; onExit: () => void }) {
  const n = boss.questions.length
  const [phase, setPhase] = useState<'intro' | 'fight' | 'end'>('intro')
  const [qi, setQi] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [lives, setLives] = useState(LIVES)
  const [left, setLeft] = useState(n * SECS_PER_Q)
  const [answering, setAnswering] = useState(true)
  const [why, setWhy] = useState<'cleared' | 'lives' | 'time' | 'score'>('score')
  const [passed, setPassed] = useState(false)
  const ended = useRef(false)

  const end = (c: number, reason: typeof why) => {
    if (ended.current) return
    ended.current = true
    const pct = c / n
    setPassed(finishBoss(worldId, pct) && reason === 'cleared')
    setWhy(reason)
    setPhase('end')
  }

  useEffect(() => {
    if (phase !== 'fight' || !answering) return
    const t = setInterval(() => setLeft((x) => x - 1), 1000)
    return () => clearInterval(t)
  }, [phase, answering])

  useEffect(() => {
    if (phase === 'fight' && left <= 0) end(correct, 'time')
  })

  const mm = Math.floor(Math.max(left, 0) / 60)
  const ss = String(Math.max(left, 0) % 60).padStart(2, '0')

  if (phase === 'intro')
    return (
      <div className="level">
        <button className="btn ghost" onClick={onExit}>
          ← {worldTitle}
        </button>
        <div className="panel center fadein boss">
          <div className="bossemoji">👹</div>
          <h2>{boss.title}</h2>
          <p>
            <Rich t={boss.intro} />
          </p>
          <ul className="rules">
            <li>{n} questions, including multi-step exam-style problems</li>
            <li>⏱ {Math.round((n * SECS_PER_Q) / 60)} minutes total (the clock pauses while you read feedback)</li>
            <li>❤️ {LIVES} lives: each wrong answer costs one</li>
            <li>Pass mark: <strong>80%</strong></li>
          </ul>
          <button className="btn primary big" onClick={() => setPhase('fight')}>
            Fight!
          </button>
        </div>
      </div>
    )

  if (phase === 'end') {
    const pct = Math.round((correct / n) * 100)
    return (
      <div className="level">
        <div className="panel center fadein boss">
          <div className="bossemoji">{passed ? '🏆' : '💀'}</div>
          <h2>{passed ? 'Boss defeated!' : 'Defeated'}</h2>
          <p>
            Score {correct}/{n} ({pct}%) ·{' '}
            {why === 'lives' ? 'out of lives' : why === 'time' ? 'time ran out' : pct >= 80 ? 'pass mark reached' : 'below the 80% pass mark'}
          </p>
          <p className="muted">{passed ? 'Next world and this world’s Cheat Sheet are unlocked.' : 'Wrong answers are in your Mistake Journal. Review, then try again.'}</p>
          <div className="row">
            <button className="btn" onClick={onExit}>Back to world</button>
            {!passed && (
              <button
                className="btn primary"
                onClick={() => {
                  ended.current = false
                  setQi(0); setCorrect(0); setLives(LIVES); setLeft(n * SECS_PER_Q); setAnswering(true); setPhase('intro')
                }}
              >
                Try again
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  const q = boss.questions[qi]
  return (
    <div className="level">
      <div className="bosshud">
        <div>👹 {boss.title}</div>
        <div className={'timer' + (left < 60 ? ' low' : '')}>⏱ {mm}:{ss}</div>
        <div>{'❤️'.repeat(lives)}{'🖤'.repeat(LIVES - lives)}</div>
        <div>{qi + 1}/{n}</div>
      </div>
      <div className="panel fadein" key={q.id}>
        <QuestionCard
          q={q}
          context={`${worldId.toUpperCase()} · Boss`}
          onSubmit={(ok) => {
            setAnswering(false)
            if (ok) setCorrect((c) => c + 1)
            else setLives((l) => l - 1)
          }}
          onNext={(ok) => {
            const c = correct // already includes this answer (state updated at submit)
            if (!ok && lives <= 0) return end(c, 'lives')
            if (qi + 1 >= n) return end(c, c / n >= 0.8 ? 'cleared' : 'score')
            setAnswering(true)
            setQi(qi + 1)
          }}
          nextLabel={qi + 1 >= n ? 'Finish' : 'Next →'}
        />
      </div>
    </div>
  )
}
