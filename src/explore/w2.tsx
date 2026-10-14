import { useMemo, useState } from 'react'
import { Seg, Slider, f2, gauss, npdf, path, rng } from './ui'
import { M } from '../components/Rich'

const sig = (z: number) => 1 / (1 + Math.exp(-z))

/* ---------- L1: tiny FVSBN ---------- */
export function AutoregDemo() {
  const [w, setW] = useState([0.5, -1, 2, 0.5, 1.5, -2]) // a0 | b0,b1 | c0,c1,c2
  const [bits, setBits] = useState([1, 1, 0])
  const [seed, setSeed] = useState(1)
  const [drawn, setDrawn] = useState<number[] | null>(null)
  const cond = (x: number[]) => [sig(w[0]), sig(w[1] + w[2] * x[0]), sig(w[3] + w[4] * x[0] + w[5] * x[1])]
  const pOf = (x: number[]) => {
    const c = cond(x)
    return x.reduce((p, xi, i) => p * (xi ? c[i] : 1 - c[i]), 1)
  }
  const all = Array.from({ length: 8 }, (_, k) => [(k >> 2) & 1, (k >> 1) & 1, k & 1])
  const total = all.reduce((s, x) => s + pOf(x), 0)
  const c = cond(bits)
  const sample = () => {
    const r = rng(seed * 97 + 13)
    setSeed(seed + 1)
    const x: number[] = []
    x.push(r() < sig(w[0]) ? 1 : 0)
    x.push(r() < sig(w[1] + w[2] * x[0]) ? 1 : 0)
    x.push(r() < sig(w[3] + w[4] * x[0] + w[5] * x[1]) ? 1 : 0)
    setDrawn(x)
  }
  const names = ['a⁰', 'b⁰', 'b¹', 'c⁰', 'c¹', 'c²']
  return (
    <div className="viz">
      <div>
        <div className="btnrow" style={{ marginBottom: 10 }}>
          {bits.map((b, i) => (
            <button key={i} className={'btn' + (b ? ' primary' : '')} onClick={() => setBits(bits.map((v, k) => (k === i ? 1 - v : v)))}>x{i + 1} = {b}</button>
          ))}
        </div>
        <div className="readout">
          <M t={`p(x_1{=}${bits[0]})=${f2(bits[0] ? c[0] : 1 - c[0], 3)}`} /><br />
          <M t={`p(x_2{=}${bits[1]}\\mid x_1{=}${bits[0]})=${f2(bits[1] ? c[1] : 1 - c[1], 3)}`} /><br />
          <M t={`p(x_3{=}${bits[2]}\\mid x_1{=}${bits[0]},x_2{=}${bits[1]})=${f2(bits[2] ? c[2] : 1 - c[2], 3)}`} /><br />
          <b>product p(x₁,x₂,x₃) = {f2(pOf(bits), 4)}</b>
        </div>
        <table className="grid" style={{ marginTop: 10 }}>
          <thead><tr><th>x₁x₂x₃</th>{all.map((x) => <th key={x.join('')}>{x.join('')}</th>)}</tr></thead>
          <tbody><tr><th>p</th>{all.map((x) => <td key={x.join('')} className={x.join('') === bits.join('') ? 'hl' : ''}>{f2(pOf(x), 3)}</td>)}</tr></tbody>
        </table>
        <div className="readout" style={{ marginTop: 10 }}>Σ over all 8 images = <b>{f2(total, 4)}</b> (valid distribution)</div>
        <div className="btnrow" style={{ marginTop: 10 }}>
          <button className="btn primary" onClick={sample}>Sample one image (x₁, then x₂, then x₃)</button>
          {drawn && <span className="readout">drew: <b>{drawn.join(' ')}</b></span>}
        </div>
      </div>
      <div className="ctrls">
        {w.map((v, i) => <Slider key={i} label={`weight ${names[i]}`} value={v} min={-4} max={4} step={0.25} onChange={(nv) => setW(w.map((o, k) => (k === i ? nv : o)))} />)}
        <div className="readout">Parameters: 1 + 2 + 3 = <b>6</b> (≈ n²/2 for n pixels)</div>
      </div>
    </div>
  )
}

/* ---------- L2: parameter counting ---------- */
export function ParamCount() {
  const [n, setN] = useState(784)
  const [d, setD] = useState(500)
  const fvsbn = (n * (n + 1)) / 2
  const nadeTied = 2 * n * d + d + n
  const table = (n * (n + 1)) / 2
  const maxv = Math.max(fvsbn, nadeTied, 1)
  const bar = (v: number, col: string) => <div style={{ background: col, height: 18, width: `${(v / maxv) * 100}%`, borderRadius: 6, minWidth: 2 }} />
  const full = Math.pow(2, n) - 1
  return (
    <div className="viz">
      <div className="ctrls">
        <div><b>FVSBN</b> (slide): 1 + 2 + … + n = {fvsbn.toLocaleString()}</div>
        {bar(fvsbn, '#7c9cff')}
        <div><b>NADE, tied weights</b> (extra: my count with hidden size d): 2nd + d + n = {nadeTied.toLocaleString()}</div>
        {bar(nadeTied, '#4de1c1')}
        <div className="readout">A full probability table over n binary pixels needs 2ⁿ − 1 numbers: for n = {n} that is about 10<sup>{Math.floor(n * Math.log10(2))}</sup>. (Slide: 2<sup>784</sup> ≈ 10<sup>235</sup> images.)<br />n²/2 ≈ {table.toLocaleString()} (exact n(n+1)/2)<br /><span className="muted">2ⁿ − 1 = {n <= 20 ? full.toLocaleString() : 'astronomical'}</span></div>
      </div>
      <div className="ctrls">
        <Slider label="pixels n" value={n} min={3} max={784} step={1} onChange={setN} />
        <Slider label="NADE hidden units d" value={d} min={10} max={1000} step={10} onChange={setD} />
        <div className="readout">At small n the FVSBN is cheap; its n²/2 growth is quadratic, but still tiny vs 2ⁿ. NADE’s tying makes growth <b>linear</b> in n for fixed d (and lets h be updated incrementally).</div>
      </div>
    </div>
  )
}

/* ---------- L3: softmax & RNADE ---------- */
export function SoftmaxMix() {
  const [tab, setTab] = useState<'sm' | 'mix'>('sm')
  const [a, setA] = useState([1, 2.2, 0.3, 4.1])
  const e = a.map(Math.exp), Z = e.reduce((s, v) => s + v, 0)
  const [mu, setMu] = useState([-1.5, 0.3, 2])
  const [sg, setSg] = useState([0.5, 0.7, 0.4])
  const xs = Array.from({ length: 241 }, (_, i) => -4 + (i * 8) / 240)
  const W = 520, H = 220
  const dens = (x: number) => mu.reduce((s, m, j) => s + npdf(x, m, sg[j]), 0) / mu.length
  const X = (x: number) => 20 + ((x + 4) / 8) * (W - 40), Y = (y: number) => H - 24 - y * 160
  return (
    <div>
      <Seg value={tab} onChange={setTab} options={[{ v: 'sm', label: 'Softmax: categorical output' }, { v: 'mix', label: 'RNADE: mixture of Gaussians' }]} />
      {tab === 'sm' ? (
        <div className="viz" style={{ marginTop: 12 }}>
          <svg className="svgbox" viewBox={`0 0 ${W} ${H}`}>
            {a.map((_, i) => {
              const p = e[i] / Z
              return <g key={i}><rect x={40 + i * 120} y={H - 30 - p * 170} width={80} height={p * 170} rx={6} fill="#7c9cff" /><text x={80 + i * 120} y={H - 36 - p * 170} textAnchor="middle" fill="#e6edf6" fontSize="13">{p.toFixed(3)}</text><text x={80 + i * 120} y={H - 10} textAnchor="middle" fill="#8fa0b8" fontSize="12">class {i + 1}</text></g>
            })}
          </svg>
          <div className="ctrls">
            {a.map((v, i) => <Slider key={i} label={`logit a${i + 1}`} value={v} min={-3} max={5} step={0.1} onChange={(nv) => setA(a.map((o, k) => (k === i ? nv : o)))} />)}
            <div className="readout">softmax(a)ᵢ = exp(aᵢ)/Σexp(aⱼ) → Σ = <b>{f2(e.reduce((s, v) => s + v / Z, 0), 3)}</b><br />Adding the same constant to every logit changes nothing. Try it.</div>
          </div>
        </div>
      ) : (
        <div className="viz" style={{ marginTop: 12 }}>
          <svg className="svgbox" viewBox={`0 0 ${W} ${H}`}>
            {mu.map((m, j) => <path key={j} d={path(xs.map((x) => [X(x), Y(npdf(x, m, sg[j]) / mu.length)]))} fill="none" stroke="#ffc85788" strokeDasharray="4" />)}
            <path d={path(xs.map((x) => [X(x), Y(dens(x))]))} fill="none" stroke="#7c9cff" strokeWidth={3} />
          </svg>
          <div className="ctrls">
            {mu.map((m, j) => (
              <div key={j}>
                <Slider label={<M t={`\\mu_${j + 1}`} />} value={m} min={-3.5} max={3.5} step={0.1} onChange={(v) => setMu(mu.map((o, k) => (k === j ? v : o)))} />
                <Slider label={<M t={`\\sigma_${j + 1}`} />} value={sg[j]} min={0.2} max={1.2} step={0.05} onChange={(v) => setSg(sg.map((o, k) => (k === j ? v : o)))} />
              </div>
            ))}
            <div className="readout">p(xᵢ | x₁…xᵢ₋₁) = (1/K) Σⱼ N(xᵢ; μⱼ, σⱼ). The network outputs all μⱼ, σⱼ; use exp(·) to keep σ positive.</div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ---------- L4: MADE masks ---------- */
const PERMS = [[1, 2, 3], [1, 3, 2], [2, 1, 3], [2, 3, 1], [3, 1, 2], [3, 2, 1]] // ordering of variable indices
export function MadeDemo() {
  const [pi, setPi] = useState(3) // ordering x2, x3, x1 (the slide example)
  const [deg, setDeg] = useState([1, 2, 1, 2])
  const [masked, setMasked] = useState(true)
  const order = PERMS[pi]
  const din = [0, 0, 0]
  order.forEach((v, pos) => (din[v - 1] = pos + 1)) // degree of each input variable
  const W1 = deg.map((m) => din.map((d) => (!masked || m >= d ? 1 : 0))) // hidden k <- input i
  const W2 = din.map((d) => deg.map((m) => (!masked || d > m ? 1 : 0))) // output o <- hidden k
  const dep = din.map((_, o) => din.map((_, i) => (W2[o].some((w, k) => w && W1[k][i]) ? 1 : 0)))
  const leaks = dep.some((row, o) => row.some((v, i) => v && din[i] >= din[o]))
  const H = 300, Wd = 520
  const yin = (i: number) => 60 + i * 90, yh = (k: number) => 40 + k * 62
  return (
    <div className="viz">
      <div>
        <svg className="svgbox" viewBox={`0 0 ${Wd} ${H}`}>
          {W1.map((row, k) => row.map((v, i) => v ? <line key={`a${k}${i}`} x1={80} y1={yin(i)} x2={260} y2={yh(k)} stroke="#7c9cff88" /> : null))}
          {W2.map((row, o) => row.map((v, k) => v ? <line key={`b${o}${k}`} x1={260} y1={yh(k)} x2={440} y2={yin(o)} stroke="#4de1c188" /> : null))}
          {din.map((_, i) => <g key={'i' + i}><circle cx={80} cy={yin(i)} r={17} fill="#182131" stroke="#7c9cff" /><text x={80} y={yin(i) + 4} textAnchor="middle" fill="#e6edf6" fontSize="12">x{i + 1}</text><text x={36} y={yin(i) + 4} textAnchor="middle" fill="#ffc857" fontSize="11">m={din[i]}</text></g>)}
          {deg.map((m, k) => <g key={'h' + k} style={{ cursor: 'pointer' }} onClick={() => setDeg(deg.map((v, j) => (j === k ? (v === 1 ? 2 : 1) : v)))}><circle cx={260} cy={yh(k)} r={17} fill="#26364f" stroke="#ffc857" /><text x={260} y={yh(k) + 4} textAnchor="middle" fill="#ffc857" fontSize="12">m={m}</text></g>)}
          {din.map((_, o) => <g key={'o' + o}><circle cx={440} cy={yin(o)} r={17} fill="#182131" stroke="#4de1c1" /><text x={440} y={yin(o) + 4} textAnchor="middle" fill="#e6edf6" fontSize="11">x̂{o + 1}</text></g>)}
          <text x={14} y={H - 8} fill="#8fa0b8" fontSize="11">Click a hidden unit to change its number m (1 ≤ m ≤ n−1). m = rank of the input in the chosen ordering.</text>
        </svg>
      </div>
      <div className="ctrls">
        <div className="ctrl"><label><span>Ordering of variables</span></label>
          <select className="fillsel" value={pi} onChange={(e) => setPi(+e.target.value)}>
            {PERMS.map((p, i) => <option key={i} value={i}>x{p[0]}, x{p[1]}, x{p[2]}</option>)}
          </select></div>
        <Seg value={masked ? 'm' : 'f'} onChange={(v) => setMasked(v === 'm')} options={[{ v: 'm', label: 'MADE masks' }, { v: 'f', label: 'fully connected (plain autoencoder)' }]} />
        <table className="grid">
          <thead><tr><th>output depends on →</th><th>x₁</th><th>x₂</th><th>x₃</th></tr></thead>
          <tbody>{dep.map((row, o) => <tr key={o}><th>x̂{o + 1}</th>{row.map((v, i) => <td key={i} style={{ background: v ? (din[i] < din[o] ? '#12332a' : '#381722') : undefined }}>{v ? (din[i] < din[o] ? '✓ allowed' : '✗ LEAK') : '·'}</td>)}</tr>)}</tbody>
        </table>
        <div className="readout">{leaks ? <b style={{ color: '#ff6b81' }}>Not a valid autoregressive model: some output sees itself or a later variable.</b> : <b style={{ color: '#3ddc97' }}>Valid DAG: each x̂ᵢ depends only on variables earlier in the ordering.</b>}</div>
      </div>
    </div>
  )
}

/* ---------- L5: attention ---------- */
const TOK = ['My', 'friend', 'opened', 'the', 'door']
const KEYANG = [20, 75, 130, 200, 260]
export function AttentionDemo() {
  const [tab, setTab] = useState<'one' | 'self'>('one')
  const [ang, setAng] = useState(120)
  const [causal, setCausal] = useState(true)
  const unit = (a: number) => [Math.cos((a * Math.PI) / 180), Math.sin((a * Math.PI) / 180)]
  const keys = KEYANG.map(unit)
  const q = unit(ang)
  const scores = keys.map((k) => 2 * (q[0] * k[0] + q[1] * k[1]))
  const ex = scores.map(Math.exp), Z = ex.reduce((s, v) => s + v, 0)
  const attn = ex.map((v) => v / Z)
  const mat = keys.map((qi, i) => {
    const sc = keys.map((kj, j) => (causal && j > i ? -Infinity : 2 * (qi[0] * kj[0] + qi[1] * kj[1])))
    const e = sc.map((s) => Math.exp(s)), z = e.reduce((s, v) => s + v, 0)
    return e.map((v) => v / z)
  })
  return (
    <div>
      <Seg value={tab} onChange={setTab} options={[{ v: 'one', label: 'One query over the history' }, { v: 'self', label: 'Self-attention matrix' }]} />
      {tab === 'one' ? (
        <div className="viz" style={{ marginTop: 12 }}>
          <svg className="svgbox" viewBox="0 0 520 250">
            {TOK.map((t, i) => (
              <g key={i}>
                <rect x={30 + i * 96} y={190 - attn[i] * 160} width={70} height={attn[i] * 160 + 2} rx={6} fill="#4de1c1" />
                <text x={65 + i * 96} y={184 - attn[i] * 160} textAnchor="middle" fill="#e6edf6" fontSize="13">{attn[i].toFixed(2)}</text>
                <text x={65 + i * 96} y={214} textAnchor="middle" fill="#e6edf6" fontSize="13">{t}</text>
                <text x={65 + i * 96} y={232} textAnchor="middle" fill="#8fa0b8" fontSize="11">key {KEYANG[i]}°</text>
              </g>
            ))}
            <text x={14} y={16} fill="#8fa0b8" fontSize="12">attention weights = softmax(query · keys) over the history “My friend opened the …”</text>
          </svg>
          <div className="ctrls">
            <Slider label="query direction (current hidden state)" value={ang} min={0} max={360} step={5} onChange={setAng} fmt={(v) => v + '°'} />
            <div className="readout">1) compare query with each key (dot product)<br />2) softmax → attention distribution<br />3) weighted sum of the values = summary of the history<br />Aim the query at the key of “friend” (75°).</div>
          </div>
        </div>
      ) : (
        <div className="viz" style={{ marginTop: 12 }}>
          <table className="grid">
            <thead><tr><th>query ↓ / key →</th>{TOK.map((t) => <th key={t}>{t}</th>)}</tr></thead>
            <tbody>{mat.map((row, i) => <tr key={i}><th>{TOK[i]}</th>{row.map((v, j) => <td key={j} style={{ background: `rgba(77,225,193,${v * 0.85})`, color: v > 0.5 ? '#0b1220' : undefined }}>{v === 0 ? '—' : v.toFixed(2)}</td>)}</tr>)}</tbody>
          </table>
          <div className="ctrls">
            <Seg value={causal ? 'c' : 'f'} onChange={(v) => setCausal(v === 'c')} options={[{ v: 'c', label: 'masked (autoregressive)' }, { v: 'f', label: 'unmasked' }]} />
            <div className="readout">Masked: token i may only attend to tokens ≤ i, so the model stays a valid left-to-right autoregressive factorisation and all positions can still be computed in parallel.</div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ---------- L6: masked & dilated convolutions ---------- */
export function ConvReceptive() {
  const [tab, setTab] = useState<'wave' | 'pix'>('wave')
  const [L, setL] = useState(4)
  const [dil, setDil] = useState(true)
  const N = 32
  const rf = dil ? 2 ** L : L + 1
  // dependent inputs of the last output position
  const dependents = new Set<number>()
  const top = N - 1
  let frontier = new Set([top])
  for (let l = L - 1; l >= 0; l--) {
    const d = dil ? 2 ** l : 1
    const nxt = new Set<number>()
    frontier.forEach((p) => { nxt.add(p); if (p - d >= 0) nxt.add(p - d) })
    frontier = nxt
  }
  frontier.forEach((p) => dependents.add(p))
  return (
    <div>
      <Seg value={tab} onChange={setTab} options={[{ v: 'wave', label: 'WaveNet: dilated 1-D' }, { v: 'pix', label: 'PixelCNN: masked 2-D' }]} />
      {tab === 'wave' ? (
        <div className="viz" style={{ marginTop: 12 }}>
          <div>
            <svg className="svgbox" viewBox="0 0 520 120">
              {Array.from({ length: N }, (_, i) => <rect key={i} x={10 + i * 15.5} y={50} width={13} height={30} rx={3} fill={dependents.has(i) ? '#ffc857' : '#26364f'} />)}
              <rect x={10 + top * 15.5} y={10} width={13} height={24} rx={3} fill="#4de1c1" />
              <text x={10} y={108} fill="#8fa0b8" fontSize="12">yellow = inputs that can influence the green output (past only: causal)</text>
            </svg>
          </div>
          <div className="ctrls">
            <Slider label="layers" value={L} min={1} max={5} step={1} onChange={setL} />
            <Seg value={dil ? 'd' : 'n'} onChange={(v) => setDil(v === 'd')} options={[{ v: 'd', label: 'dilation 1,2,4,…' }, { v: 'n', label: 'no dilation' }]} />
            <div className="readout">receptive field (kernel size 2): <b>{rf}</b> samples<br />dilated: 2ᴸ grows exponentially; plain: L + 1 grows linearly <span className="muted">(extra: closed forms for kernel 2)</span></div>
          </div>
        </div>
      ) : (
        <div className="viz" style={{ marginTop: 12 }}>
          <svg className="svgbox" viewBox="0 0 520 260">
            {Array.from({ length: 25 }, (_, k) => {
              const r = Math.floor(k / 5), c = k % 5
              const before = r < 2 || (r === 2 && c < 2)
              const cur = r === 2 && c === 2
              return <rect key={k} x={110 + c * 56} y={10 + r * 48} width={50} height={42} rx={6} fill={cur ? '#4de1c1' : before ? '#ffc857' : '#26364f'} />
            })}
            <text x={20} y={252} fill="#8fa0b8" fontSize="12">yellow = pixels the conv may read (raster-scan past); green = pixel being predicted</text>
          </svg>
          <div className="ctrls"><div className="readout">Masked convolution zeroes every weight on or after the centre in raster-scan order. The model stays autoregressive but, unlike PixelRNN, all positions are computed in parallel during training.</div></div>
        </div>
      )}
    </div>
  )
}

/* ---------- L7: KL & Monte Carlo ---------- */
export function KLMC() {
  const [mu, setMu] = useState(1)
  const [sg, setSg] = useState(1.5)
  const [T, setT] = useState(20)
  const [seed, setSeed] = useState(1)
  const klpq = Math.log(sg / 1) + (1 + (0 - mu) ** 2) / (2 * sg * sg) - 0.5 // KL(p||q), p=N(0,1)
  const klqp = Math.log(1 / sg) + (sg * sg + mu * mu) / 2 - 0.5 // KL(q||p)
  const est = useMemo(() => {
    const r = rng(seed * 31 + 7)
    let s = 0
    for (let i = 0; i < T; i++) {
      const x = gauss(r)
      s += Math.log(npdf(x, 0, 1) / npdf(x, mu, sg))
    }
    return s / T
  }, [seed, T, mu, sg])
  const xs = Array.from({ length: 241 }, (_, i) => -5 + (i * 10) / 240)
  const W = 520, H = 210
  const X = (x: number) => 20 + ((x + 5) / 10) * (W - 40), Y = (y: number) => H - 20 - y * 330
  return (
    <div className="viz">
      <svg className="svgbox" viewBox={`0 0 ${W} ${H}`}>
        <path d={path(xs.map((x) => [X(x), Y(npdf(x, 0, 1))]))} fill="none" stroke="#3ddc97" strokeWidth={2.5} />
        <path d={path(xs.map((x) => [X(x), Y(npdf(x, mu, sg))]))} fill="none" stroke="#ff6b81" strokeWidth={2.5} />
        <text x={20} y={16} fill="#3ddc97" fontSize="12">p = N(0,1)</text><text x={110} y={16} fill="#ff6b81" fontSize="12">q = N(μ, σ²)</text>
      </svg>
      <div className="ctrls">
        <Slider label={<M t="\mu_q" />} value={mu} min={-3} max={3} step={0.1} onChange={setMu} />
        <Slider label={<M t="\sigma_q" />} value={sg} min={0.3} max={3} step={0.05} onChange={setSg} />
        <Slider label="Monte Carlo samples T" value={T} min={1} max={500} step={1} onChange={setT} />
        <button className="btn" onClick={() => setSeed(seed + 1)}>Draw new samples</button>
        <div className="readout">
          D(p‖q) exact = <b>{f2(klpq, 3)}</b><br />
          D(q‖p) exact = <b>{f2(klqp, 3)}</b> (not equal: KL is asymmetric)<br />
          MC estimate of D(p‖q) with T={T}: <b>{f2(est, 3)}</b><br />
          <span className="muted">ĝ is itself random: redraw and watch it move; larger T shrinks the wobble.</span>
        </div>
      </div>
    </div>
  )
}

/* ---------- L8: MLE training of a tiny autoregressive model ---------- */
const DATA = [[1,1,1],[1,1,1],[1,1,0],[1,0,0],[1,1,1],[0,0,0],[0,0,0],[0,0,1],[0,1,1],[0,0,0],[1,1,1],[0,0,0]]
const ctxIdx = (i: number, x: number[]) => (i === 0 ? 0 : i === 1 ? 1 + x[0] : 3 + x[0] * 2 + x[1])
const NCTX = 7
export function ARTrain() {
  const [th, setTh] = useState<number[]>(Array(NCTX).fill(0))
  const [lr, setLr] = useState(0.5)
  const [hist, setHist] = useState<number[]>([])
  const ll = (t: number[]) => DATA.reduce((s, x) => s + [0, 1, 2].reduce((a, i) => { const p = sig(t[ctxIdx(i, x)]); return a + Math.log(x[i] ? p : 1 - p) }, 0), 0)
  const step = (t: number[], k: number) => {
    let cur = t, h = hist.slice()
    for (let s = 0; s < k; s++) {
      const g = Array(NCTX).fill(0)
      for (const x of DATA) for (let i = 0; i < 3; i++) { const c = ctxIdx(i, x); g[c] += x[i] - sig(cur[c]) }
      cur = cur.map((v, i) => v + (lr * g[i]) / DATA.length)
      h.push(ll(cur) / DATA.length)
    }
    setTh(cur); setHist(h)
  }
  const emp = (c: number) => {
    let n = 0, k = 0
    for (const x of DATA) for (let i = 0; i < 3; i++) if (ctxIdx(i, x) === c) { n++; k += x[i] }
    return n ? k / n : 0.5
  }
  const ctxName = ['x₁', 'x₂ | x₁=0', 'x₂ | x₁=1', 'x₃ | 00', 'x₃ | 01', 'x₃ | 10', 'x₃ | 11']
  const W = 520, H = 140
  const hh = hist.length ? hist : [ll(th) / DATA.length]
  const lo = Math.min(...hh), hi = Math.max(...hh, lo + 0.01)
  return (
    <div className="viz">
      <div>
        <table className="grid">
          <thead><tr><th>conditional</th><th>learned p(=1)</th><th>data freq.</th></tr></thead>
          <tbody>{ctxName.map((n, c) => <tr key={c}><th>{n}</th><td>{f2(sig(th[c]), 3)}</td><td>{f2(emp(c), 3)}</td></tr>)}</tbody>
        </table>
        <svg className="svgbox" style={{ marginTop: 10 }} viewBox={`0 0 ${W} ${H}`}>
          <path d={path(hh.map((v, i) => [20 + (i / Math.max(hh.length - 1, 1)) * (W - 40), 10 + (1 - (v - lo) / (hi - lo)) * (H - 30)]))} fill="none" stroke="#7c9cff" strokeWidth={2.5} />
          <text x={20} y={H - 4} fill="#8fa0b8" fontSize="12">average log-likelihood per image over gradient steps (θ ← θ + α∇ℓ)</text>
        </svg>
      </div>
      <div className="ctrls">
        <Slider label="learning rate α" value={lr} min={0.05} max={3} step={0.05} onChange={setLr} />
        <div className="btnrow">
          <button className="btn" onClick={() => step(th, 1)}>1 step</button>
          <button className="btn primary" onClick={() => step(th, 25)}>25 steps</button>
          <button className="btn ghost" onClick={() => { setTh(Array(NCTX).fill(0)); setHist([]) }}>Reset</button>
        </div>
        <div className="readout">data: 12 binary images of 3 pixels<br />ℓ(θ) = Σ over images j and pixels i of log p(x_i | earlier pixels; θ_i)<br />average log-lik now: <b>{f2(ll(th) / DATA.length, 3)}</b><br />Tabular conditionals have a closed form; neural ones need gradient steps. Here, with no hidden layer, the two meet.</div>
      </div>
    </div>
  )
}
