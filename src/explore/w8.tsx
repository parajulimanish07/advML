import { useState } from 'react'
import { Seg, Slider, f2 } from './ui'
import { M } from '../components/Rich'

/* ---------- L1: relation types ---------- */
export function Relations() {
  const [T, setT] = useState(2)
  const [E, setE] = useState(2)
  const [oneHot, setOneHot] = useState(false)
  const nodeN = ['Paper', 'Author', 'Venue', 'Field'].slice(0, T)
  const edgeN = ['Cite', 'Like', 'Write', 'Publish'].slice(0, E)
  const rels = nodeN.flatMap((a) => edgeN.flatMap((e) => nodeN.map((b) => `(${a}, ${e}, ${b})`)))
  return (
    <div className="viz">
      <div className="ctrls">
        <Slider label="node types" value={T} min={1} max={4} step={1} onChange={setT} />
        <Slider label="edge types" value={E} min={1} max={4} step={1} onChange={setE} />
        <div className="readout">possible relation types = {T} × {E} × {T} = <b>{T * E * T}</b><br />relation type r(u,v) = (τ(u), φ(u,v), τ(v))</div>
        <div className="ctrl"><label><span>Types as features?</span></label></div>
        <Seg value={oneHot ? 'f' : 'h'} onChange={(v) => setOneHot(v === 'f')} options={[{ v: 'h', label: 'heterogeneous graph' }, { v: 'f', label: 'one-hot type features' }]} />
        <div className="readout">{oneHot ? <>Each node gets a one-hot type indicator: author = [1, 0], paper = [0, 1]. The graph becomes a standard homogeneous graph. <b>But</b> it only works if all types share the same feature shape and one model suits every relation.</> : <>A heterogeneous graph keeps types explicit. It is <b>needed</b> when (1) node types have different feature shapes (author 4-dim vs paper 5-dim) or (2) relation types need different models (English→French vs English→Chinese). Cost: more computation, storage and complexity.</>}</div>
      </div>
      <div className="readout" style={{ maxHeight: 300, overflow: 'auto' }}>
        <b>All {rels.length} possible relation types:</b>
        {rels.map((r, i) => <div key={i} style={{ color: '#cfd9ea' }}>{r}</div>)}
      </div>
    </div>
  )
}

/* ---------- L2: RGCN layer ---------- */
const HN: Record<string, number> = { A: 1, B: 1, C: 2, D: 3, E: 4, F: 2 }
export function RGCNLayer() {
  const [w1, setW1] = useState(1)
  const [w2, setW2] = useState(0.5)
  const [w0, setW0] = useState(1)
  const [act, setAct] = useState<'id' | 'relu'>('id')
  const r1 = ['B', 'C', 'D'], r2 = ['E', 'F']
  const m1 = r1.reduce((s, u) => s + HN[u], 0) / r1.length, m2 = r2.reduce((s, u) => s + HN[u], 0) / r2.length
  const z = w1 * m1 + w2 * m2 + w0 * HN.A
  const hA = act === 'relu' ? Math.max(0, z) : z
  const pos: Record<string, [number, number]> = { A: [250, 120], B: [90, 50], C: [90, 190], D: [250, 20], E: [410, 50], F: [410, 190] }
  const rel: Record<string, string> = { B: 'r1', C: 'r1', D: 'r1', E: 'r2', F: 'r2' }
  return (
    <div className="viz">
      <svg className="svgbox" viewBox="0 0 520 230">
        {Object.keys(rel).map((n) => <line key={n} x1={pos[n][0]} y1={pos[n][1]} x2={pos.A[0]} y2={pos.A[1]} stroke={rel[n] === 'r1' ? '#4de1c1' : '#ff6b81'} strokeWidth={3} />)}
        {Object.entries(pos).map(([n, p]) => <g key={n}><circle cx={p[0]} cy={p[1]} r={22} fill={n === 'A' ? '#ffc857' : '#182131'} stroke="#e6edf6" /><text x={p[0]} y={p[1] + 5} textAnchor="middle" fill={n === 'A' ? '#0b1220' : '#e6edf6'} fontWeight="700">{n}</text><text x={p[0]} y={p[1] + 38} textAnchor="middle" fill="#8fa0b8" fontSize="11">h⁰={HN[n]}</text></g>)}
        <text x={10} y={226} fill="#8fa0b8" fontSize="11">teal = relation r₁ (B, C, D) · red = relation r₂ (E, F)</text>
      </svg>
      <div className="ctrls">
        <Slider label={<M t="W_{r_1}" />} value={w1} min={-2} max={2} step={0.1} onChange={setW1} />
        <Slider label={<M t="W_{r_2}" />} value={w2} min={-2} max={2} step={0.1} onChange={setW2} />
        <Slider label={<M t="W_0" />} value={w0} min={-2} max={2} step={0.1} onChange={setW0} />
        <Seg value={act} onChange={setAct} options={[{ v: 'id', label: 'σ = identity' }, { v: 'relu', label: 'σ = ReLU' }]} />
        <div className="readout">
          h<sub>A</sub><sup>(1)</sup> = σ( W<sub>r1</sub>·(h<sub>B</sub>+h<sub>C</sub>+h<sub>D</sub>)/3 + W<sub>r2</sub>·(h<sub>E</sub>+h<sub>F</sub>)/2 + W<sub>0</sub>h<sub>A</sub> )<br />
          = σ( {f2(w1)}·{f2(m1)} + {f2(w2)}·{f2(m2)} + {f2(w0)}·{HN.A} ) = <b>{f2(hA)}</b><br />
          <span className="muted">Each relation has its own weight matrix and its own 1/|N<sub>v</sub><sup>r</sup>| normalisation.</span>
        </div>
      </div>
    </div>
  )
}

/* ---------- L3/L4: parameter growth ---------- */
export function RGCNParams({ params }: { params: Record<string, unknown> }) {
  const [tab, setTab] = useState<'block' | 'basis'>((params.tab as 'block' | 'basis') ?? 'block')
  const [dout, setDout] = useState(64)
  const [din, setDin] = useState(64)
  const [R, setR] = useState(100)
  const [Bk, setBk] = useState(4)
  const [Bb, setBb] = useState(5)
  const full = dout * din * R
  const blk = (dout * din * R) / Bk
  const bas = (dout * din + R) * Bb
  const mx = Math.max(full, 1)
  const bar = (v: number, c: string) => <div style={{ background: c, height: 18, width: `${Math.max(1, (v / mx) * 100)}%`, borderRadius: 6 }} />
  return (
    <div>
      <Seg value={tab} onChange={setTab} options={[{ v: 'block', label: 'Block-diagonal weights' }, { v: 'basis', label: 'Basis learning' }]} />
      <div className="viz" style={{ marginTop: 12 }}>
        <div className="ctrls">
          <Slider label={<M t="d^{(l+1)}" />} value={dout} min={8} max={256} step={8} onChange={setDout} />
          <Slider label={<M t="d^{(l)}" />} value={din} min={8} max={256} step={8} onChange={setDin} />
          <Slider label="relations |R|" value={R} min={2} max={500} step={2} onChange={setR} />
          {tab === 'block' ? <Slider label="blocks B" value={Bk} min={1} max={16} step={1} onChange={setBk} /> : <Slider label="bases B" value={Bb} min={1} max={50} step={1} onChange={setBb} />}
          <div>full: d<sup>(l+1)</sup>·d<sup>(l)</sup>·|R| = <b>{full.toLocaleString()}</b></div>{bar(full, '#ff6b81')}
          {tab === 'block'
            ? <><div>block-diagonal: full / B = <b>{Math.round(blk).toLocaleString()}</b></div>{bar(blk, '#4de1c1')}</>
            : <><div>basis: (d<sup>(l+1)</sup>·d<sup>(l)</sup> + |R|)·B = <b>{bas.toLocaleString()}</b></div>{bar(bas, '#4de1c1')}</>}
        </div>
        <div>
          {tab === 'block' ? (
            <>
              <svg className="svgbox" viewBox="0 0 300 220">
                {Array.from({ length: 24 }, (_, k) => { const r = Math.floor(k / 4), c = k % 4; const on = (r < 3 && c < 2) || (r >= 3 && c >= 2); return <rect key={k} x={40 + c * 56} y={20 + r * 30} width={52} height={26} rx={4} fill={on ? '#4de1c1' : '#182131'} stroke="#3a4f7a" /> })}
                <text x={40} y={212} fill="#8fa0b8" fontSize="11">W_r is 6×4 with 2 blocks: 12 nonzeros instead of 24</text>
              </svg>
              <div className="readout" style={{ marginTop: 10 }}>Catch: features in the first block can only be transformed by the first sub-matrix. Inputs 1–2 never influence outputs 4–6, so cross-block interaction is lost.</div>
            </>
          ) : (
            <div className="readout">W<sub>r</sub> = Σ<sub>b=1..B</sub> a<sub>rb</sub> V<sub>b</sub>: the B basis matrices V<sub>b</sub> are shared by all relations; each relation only owns its B coefficients a<sub>rb</sub>.<br /><br />
              Savings vs full: <b>{f2(full / bas, 1)}×</b><br />{Bb * 2 > R ? <span style={{ color: '#ff6b81' }}>B ≈ |R|: savings vanish.</span> : <span style={{ color: '#3ddc97' }}>B ≪ |R|: large savings.</span>}<br /><br />Bases are per layer (not shared across layers) and are learned by backprop together with the coefficients.</div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ---------- L5: link ranking ---------- */
export function LinkRank() {
  const [sD, setSD] = useState(2.0)
  const [sB, setSB] = useState(1.0)
  const [sF, setSF] = useState(-0.5)
  const [k, setK] = useState(2)
  const cands = [{ n: 'D (true edge)', s: sD, t: true }, { n: 'B (negative)', s: sB, t: false }, { n: 'F (negative)', s: sF, t: false }]
  const rank = 1 + cands.filter((c) => !c.t && c.s > sD).length
  return (
    <div className="viz">
      <div className="ctrls">
        <div className="readout">Validation edge (E, r₃, D). Negatives: (E, r₃, B) and (E, r₃, F). (A and C are excluded: (E,r₃,A) and (E,r₃,C) are training edges.)</div>
        <Slider label="score f_r3(h_E, h_D)  (true)" value={sD} min={-3} max={3} step={0.1} onChange={setSD} />
        <Slider label="score of (E, r₃, B)" value={sB} min={-3} max={3} step={0.1} onChange={setSB} />
        <Slider label="score of (E, r₃, F)" value={sF} min={-3} max={3} step={0.1} onChange={setSF} />
        <Slider label="k for Hits@k" value={k} min={1} max={3} step={1} onChange={setK} />
      </div>
      <div className="readout">
        ranking (best first):
        <ol style={{ margin: '6px 0 6px 18px' }}>{[...cands].sort((a, b) => b.s - a.s).map((c) => <li key={c.n} style={{ color: c.t ? '#3ddc97' : undefined }}>{c.n}: {f2(c.s, 1)}</li>)}</ol>
        rank of the true edge RK = <b>{rank}</b><br />
        Hits@{k} = 1[RK ≤ {k}] = <b>{rank <= k ? 1 : 0}</b><br />
        Reciprocal rank = 1/RK = <b>{f2(1 / rank, 3)}</b><br />
        <span className="muted">Both are higher-is-better. The true edge’s score should beat every non-training negative.</span>
      </div>
    </div>
  )
}

/* ---------- L6: heterogeneous aggregation ---------- */
const MSG1: [number, number][] = [[1, 2], [3, 0], [2, 1]]
const MSG2: [number, number][] = [[0, 4], [2, 2]]
export function HeteroAgg() {
  const [inner, setInner] = useState<'mean' | 'sum' | 'max'>('mean')
  const [outer, setOuter] = useState<'sum' | 'concat'>('sum')
  const agg = (ms: [number, number][]) => [0, 1].map((d) => inner === 'mean' ? ms.reduce((s, m) => s + m[d], 0) / ms.length : inner === 'sum' ? ms.reduce((s, m) => s + m[d], 0) : Math.max(...ms.map((m) => m[d])))
  const a1 = agg(MSG1), a2 = agg(MSG2)
  const out = outer === 'sum' ? [a1[0] + a2[0], a1[1] + a2[1]] : [...a1, ...a2]
  return (
    <div className="viz">
      <div className="ctrls">
        <div className="readout">Messages m<sub>u</sub> = MSG<sub>r</sub>(h<sub>u</sub>) already computed per relation:<br />relation r₁: {MSG1.map((m) => `(${m})`).join(' ')}<br />relation r₂: {MSG2.map((m) => `(${m})`).join(' ')}</div>
        <div className="ctrl"><label><span>Stage 1: AGG<sub>r</sub> within each relation</span></label></div>
        <Seg value={inner} onChange={setInner} options={[{ v: 'mean', label: 'mean' }, { v: 'sum', label: 'sum' }, { v: 'max', label: 'max' }]} />
        <div className="ctrl"><label><span>Stage 2: AGG<sub>all</sub> across relations</span></label></div>
        <Seg value={outer} onChange={setOuter} options={[{ v: 'sum', label: 'sum' }, { v: 'concat', label: 'concat' }]} />
      </div>
      <div className="readout">
        Stage 1: r₁ → ({a1.map((v) => f2(v, 2)).join(', ')}) · r₂ → ({a2.map((v) => f2(v, 2)).join(', ')})<br />
        Stage 2 ({outer}): h<sub>v</sub> = <b>({out.map((v) => f2(v, 2)).join(', ')})</b> · dimension <b>{out.length}</b><br />
        <span className="muted">Concatenation keeps relations separate but grows the vector with the number of relation types; sum keeps the dimension fixed.</span>
      </div>
    </div>
  )
}
