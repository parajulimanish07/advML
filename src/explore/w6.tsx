import { useMemo, useState } from 'react'
import { Seg, Slider, f2, gauss, rng } from './ui'
import { M } from '../components/Rich'

/* a small demo graph:  D-A, A-B, A-C, B-C, C-E, E-F */
const NAMES = ['A', 'B', 'C', 'D', 'E', 'F']
const EDGES: [number, number][] = [[0, 1], [0, 2], [1, 2], [0, 3], [2, 4], [4, 5]]
const POS: [number, number][] = [[150, 110], [150, 230], [270, 170], [60, 60], [390, 170], [490, 90]]
const FEAT: [number, number][] = [[1, 0], [0, 1], [1, 1], [-1, 0], [0, -1], [-1, -1]]
const NODECOL = ['#4de1c1', '#ff6b81', '#ffc857', '#7c9cff', '#c28bff', '#ff9f5b']
const ADJ: number[][] = NAMES.map((_, i) => NAMES.map((_, j) => (EDGES.some(([a, b]) => (a === i && b === j) || (a === j && b === i)) ? 1 : 0)))
const nbrs = (i: number) => ADJ[i].map((v, j) => (v ? j : -1)).filter((j) => j >= 0)
const relu = (x: number) => Math.max(0, x)

function shuffleOrder(seed: number) {
  const r = rng(seed * 7919 + 5)
  const o = [0, 1, 2, 3, 4, 5]
  for (let i = 5; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [o[i], o[j]] = [o[j], o[i]] }
  return o
}

function GraphSvg({ hl, labels, sel, onSel, hops }: { hl?: number[]; labels?: string[]; sel?: number; onSel?: (i: number) => void; hops?: Set<number> }) {
  return (
    <svg className="svgbox" viewBox="0 0 560 280">
      {EDGES.map(([a, b], i) => <line key={i} x1={POS[a][0]} y1={POS[a][1]} x2={POS[b][0]} y2={POS[b][1]} stroke="#3a4f7a" strokeWidth={2} />)}
      {NAMES.map((n, i) => (
        <g key={n} style={{ cursor: onSel ? 'pointer' : 'default' }} onClick={() => onSel?.(i)}>
          <circle cx={POS[i][0]} cy={POS[i][1]} r={24} fill={hops?.has(i) ? '#ffc85733' : '#182131'} stroke={sel === i ? '#fff' : NODECOL[hl ? hl[i] : i]} strokeWidth={sel === i ? 4 : 3} />
          <text x={POS[i][0]} y={POS[i][1] + 5} textAnchor="middle" fill="#e6edf6" fontSize="15" fontWeight="700">{n}</text>
          {labels && <text x={POS[i][0]} y={POS[i][1] + 44} textAnchor="middle" fill="#4de1c1" fontSize="12">{labels[i]}</text>}
        </g>
      ))}
    </svg>
  )
}

/* ---------- L1: naive approach fails ---------- */
const NW = (() => { const r = rng(99); const w1 = Array.from({ length: 4 }, () => Array.from({ length: 42 }, () => gauss(r) * 0.4)); const w2 = Array.from({ length: 4 }, () => gauss(r)); return { w1, w2 } })()
export function GraphPerm() {
  const [seed, setSeed] = useState(0)
  const ord = seed === 0 ? [0, 1, 2, 3, 4, 5] : shuffleOrder(seed)
  const Aord = ord.map((i) => ord.map((j) => ADJ[i][j]))
  const Xord = ord.map((i) => FEAT[i][0] + FEAT[i][1])
  const input = [...Aord.flat(), ...Xord]
  const naive = (inp: number[]) => Math.tanh(NW.w2.reduce((s, w, k) => s + w * Math.tanh(NW.w1[k].reduce((a, ww, i) => a + ww * inp[i], 0)), 0))
  const ident = [0, 1, 2, 3, 4, 5]
  const base = naive([...ident.map((i) => ident.map((j) => ADJ[i][j])).flat(), ...ident.map((i) => FEAT[i][0] + FEAT[i][1])])
  const y = naive(input)
  // permutation-invariant GNN readout: one mean-aggregation layer then sum over nodes
  const gnn = (o: number[]) => o.reduce((s, v) => { const n = nbrs(v); const m = n.reduce((a, u) => a + FEAT[u][0] + FEAT[u][1], 0) / n.length; return s + relu(0.7 * m + 0.5 * (FEAT[v][0] + FEAT[v][1])) }, 0)
  return (
    <div className="viz">
      <div>
        <GraphSvg />
        <p className="muted" style={{ fontSize: 13 }}>It is always the same graph. Only the order we list the nodes changes.</p>
      </div>
      <div className="ctrls">
        <div className="btnrow"><button className="btn primary" onClick={() => setSeed(seed + 1)}>Re-order the nodes</button><button className="btn ghost" onClick={() => setSeed(0)}>original order</button></div>
        <div className="readout">node order: <b>{ord.map((i) => NAMES[i]).join(' ')}</b></div>
        <table className="grid">
          <thead><tr><th></th>{ord.map((i) => <th key={i}>{NAMES[i]}</th>)}<th>x</th></tr></thead>
          <tbody>{Aord.map((row, r) => <tr key={r}><th>{NAMES[ord[r]]}</th>{row.map((v, c) => <td key={c} style={{ background: v ? '#22305a' : undefined }}>{v}</td>)}<td>{Xord[r]}</td></tr>)}</tbody>
        </table>
        <div className="readout">
          Naive MLP on [A | X]: output <b style={{ color: Math.abs(y - base) < 1e-9 ? '#3ddc97' : '#ff6b81' }}>{f2(y, 4)}</b> (original order: {f2(base, 4)})<br />
          Neighbour-averaging layer + sum readout: <b style={{ color: '#3ddc97' }}>{f2(gnn(ord), 4)}</b> (original: {f2(gnn(ident), 4)})
        </div>
      </div>
    </div>
  )
}

/* ---------- L2: invariance vs equivariance ---------- */
export function Equivar() {
  const [seed, setSeed] = useState(0)
  const ord = seed === 0 ? [0, 1, 2, 3, 4, 5] : shuffleOrder(seed + 40)
  const emb = (v: number): [number, number] => {
    const n = nbrs(v)
    const m = [0, 1].map((d) => n.reduce((a, u) => a + FEAT[u][d], 0) / n.length)
    return [relu(0.8 * m[0] + 0.6 * FEAT[v][0]), relu(0.8 * m[1] + 0.6 * FEAT[v][1])]
  }
  const H = ord.map(emb)
  const pool = [0, 1].map((d) => H.reduce((s, h) => s + h[d], 0))
  const poolBase = [0, 1].map((d) => [0, 1, 2, 3, 4, 5].reduce((s, v) => s + emb(v)[d], 0))
  return (
    <div className="viz">
      <div className="ctrls">
        <div className="btnrow"><button className="btn primary" onClick={() => setSeed(seed + 1)}>Permute the input order</button><button className="btn ghost" onClick={() => setSeed(0)}>reset</button></div>
        <table className="grid">
          <thead><tr><th>row</th><th>node</th><th>input x</th><th>output embedding h</th></tr></thead>
          <tbody>{ord.map((v, r) => <tr key={r}><td>{r + 1}</td><th style={{ color: NODECOL[v] }}>{NAMES[v]}</th><td>({FEAT[v][0]}, {FEAT[v][1]})</td><td>({f2(H[r][0])}, {f2(H[r][1])})</td></tr>)}</tbody>
        </table>
      </div>
      <div className="ctrls">
        <div className="readout"><b>Equivariant (node-level, matrix out).</b> Each node keeps <i>its own</i> embedding; the rows just move with the nodes. Check node C: h = ({f2(emb(2)[0])}, {f2(emb(2)[1])}) in any order.</div>
        <div className="readout"><b>Invariant (graph-level, vector out).</b> Sum-pooled vector: ({f2(pool[0])}, {f2(pool[1])})<br />original order: ({f2(poolBase[0])}, {f2(poolBase[1])}) <span style={{ color: '#3ddc97' }}>identical</span></div>
        <div className="readout"><M t="f(PA P^\top, PX)=P\,f(A,X)" /> equivariant, and pooling over rows gives an invariant.</div>
      </div>
    </div>
  )
}

/* ---------- L3: GCN message passing ---------- */
export function MPDemo() {
  const [k, setK] = useState(1)
  const [w, setW] = useState(1)
  const [b, setB] = useState(1)
  const [act, setAct] = useState<'relu' | 'id'>('relu')
  const [sel, setSel] = useState(1)
  const layers = useMemo(() => {
    const L: [number, number][][] = [FEAT.map((f) => [f[0], f[1]] as [number, number])]
    for (let l = 1; l <= 3; l++) {
      L.push(NAMES.map((_, v) => {
        const n = nbrs(v)
        return [0, 1].map((d) => {
          const agg = n.reduce((a, u) => a + L[l - 1][u][d], 0) / n.length
          const z = w * agg + b * L[l - 1][v][d]
          return act === 'relu' ? relu(z) : z
        }) as [number, number]
      }))
    }
    return L
  }, [w, b, act])
  const hops = useMemo(() => {
    let cur = new Set([sel])
    for (let i = 0; i < k; i++) { const nx = new Set(cur); cur.forEach((v) => nbrs(v).forEach((u) => nx.add(u))); cur = nx }
    return cur
  }, [sel, k])
  const n = nbrs(sel)
  const prev = layers[Math.max(k - 1, 0)]
  return (
    <div className="viz">
      <div>
        <GraphSvg sel={sel} onSel={setSel} hops={hops} labels={layers[k].map((h) => `(${f2(h[0], 1)}, ${f2(h[1], 1)})`)} />
        <p className="muted" style={{ fontSize: 13 }}>Click a node. Yellow halo = its receptive field after {k} layer{k === 1 ? '' : 's'} (k hops). Labels = h<sup>({k})</sup>.</p>
      </div>
      <div className="ctrls">
        <Slider label="layer k" value={k} min={0} max={3} step={1} onChange={setK} />
        <Slider label="W (neighbour weight)" value={w} min={-1.5} max={1.5} step={0.1} onChange={setW} />
        <Slider label="B (self weight)" value={b} min={-1.5} max={1.5} step={0.1} onChange={setB} />
        <Seg value={act} onChange={setAct} options={[{ v: 'relu', label: 'ReLU' }, { v: 'id', label: 'no non-linearity' }]} />
        <div className="readout">
          {k === 0 ? <>h<sup>(0)</sup> = x (the input features)</> : <>
            h<sub>{NAMES[sel]}</sub><sup>({k})</sup> = σ( W · mean{'{'}{n.map((u) => NAMES[u] + ':(' + prev[u].map((v) => f2(v, 1)).join(',') + ')').join(', ')}{'}'} + B · ({prev[sel].map((v) => f2(v, 1)).join(', ')}) )<br />
            = <b>({layers[k][sel].map((v) => f2(v)).join(', ')})</b>
          </>}
        </div>
      </div>
    </div>
  )
}

/* ---------- L4: training a GCN ---------- */
const NG = 10
const GEDGES: [number, number][] = [[0, 1], [0, 2], [1, 2], [2, 3], [3, 4], [1, 4], [5, 6], [5, 7], [6, 7], [7, 8], [8, 9], [6, 9], [4, 5], [2, 7]]
const GN = Array.from({ length: NG }, (_, i) => GEDGES.filter(([a, b]) => a === i || b === i).map(([a, b]) => (a === i ? b : a)))
const GLAB = [0, 0, 0, 0, 0, 1, 1, 1, 1, 1]
const sigm = (z: number) => 1 / (1 + Math.exp(-z))
export function GNNTrain() {
  const X = useMemo(() => { const r = rng(12); return GLAB.map((c) => (c ? 0.8 : -0.8) + 1.4 * gauss(r)) }, [])
  const [par, setPar] = useState({ w: 0, b: 1, c: 0 })
  const [hist, setHist] = useState<number[]>([])
  const [lr, setLr] = useState(0.5)
  const agg = (v: number) => GN[v].reduce((s, u) => s + X[u], 0) / GN[v].length
  const prob = (p: typeof par, v: number) => sigm(p.w * agg(v) + p.b * X[v] + p.c)
  const loss = (p: typeof par) => -GLAB.reduce((s, y, v) => s + y * Math.log(prob(p, v)) + (1 - y) * Math.log(1 - prob(p, v)), 0) / NG
  const acc = (p: typeof par) => GLAB.filter((y, v) => (prob(p, v) > 0.5 ? 1 : 0) === y).length / NG
  const train = (steps: number) => {
    let p = par; const h = hist.slice()
    for (let s = 0; s < steps; s++) {
      let gw = 0, gb = 0, gc = 0
      GLAB.forEach((y, v) => { const e = prob(p, v) - y; gw += e * agg(v); gb += e * X[v]; gc += e })
      p = { w: p.w - (lr * gw) / NG, b: p.b - (lr * gb) / NG, c: p.c - (lr * gc) / NG }
      h.push(loss(p))
    }
    setPar(p); setHist(h)
  }
  const GP: [number, number][] = [[60, 60], [60, 150], [150, 100], [230, 100], [230, 190], [310, 150], [400, 60], [370, 130], [450, 190], [500, 100]]
  const selfOnly = { w: 0, b: par.b || 1, c: 0 }
  return (
    <div className="viz">
      <div>
        <svg className="svgbox" viewBox="0 0 560 250">
          {GEDGES.map(([a, b], i) => <line key={i} x1={GP[a][0]} y1={GP[a][1]} x2={GP[b][0]} y2={GP[b][1]} stroke="#3a4f7a" strokeWidth={2} />)}
          {GP.map((p, v) => { const pr = prob(par, v); return <g key={v}><circle cx={p[0]} cy={p[1]} r={20} fill={`rgba(${Math.round(77 + pr * 178)},${Math.round(225 - pr * 118)},${Math.round(193 - pr * 64)},0.9)`} stroke={GLAB[v] ? '#ff6b81' : '#4de1c1'} strokeWidth={3} /><text x={p[0]} y={p[1] + 4} textAnchor="middle" fontSize="11" fill="#0b1220" fontWeight="700">{f2(X[v], 1)}</text></g> })}
          <text x={10} y={240} fill="#8fa0b8" fontSize="11">outline = true class (green 0 / red 1) · fill = predicted P(class 1) · number = noisy feature x</text>
        </svg>
      </div>
      <div className="ctrls">
        <Slider label="learning rate" value={lr} min={0.05} max={2} step={0.05} onChange={setLr} />
        <div className="btnrow"><button className="btn" onClick={() => train(1)}>1 step</button><button className="btn primary" onClick={() => train(30)}>30 steps</button><button className="btn ghost" onClick={() => { setPar({ w: 0, b: 1, c: 0 }); setHist([]) }}>reset</button></div>
        <div className="readout">
          p<sub>v</sub> = σ( W·mean<sub>u∈N(v)</sub> x<sub>u</sub> + B·x<sub>v</sub> + c )<br />
          W = {f2(par.w)}, B = {f2(par.b)}, c = {f2(par.c)}<br />
          cross-entropy loss: <b>{f2(loss(par), 3)}</b> · accuracy: <b>{f2(acc(par) * 100, 0)}%</b><br />
          using the node’s own feature only (W=0): accuracy {f2(acc(selfOnly) * 100, 0)}%<br />
          <span className="muted">The same W, B are shared by every node, so the trained rule applies to nodes (even graphs) never seen in training.</span>
        </div>
        {hist.length > 1 && <svg className="svgbox" viewBox="0 0 300 70"><path d={hist.map((v, i) => `${i ? 'L' : 'M'}${(i / (hist.length - 1)) * 290 + 5},${60 - Math.min(1, v / (hist[0] + 1e-9)) * 50}`).join(' ')} fill="none" stroke="#7c9cff" strokeWidth={2} /></svg>}
      </div>
    </div>
  )
}

/* ---------- L5: aggregators + GraphSAGE ---------- */
const POOL: [number, number][] = [[2, 0], [0, 3], [-1, 1], [1, -2], [4, 1]]
export function AggDemo() {
  const [cnt, setCnt] = useState(3)
  const [agg, setAgg] = useState<'mean' | 'sum' | 'max' | 'pool'>('mean')
  const hv: [number, number] = [1, 1]
  const nb = POOL.slice(0, cnt)
  const mlp = (x: [number, number]) => [relu(1 * x[0] + 0.5 * x[1]), relu(-0.5 * x[0] + 1 * x[1])]
  const A = (() => {
    if (agg === 'mean') return [0, 1].map((d) => nb.reduce((s, u) => s + u[d], 0) / nb.length)
    if (agg === 'sum') return [0, 1].map((d) => nb.reduce((s, u) => s + u[d], 0))
    if (agg === 'max') return [0, 1].map((d) => Math.max(...nb.map((u) => u[d])))
    return [0, 1].map((d) => Math.max(...nb.map((u) => mlp(u)[d])))
  })()
  const cat = [...hv, ...A]
  const Wm = [[0.5, 0, 0.5, 0], [0, 0.5, 0, 0.5]]
  const out = Wm.map((r) => relu(r.reduce((s, w, i) => s + w * cat[i], 0)))
  return (
    <div className="viz">
      <div className="ctrls">
        <Seg value={agg} onChange={setAgg} options={[{ v: 'mean', label: 'Mean' }, { v: 'sum', label: 'Sum' }, { v: 'max', label: 'Max' }, { v: 'pool', label: 'Pool (MLP→max)' }]} />
        <Slider label="number of neighbours |N(v)|" value={cnt} min={1} max={5} step={1} onChange={setCnt} />
        <table className="grid">
          <thead><tr><th>neighbour u</th><th>h_u</th>{agg === 'pool' && <th>MLP(h_u)</th>}</tr></thead>
          <tbody>{nb.map((u, i) => <tr key={i}><td>u{i + 1}</td><td>({u[0]}, {u[1]})</td>{agg === 'pool' && <td>({f2(mlp(u)[0], 1)}, {f2(mlp(u)[1], 1)})</td>}</tr>)}</tbody>
        </table>
      </div>
      <div className="ctrls">
        <div className="readout">Stage 1: h<sub>N(v)</sub> = AGG({'{'}h<sub>u</sub>{'}'}) = <b>({f2(A[0])}, {f2(A[1])})</b></div>
        <div className="readout">Stage 2: GraphSAGE concatenates the node’s own h<sub>v</sub> = (1, 1):<br />CONCAT = ({cat.map((v) => f2(v)).join(', ')})<br />h<sub>v</sub><sup>(l)</sup> = σ(W·CONCAT) = <b>({f2(out[0])}, {f2(out[1])})</b></div>
        <div className="readout muted">Add neighbours: mean stays stable, sum grows with degree, max keeps the largest per-dimension value, pool applies an MLP to each neighbour first.</div>
      </div>
    </div>
  )
}

/* ---------- L6: GAT ---------- */
export function GATDemo() {
  const [a, setA] = useState([1, 0, 0, 0.5])
  const [heads, setHeads] = useState(false)
  const hv: [number, number] = [1, 1]
  const nb: [number, number][] = [[1, 0], [0, 1], [-1, 0], [2, 2]]
  const score = (u: [number, number], aa: number[]) => aa[0] * u[0] + aa[1] * u[1] + aa[2] * hv[0] + aa[3] * hv[1]
  const att = (aa: number[]) => { const e = nb.map((u) => score(u, aa)); const m = Math.max(...e); const x = e.map((v) => Math.exp(v - m)); const z = x.reduce((s, v) => s + v, 0); return x.map((v) => v / z) }
  const al = att(a)
  const out = (alp: number[]) => [0, 1].map((d) => relu(nb.reduce((s, u, i) => s + alp[i] * u[d], 0)))
  const H2 = [[0, 1, 0, 0], [0.5, -0.5, 0.5, 0.5]]
  const o1 = out(al), o2 = out(att(H2[0])), o3 = out(att(H2[1]))
  const uni = out(nb.map(() => 1 / nb.length))
  return (
    <div className="viz">
      <div>
        <svg className="svgbox" viewBox="0 0 520 250">
          {nb.map((u, i) => <g key={i}><rect x={30 + i * 118} y={200 - al[i] * 170} width={90} height={al[i] * 170 + 2} rx={6} fill="#4de1c1" /><text x={75 + i * 118} y={194 - al[i] * 170} textAnchor="middle" fill="#e6edf6" fontSize="13">α={al[i].toFixed(2)}</text><text x={75 + i * 118} y={222} textAnchor="middle" fill="#e6edf6" fontSize="12">u{i + 1}: ({u[0]}, {u[1]})</text><text x={75 + i * 118} y={238} textAnchor="middle" fill="#8fa0b8" fontSize="11">GCN weight 0.25</text></g>)}
          <text x={14} y={16} fill="#8fa0b8" fontSize="12">attention weights over the 4 neighbours of v (h_v = (1, 1)); the dashed GCN weights are all 1/|N(v)|</text>
        </svg>
      </div>
      <div className="ctrls">
        {a.map((v, i) => <Slider key={i} label={['a on W h_u (dim 1)', 'a on W h_u (dim 2)', 'a on W h_v (dim 1)', 'a on W h_v (dim 2)'][i]} value={v} min={-2} max={2} step={0.1} onChange={(nv) => setA(a.map((o, k) => (k === i ? nv : o)))} />)}
        <Seg value={heads ? 'm' : 's'} onChange={(v) => setHeads(v === 'm')} options={[{ v: 's', label: 'one head' }, { v: 'm', label: '3 heads' }]} />
        <div className="readout">
          e<sub>vu</sub> = a(Wh<sub>u</sub>, Wh<sub>v</sub>) = aᵀ[Wh<sub>u</sub> ‖ Wh<sub>v</sub>] (W = I here) → α = softmax over N(v), Σα = {f2(al.reduce((s, v) => s + v, 0), 2)}<br />
          GAT output: <b>({f2(o1[0])}, {f2(o1[1])})</b> · GCN/uniform: ({f2(uni[0])}, {f2(uni[1])})
          {heads && <><br />head 2: ({f2(o2[0])}, {f2(o2[1])}) · head 3: ({f2(o3[0])}, {f2(o3[1])})<br />concatenated: ({[...o1, ...o2, ...o3].map((v) => f2(v, 1)).join(', ')})</>}
        </div>
      </div>
    </div>
  )
}
