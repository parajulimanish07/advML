import { useState } from 'react'
import type { Level } from '../types'
import { EXPLORE } from '../explore'
import { Rich } from './Rich'
import { BuildStep } from './BuildStep'
import { QuestionCard, SourceTag } from './QuestionCard'
import { finishBuild, finishLevel } from '../store'

type Stage = 'hook' | 'explore' | 'build' | 'challenge' | 'done'
const STAGES: { k: Stage; label: string }[] = [
  { k: 'hook', label: '1 · Hook' },
  { k: 'explore', label: '2 · Explore' },
  { k: 'build', label: '3 · Build' },
  { k: 'challenge', label: '4 · Challenge' },
]

export function LevelPlayer({ level, worldTitle, onExit, onNext }: { level: Level; worldTitle: string; onExit: () => void; onNext?: () => void }) {
  const [stage, setStage] = useState<Stage>('hook')
  const [qi, setQi] = useState(0)
  const [score, setScore] = useState(0)
  const [result, setResult] = useState<{ stars: number; pct: number } | null>(null)
  const Explore = EXPLORE[level.explore.component]

  const idx = STAGES.findIndex((s) => s.k === stage)
  const finish = (finalScore: number) => {
    setResult(finishLevel(level.id, finalScore, level.questions.length))
    setStage('done')
  }

  return (
    <div className="level">
      <div className="levelhead">
        <button className="btn ghost" onClick={onExit}>
          ← {worldTitle}
        </button>
        <h2>{level.title}</h2>
        <div className="srcs">
          {level.source.map((s, i) => (
            <SourceTag key={i} s={s} />
          ))}
        </div>
      </div>
      <div className="stepper">
        {STAGES.map((s, i) => (
          <div key={s.k} className={'step' + (i === idx || (stage === 'done' && i === 3) ? ' on' : i < idx || stage === 'done' ? ' past' : '')}>
            {s.label}
          </div>
        ))}
      </div>

      {stage === 'hook' && (
        <div className="panel hook fadein">
          <div className="hooktag">🎣 The hook</div>
          <h3>{level.hook.title}</h3>
          <p className="hooktext">
            <Rich t={level.hook.text} />
          </p>
          <button className="btn primary" onClick={() => setStage('explore')}>
            Show me →
          </button>
        </div>
      )}

      {stage === 'explore' && (
        <div className="fadein">
          <div className="panel exploreintro">
            <Rich t={level.explore.intro} />
            <ul className="tasks">
              {level.explore.tasks.map((t, i) => (
                <li key={i}>
                  <Rich t={t} />
                </li>
              ))}
            </ul>
          </div>
          <div className="panel playground">
            {Explore ? <Explore params={level.explore.params ?? {}} /> : <div className="muted">Missing explorer: {level.explore.component}</div>}
          </div>
          <div className="panel takeaway">
            🧭 <Rich t={level.explore.takeaway} />
          </div>
          <button className="btn primary" onClick={() => setStage('build')}>
            I've played with it → Build
          </button>
        </div>
      )}

      {stage === 'build' && (
        <div className="panel fadein">
          <div className="hooktag">🔧 Build it yourself</div>
          <BuildStep
            b={level.build}
            id={level.id}
            onDone={() => {
              finishBuild(level.id)
              setStage('challenge')
            }}
          />
        </div>
      )}

      {stage === 'challenge' && (
        <div className="panel fadein" key={qi}>
          <div className="hooktag">
            ⚔️ Challenge · question {qi + 1} of {level.questions.length}
          </div>
          <QuestionCard
            q={level.questions[qi]}
            context={level.title}
            hookRecall={level.hook.recall}
            onSubmit={(ok) => ok && setScore((s) => s + 1)}
            onNext={() => {
              if (qi + 1 < level.questions.length) setQi(qi + 1)
              else finish(score)
            }}
            nextLabel={qi + 1 < level.questions.length ? 'Next →' : 'Finish level'}
          />
        </div>
      )}

      {stage === 'done' && result && (
        <div className="panel center fadein">
          <div className="bigstars">{[1, 2, 3].map((n) => (n <= result.stars ? '⭐' : '☆'))}</div>
          <h3>
            {result.stars >= 1 ? 'Level cleared!' : 'Not cleared yet'} · {score}/{level.questions.length}
          </h3>
          <p className="muted">
            {result.stars === 0
              ? 'You need at least 60% to clear a level. Your wrong answers are in the Mistake Journal. Replay when ready.'
              : 'Stars: 3 = perfect, 2 = 80%+, 1 = 60%+. Weak questions now flow into the Review Dungeon.'}
          </p>
          <div className="row">
            <button className="btn" onClick={() => { setStage('hook'); setQi(0); setScore(0) }}>
              Replay
            </button>
            <button className="btn" onClick={onExit}>
              Back to world
            </button>
            {result.stars >= 1 && onNext && (
              <button className="btn primary" onClick={onNext}>
                Next level →
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
