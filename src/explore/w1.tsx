import { useMemo, useState } from 'react'
import { Seg, Slider, f2, gauss, npdf, path, rng } from './ui'
import { M } from '../components/Rich'

/* ---------- L1: distributions ---------- */
export function Distribution() {
  const [mode, setMode] = useState<'disc' | 'cont'>('disc')
  const [w, setW] = useState([1, 2, 4, 3, 1, 1])
  const tot = w.reduce((a, b) => a + b, 0)
  const labels = ['0', '50', '100', '150', '200', '255']
  const [sigma, setSigma] = useState(0.5)
  const [a, setA] = useState(-0.5)
  const [b, setB] = useState(0.5)
  const W = 520, H = 240, px = (x: number) => 30 + ((x + 3) / 6) * (W - 50), py = (y: number) => H - 24 - y * (H - 50) / 1.4
  const xs = Array.from({ length: 241 }, (_, i) => -3 + (i * 6) / 240)
  const area = useMemo(() => {
    let s = 0
    const n = 400
    for (let i = 0; i < n; i++) {
      const x = a + ((i + 0.5) * (b - a)) / n
      s += npdf(x, 0, sigma) * ((b - a) / n)
    }
    return s
  }, [a, b, sigma])
  return (
    <div>
      <Seg value={mode} onChange={setMode} options={[{ v: 'disc', label: 'Discrete (pixel values)' }, { v: 'cont', label: 'Continuous (density)' }]} />
      {mode === 'disc' ? (
        <div className="viz" style={{ marginTop: 12 }}>
          <svg className="svgbox" viewBox={`0 0 ${W} ${H}`}>
            {w.map((v, i) => {
              const p = v / tot
              const bw = 54
              const x = 30 + i * (bw + 14)
              return (
                <g key={i}>
                  <rect x={x} y={H - 30 - p * 180} width={bw} height={p * 180} rx={6} fill="#7c9cff" />
                  <text x={x + bw / 2} y={H - 34 - p * 180} textAnchor="middle" fill="#e6edf6" fontSize="13">{p.toFixed(2)}</text>
                  <text x={x + bw / 2} y={H - 10} textAnchor="middle" fill="#8fa0b8" fontSize="12">x={labels[i]}</text>
                </g>
              )
            })}
          </svg>
          <div className="ctrls">
            {w.map((v, i) => (
              <Slider key={i} label={`raw weight for pixel value ${labels[i]}`} value={v} min={0} max={10} step={1} onChange={(nv) => setW(w.map((o, j) => (j === i ? nv : o)))} />
            ))}
            <div className="readout">Σ p(x) = <b>{f2(w.reduce((s, v) => s + v / tot, 0), 3)}</b> (always 1, we normalise)</div>
          </div>
        </div>
      ) : (
        <div className="viz" style={{ marginTop: 12 }}>
          <svg className="svgbox" viewBox={`0 0 ${W} ${H}`}>
            <line x1={30} y1={py(0)} x2={W - 20} y2={py(0)} stroke="#2a3a54" />
            <line x1={px(1)} y1={py(1)} x2={px(1)} y2={py(0)} stroke="#2a3a54" strokeDasharray="3" />
            <text x={px(-3) + 4} y={py(1) - 4} fill="#8fa0b8" fontSize="11">density = 1</text>
            <line x1={30} y1={py(1)} x2={W - 20} y2={py(1)} stroke="#ffc85755" strokeDasharray="4" />
            <path d={path([[px(a), py(0)], ...xs.filter((x) => x >= a && x <= b).map((x) => [px(x), py(npdf(x, 0, sigma))] as [number, number]), [px(b), py(0)]])} fill="#4de1c155" />
            <path d={path(xs.map((x) => [px(x), py(Math.min(npdf(x, 0, sigma), 1.4))]))} fill="none" stroke="#7c9cff" strokeWidth={2.5} />
          </svg>
          <div className="ctrls">
            <Slider label={<M t="\sigma" />} value={sigma} min={0.2} max={1.5} step={0.05} onChange={setSigma} />
            <Slider label="a" value={a} min={-3} max={3} step={0.1} onChange={(v) => setA(Math.min(v, b - 0.1))} />
            <Slider label="b" value={b} min={-3} max={3} step={0.1} onChange={(v) => setB(Math.max(v, a + 0.1))} />
            <div className="readout">peak density f(0) = <b>{f2(npdf(0, 0, sigma), 3)}</b> {npdf(0, 0, sigma) > 1 && '(> 1 — allowed!)'}<br />P(a ≤ X ≤ b) = <b>{f2(area, 3)}</b> (always ≤ 1)</div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ---------- L2: joint table + Bayes ---------- */
export function JointBayes() {
  const [tab, setTab] = useState<'joint' | 'bayes'>('joint')
  const [n, setN] = useState([
    [30, 10, 5],
    [5, 15, 35],
  ])
  const [cond, setCond] = useState<number | null>(null)
  const ys = ['rainy', 'sunny'], xs = ['dark', 'mid', 'bright']
  const T = n.flat().reduce((a, b) => a + b, 0)
  const rowS = n.map((r) => r.reduce((a, b) => a + b, 0))
  const colS = [0, 1, 2].map((j) => n[0][j] + n[1][j])
  const indDiff = Math.max(...n.flatMap((r, i) => r.map((v, j) => Math.abs(v / T - (rowS[i] / T) * (colS[j] / T)))))
  const bump = (i: number, j: number, d: number) => setN(n.map((r, a) => r.map((v, b) => (a === i && b === j ? Math.max(0, v + d) : v))))
  // Bayes
  const [prior, setPrior] = useState(0.02)
  const [sens, setSens] = useState(0.9)
  const [fpr, setFpr] = useState(0.08)
  const pos = sens * prior + fpr * (1 - prior)
  const post = (sens * prior) / pos
  return (
    <div>
      <Seg value={tab} onChange={setTab} options={[{ v: 'joint', label: 'Joint → marginal → conditional' }, { v: 'bayes', label: 'Bayes’ theorem' }]} />
      {tab === 'joint' ? (
        <div className="viz" style={{ marginTop: 12 }}>
          <div>
            <table className="grid">
              <thead>
                <tr><th>y \ x (pixel)</th>{xs.map((x) => <th key={x}>{x}</th>)}<th>p(y)</th></tr>
              </thead>
              <tbody>
                {ys.map((y, i) => (
                  <tr key={y}>
                    <th className="click" onClick={() => setCond(cond === i ? null : i)}>{y} {cond === i ? '◀' : ''}</th>
                    {xs.map((x, j) => (
                      <td key={x} className={cond === i ? 'hl' : ''}>
                        {cond === null ? f2(n[i][j] / T, 3) : cond === i ? <b>{f2(n[i][j] / rowS[i], 3)}</b> : <span className="muted">·</span>}
                        <div><button className="btn small" onClick={() => bump(i, j, -5)}>−</button> <button className="btn small" onClick={() => bump(i, j, 5)}>+</button></div>
                      </td>
                    ))}
                    <td>{f2(rowS[i] / T, 3)}</td>
                  </tr>
                ))}
                <tr><th>p(x)</th>{colS.map((c, j) => <td key={j}>{f2(c / T, 3)}</td>)}<td>1</td></tr>
              </tbody>
            </table>
            <p className="muted" style={{ fontSize: 13 }}>Cells show p(x,y) = n<sub>ij</sub>/Σn. Click a weather row to switch to p(x | y = that row).</p>
          </div>
          <div className="ctrls">
            <div className="readout">
              <b>Sum rule</b> p(x=dark) = Σ<sub>y</sub> p(x=dark, y) = {f2(colS[0] / T, 3)}<br />
              <b>Product rule</b> p(x,y) = p(y|x)p(x)<br />
              <b>Independent?</b> max |p(x,y) − p(x)p(y)| = <b>{f2(indDiff, 3)}</b> {indDiff < 0.005 ? '→ independent' : '→ NOT independent'}
            </div>
          </div>
        </div>
      ) : (
        <div className="viz" style={{ marginTop: 12 }}>
          <div>
            <svg className="svgbox" viewBox="0 0 520 200">
              {Array.from({ length: 100 }, (_, k) => {
                const sick = k < Math.round(prior * 100)
                return <rect key={k} x={20 + (k % 20) * 24} y={16 + Math.floor(k / 20) * 22} width={18} height={16} rx={4} fill={sick ? '#ff6b81' : '#2a3a54'} />
              })}
              <text x={20} y={150} fill="#8fa0b8" fontSize="12">100 people (red = condition present, prior p(x)={f2(prior, 2)})</text>
              <text x={20} y={176} fill="#e6edf6" fontSize="14">P(test positive) = {f2(pos, 3)} · posterior p(x | positive) = {f2(post, 3)}</text>
            </svg>
          </div>
          <div className="ctrls">
            <Slider label="prior p(x)" value={prior} min={0.01} max={0.5} step={0.01} onChange={setPrior} />
            <Slider label="likelihood p(+ | x) (sensitivity)" value={sens} min={0.5} max={0.99} step={0.01} onChange={setSens} />
            <Slider label="p(+ | not x) (false-positive rate)" value={fpr} min={0.01} max={0.4} step={0.01} onChange={setFpr} />
            <div className="readout">
              <M t="p(x|y)=\frac{p(y|x)\,p(x)}{p(y)}" /> → <b>{f2(post, 3)}</b>
              <br />evidence p(y) = {f2(pos, 3)}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ---------- L3: moments and affine transforms ---------- */
export function Moments() {
  const [A, setA] = useState([1, 0, 0, 1])
  const [b, setB] = useState([0, 0])
  const pts = useMemo(() => {
    const r = rng(11)
    // x ~ N(mu=(1,0.5), Sigma=[[1,0.6],[0.6,1]]) via Cholesky
    const l11 = 1, l21 = 0.6, l22 = 0.8
    return Array.from({ length: 220 }, () => {
      const z1 = gauss(r), z2 = gauss(r)
      return [1 + l11 * z1, 0.5 + l21 * z1 + l22 * z2] as [number, number]
    })
  }, [])
  const tr = pts.map(([x, y]) => [A[0] * x + A[1] * y + b[0], A[2] * x + A[3] * y + b[1]] as [number, number])
  const mean = (v: [number, number][]) => [v.reduce((s, p) => s + p[0], 0) / v.length, v.reduce((s, p) => s + p[1], 0) / v.length]
  const cov = (v: [number, number][]) => {
    const m = mean(v)
    let sxx = 0, sxy = 0, syy = 0
    for (const p of v) { sxx += (p[0] - m[0]) ** 2; sxy += (p[0] - m[0]) * (p[1] - m[1]); syy += (p[1] - m[1]) ** 2 }
    return [sxx / v.length, sxy / v.length, syy / v.length]
  }
  const m0 = mean(pts), c0 = cov(pts), m1 = mean(tr), c1 = cov(tr)
  const pm = [A[0] * m0[0] + A[1] * m0[1] + b[0], A[2] * m0[0] + A[3] * m0[1] + b[1]]
  const S = [[c0[0], c0[1]], [c0[1], c0[2]]]
  const AS = [[A[0] * S[0][0] + A[1] * S[1][0], A[0] * S[0][1] + A[1] * S[1][1]], [A[2] * S[0][0] + A[3] * S[1][0], A[2] * S[0][1] + A[3] * S[1][1]]]
  const pc = [AS[0][0] * A[0] + AS[0][1] * A[1], AS[0][0] * A[2] + AS[0][1] * A[3], AS[1][0] * A[2] + AS[1][1] * A[3]]
  const W = 460, H = 320, sx = (x: number) => W / 2 + x * 28, sy = (y: number) => H / 2 - y * 28
  const set = (i: number) => (v: number) => setA(A.map((o, k) => (k === i ? v : o)))
  return (
    <div className="viz">
      <svg className="svgbox" viewBox={`0 0 ${W} ${H}`}>
        <line x1={0} y1={H / 2} x2={W} y2={H / 2} stroke="#2a3a54" /><line x1={W / 2} y1={0} x2={W / 2} y2={H} stroke="#2a3a54" />
        {pts.map((p, i) => <circle key={'a' + i} cx={sx(p[0])} cy={sy(p[1])} r={2.4} fill="#8fa0b866" />)}
        {tr.map((p, i) => <circle key={'b' + i} cx={sx(p[0])} cy={sy(p[1])} r={2.6} fill="#4de1c1" />)}
        <text x={10} y={18} fill="#8fa0b8" fontSize="12">grey: x · green: Ax + b</text>
      </svg>
      <div className="ctrls">
        <Slider label="A₁₁" value={A[0]} min={-2} max={2} step={0.1} onChange={set(0)} />
        <Slider label="A₁₂" value={A[1]} min={-2} max={2} step={0.1} onChange={set(1)} />
        <Slider label="A₂₁" value={A[2]} min={-2} max={2} step={0.1} onChange={set(2)} />
        <Slider label="A₂₂" value={A[3]} min={-2} max={2} step={0.1} onChange={set(3)} />
        <Slider label="b₁" value={b[0]} min={-4} max={4} step={0.25} onChange={(v) => setB([v, b[1]])} />
        <Slider label="b₂" value={b[1]} min={-4} max={4} step={0.25} onChange={(v) => setB([b[0], v])} />
        <div className="readout">
          E[Ax+b] measured: ({f2(m1[0])}, {f2(m1[1])})<br />
          A·E[x]+b formula: ({f2(pm[0])}, {f2(pm[1])})<br />
          V[Ax+b] measured: [{f2(c1[0])}, {f2(c1[1])}, {f2(c1[2])}] (xx, xy, yy)<br />
          A V[x] Aᵀ formula: [{f2(pc[0])}, {f2(pc[1])}, {f2(pc[2])}]
        </div>
      </div>
    </div>
  )
}

/* ---------- L4: Gaussians + Cholesky ---------- */
export function Gaussian2D() {
  const [mx, setMx] = useState(1)
  const [my, setMy] = useState(0.5)
  const [sx, setSx] = useState(1.2)
  const [sy, setSy] = useState(0.8)
  const [rho, setRho] = useState(0.7)
  const [step, setStep] = useState<'z' | 'y'>('y')
  const Z = useMemo(() => { const r = rng(3); return Array.from({ length: 250 }, () => [gauss(r), gauss(r)] as [number, number]) }, [])
  const L = [[sx, 0], [rho * sy, sy * Math.sqrt(1 - rho * rho)]]
  const pts = Z.map(([a, c]) => (step === 'z' ? [a, c] : [L[0][0] * a + mx, L[1][0] * a + L[1][1] * c + my]) as [number, number])
  const W = 460, H = 320, X = (x: number) => W / 2 + x * 36, Y = (y: number) => H / 2 - y * 36
  const ell = Array.from({ length: 61 }, (_, i) => {
    const t = (i / 60) * 2 * Math.PI, a = 2 * Math.cos(t), c = 2 * Math.sin(t)
    return step === 'z' ? [X(a), Y(c)] as [number, number] : [X(L[0][0] * a + mx), Y(L[1][0] * a + L[1][1] * c + my)] as [number, number]
  })
  return (
    <div className="viz">
      <div>
        <Seg value={step} onChange={setStep} options={[{ v: 'z', label: '1 · z ~ N(0, I)' }, { v: 'y', label: '2 · y = Lz + μ' }]} />
        <svg className="svgbox" style={{ marginTop: 10 }} viewBox={`0 0 ${W} ${H}`}>
          <line x1={0} y1={H / 2} x2={W} y2={H / 2} stroke="#2a3a54" /><line x1={W / 2} y1={0} x2={W / 2} y2={H} stroke="#2a3a54" />
          {pts.map((p, i) => <circle key={i} cx={X(p[0])} cy={Y(p[1])} r={2.6} fill={step === 'z' ? '#8fa0b8' : '#7c9cff'} />)}
          <path d={path(ell) + 'Z'} fill="none" stroke="#ffc857" strokeWidth={2} />
        </svg>
      </div>
      <div className="ctrls">
        <Slider label={<M t="\mu_1" />} value={mx} min={-3} max={3} step={0.1} onChange={setMx} />
        <Slider label={<M t="\mu_2" />} value={my} min={-3} max={3} step={0.1} onChange={setMy} />
        <Slider label={<M t="\sigma_1" />} value={sx} min={0.3} max={2} step={0.1} onChange={setSx} />
        <Slider label={<M t="\sigma_2" />} value={sy} min={0.3} max={2} step={0.1} onChange={setSy} />
        <Slider label={<M t="\rho" />} value={rho} min={-0.95} max={0.95} step={0.05} onChange={setRho} />
        <div className="readout">
          <M t={`\\Sigma=\\begin{pmatrix}${f2(sx * sx)}&${f2(rho * sx * sy)}\\\\${f2(rho * sx * sy)}&${f2(sy * sy)}\\end{pmatrix}`} /><br />
          <M t={`L=\\begin{pmatrix}${f2(L[0][0])}&0\\\\${f2(L[1][0])}&${f2(L[1][1])}\\end{pmatrix},\\quad LL^\\top=\\Sigma`} /><br />
          yellow = 2σ contour
        </div>
      </div>
    </div>
  )
}

/* ---------- L5: MLE ---------- */
export function MLEDemo() {
  const [tab, setTab] = useState<'coin' | 'gen'>('coin')
  const [n, setN] = useState(10)
  const [k, setK] = useState(7)
  const [th, setTh] = useState(0.5)
  const kk = Math.min(k, n)
  const ll = (t: number) => kk * Math.log(t) + (n - kk) * Math.log(1 - t)
  const grid = Array.from({ length: 193 }, (_, i) => 0.02 + i * 0.005)
  const lo = Math.min(...grid.map(ll)), hi = Math.max(...grid.map(ll))
  const W = 520, H = 240
  const X = (t: number) => 30 + t * (W - 50), Y = (v: number) => 20 + (1 - (v - lo) / (hi - lo + 1e-9)) * (H - 50)
  // generalisation tab
  const [h, setH] = useState(0.15)
  const data = useMemo(() => { const r = rng(5); return { train: Array.from({ length: 8 }, () => gauss(r)), test: Array.from({ length: 300 }, () => gauss(r)) } }, [])
  const kde = (x: number) => data.train.reduce((s, m) => s + npdf(x, m, h), 0) / data.train.length
  const trainLL = data.train.reduce((s, x) => s + Math.log(kde(x)), 0) / data.train.length
  const testLL = data.test.reduce((s, x) => s + Math.log(Math.max(kde(x), 1e-300)), 0) / data.test.length
  const xs = Array.from({ length: 241 }, (_, i) => -4 + (i * 8) / 240)
  const X2 = (x: number) => 20 + ((x + 4) / 8) * (W - 40), Y2 = (y: number) => H - 24 - y * 150
  return (
    <div>
      <Seg value={tab} onChange={setTab} options={[{ v: 'coin', label: 'Likelihood of a coin' }, { v: 'gen', label: 'Fit vs generalise' }]} />
      {tab === 'coin' ? (
        <div className="viz" style={{ marginTop: 12 }}>
          <svg className="svgbox" viewBox={`0 0 ${W} ${H}`}>
            <path d={path(grid.map((t) => [X(t), Y(ll(t))]))} fill="none" stroke="#7c9cff" strokeWidth={2.5} />
            <line x1={X(kk / n)} y1={20} x2={X(kk / n)} y2={H - 30} stroke="#3ddc97" strokeDasharray="4" />
            <circle cx={X(th)} cy={Y(ll(th))} r={7} fill="#ffc857" />
            <text x={30} y={H - 8} fill="#8fa0b8" fontSize="12">θ = P(heads) from 0 to 1 →   log-likelihood on the y axis</text>
          </svg>
          <div className="ctrls">
            <Slider label="flips n" value={n} min={2} max={40} step={1} onChange={(v) => { setN(v) }} />
            <Slider label="heads observed" value={kk} min={0} max={n} step={1} onChange={setK} />
            <Slider label="your guess θ" value={th} min={0.02} max={0.98} step={0.01} onChange={setTh} />
            <div className="readout">log p(D;θ) = Σ log p(xₙ;θ) = <b>{f2(ll(th))}</b><br />best θ* = heads/n = <b>{f2(kk / n, 3)}</b> (log-lik {f2(ll(Math.min(0.995, Math.max(0.005, kk / n))))})</div>
          </div>
        </div>
      ) : (
        <div className="viz" style={{ marginTop: 12 }}>
          <svg className="svgbox" viewBox={`0 0 ${W} ${H}`}>
            <path d={path(xs.map((x) => [X2(x), Y2(npdf(x, 0, 1))]))} fill="none" stroke="#3ddc97" strokeDasharray="5" strokeWidth={2} />
            <path d={path(xs.map((x) => [X2(x), Y2(Math.min(kde(x), 1.4))]))} fill="none" stroke="#7c9cff" strokeWidth={2.5} />
            {data.train.map((x, i) => <circle key={i} cx={X2(x)} cy={H - 14} r={5} fill="#ffc857" />)}
            <text x={20} y={16} fill="#8fa0b8" fontSize="12">green dashed: true p_data · blue: fitted model · dots: 8 training points</text>
          </svg>
          <div className="ctrls">
            <Slider label="model width h (small = memorise the data)" value={h} min={0.03} max={1.5} step={0.01} onChange={setH} />
            <div className="readout">avg train log-lik: <b>{f2(trainLL)}</b><br />avg test log-lik (unseen data): <b>{f2(testLL)}</b><br />Tiny h wins on train, loses on test. Generalisation is judged on test data.</div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ---------- L6: GMM + EM ---------- */
const CATS = (() => {
  const r = rng(21)
  return Array.from({ length: 90 }, () => (r() < 0.45 ? 3.4 + 0.45 * gauss(r) : 5.0 + 0.6 * gauss(r)))
})()
type G = { w: number; m: number; s: number }
const mixLL = (g: G[]) => CATS.reduce((a, x) => a + Math.log(g.reduce((s, c) => s + c.w * npdf(x, c.m, c.s), 1e-300)), 0)
export function GMMDemo() {
  const init: G[] = [{ w: 0.5, m: 3.9, s: 0.8 }, { w: 0.5, m: 4.3, s: 0.8 }]
  const [g, setG] = useState<G[]>(init)
  const [stage, setStage] = useState<'init' | 'E' | 'M'>('init')
  const [hist, setHist] = useState<number[]>([mixLL(init)])
  const resp = (gg: G[]) => CATS.map((x) => { const p = gg.map((c) => c.w * npdf(x, c.m, c.s)); const t = p[0] + p[1]; return p.map((v) => v / t) })
  const R = resp(g)
  const mstep = () => {
    const rr = resp(g)
    const ng = [0, 1].map((k) => {
      const Nk = rr.reduce((s, r) => s + r[k], 0)
      const m = rr.reduce((s, r, i) => s + r[k] * CATS[i], 0) / Nk
      const s = Math.sqrt(rr.reduce((a, r, i) => a + r[k] * (CATS[i] - m) ** 2, 0) / Nk)
      return { w: Nk / CATS.length, m, s: Math.max(s, 0.05) }
    })
    setG(ng); setStage('M'); setHist((h) => [...h, mixLL(ng)])
  }
  const W = 560, H = 250, X = (x: number) => 20 + ((x - 2) / 5) * (W - 40), Y = (y: number) => H - 28 - y * 190
  const xs = Array.from({ length: 201 }, (_, i) => 2 + (i * 5) / 200)
  const dens = (x: number) => g.reduce((s, c) => s + c.w * npdf(x, c.m, c.s), 0)
  return (
    <div className="viz">
      <svg className="svgbox" viewBox={`0 0 ${W} ${H}`}>
        {g.map((c, k) => <path key={k} d={path(xs.map((x) => [X(x), Y(c.w * npdf(x, c.m, c.s))]))} fill="none" stroke={k ? '#ff6b81' : '#4de1c1'} strokeDasharray="4" strokeWidth={2} />)}
        <path d={path(xs.map((x) => [X(x), Y(dens(x))]))} fill="none" stroke="#7c9cff" strokeWidth={3} />
        {CATS.map((x, i) => {
          const r = stage === 'init' ? [0.5, 0.5] : R[i]
          const col = `rgb(${Math.round(77 + r[1] * 178)},${Math.round(225 - r[1] * 118)},${Math.round(193 - r[1] * 64)})`
          return <circle key={i} cx={X(x)} cy={H - 12 - (i % 5) * 3} r={4} fill={col} opacity={0.9} />
        })}
        <text x={20} y={16} fill="#8fa0b8" fontSize="12">cat weights (kg): dots coloured by responsibility p(z | x)</text>
      </svg>
      <div className="ctrls">
        <div className="btnrow">
          <button className="btn" onClick={() => setStage('E')}>E-step: assign p(z)</button>
          <button className="btn primary" onClick={mstep}>M-step: update ω, μ, σ</button>
        </div>
        <div className="btnrow">
          <button className="btn" onClick={() => { let gg = g; let h = hist.slice(); for (let i = 0; i < 10; i++) { const rr = resp(gg); gg = [0, 1].map((k) => { const Nk = rr.reduce((s, r) => s + r[k], 0); const m = rr.reduce((s, r, j) => s + r[k] * CATS[j], 0) / Nk; const s = Math.sqrt(rr.reduce((a, r, j) => a + r[k] * (CATS[j] - m) ** 2, 0) / Nk); return { w: Nk / CATS.length, m, s: Math.max(s, 0.05) } }); h.push(mixLL(gg)) } setG(gg); setHist(h); setStage('M') }}>Run 10 EM iterations</button>
          <button className="btn ghost" onClick={() => { setG(init); setStage('init'); setHist([mixLL(init)]) }}>Reset</button>
        </div>
        <div className="readout">
          comp 1: ω={f2(g[0].w)} μ={f2(g[0].m)} σ={f2(g[0].s)}<br />
          comp 2: ω={f2(g[1].w)} μ={f2(g[1].m)} σ={f2(g[1].s)}<br />
          log-likelihood: <b>{f2(hist[hist.length - 1], 1)}</b> (after {hist.length - 1} M-steps)
        </div>
      </div>
    </div>
  )
}

/* ---------- L7: gradient descent ---------- */
const A2 = [[2, 1], [1, 20]], B2 = [5, 3]
const fq = (x: number[]) => 0.5 * (x[0] * (A2[0][0] * x[0] + A2[0][1] * x[1]) + x[1] * (A2[1][0] * x[0] + A2[1][1] * x[1])) - (B2[0] * x[0] + B2[1] * x[1])
const gq = (x: number[]) => [A2[0][0] * x[0] + A2[0][1] * x[1] - B2[0], A2[1][0] * x[0] + A2[1][1] * x[1] - B2[1]]
export function GDDemo() {
  const [gam, setGam] = useState(0.05)
  const [steps, setSteps] = useState(15)
  const xstar = [97 / 39, 1 / 39], fstar = fq(xstar)
  const traj = [[-3, -1]]
  for (let i = 0; i < steps; i++) { const x = traj[traj.length - 1], g = gq(x); traj.push([x[0] - gam * g[0], x[1] - gam * g[1]]) }
  const W = 560, H = 300, X = (x: number) => 40 + ((x + 4) / 9) * (W - 60), Y = (y: number) => H / 2 - y * 55
  // eigen of A2
  const tr = 22, det = 39, l1 = tr / 2 + Math.sqrt((tr / 2) ** 2 - det), l2 = tr / 2 - Math.sqrt((tr / 2) ** 2 - det)
  const ev = (l: number) => { const v = [1, l - 2]; const n = Math.hypot(v[0], v[1]); return [v[0] / n, v[1] / n] } // (A-2I)v... A v = l v -> v=(1, l-2)
  const e1 = ev(l1), e2 = ev(l2)
  const levels = [0.5, 2, 5, 10, 20, 40]
  const ellipses = levels.map((c) => {
    const pts: [number, number][] = []
    for (let i = 0; i <= 80; i++) {
      const t = (i / 80) * 2 * Math.PI
      const a = Math.sqrt((2 * c) / l1) * Math.cos(t), b = Math.sqrt((2 * c) / l2) * Math.sin(t)
      pts.push([X(xstar[0] + a * e1[0] + b * e2[0]), Y(xstar[1] + a * e1[1] + b * e2[1])])
    }
    return path(pts)
  })
  const last = traj[traj.length - 1]
  const diverged = !Number.isFinite(fq(last)) || Math.abs(fq(last)) > 1e6
  return (
    <div className="viz">
      <svg className="svgbox" viewBox={`0 0 ${W} ${H}`}>
        {ellipses.map((d, i) => <path key={i} d={d} fill="none" stroke="#2f4a7a" />)}
        <circle cx={X(xstar[0])} cy={Y(xstar[1])} r={6} fill="#3ddc97" />
        <path d={path(traj.map((p) => [Math.max(-50, Math.min(W + 50, X(p[0]))), Math.max(-50, Math.min(H + 50, Y(p[1])))]))} fill="none" stroke="#ffc857" strokeWidth={1.5} />
        {traj.map((p, i) => <circle key={i} cx={Math.max(-50, Math.min(W + 50, X(p[0])))} cy={Math.max(-50, Math.min(H + 50, Y(p[1])))} r={i === 0 ? 6 : 3} fill={i === 0 ? '#ff6b81' : '#ffc857'} />)}
        <text x={14} y={16} fill="#8fa0b8" fontSize="12">red = x₀ = (−3, −1) · green = minimum (97/39, 1/39) · rings = level sets of f</text>
      </svg>
      <div className="ctrls">
        <Slider label={<M t="\gamma" />} value={gam} min={0.01} max={0.12} step={0.005} onChange={setGam} />
        <Slider label="steps" value={steps} min={1} max={60} step={1} onChange={setSteps} />
        <div className="readout">
          f(xₖ): <b>{diverged ? 'exploding 💥' : f2(fq(last), 4)}</b> (min f* = {f2(fstar, 4)})<br />
          xₖ = ({diverged ? '∞' : f2(last[0], 3)}, {diverged ? '∞' : f2(last[1], 3)})<br />
          eigenvalues of A: {f2(l2)} and {f2(l1)}
        </div>
      </div>
    </div>
  )
}
