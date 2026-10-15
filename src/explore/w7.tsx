import { useMemo, useState } from 'react'
import { Seg, Slider, f2, rng, gauss } from './ui'

/* ---------- L1: over-smoothing lab ---------- */
// ring-with-chords graph of 12 nodes, 2 communities with distinct 2-D features
const N = 12
const EDG: [number, number][] = [[0,1],[1,2],[2,3],[3,4],[4,5],[5,0],[6,7],[7,8],[8,9],[9,10],[10,11],[11,6],[2,8],[5,9],[1,4],[7,10]]
const NB = Array.from({ length: N }, (_, i) => EDG.filter(([a, b]) => a === i || b === i).map(([a, b]) => (a === i ? b : a)))
const gpos = (i: number): [number, number] => {
  const a = (i / 6) * 2 * Math.PI, c = i < 6 ? [150, 130] : [380, 130]
  return [c[0] + 80 * Math.cos(a + (i < 6 ? 0 : 0.5)), c[1] + 80 * Math.sin(a + (i < 6 ? 0 : 0.5))]
}
export function OverSmooth() {
  const [L, setL] = useState(2)
  const [skip, setSkip] = useState(false)
  const X0 = useMemo(() => { const r = rng(4); return Array.from({ length: N }, (_, i) => [(i < 6 ? -1 : 1) + 0.35 * gauss(r), (i < 6 ? 0.8 : -0.8) + 0.35 * gauss(r)]) }, [])
  const layers = useMemo(() => {
    const out = [X0]
    for (let l = 1; l <= 12; l++) {
      const prev = out[l - 1]
      out.push(prev.map((h, v) => [0, 1].map((d) => {
        const m = NB[v].reduce((s, u) => s + prev[u][d], 0) / NB[v].length
        return skip ? 0.5 * m + 0.5 * h[d] + 0 : m
      })))
    }
    return out
  }, [X0, skip])
  const H = layers[L]
  const spread = (M: number[][]) => { const mx = [0, 1].map((d) => M.reduce((s, h) => s + h[d], 0) / N); return Math.sqrt(M.reduce((s, h) => s + (h[0] - mx[0]) ** 2 + (h[1] - mx[1]) ** 2, 0) / N) }
  const ex = (M: number[][], i: number) => M[i]
  const ex1 = [0, 1].map((d) => ex(H, 0)[d]), ex2 = [0, 1].map((d) => ex(H, 11)[d])
  const dist = Math.hypot(ex1[0] - ex2[0], ex1[1] - ex2[1])
  const X = (x: number) => 260 + x * 90, Y = (y: number) => 140 - y * 90
  const hist = layers.map(spread)
  return (
    <div className="viz">
      <div>
        <svg className="svgbox" viewBox="0 0 520 280">
          {EDG.map(([a, b], i) => <line key={i} x1={gpos(a)[0]} y1={gpos(a)[1]} x2={gpos(b)[0]} y2={gpos(b)[1]} stroke="#3a4f7a" />)}
          {H.map((h, i) => { const t = Math.min(1, Math.max(0, (h[0] - -1.5) / 3)); return <circle key={i} cx={gpos(i)[0]} cy={gpos(i)[1]} r={16} fill={`rgb(${Math.round(255 * t)},${Math.round(120 + 40 * (1 - t))},${Math.round(255 * (1 - t))})`} stroke="#0b1220" strokeWidth={2} /> })}
          <text x={10} y={16} fill="#8fa0b8" fontSize="12">node colour = first embedding coordinate after {L} layers (blue ↔ red)</text>
        </svg>
        <svg className="svgbox" style={{ marginTop: 10 }} viewBox="0 0 520 160">
          <rect x={20} y={10} width={480} height={130} fill="none" stroke="#2a3a54" />
          {H.map((h, i) => <circle key={i} cx={X(h[0]) } cy={Y(h[1]) - 20} r={5} fill={i < 6 ? '#4de1c1' : '#ff6b81'} opacity={0.9} />)}
          <text x={26} y={154} fill="#8fa0b8" fontSize="11">embedding space: teal = community 1, red = community 2</text>
        </svg>
      </div>
      <div className="ctrls">
        <Slider label="GNN layers L" value={L} min={0} max={12} step={1} onChange={setL} />
        <Seg value={skip ? 's' : 'p'} onChange={(v) => setSkip(v === 's')} options={[{ v: 'p', label: 'plain stack' }, { v: 's', label: 'with skip connections' }]} />
        <div className="readout">spread of embeddings: <b>{f2(hist[L], 3)}</b> (layer 0: {f2(hist[0], 3)})<br />distance between node A and node L’s embeddings: <b>{f2(dist, 3)}</b><br /><span className="muted">Plain mean-aggregation GNN: all embeddings converge toward the same value as L grows. Skip connections keep earlier (more distinguishing) layers in the mix.</span></div>
      </div>
    </div>
  )
}

/* ---------- L2: receptive field overlap ---------- */
const PATH = 15
export function ReceptiveField() {
  const [k, setK] = useState(2)
  const [a, setA] = useState(4)
  const [b, setB] = useState(9)
  const rf = (c: number) => { const s = new Set<number>(); for (let i = Math.max(0, c - k); i <= Math.min(PATH - 1, c + k); i++) s.add(i); return s }
  const ra = rf(a), rb = rf(b)
  const overlap = [...ra].filter((x) => rb.has(x)).length
  const jac = overlap / (ra.size + rb.size - overlap)
  return (
    <div className="viz">
      <div>
        <svg className="svgbox" viewBox="0 0 520 140">
          {Array.from({ length: PATH }, (_, i) => {
            const inA = ra.has(i), inB = rb.has(i)
            const fill = inA && inB ? '#ffc857' : inA ? '#4de1c1' : inB ? '#ff6b81' : '#182131'
            return <g key={i}>{i < PATH - 1 && <line x1={25 + i * 33} y1={60} x2={25 + (i + 1) * 33} y2={60} stroke="#3a4f7a" strokeWidth={2} />}<circle cx={25 + i * 33} cy={60} r={13} fill={fill} stroke={i === a ? '#4de1c1' : i === b ? '#ff6b81' : '#3a4f7a'} strokeWidth={i === a || i === b ? 4 : 1.5} /></g>
          })}
          <text x={10} y={110} fill="#8fa0b8" fontSize="12">teal = receptive field of node a · red = node b · yellow = shared neighbours</text>
        </svg>
      </div>
      <div className="ctrls">
        <Slider label="layers K (hops)" value={k} min={0} max={8} step={1} onChange={setK} />
        <Slider label="node a" value={a} min={0} max={PATH - 1} step={1} onChange={setA} />
        <Slider label="node b" value={b} min={0} max={PATH - 1} step={1} onChange={setB} />
        <div className="readout">|field(a)| = {ra.size}, |field(b)| = {rb.size}<br />shared nodes: <b>{overlap}</b> · overlap fraction: <b>{f2(jac, 2)}</b><br /><span className="muted">Highly overlapping receptive fields ⇒ highly similar embeddings ⇒ over-smoothing.</span></div>
      </div>
    </div>
  )
}

/* ---------- L3: graph manipulation ---------- */
export function GraphManip() {
  const [tab, setTab] = useState<'virt' | 'samp'>('virt')
  const [n, setN] = useState(11)
  const [virt, setVirt] = useState(false)
  const [kk, setKk] = useState(2)
  const [seed, setSeed] = useState(1)
  const deg = 8
  const pick = useMemo(() => { const r = rng(seed * 31); const arr = Array.from({ length: deg }, (_, i) => i); for (let i = deg - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]] } return new Set(arr.slice(0, kk)) }, [seed, kk])
  return (
    <div>
      <Seg value={tab} onChange={setTab} options={[{ v: 'virt', label: 'Sparse graph: virtual node' }, { v: 'samp', label: 'Dense graph: neighbour sampling' }]} />
      {tab === 'virt' ? (
        <div className="viz" style={{ marginTop: 12 }}>
          <svg className="svgbox" viewBox="0 0 520 170">
            {Array.from({ length: n }, (_, i) => <g key={i}>{i < n - 1 && <line x1={25 + i * (470 / (n - 1))} y1={120} x2={25 + (i + 1) * (470 / (n - 1))} y2={120} stroke="#3a4f7a" strokeWidth={2} />}{virt && <line x1={260} y1={30} x2={25 + i * (470 / (n - 1))} y2={120} stroke="#ffc85766" />}<circle cx={25 + i * (470 / (n - 1))} cy={120} r={8} fill={i === 0 || i === n - 1 ? '#ff6b81' : '#7c9cff'} /></g>)}
            {virt && <circle cx={260} cy={30} r={12} fill="#ffc857" />}
          </svg>
          <div className="ctrls">
            <Slider label="path length (nodes)" value={n} min={4} max={30} step={1} onChange={setN} />
            <Seg value={virt ? 'v' : 'n'} onChange={(v) => setVirt(v === 'v')} options={[{ v: 'n', label: 'original graph' }, { v: 'v', label: 'add virtual node' }]} />
            <div className="readout">shortest path between the red end nodes: <b>{virt ? 2 : n - 1}</b> hop{virt ? 's' : 's'}<br /><span className="muted">A virtual node connected to every node makes all pairs at distance ≤ 2, which greatly improves message passing in sparse graphs.</span></div>
          </div>
        </div>
      ) : (
        <div className="viz" style={{ marginTop: 12 }}>
          <svg className="svgbox" viewBox="0 0 520 220">
            <circle cx={260} cy={110} r={16} fill="#ffc857" />
            {Array.from({ length: deg }, (_, i) => { const a = (i / deg) * 2 * Math.PI; const x = 260 + 90 * Math.cos(a), y = 110 + 80 * Math.sin(a); const on = pick.has(i); return <g key={i}><line x1={260} y1={110} x2={x} y2={y} stroke={on ? '#4de1c1' : '#3a4f7a55'} strokeWidth={on ? 3 : 1} strokeDasharray={on ? '' : '4'} /><circle cx={x} cy={y} r={11} fill={on ? '#4de1c1' : '#182131'} stroke="#3a4f7a" /></g> })}
          </svg>
          <div className="ctrls">
            <Slider label="neighbours sampled per step" value={kk} min={1} max={8} step={1} onChange={setKk} />
            <button className="btn" onClick={() => setSeed(seed + 1)}>Draw a new sample (new training step)</button>
            <div className="readout">The hub has {deg} neighbours; each step it aggregates only {kk}.<br />Messages per hub per layer: <b>{kk}</b> instead of {deg} ({f2((kk / deg) * 100, 0)}% of the cost).<br /><span className="muted">Each time different neighbours are sampled, but embeddings stay similar to using all of them.</span></div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ---------- L4: prediction heads ---------- */
export function HeadsDemo() {
  const [tab, setTab] = useState<'node' | 'edge' | 'graph'>('graph')
  const [pool, setPool] = useState<'mean' | 'max' | 'sum'>('mean')
  const [extra, setExtra] = useState(0)
  const emb: number[][] = [[1, 2, 0], [3, 0, 1], [2, 4, 2], [0, 1, 5]]
  const Hh = emb.concat(Array.from({ length: extra }, () => [1, 1, 1]))
  const agg = (d: number) => pool === 'mean' ? Hh.reduce((s, h) => s + h[d], 0) / Hh.length : pool === 'sum' ? Hh.reduce((s, h) => s + h[d], 0) : Math.max(...Hh.map((h) => h[d]))
  const hv = emb[0], hu = emb[1]
  const dot = hv.reduce((s, v, i) => s + v * hu[i], 0)
  const Wh = [[1, 0, 0], [0, 1, 0]]
  return (
    <div>
      <Seg value={tab} onChange={setTab} options={[{ v: 'node', label: 'Node head' }, { v: 'edge', label: 'Edge head' }, { v: 'graph', label: 'Graph head (pooling)' }]} />
      <div style={{ marginTop: 12 }} className="viz">
        <div className="readout">
          Embeddings h<sup>(L)</sup> (d = 3):
          <table className="grid"><tbody>{Hh.map((h, i) => <tr key={i}><th>v{i + 1}</th>{h.map((v, j) => <td key={j}>{v}</td>)}</tr>)}</tbody></table>
        </div>
        <div className="ctrls">
          {tab === 'node' && <div className="readout">Node-level: ŷ<sub>v</sub> = W<sub>head</sub> h<sub>v</sub><br />W<sub>head</sub> ∈ ℝ<sup>k×d</sup> (k=2 classes): ŷ<sub>v1</sub> = <b>({Wh.map((r) => f2(r.reduce((s, w, i) => s + w * hv[i], 0), 1)).join(', ')})</b> → softmax gives class probabilities.</div>}
          {tab === 'edge' && <div className="readout">Edge-level for the pair (v1, v2):<br />• dot product (h<sub>v1</sub>)ᵀh<sub>v2</sub> = <b>{dot}</b> (a single score, 1-way prediction, e.g. link prediction)<br />• concat + linear: Linear([{hv.join(',')} ‖ {hu.join(',')}]), a 2d = 6 dimensional input mapped to k outputs.</div>}
          {tab === 'graph' && <>
            <Seg value={pool} onChange={setPool} options={[{ v: 'mean', label: 'mean' }, { v: 'max', label: 'max' }, { v: 'sum', label: 'sum' }]} />
            <Slider label="add identical nodes (1,1,1)" value={extra} min={0} max={6} step={1} onChange={setExtra} />
            <div className="readout">Global {pool} pooling ŷ<sub>G</sub> = <b>({[0, 1, 2].map((d) => f2(agg(d), 2)).join(', ')})</b><br /><span className="muted">Sum grows with graph size; mean is size-normalised; max keeps the most extreme node per dimension.</span></div></>}
        </div>
      </div>
    </div>
  )
}

/* ---------- L5: metrics ---------- */
export function MetricsDemo() {
  const [tp, setTp] = useState(40)
  const [fp, setFp] = useState(10)
  const [fn, setFn] = useState(20)
  const [tn, setTn] = useState(130)
  const n = tp + fp + fn + tn
  const acc = (tp + tn) / n, p = tp / Math.max(tp + fp, 1), r = tp / Math.max(tp + fn, 1), f1 = (2 * p * r) / Math.max(p + r, 1e-9)
  return (
    <div className="viz">
      <div className="ctrls">
        <Slider label="TP" value={tp} min={0} max={200} step={1} onChange={setTp} />
        <Slider label="FP" value={fp} min={0} max={200} step={1} onChange={setFp} />
        <Slider label="FN" value={fn} min={0} max={200} step={1} onChange={setFn} />
        <Slider label="TN" value={tn} min={0} max={400} step={1} onChange={setTn} />
      </div>
      <div>
        <table className="grid"><thead><tr><th></th><th>pred +</th><th>pred −</th></tr></thead><tbody><tr><th>actual +</th><td style={{ background: '#12332a' }}>TP {tp}</td><td style={{ background: '#381722' }}>FN {fn}</td></tr><tr><th>actual −</th><td style={{ background: '#381722' }}>FP {fp}</td><td style={{ background: '#12332a' }}>TN {tn}</td></tr></tbody></table>
        <div className="readout" style={{ marginTop: 10 }}>accuracy = (TP+TN)/N = <b>{f2(acc, 3)}</b><br />precision = TP/(TP+FP) = <b>{f2(p, 3)}</b><br />recall = TP/(TP+FN) = <b>{f2(r, 3)}</b><br />F1 = 2PR/(P+R) = <b>{f2(f1, 3)}</b><br /><span className="muted">Raise TN a lot: accuracy climbs, precision and recall don’t move.</span></div>
      </div>
    </div>
  )
}

/* ---------- L6: dataset splits ---------- */
export function SplitDemo() {
  const [mode, setMode] = useState<'trans' | 'ind'>('trans')
  const [phase, setPhase] = useState<'train' | 'val'>('train')
  const pos: [number, number][] = [[80, 60], [190, 40], [140, 150], [320, 60], [380, 150], [260, 160]]
  const edges: [number, number][] = [[0, 1], [0, 2], [1, 2], [1, 3], [3, 4], [3, 5], [4, 5], [2, 5]]
  const group = [0, 0, 0, 1, 1, 1] // nodes 0-2 train, 3-5 validation
  const labelled = (v: number) => (phase === 'train' ? group[v] === 0 : group[v] === 1)
  const visibleEdge = ([a, b]: [number, number]) => (mode === 'trans' ? true : group[a] === group[b] && (phase === 'train' ? group[a] === 0 : group[a] === 1))
  const visibleNode = (v: number) => (mode === 'trans' ? true : phase === 'train' ? group[v] === 0 : group[v] === 1)
  return (
    <div className="viz">
      <svg className="svgbox" viewBox="0 0 520 220">
        {edges.map((e, i) => <line key={i} x1={pos[e[0]][0]} y1={pos[e[0]][1]} x2={pos[e[1]][0]} y2={pos[e[1]][1]} stroke={visibleEdge(e) ? '#7c9cff' : '#3a4f7a22'} strokeWidth={visibleEdge(e) ? 3 : 1} strokeDasharray={visibleEdge(e) ? '' : '4'} />)}
        {pos.map((p, v) => <g key={v}><circle cx={p[0]} cy={p[1]} r={20} fill={labelled(v) ? '#4de1c1' : '#182131'} stroke={visibleNode(v) ? '#e6edf6' : '#3a4f7a44'} strokeWidth={visibleNode(v) ? 2.5 : 1} opacity={visibleNode(v) ? 1 : 0.3} /><text x={p[0]} y={p[1] + 5} textAnchor="middle" fill={labelled(v) ? '#0b1220' : '#e6edf6'} fontSize="14" fontWeight="700">{v + 1}</text></g>)}
        <text x={10} y={210} fill="#8fa0b8" fontSize="12">teal = nodes whose labels are used for the loss/metric in this phase · faded = hidden from the GNN</text>
      </svg>
      <div className="ctrls">
        <Seg value={mode} onChange={setMode} options={[{ v: 'trans', label: 'Transductive' }, { v: 'ind', label: 'Inductive' }]} />
        <Seg value={phase} onChange={setPhase} options={[{ v: 'train', label: 'training time' }, { v: 'val', label: 'validation time' }]} />
        <div className="readout">{mode === 'trans' ? <>Whole graph is visible at both times. Only the <b>labels</b> are split: train on nodes 1–3, evaluate on nodes 4–6.</> : <>Edges between splits are <b>broken</b>: each split sees only its own graph. A good model must generalise to a graph it never observed.</>}</div>
      </div>
    </div>
  )
}

/* ---------- L7: link prediction pipeline ---------- */
export function LinkPredDemo() {
  const [hide, setHide] = useState<number[]>([6])
  const pos: [number, number][] = [[60, 50], [160, 30], [260, 60], [110, 150], [220, 160]]
  const edges: [number, number][] = [[0, 1], [1, 2], [0, 3], [3, 4], [2, 4], [1, 3], [1, 4], [0, 4]]
  const names = ['v1', 'v2', 'v3', 'v4', 'v5']
  const toggle = (i: number) => setHide(hide.includes(i) ? hide.filter((x) => x !== i) : [...hide, i])
  const sup = edges.map((_, i) => hide.includes(i))
  const nMsg = sup.filter((s) => !s).length
  return (
    <div className="viz">
      <svg className="svgbox" viewBox="0 0 400 210">
        {edges.map((e, i) => <line key={i} onClick={() => toggle(i)} style={{ cursor: 'pointer' }} x1={pos[e[0]][0]} y1={pos[e[0]][1]} x2={pos[e[1]][0]} y2={pos[e[1]][1]} stroke={sup[i] ? '#ffc857' : '#7c9cff'} strokeWidth={sup[i] ? 4 : 2.5} strokeDasharray={sup[i] ? '7 5' : ''} />)}
        {pos.map((p, v) => <g key={v}><circle cx={p[0]} cy={p[1]} r={17} fill="#182131" stroke="#e6edf6" /><text x={p[0]} y={p[1] + 4} textAnchor="middle" fill="#e6edf6" fontSize="12">{names[v]}</text></g>)}
        <text x={8} y={200} fill="#8fa0b8" fontSize="11">click an edge to make it a supervision edge (dashed gold) · blue = message edges fed to the GNN</text>
      </svg>
      <div className="ctrls">
        <div className="readout">
          <b style={{ color: '#7c9cff' }}>message edges</b> ({nMsg}): used for message passing<br />
          <b style={{ color: '#ffc857' }}>supervision edges</b> ({edges.length - nMsg}): the labels the model must predict; <b>never fed into the GNN</b><br />
          {sup.some(Boolean) ? 'The GNN computes embeddings from the blue graph, then scores each gold pair (e.g. dot product).' : 'No supervision edges: nothing to learn from. Hide some.'}
          {nMsg < 3 && <><br /><span style={{ color: '#ff6b81' }}>Too few message edges: the GNN has little structure to pass messages along.</span></>}
        </div>
      </div>
    </div>
  )
}

/* ---------- L0: BN / dropout / activations ---------- */
export function ModulesDemo() {
  const [tab, setTab] = useState<'bn' | 'do' | 'act'>('bn')
  const [shift, setShift] = useState(5)
  const [scale, setScale] = useState(3)
  const [p, setP] = useState(0.4)
  const [seed, setSeed] = useState(1)
  const [train, setTrain] = useState(true)
  const [xin, setXin] = useState(1)
  const base = [-1.2, -0.4, 0.1, 0.5, 0.9, 1.6, -0.8, 0.3]
  const raw = base.map((v) => v * scale + shift)
  const mean = raw.reduce((a, b) => a + b, 0) / raw.length
  const vr = raw.reduce((a, b) => a + (b - mean) ** 2, 0) / raw.length
  const bn = raw.map((v) => (v - mean) / Math.sqrt(vr + 1e-5))
  const mask = useMemo(() => { const r = rng(seed * 17); return Array.from({ length: 10 }, () => r() >= p) }, [seed, p])
  const act = (x: number) => ({ relu: Math.max(0, x), sig: 1 / (1 + Math.exp(-x)), tanh: Math.tanh(x) })
  const xs = Array.from({ length: 121 }, (_, i) => -6 + i * 0.1)
  const W = 520, H = 190
  const X = (x: number) => 20 + ((x + 6) / 12) * (W - 40), Y = (y: number) => 100 - y * 40
  const curve = (k: 'relu' | 'sig' | 'tanh') => xs.map((x, i) => `${i ? 'L' : 'M'}${X(x).toFixed(1)},${Y(act(x)[k]).toFixed(1)}`).join(' ')
  return (
    <div>
      <Seg value={tab} onChange={setTab} options={[{ v: 'bn', label: 'Batch normalisation' }, { v: 'do', label: 'Dropout' }, { v: 'act', label: 'Activations' }]} />
      <div className="viz" style={{ marginTop: 12 }}>
        {tab === 'bn' && <>
          <svg className="svgbox" viewBox={`0 0 ${W} ${H}`}>
            <line x1={20} y1={60} x2={500} y2={60} stroke="#2a3a54" /><line x1={20} y1={140} x2={500} y2={140} stroke="#2a3a54" />
            {raw.map((v, i) => <circle key={'r' + i} cx={20 + ((v + 10) / 30) * 480} cy={60} r={6} fill="#ff6b81" />)}
            {bn.map((v, i) => <circle key={'b' + i} cx={20 + ((v * 2 + 10) / 30) * 480} cy={140} r={6} fill="#4de1c1" />)}
            <text x={20} y={20} fill="#ff6b81" fontSize="12">raw node embeddings (one feature across the batch)</text><text x={20} y={170} fill="#4de1c1" fontSize="12">after batch norm: mean 0, variance 1 (shown ×2)</text>
          </svg>
          <div className="ctrls">
            <Slider label="raw shift" value={shift} min={-8} max={8} step={0.5} onChange={setShift} />
            <Slider label="raw scale" value={scale} min={0.2} max={6} step={0.2} onChange={setScale} />
            <div className="readout">raw: mean {f2(mean)}, variance {f2(vr)}<br />normalised: mean <b>{f2(bn.reduce((a, b) => a + b, 0) / bn.length, 3)}</b>, variance <b>{f2(bn.reduce((a, b) => a + b * b, 0) / bn.length, 3)}</b></div>
          </div>
        </>}
        {tab === 'do' && <>
          <svg className="svgbox" viewBox="0 0 520 140">
            {mask.map((on, i) => <circle key={i} cx={40 + i * 48} cy={70} r={18} fill={train ? (on ? '#4de1c1' : '#182131') : '#4de1c1'} stroke="#3a4f7a" strokeWidth={2} opacity={train && !on ? 0.4 : 1} />)}
            <text x={20} y={120} fill="#8fa0b8" fontSize="12">{train ? 'training: each neuron is set to 0 with probability p' : 'testing: all neurons are used'}</text>
          </svg>
          <div className="ctrls">
            <Seg value={train ? 't' : 'e'} onChange={(v) => setTrain(v === 't')} options={[{ v: 't', label: 'training' }, { v: 'e', label: 'testing' }]} />
            <Slider label="drop probability p" value={p} min={0} max={0.9} step={0.05} onChange={setP} />
            <button className="btn" onClick={() => setSeed(seed + 1)}>New random mask</button>
            <div className="readout">active neurons: <b>{train ? mask.filter(Boolean).length : 10}</b> of 10<br />In a GNN the dropout is applied to the linear layer of the message function m<sub>u</sub><sup>(l)</sup> = W<sup>(l)</sup>h<sub>u</sub><sup>(l−1)</sup>.</div>
          </div>
        </>}
        {tab === 'act' && <>
          <svg className="svgbox" viewBox={`0 0 ${W} ${H}`}>
            <line x1={20} y1={100} x2={500} y2={100} stroke="#2a3a54" /><line x1={260} y1={10} x2={260} y2={180} stroke="#2a3a54" />
            <path d={curve('relu')} fill="none" stroke="#4de1c1" strokeWidth={2.5} /><path d={curve('sig')} fill="none" stroke="#ffc857" strokeWidth={2.5} /><path d={curve('tanh')} fill="none" stroke="#ff6b81" strokeWidth={2.5} />
            <text x={30} y={16} fill="#4de1c1" fontSize="12">ReLU</text><text x={80} y={16} fill="#ffc857" fontSize="12">sigmoid</text><text x={140} y={16} fill="#ff6b81" fontSize="12">tanh</text>
          </svg>
          <div className="ctrls">
            <Slider label="input x" value={xin} min={-5} max={5} step={0.1} onChange={setXin} />
            <div className="readout">ReLU({xin}) = <b>{f2(act(xin).relu, 3)}</b><br />σ({xin}) = <b>{f2(act(xin).sig, 3)}</b> (restricts the range to (0,1))<br />tanh({xin}) = <b>{f2(act(xin).tanh, 3)}</b></div>
          </div>
        </>}
      </div>
    </div>
  )
}
