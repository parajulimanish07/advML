import { useMemo, useState } from 'react'
import { Seg, Slider, f2, gauss, path, rng } from './ui'
import { M } from '../components/Rich'

const ARROW = ['↑', '↓', '←', '→']
const DIRS: [number, number][] = [[-1, 0], [1, 0], [0, -1], [0, 1]]

/* ---------- L1: be the agent in the maze ---------- */
const MR = 4, MC = 5
const OBST = new Set(['1,1', '1,3', '2,1', '3,3'])
const CHEESE = '3,4'
export function MazeAgent() {
  const [pos, setPos] = useState<[number, number]>([0, 0])
  const [log, setLog] = useState<{ s: string; a: number; r: number }[]>([])
  const [g, setG] = useState(0.9)
  const done = `${pos[0]},${pos[1]}` === CHEESE
  const act = (a: number) => {
    if (done) return
    const nr = pos[0] + DIRS[a][0], nc = pos[1] + DIRS[a][1]
    const off = nr < 0 || nr >= MR || nc < 0 || nc >= MC
    const hit = off || OBST.has(`${nr},${nc}`)
    const np: [number, number] = hit ? pos : [nr, nc]
    const r = `${np[0]},${np[1]}` === CHEESE && !hit ? 10 : hit ? -2 : -1
    setLog([...log, { s: `(${pos[0]},${pos[1]})`, a, r }])
    setPos(np)
  }
  const G = log.reduce((s, e, t) => s + g ** t * e.r, 0)
  const raw = log.reduce((s, e) => s + e.r, 0)
  const W = 400, H = 330
  return (
    <div className="viz">
      <div>
        <svg className="svgbox" viewBox={`0 0 ${W} ${H}`}>
          {Array.from({ length: MR * MC }, (_, k) => { const r = Math.floor(k / MC), c = k % MC; const key = `${r},${c}`; return <g key={k}><rect x={20 + c * 72} y={10 + r * 74} width={68} height={70} rx={8} fill={OBST.has(key) ? '#3a2430' : key === CHEESE ? '#3a3320' : '#182131'} stroke="#2a3a54" /><text x={54 + c * 72} y={55 + r * 74} textAnchor="middle" fontSize="26">{OBST.has(key) ? '🧱' : key === CHEESE ? '🧀' : ''}</text></g> })}
          <text x={34 + pos[1] * 72} y={52 + pos[0] * 74} fontSize="34">🐭</text>
        </svg>
        <div className="btnrow" style={{ marginTop: 10 }}>
          {ARROW.map((a, i) => <button key={i} className="btn primary" disabled={done} onClick={() => act(i)} style={{ minWidth: 48 }}>{a}</button>)}
          <button className="btn ghost" onClick={() => { setPos([0, 0]); setLog([]) }}>reset</button>
        </div>
      </div>
      <div className="ctrls">
        <Slider label={<M t="\gamma" />} value={g} min={0} max={1} step={0.05} onChange={setG} />
        <div className="readout">
          MDP: S = mouse position, A = ↑↓←→, r = −1 per move, −2 for hitting a wall/obstacle, +10 for the cheese, deterministic p(s′|s,a) = 1<br /><br />
          steps taken: {log.length} · plain sum of rewards: <b>{raw}</b><br />
          discounted return G = Σ γᵗ rₜ = <b>{f2(G)}</b>
        </div>
        <div className="readout" style={{ maxHeight: 130, overflow: 'auto', fontSize: 13 }}>
          {log.length === 0 ? 'Move the mouse to the cheese.' : log.map((e, t) => <div key={t}>t={t}: s={e.s}, a={ARROW[e.a]}, r={e.r}, γᵗr = {f2(g ** t * e.r)}</div>)}
          {done && <b style={{ color: '#3ddc97' }}>episode over: cheese reached</b>}
        </div>
      </div>
    </div>
  )
}

/* ---------- L2: why discount (Sutton Ex 3.22) ---------- */
export function DiscountDemo() {
  const [g, setG] = useState(0.9)
  const L = 1 / (1 - g * g), R = (2 * g) / (1 - g * g)
  const terms = (rew: (t: number) => number) => Array.from({ length: 14 }, (_, t) => g ** t * rew(t))
  const tl = terms((t) => (t % 2 === 0 ? 1 : 0)), tr = terms((t) => (t % 2 === 1 ? 2 : 0))
  const best = Math.abs(L - R) < 1e-9 ? 'tie' : L > R ? 'left' : 'right'
  const bar = (v: number, c: string, i: number, y: number) => <rect key={c + i} x={30 + i * 34} y={y - v * 40} width={26} height={v * 40} fill={c} rx={3} />
  return (
    <div className="viz">
      <div>
        <svg className="svgbox" viewBox="0 0 520 300">
          <text x={20} y={16} fill="#4de1c1" fontSize="12">policy left: rewards 1, 0, 1, 0, …  (discounted contribution of each step)</text>
          {tl.map((v, i) => bar(v, '#4de1c1', i, 120))}
          <text x={20} y={156} fill="#ff6b81" fontSize="12">policy right: rewards 0, 2, 0, 2, …</text>
          {tr.map((v, i) => bar(v, '#ff6b81', i, 270))}
        </svg>
      </div>
      <div className="ctrls">
        <Slider label={<M t="\gamma" />} value={g} min={0} max={0.99} step={0.01} onChange={setG} />
        <div className="readout">
          G<sub>left</sub> = 1 + γ·0 + γ²·1 + … = <b>{f2(L, 3)}</b><br />
          G<sub>right</sub> = 0 + γ·2 + γ²·0 + γ³·2 + … = <b>{f2(R, 3)}</b><br /><br />
          optimal policy: <b style={{ color: '#ffc857' }}>{best === 'tie' ? 'either (tie)' : 'π_' + best}</b><br />
          <span className="muted">Without γ&lt;1 the cyclic sums grow without bound. Closed forms 1/(1−γ²) and 2γ/(1−γ²) are my algebra; the slide shows the first terms.</span>
        </div>
      </div>
    </div>
  )
}

/* ---------- L3: V and Q on a 3x3 grid ---------- */
const GOAL = 8
const dist = (s: number) => Math.abs(2 - Math.floor(s / 3)) + Math.abs(2 - (s % 3))
const stepG = (s: number, a: number) => { const r = Math.floor(s / 3) + DIRS[a][0], c = (s % 3) + DIRS[a][1]; return r < 0 || r > 2 || c < 0 || c > 2 ? s : r * 3 + c }
export function VQDemo() {
  const [g, setG] = useState(0.9)
  const [sel, setSel] = useState(4)
  const V = (s: number) => (s === GOAL ? 0 : g ** (dist(s) - 1))
  const Q = (s: number, a: number) => { const n = stepG(s, a); return (n === GOAL ? 1 : 0) + (n === GOAL ? 0 : g * V(n)) }
  return (
    <div className="viz">
      <div>
        <svg className="svgbox" viewBox="0 0 330 330">
          {Array.from({ length: 9 }, (_, s) => { const r = Math.floor(s / 3), c = s % 3; return <g key={s} style={{ cursor: 'pointer' }} onClick={() => s !== GOAL && setSel(s)}><rect x={15 + c * 100} y={15 + r * 100} width={95} height={95} rx={10} fill={s === GOAL ? '#12332a' : sel === s ? '#22305a' : '#182131'} stroke={sel === s ? '#7c9cff' : '#2a3a54'} strokeWidth={sel === s ? 3 : 1} /><text x={62 + c * 100} y={70 + r * 100} textAnchor="middle" fill="#e6edf6" fontSize="20" fontWeight="700">{s === GOAL ? '🏁' : f2(V(s), 3)}</text><text x={62 + c * 100} y={96 + r * 100} textAnchor="middle" fill="#8fa0b8" fontSize="11">{s === GOAL ? 'goal r=+1' : `d=${dist(s)} step${dist(s) > 1 ? 's' : ''}`}</text></g> })}
        </svg>
        <p className="muted" style={{ fontSize: 13 }}>Cell value = V<sup>π</sup>(s) for the shortest-path policy. Click a cell for its Q-values.</p>
      </div>
      <div className="ctrls">
        <Slider label={<M t="\gamma" />} value={g} min={0.1} max={1} step={0.05} onChange={setG} />
        <div className="readout">V<sup>π</sup>(s) = expected discounted return from s: a cell d steps from the goal gets γ<sup>d−1</sup>.<br />Selected cell {sel + 1}: V = <b>{f2(V(sel), 3)}</b></div>
        <table className="grid">
          <thead><tr><th>action a</th>{ARROW.map((a) => <th key={a}>{a}</th>)}</tr></thead>
          <tbody><tr><th>Q<sup>π</sup>(s,a)</th>{[0, 1, 2, 3].map((a) => { const best = Math.max(...[0, 1, 2, 3].map((x) => Q(sel, x))); return <td key={a} style={{ background: Q(sel, a) === best ? '#12332a' : undefined }}>{f2(Q(sel, a), 3)}</td> })}</tr></tbody>
        </table>
        <div className="readout muted">Q(s,a): take action a first (bumping a wall keeps you in place), then follow π. If Q(s,a₁) &gt; Q(s,a₂), a₁ is the better action.</div>
      </div>
    </div>
  )
}

/* ---------- L4: Bellman on the A/B gridworld ---------- */
const GN = 5
const GA = [0, 1], GAp = [4, 1], GB = [0, 3], GBp = [2, 3]
const gnext = (r: number, c: number, a: number): [number, number, number] => {
  if (r === GA[0] && c === GA[1]) return [GAp[0], GAp[1], 10]
  if (r === GB[0] && c === GB[1]) return [GBp[0], GBp[1], 5]
  const nr = r + DIRS[a][0], nc = c + DIRS[a][1]
  if (nr < 0 || nr >= GN || nc < 0 || nc >= GN) return [r, c, -1]
  return [nr, nc, 0]
}
export function BellmanGrid() {
  const [g, setG] = useState(0.9)
  const [sweeps, setSweeps] = useState(0)
  const [sel, setSel] = useState<[number, number]>([0, 1])
  const V = useMemo(() => {
    let v = Array.from({ length: GN }, () => Array(GN).fill(0))
    for (let i = 0; i < sweeps; i++) v = v.map((row, r) => row.map((_, c) => Math.max(...[0, 1, 2, 3].map((a) => { const [nr, nc, rw] = gnext(r, c, a); return rw + g * v[nr][nc] }))))
    return v
  }, [g, sweeps])
  const opts = [0, 1, 2, 3].map((a) => { const [nr, nc, rw] = gnext(sel[0], sel[1], a); return { a, nr, nc, rw, val: rw + g * V[nr][nc] } })
  const bestv = Math.max(...opts.map((o) => o.val))
  return (
    <div className="viz">
      <div>
        <svg className="svgbox" viewBox="0 0 330 330">
          {V.map((row, r) => row.map((v, c) => {
            const special = (r === 0 && c === 1) ? 'A' : (r === 0 && c === 3) ? 'B' : (r === 4 && c === 1) ? "A′" : (r === 2 && c === 3) ? "B′" : ''
            return <g key={`${r}${c}`} style={{ cursor: 'pointer' }} onClick={() => setSel([r, c])}><rect x={10 + c * 62} y={10 + r * 62} width={58} height={58} rx={8} fill={`rgba(77,225,193,${Math.min(0.55, v / 40)})`} stroke={sel[0] === r && sel[1] === c ? '#fff' : '#2a3a54'} strokeWidth={sel[0] === r && sel[1] === c ? 3 : 1} /><text x={39 + c * 62} y={44 + r * 62} textAnchor="middle" fill="#e6edf6" fontSize="14" fontWeight="700">{v.toFixed(1)}</text>{special && <text x={16 + c * 62} y={24 + r * 62} fill="#ffc857" fontSize="12" fontWeight="700">{special}</text>}</g>
          }))}
        </svg>
      </div>
      <div className="ctrls">
        <Slider label={<M t="\gamma" />} value={g} min={0.5} max={0.99} step={0.01} onChange={(v) => { setG(v); setSweeps(0) }} />
        <div className="btnrow"><button className="btn" onClick={() => setSweeps(sweeps + 1)}>1 Bellman sweep</button><button className="btn primary" onClick={() => setSweeps(sweeps + 50)}>+50 sweeps</button><button className="btn ghost" onClick={() => setSweeps(0)}>reset</button></div>
        <div className="readout">sweeps: {sweeps} · from A every action gives +10 and jumps to A′; from B +5 to B′; off-grid = −1<br />closed form (slide): v*(A) = 10/(1−γ⁵) = <b>{f2(10 / (1 - g ** 5), 2)}</b> · now: <b>{V[0][1].toFixed(2)}</b></div>
        <div className="readout">cell ({sel[0] + 1},{sel[1] + 1}): V(s) ← max<sub>a</sub> [ r + γ V(s′) ]<br />{opts.map((o) => <div key={o.a} style={{ color: o.val === bestv ? '#3ddc97' : undefined }}>{ARROW[o.a]}: {o.rw} + {g}·{V[o.nr][o.nc].toFixed(1)} = {o.val.toFixed(2)}</div>)}</div>
      </div>
    </div>
  )
}

/* ---------- L5: tabular Q-learning ---------- */
const QN = 4
const qstep = (s: number, a: number): [number, number, boolean] => {
  const r = Math.floor(s / QN) + DIRS[a][0], c = (s % QN) + DIRS[a][1]
  if (r < 0 || r >= QN || c < 0 || c >= QN) return [s, -1, false]
  const n = r * QN + c
  return n === QN * QN - 1 ? [n, 10, true] : [n, -1, false]
}
export function QLearnGrid() {
  const [Q, setQ] = useState<number[][]>(() => Array.from({ length: QN * QN }, () => [0, 0, 0, 0]))
  const [alpha, setAlpha] = useState(0.5)
  const [gamma, setGamma] = useState(0.9)
  const [eps, setEps] = useState(0.2)
  const [s, setS] = useState(0)
  const [seed, setSeed] = useState(1)
  const [last, setLast] = useState('')
  const [eps_n, setEpN] = useState(0)
  const run = (steps: number, stopAtEnd: boolean) => {
    let q = Q.map((r) => r.slice()), cur = s, sd = seed, msg = last, ep = eps_n
    const r = rng(sd * 7919)
    for (let i = 0; i < steps; i++) {
      const best = q[cur].indexOf(Math.max(...q[cur]))
      const a = r() < eps ? Math.floor(r() * 4) : best
      const [n, rw, d] = qstep(cur, a)
      const tgt = rw + (d ? 0 : gamma * Math.max(...q[n]))
      const old = q[cur][a]
      q[cur][a] = old + alpha * (tgt - old)
      msg = `Q(${cur + 1},${ARROW[a]}) ← ${f2(old)} + ${alpha}·[${rw} + ${d ? '0' : gamma + '·' + f2(Math.max(...q[n]))} − ${f2(old)}] = ${f2(q[cur][a])}`
      cur = d ? 0 : n
      if (d) { ep++; if (stopAtEnd) break }
    }
    setQ(q); setS(cur); setSeed(sd + 1); setLast(msg); setEpN(ep)
  }
  const greedy = (st: number) => ARROW[Q[st].indexOf(Math.max(...Q[st]))]
  return (
    <div className="viz">
      <div>
        <svg className="svgbox" viewBox="0 0 330 330">
          {Q.map((qs, st) => { const r = Math.floor(st / QN), c = st % QN; const mx = Math.max(...qs); return <g key={st}><rect x={10 + c * 78} y={10 + r * 78} width={74} height={74} rx={8} fill={st === QN * QN - 1 ? '#12332a' : `rgba(124,156,255,${Math.min(0.55, Math.max(0, mx) / 20)})`} stroke={st === s ? '#ffc857' : '#2a3a54'} strokeWidth={st === s ? 3 : 1} />{st === QN * QN - 1 ? <text x={47 + c * 78} y={55 + r * 78} textAnchor="middle" fontSize="24">🏁</text> : <><text x={47 + c * 78} y={42 + r * 78} textAnchor="middle" fill="#e6edf6" fontSize="22">{mx === 0 ? '·' : greedy(st)}</text><text x={47 + c * 78} y={68 + r * 78} textAnchor="middle" fill="#8fa0b8" fontSize="12">{f2(mx, 1)}</text></>}</g> })}
          <text x={14} y={326} fill="#8fa0b8" fontSize="11">arrow = greedy action · number = max Q · gold border = agent</text>
        </svg>
      </div>
      <div className="ctrls">
        <Slider label={<M t="\alpha" />} value={alpha} min={0.05} max={1} step={0.05} onChange={setAlpha} />
        <Slider label={<M t="\gamma" />} value={gamma} min={0} max={0.99} step={0.01} onChange={setGamma} />
        <Slider label={<M t="\varepsilon" />} value={eps} min={0} max={1} step={0.05} onChange={setEps} />
        <div className="btnrow"><button className="btn" onClick={() => run(1, false)}>1 step</button><button className="btn" onClick={() => run(200, true)}>1 episode</button><button className="btn primary" onClick={() => run(3000, false)}>run 3000 steps</button><button className="btn ghost" onClick={() => { setQ(Array.from({ length: QN * QN }, () => [0, 0, 0, 0])); setS(0); setLast(''); setEpN(0) }}>reset</button></div>
        <div className="readout">episodes finished: {eps_n}<br />last update: {last || '—'}<br /><span className="muted">r = −1 per move (and for bumping a wall), +10 at the goal (terminal). Off-policy: Q approximates Q* whatever policy collects the data, provided every pair keeps being updated.</span></div>
      </div>
    </div>
  )
}

/* ---------- L6: cliff walking ---------- */
const CR = 4, CC = 12
function cliffStep(s: [number, number], a: number): [[number, number], number, boolean] {
  const nr = Math.min(Math.max(s[0] + DIRS[a][0], 0), CR - 1), nc = Math.min(Math.max(s[1] + DIRS[a][1], 0), CC - 1)
  if (nr === CR - 1 && nc > 0 && nc < CC - 1) return [[CR - 1, 0], -100, false]
  if (nr === CR - 1 && nc === CC - 1) return [[nr, nc], -1, true]
  return [[nr, nc], -1, false]
}
function runCliff(algo: 'q' | 'sarsa', eps: number, alpha: number, episodes: number, seed: number) {
  const r = rng(seed)
  const Q: number[][] = Array.from({ length: CR * CC }, () => [0, 0, 0, 0])
  const id = (s: [number, number]) => s[0] * CC + s[1]
  const pick = (s: [number, number]) => { if (r() < eps) return Math.floor(r() * 4); const q = Q[id(s)]; const m = Math.max(...q); const c = q.map((v, i) => (v === m ? i : -1)).filter((i) => i >= 0); return c[Math.floor(r() * c.length)] }
  const rets: number[] = []
  for (let e = 0; e < episodes; e++) {
    let s: [number, number] = [CR - 1, 0], a = pick(s), tot = 0
    for (let t = 0; t < 500; t++) {
      const [s2, rw, d] = cliffStep(s, a)
      tot += rw
      const a2 = pick(s2)
      const tgt = rw + (d ? 0 : algo === 'q' ? Math.max(...Q[id(s2)]) : Q[id(s2)][a2])
      Q[id(s)][a] += alpha * (tgt - Q[id(s)][a])
      s = s2; a = a2
      if (d) break
    }
    rets.push(tot)
  }
  let s: [number, number] = [CR - 1, 0]
  const route: [number, number][] = [s]
  for (let t = 0; t < 40; t++) { const q = Q[id(s)]; const [n, , d] = cliffStep(s, q.indexOf(Math.max(...q))); s = n; route.push(s); if (d) break }
  return { rets, route }
}
export function CliffDemo() {
  const [eps, setEps] = useState(0.1)
  const [eN, setEN] = useState(500)
  const [seed, setSeed] = useState(1)
  const res = useMemo(() => ({ q: runCliff('q', eps, 0.5, eN, seed), s: runCliff('sarsa', eps, 0.5, eN, seed) }), [eps, eN, seed])
  const avg = (v: number[]) => v.slice(-100).reduce((a, b) => a + b, 0) / Math.min(100, v.length)
  const cell = 30, W = CC * cell + 20
  const grid = (route: [number, number][], col: string) => (
    <svg className="svgbox" viewBox={`0 0 ${W} ${CR * cell + 20}`}>
      {Array.from({ length: CR * CC }, (_, k) => { const r = Math.floor(k / CC), c = k % CC; const cl = r === CR - 1 && c > 0 && c < CC - 1; return <rect key={k} x={10 + c * cell} y={10 + r * cell} width={cell - 2} height={cell - 2} rx={4} fill={cl ? '#4a1c2a' : '#182131'} /> })}
      <text x={14} y={10 + (CR - 1) * cell + 20} fontSize="12" fill="#e6edf6">S</text><text x={14 + (CC - 1) * cell} y={10 + (CR - 1) * cell + 20} fontSize="12" fill="#e6edf6">G</text>
      <path d={path(route.map((p) => [10 + p[1] * cell + cell / 2 - 1, 10 + p[0] * cell + cell / 2 - 1] as [number, number]))} fill="none" stroke={col} strokeWidth={3} />
    </svg>
  )
  return (
    <div>
      <div className="viz one">
        <div><b style={{ color: '#4de1c1' }}>Q-learning</b> greedy path (off-policy: learns the optimal path along the cliff edge){grid(res.q.route, '#4de1c1')}</div>
        <div><b style={{ color: '#ff6b81' }}>SARSA</b> greedy path (on-policy: accounts for its own ε-exploration, so takes the safer path){grid(res.s.route, '#ff6b81')}</div>
      </div>
      <div className="viz" style={{ marginTop: 12 }}>
        <div className="ctrls">
          <Slider label={<M t="\varepsilon" />} value={eps} min={0} max={0.4} step={0.05} onChange={setEps} />
          <Slider label="training episodes" value={eN} min={50} max={1500} step={50} onChange={setEN} />
          <button className="btn" onClick={() => setSeed(seed + 1)}>Re-run with new randomness</button>
        </div>
        <div className="readout">Average online return over the last 100 training episodes (ε-greedy exploring):<br />Q-learning: <b>{f2(avg(res.q.rets), 1)}</b> · SARSA: <b>{f2(avg(res.s.rets), 1)}</b><br /><span className="muted">Reward −1 per step, −100 for falling off the cliff (sent back to S). With exploration, the cliff-edge path occasionally falls; the safe path doesn’t. At ε = 0 both converge to the same path.</span></div>
      </div>
    </div>
  )
}

/* ---------- L7: MSBE target ---------- */
export function DQNTarget() {
  const [tab, setTab] = useState<'y' | 'frozen'>('y')
  const [r, setR] = useState(1)
  const [g, setG] = useState(0.9)
  const [d, setD] = useState(false)
  const [qn, setQn] = useState([2, 5, 3])
  const [qcur, setQcur] = useState(4)
  const mx = Math.max(...qn)
  const y = r + g * (d ? 0 : 1) * mx
  const [K, setK] = useState(10)
  const traj = useMemo(() => { const rr = rng(6); let v = 0; return Array.from({ length: 60 }, () => (v += 0.15 + 0.5 * gauss(rr))) }, [])
  const frozen = traj.map((_, t) => traj[Math.floor(t / K) * K])
  const lo = Math.min(...traj), hi = Math.max(...traj)
  const Y = (v: number) => 140 - ((v - lo) / (hi - lo)) * 120
  return (
    <div>
      <Seg value={tab} onChange={setTab} options={[{ v: 'y', label: 'Build the Bellman target' }, { v: 'frozen', label: 'Why a target network?' }]} />
      {tab === 'y' ? (
        <div className="viz" style={{ marginTop: 12 }}>
          <div className="ctrls">
            <Slider label="reward r" value={r} min={-2} max={5} step={0.5} onChange={setR} />
            <Slider label={<M t="\gamma" />} value={g} min={0} max={0.99} step={0.01} onChange={setG} />
            {qn.map((v, i) => <Slider key={i} label={`Q_φ′(s′, a${i + 1})`} value={v} min={-5} max={10} step={0.5} onChange={(nv) => setQn(qn.map((o, k) => (k === i ? nv : o)))} />)}
            <Slider label="current Q_φ(s, a)" value={qcur} min={-5} max={10} step={0.5} onChange={setQcur} />
            <label className="toggle"><input type="checkbox" checked={d} onChange={(e) => setD(e.target.checked)} /> s′ is terminal (d = 1)</label>
          </div>
          <div className="readout">
            y = r + γ(1 − d)·max<sub>a′</sub> Q<sub>φ′</sub>(s′, a′)<br />
            = {r} + {g}·{d ? 0 : 1}·{mx} = <b>{f2(y)}</b><br /><br />
            TD error: Q<sub>φ</sub>(s,a) − y = {f2(qcur - y)}<br />
            squared Bellman error (qcur − y)² = <b>{f2((qcur - y) ** 2)}</b><br /><br />
            Gradient step: φ ← φ − α∇<sub>φ</sub> L(φ, B) pulls Q<sub>φ</sub>(s,a) toward the target y.<br /><span className="muted">The target uses the target network φ′ and the terminal flag d zeroes the future when the episode ends.</span>
          </div>
        </div>
      ) : (
        <div className="viz" style={{ marginTop: 12 }}>
          <svg className="svgbox" viewBox="0 0 520 170">
            <path d={path(traj.map((v, t) => [20 + (t / 59) * 480, Y(v)] as [number, number]))} fill="none" stroke="#ff6b81" strokeWidth={2} />
            <path d={path(frozen.flatMap((v, t) => (t === 0 ? [[20, Y(v)]] : [[20 + ((t - 1) / 59) * 480 + 8, Y(frozen[t - 1])], [20 + (t / 59) * 480, Y(v)]]) as [number, number][]).slice(0, 118))} fill="none" stroke="#4de1c1" strokeWidth={3} />
            <text x={20} y={14} fill="#ff6b81" fontSize="12">target computed from the online network (moves every update)</text><text x={20} y={164} fill="#4de1c1" fontSize="12">target network φ′ (copied every K updates): a fixed target in between</text>
          </svg>
          <div className="ctrls">
            <Slider label="copy φ′ ← φ every K updates" value={K} min={1} max={30} step={1} onChange={setK} />
            <div className="readout">Chasing a target that moves each time you move is unstable. A target network keeps y fixed over multiple updates (slide 48). In DDPG the copy is a smooth average φ′ ← ρφ′ + (1−ρ)φ.</div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ---------- L8: DDPG machinery ---------- */
export function DDPGDemo() {
  const [tab, setTab] = useState<'act' | 'buf'>('act')
  const [th, setTh] = useState(0)
  const [lr, setLr] = useState(0.1)
  const [rho, setRho] = useState(0.9)
  const [thp, setThp] = useState(0)
  const [hist, setHist] = useState<number[][]>([[0, 0]])
  const states = [-1, 0.5, 1]
  const Qf = (s: number, a: number) => -((a - 2 * s) ** 2)
  const J = (t: number) => states.reduce((a, s) => a + Qf(s, t * s), 0) / states.length
  const grad = (t: number) => states.reduce((a, s) => a + -2 * (t * s - 2 * s) * s, 0) / states.length
  const stepUp = (k: number) => { let t = th, tp = thp; const h = hist.slice(); for (let i = 0; i < k; i++) { t = t + lr * grad(t); tp = rho * tp + (1 - rho) * t; h.push([t, tp]) } setTh(t); setThp(tp); setHist(h) }
  const W = 520, H = 170
  return (
    <div>
      <Seg value={tab} onChange={setTab} options={[{ v: 'act', label: 'Actor: gradient ascent on Q' }, { v: 'buf', label: 'Target networks (Polyak)' }]} />
      <div className="viz" style={{ marginTop: 12 }}>
        {tab === 'act' ? <>
          <svg className="svgbox" viewBox={`0 0 ${W} ${H}`}>
            <line x1={20} y1={140} x2={500} y2={140} stroke="#2a3a54" />
            {states.map((s, i) => { const x = 40 + i * 160; return <g key={i}><circle cx={x + 40} cy={140 - 40 - 22 * 2 * s + 0} r={0} /><text x={x} y={20} fill="#8fa0b8" fontSize="12">state s = {s}</text><rect x={x} y={140 - (2 * s + 3) * 20} width={20} height={12} fill="#3ddc97" /><text x={x + 26} y={140 - (2 * s + 3) * 20 + 10} fill="#3ddc97" fontSize="11">best a* = 2s = {2 * s}</text><rect x={x} y={140 - (th * s + 3) * 20} width={20} height={12} fill="#ffc857" /><text x={x + 26} y={140 - (th * s + 3) * 20 + 10} fill="#ffc857" fontSize="11">μ_θ(s) = {f2(th * s)}</text></g> })}
          </svg>
          <div className="ctrls">
            <Slider label="learning rate α" value={lr} min={0.01} max={0.6} step={0.01} onChange={setLr} />
            <div className="btnrow"><button className="btn" onClick={() => stepUp(1)}>1 ascent step</button><button className="btn primary" onClick={() => stepUp(20)}>20 steps</button><button className="btn ghost" onClick={() => { setTh(0); setThp(0); setHist([[0, 0]]) }}>reset</button></div>
            <div className="readout">Policy μ<sub>θ</sub>(s) = θ·s, toy critic Q(s,a) = −(a − 2s)² (best action 2s).<br />θ ← θ + α∇<sub>θ</sub> (1/|B|) Σ<sub>s∈B</sub> Q(s, μ<sub>θ</sub>(s))<br />θ = <b>{f2(th, 3)}</b> (optimum 2) · mean Q = <b>{f2(J(th), 3)}</b><br /><span className="muted">The actor climbs the critic’s surface: gradient ascent; the critic is trained by gradient descent on MSBE.</span></div>
          </div>
        </> : <>
          <svg className="svgbox" viewBox={`0 0 ${W} ${H}`}>
            <path d={path(hist.map((h, i) => [20 + (i / Math.max(hist.length - 1, 1)) * 480, 150 - (h[0] / 2.2) * 130] as [number, number]))} fill="none" stroke="#ffc857" strokeWidth={2.5} />
            <path d={path(hist.map((h, i) => [20 + (i / Math.max(hist.length - 1, 1)) * 480, 150 - (h[1] / 2.2) * 130] as [number, number]))} fill="none" stroke="#4de1c1" strokeWidth={2.5} />
            <text x={20} y={14} fill="#ffc857" fontSize="12">online θ</text><text x={90} y={14} fill="#4de1c1" fontSize="12">target θ′ ← ρθ′ + (1−ρ)θ</text>
          </svg>
          <div className="ctrls">
            <Slider label={<M t="\rho" />} value={rho} min={0} max={0.99} step={0.01} onChange={(v) => { setRho(v) }} />
            <div className="btnrow"><button className="btn primary" onClick={() => stepUp(20)}>20 updates</button><button className="btn ghost" onClick={() => { setTh(0); setThp(0); setHist([[0, 0]]) }}>reset</button></div>
            <div className="readout">ρ close to 1: the target lags (stable but slow). ρ = 0: no lag (target = online). Replay buffer D: store every (s_t, a_t, r, s_{'{t+1}'}, d), update from random batches B ⊂ D.</div>
          </div>
        </>}
      </div>
    </div>
  )
}

/* ---------- L9: overestimation bias ---------- */
export function Overestimate() {
  const [n, setN] = useState(3)
  const [sg, setSg] = useState(0.4)
  const [g, setG] = useState(0.9)
  const [dbl, setDbl] = useState(false)
  const stats = useMemo(() => {
    const r = rng(77)
    let em = 0, ed = 0
    const N = 4000
    const hist = Array(14).fill(0)
    for (let i = 0; i < N; i++) {
      const q1 = Array.from({ length: n }, () => sg * gauss(r)), q2 = Array.from({ length: n }, () => sg * gauss(r))
      const m = Math.max(...q1); em += m
      ed += q2[q1.indexOf(m)]
      const bin = Math.min(13, Math.max(0, Math.floor((m + 1.4) / 0.2)))
      hist[bin]++
    }
    return { em: em / N, ed: ed / N, hist, N }
  }, [n, sg])
  const bias = dbl ? stats.ed : stats.em
  return (
    <div className="viz">
      <div>
        <div className="readout">Slide example: Q*(s,aᵢ) = 0 for every action, but Q_φ(s,a₁)=0.5, Q_φ(s,a₂)=0.2, Q_φ(s,a₃)=−0.3.<br />max<sub>a′</sub> Q_φ = <b>0.5</b> → target y = r + γ·0.5 = {f2(0.9 * 0.5)} (r=0), yet the true value is 0: <b style={{ color: '#ff6b81' }}>the max picks up the noise</b>.</div>
        <svg className="svgbox" style={{ marginTop: 10 }} viewBox="0 0 520 150">
          {stats.hist.map((v, i) => <rect key={i} x={20 + i * 34} y={130 - (v / stats.N) * 380} width={30} height={(v / stats.N) * 380} fill={i * 0.2 - 1.4 + 0.1 > 0 ? '#ff6b81' : '#7c9cff'} />)}
          <line x1={20 + 7 * 34} y1={10} x2={20 + 7 * 34} y2={135} stroke="#fff" strokeDasharray="4" />
          <text x={20} y={146} fill="#8fa0b8" fontSize="11">distribution of max_a Q̂(s,a) over 4000 noisy draws (true value = 0, dashed)</text>
        </svg>
      </div>
      <div className="ctrls">
        <Slider label="number of actions" value={n} min={1} max={20} step={1} onChange={setN} />
        <Slider label="noise σ of Q estimates" value={sg} min={0} max={1} step={0.05} onChange={setSg} />
        <Slider label={<M t="\gamma" />} value={g} min={0} max={0.99} step={0.01} onChange={setG} />
        <label className="toggle"><input type="checkbox" checked={dbl} onChange={(e) => setDbl(e.target.checked)} /> evaluate the chosen action with an independent second estimate (extra)</label>
        <div className="readout">E[max Q̂] − 0 = <b>{f2(bias, 3)}</b> {dbl ? '(≈ 0: removes the bias)' : '(positive overestimate)'}<br />bias added to every Bellman target: γ·bias = <b>{f2(g * bias, 3)}</b><br /><span className="muted">The bias grows with more actions and more noise, and it feeds back: overestimated Q ⇒ bigger targets ⇒ overestimated Q. TD3, SAC, Maxmin Q-learning and REDQ are listed on the slide as fixes (mechanisms: extra).</span></div>
      </div>
    </div>
  )
}
