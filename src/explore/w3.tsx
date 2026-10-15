import { useMemo, useState } from 'react'
import { Seg, Slider, f2, gauss, npdf, path, rng } from './ui'
import { M } from '../components/Rich'

const COLS = ['#4de1c1', '#ff6b81', '#ffc857', '#7c9cff']

/* ---------- L1: latent-variable mixture ---------- */
const MIXW = [0.4, 0.35, 0.25]
const MIXM: [number, number][] = [[-2.2, 1.3], [2.1, 1.6], [0.2, -2.3]]
export function LVMMix() {
  const [sg, setSg] = useState(0.9)
  const [n, setN] = useState(60)
  const [q, setQ] = useState<[number, number]>([1.2, 0.6])
  const pts = useMemo(() => {
    const r = rng(17)
    return Array.from({ length: 300 }, () => {
      const u = r()
      const k = u < MIXW[0] ? 0 : u < MIXW[0] + MIXW[1] ? 1 : 2
      return { k, x: MIXM[k][0] + sg * gauss(r), y: MIXM[k][1] + sg * gauss(r) }
    })
  }, [sg])
  const W = 440, H = 320, X = (x: number) => W / 2 + x * 38, Y = (y: number) => H / 2 - y * 38
  const lik = MIXM.map((m, k) => MIXW[k] * Math.exp(-((q[0] - m[0]) ** 2 + (q[1] - m[1]) ** 2) / (2 * sg * sg)) / (2 * Math.PI * sg * sg))
  const Z = lik.reduce((a, b) => a + b, 0)
  const post = lik.map((v) => v / Z)
  return (
    <div className="viz">
      <svg className="svgbox" viewBox={`0 0 ${W} ${H}`} onClick={(e) => {
        const r = (e.currentTarget as SVGSVGElement).getBoundingClientRect()
        const px = ((e.clientX - r.left) / r.width) * W, py = ((e.clientY - r.top) / r.height) * H
        setQ([(px - W / 2) / 38, (H / 2 - py) / 38])
      }}>
        {pts.slice(0, n).map((p, i) => <circle key={i} cx={X(p.x)} cy={Y(p.y)} r={3} fill={COLS[p.k]} opacity={0.75} />)}
        <circle cx={X(q[0])} cy={Y(q[1])} r={8} fill="none" stroke="#fff" strokeWidth={2} />
        <text x={10} y={16} fill="#8fa0b8" fontSize="12">click anywhere to ask “which component made this point?”</text>
      </svg>
      <div className="ctrls">
        <Slider label="component spread σ" value={sg} min={0.4} max={1.8} step={0.05} onChange={setSg} />
        <Slider label="points generated" value={n} min={10} max={300} step={10} onChange={setN} />
        <div className="readout">
          Generative process: 1) pick z (the component) by sampling a Categorical, 2) sample x from that Gaussian.<br />
          <b>posterior p(z | x) at the white ring:</b><br />
          {post.map((p, k) => <span key={k} style={{ color: COLS[k] }}>z={k + 1}: {f2(p, 3)}&nbsp;&nbsp;</span>)}
        </div>
      </div>
    </div>
  )
}

/* ---------- L2: PCA / autoencoder ---------- */
export function PCADemo() {
  const [ang, setAng] = useState(100)
  const pts = useMemo(() => {
    const r = rng(8)
    const th = (35 * Math.PI) / 180
    return Array.from({ length: 80 }, () => {
      const a = 2.2 * gauss(r), b = 0.6 * gauss(r)
      return [a * Math.cos(th) - b * Math.sin(th), a * Math.sin(th) + b * Math.cos(th)] as [number, number]
    })
  }, [])
  const u = [Math.cos((ang * Math.PI) / 180), Math.sin((ang * Math.PI) / 180)]
  const proj = pts.map(([x, y]) => x * u[0] + y * u[1])
  const mv = proj.reduce((s, v) => s + v * v, 0) / pts.length
  const tot = pts.reduce((s, [x, y]) => s + x * x + y * y, 0) / pts.length
  const rec = tot - mv
  // PC1 angle
  let sxx = 0, sxy = 0, syy = 0
  pts.forEach(([x, y]) => { sxx += x * x; sxy += x * y; syy += y * y })
  const pc1 = ((0.5 * Math.atan2(2 * sxy, sxx - syy)) * 180) / Math.PI
  const W = 440, H = 320, X = (x: number) => W / 2 + x * 38, Y = (y: number) => H / 2 - y * 38
  return (
    <div className="viz">
      <svg className="svgbox" viewBox={`0 0 ${W} ${H}`}>
        <line x1={X(-6 * u[0])} y1={Y(-6 * u[1])} x2={X(6 * u[0])} y2={Y(6 * u[1])} stroke="#ffc857" strokeWidth={2} />
        {pts.map(([x, y], i) => <g key={i}><line x1={X(x)} y1={Y(y)} x2={X(proj[i] * u[0])} y2={Y(proj[i] * u[1])} stroke="#ff6b8166" /><circle cx={X(x)} cy={Y(y)} r={3} fill="#7c9cff" /><circle cx={X(proj[i] * u[0])} cy={Y(proj[i] * u[1])} r={2.4} fill="#ffc857" /></g>)}
        <text x={10} y={16} fill="#8fa0b8" fontSize="12">yellow axis = code direction · red = reconstruction error</text>
      </svg>
      <div className="ctrls">
        <Slider label="direction of the 1-D code" value={ang} min={0} max={180} step={1} onChange={setAng} fmt={(v) => v + '°'} />
        <button className="btn" onClick={() => setAng(((Math.round(pc1) % 180) + 180) % 180)}>Snap to PC1 ({f2(((pc1 % 180) + 180) % 180, 0)}°)</button>
        <div className="readout">variance kept along the axis: <b>{f2(mv)}</b><br />reconstruction error (mean ‖x−x′‖²): <b>{f2(rec)}</b><br />total variance: {f2(tot)} = kept + lost<br />A linear AE with a 1-D bottleneck trained with MSE finds this same subspace (slide 16 note).</div>
      </div>
    </div>
  )
}

/* ---------- L3: why VAE latent spaces can be sampled ---------- */
const CL: [number, number][] = [[3.4, 1.2], [-1.2, 4.2], [3.8, -3.6], [-3.4, -2.6]]
export function LatentSample() {
  const [beta, setBeta] = useState(0)
  const [mode, setMode] = useState<'prior' | 'enc'>('prior')
  const scale = 1 / (1 + 1.6 * beta), sd = 0.4 + 0.55 * (beta / (beta + 0.6))
  const prior = useMemo(() => { const r = rng(2); return Array.from({ length: 250 }, () => [gauss(r), gauss(r)] as [number, number]) }, [])
  const near = (p: [number, number]) => CL.some((c) => Math.hypot(p[0] - c[0] * scale, p[1] - c[1] * scale) < 1.6 * sd)
  const frac = prior.filter(near).length / prior.length
  const W = 440, H = 340, X = (x: number) => W / 2 + x * 34, Y = (y: number) => H / 2 - y * 34
  const enc = useMemo(() => { const r = rng(5); return CL.flatMap((c, k) => Array.from({ length: 40 }, () => ({ k, x: c[0] * scale + sd * gauss(r), y: c[1] * scale + sd * gauss(r) }))) }, [scale, sd])
  return (
    <div className="viz">
      <div>
        <Seg value={mode} onChange={setMode} options={[{ v: 'prior', label: 'sample z ~ N(0, I) and decode' }, { v: 'enc', label: 'show encoded training digits' }]} />
        <svg className="svgbox" style={{ marginTop: 10 }} viewBox={`0 0 ${W} ${H}`}>
          <circle cx={X(0)} cy={Y(0)} r={34 * 2} fill="none" stroke="#2a3a54" strokeDasharray="4" />
          {CL.map((c, k) => <circle key={k} cx={X(c[0] * scale)} cy={Y(c[1] * scale)} r={1.6 * sd * 34} fill={COLS[k] + '22'} stroke={COLS[k]} />)}
          {mode === 'enc' ? enc.map((p, i) => <circle key={i} cx={X(p.x)} cy={Y(p.y)} r={2.6} fill={COLS[p.k]} />) : prior.map((p, i) => <circle key={i} cx={X(p[0])} cy={Y(p[1])} r={3} fill={near(p) ? '#3ddc97' : '#ff6b81'} opacity={0.85} />)}
          <text x={8} y={14} fill="#8fa0b8" fontSize="11">dashed = prior 2σ · discs = decodable regions</text>
        </svg>
      </div>
      <div className="ctrls">
        <Slider label="KL-term strength (0 = plain autoencoder)" value={beta} min={0} max={5} step={0.1} onChange={setBeta} />
        <div className="readout">Fraction of prior samples that land where the decoder knows what to draw (green): <b>{f2(frac * 100, 0)}%</b><br /><span className="muted">Cartoon of slides 22–24: at 0 the codes sit off-centre in odd clumps with gaps; the KL term centres and fattens them so the prior’s samples hit real digits.</span></div>
      </div>
    </div>
  )
}

/* ---------- L4: reparameterisation ---------- */
export function Reparam() {
  const [mu, setMu] = useState(0.5)
  const [lv, setLv] = useState(0)
  const [K, setK] = useState(50)
  const [seed, setSeed] = useState(1)
  const sg = Math.exp(lv / 2)
  const eps = useMemo(() => { const r = rng(seed * 13 + 1); return Array.from({ length: 400 }, () => gauss(r)) }, [seed])
  const e = eps.slice(0, K)
  const z = e.map((x) => mu + sg * x)
  const gm = z.reduce((s, v) => s + 2 * (v - 2), 0) / K
  const gs = z.reduce((s, v, i) => s + 2 * (v - 2) * e[i], 0) / K
  const bins = Array.from({ length: 30 }, (_, i) => -6 + i * 0.4)
  const hist = (arr: number[]) => bins.map((b) => arr.filter((v) => v >= b && v < b + 0.4).length / arr.length)
  const he = hist(e), hz = hist(z)
  const W = 520, H = 200, X = (i: number) => 20 + (i / 30) * (W - 40)
  return (
    <div className="viz">
      <svg className="svgbox" viewBox={`0 0 ${W} ${H}`}>
        {he.map((v, i) => <rect key={'e' + i} x={X(i)} y={H - 20 - v * 380} width={(W - 40) / 30 - 2} height={v * 380} fill="#8fa0b866" />)}
        {hz.map((v, i) => <rect key={'z' + i} x={X(i) + 2} y={H - 20 - v * 380} width={(W - 40) / 30 - 6} height={v * 380} fill="#4de1c1aa" />)}
        <text x={20} y={14} fill="#8fa0b8" fontSize="12">grey: ε ~ N(0,1) · green: z = μ + σε  (x axis −6…6)</text>
      </svg>
      <div className="ctrls">
        <Slider label={<M t="\mu" />} value={mu} min={-3} max={3} step={0.1} onChange={setMu} />
        <Slider label={<M t="\log\sigma^2" />} value={lv} min={-4} max={2} step={0.1} onChange={setLv} />
        <Slider label="samples K" value={K} min={1} max={400} step={1} onChange={setK} />
        <button className="btn" onClick={() => setSeed(seed + 1)}>Resample ε</button>
        <div className="readout">σ = e^(log σ² / 2) = <b>{f2(sg)}</b> (always &gt; 0, whatever sign log σ² has)<br />Toy objective r(z) = (z − 2)², so E[r] = (μ−2)² + σ².<br />∇μ via reparam: <b>{f2(gm)}</b> (true {f2(2 * (mu - 2))})<br />∇σ via reparam: <b>{f2(gs)}</b> (true {f2(2 * sg)})</div>
      </div>
    </div>
  )
}

/* ---------- L5: ELBO ---------- */
const PRIORZ = [0.4, 0.3, 0.2, 0.1], LIKX = [0.02, 0.5, 0.25, 0.05]
const JOINT = PRIORZ.map((p, i) => p * LIKX[i])
const PX = JOINT.reduce((a, b) => a + b, 0)
const POST = JOINT.map((j) => j / PX)
export function ELBODemo() {
  const [w, setW] = useState([1, 1, 1, 1])
  const T = w.reduce((a, b) => a + b, 0) || 1
  const q = w.map((v) => Math.max(v / T, 1e-9))
  const elbo = q.reduce((s, qi, i) => s + qi * (Math.log(JOINT[i]) - Math.log(qi)), 0)
  const rec = q.reduce((s, qi, i) => s + qi * Math.log(LIKX[i]), 0)
  const klp = q.reduce((s, qi, i) => s + qi * Math.log(qi / PRIORZ[i]), 0)
  const gap = q.reduce((s, qi, i) => s + qi * Math.log(qi / POST[i]), 0)
  const set = (v: number[]) => setW(v)
  return (
    <div className="viz">
      <div className="ctrls">
        {w.map((v, i) => <Slider key={i} label={`q(z=${i}) (unnormalised)`} value={v} min={0} max={10} step={0.1} onChange={(nv) => setW(w.map((o, k) => (k === i ? nv : o)))} />)}
        <div className="btnrow">
          <button className="btn" onClick={() => set(PRIORZ.map((p) => p * 10))}>q = prior p(z)</button>
          <button className="btn primary" onClick={() => set(POST.map((p) => p * 10))}>q = true posterior</button>
          <button className="btn" onClick={() => set([0, 10, 0, 0])}>q on z=1 only</button>
        </div>
        <div className="readout">Model: prior p(z) = (0.4, 0.3, 0.2, 0.1); likelihood of the observed x under each z: (0.02, 0.5, 0.25, 0.05).<br />true posterior p(z|x) = ({POST.map((p) => f2(p, 2)).join(', ')})</div>
      </div>
      <div className="readout" style={{ fontSize: 15 }}>
        <b>log p(x) = {f2(Math.log(PX), 4)}</b> (fixed by the model)<br /><br />
        ELBO = E<sub>q</sub>[log p(z,x) − log q(z)] = <b style={{ color: '#4de1c1' }}>{f2(elbo, 4)}</b><br />
        = E<sub>q</sub>[log p(x|z)] − D<sub>KL</sub>(q‖p(z)) = {f2(rec, 4)} − {f2(klp, 4)} = <b style={{ color: '#4de1c1' }}>{f2(rec - klp, 4)}</b><br /><br />
        gap: log p(x) − ELBO = <b style={{ color: '#ffc857' }}>{f2(Math.log(PX) - elbo, 4)}</b> = D<sub>KL</sub>(q‖p(z|x)) = {f2(gap, 4)}<br /><br />
        {gap < 1e-3 ? '✅ bound is tight: q equals the true posterior' : 'ELBO ≤ log p(x), and the slack is exactly the KL to the posterior'}
      </div>
    </div>
  )
}

/* ---------- L6: VAE forward pass ---------- */
export function VAEStep() {
  const [x, setX] = useState(1.2)
  const [a, setA] = useState(0.8)
  const [b, setB] = useState(-1)
  const [eps, setEps] = useState(0.5)
  const [c, setC] = useState(1.1)
  const [alpha, setAlpha] = useState(1)
  const [step, setStep] = useState(4)
  const mu = a * x, lv = b, sg = Math.exp(lv / 2), z = mu + sg * eps, xh = c * z
  const L1 = (x - xh) ** 2, L2 = -0.5 * (1 + lv - mu * mu - sg * sg), L = alpha * L1 + L2
  const box = (n: number, title: string, body: string) => <div className="readout" style={{ opacity: step >= n ? 1 : 0.25, borderColor: step === n ? '#7c9cff' : undefined }}><b>{n}. {title}</b><br />{body}</div>
  return (
    <div className="viz">
      <div className="ctrls">
        <Seg value={String(step) as '1' | '2' | '3' | '4'} onChange={(v) => setStep(+v)} options={[{ v: '1', label: 'step 1' }, { v: '2', label: 'step 2' }, { v: '3', label: 'step 3' }, { v: '4', label: 'step 4' }]} />
        {box(1, 'Encode x → (μ, log σ²)', `μ = a·x = ${f2(mu)},   log σ² = ${f2(lv)}  (σ = ${f2(sg)})`)}
        {box(2, 'Reparameterise', `z = μ + σ·ε = ${f2(mu)} + ${f2(sg)}·${f2(eps)} = ${f2(z)}`)}
        {box(3, 'Decode z → x̂', `x̂ = c·z = ${f2(xh)}`)}
        {box(4, 'ELBO terms (as a loss)', `L₁ = (x − x̂)² = ${f2(L1)};  L₂ = −½(1 + log σ² − μ² − σ²) = ${f2(L2)};  L = αL₁ + L₂ = ${f2(L)}`)}
      </div>
      <div className="ctrls">
        <Slider label="input x" value={x} min={-2} max={2} step={0.1} onChange={setX} />
        <Slider label="encoder weight a (μ = a·x)" value={a} min={0} max={2} step={0.1} onChange={setA} />
        <Slider label="encoder log σ²" value={b} min={-4} max={1} step={0.1} onChange={setB} />
        <Slider label="noise ε" value={eps} min={-2} max={2} step={0.1} onChange={setEps} />
        <Slider label="decoder weight c" value={c} min={-2} max={2} step={0.1} onChange={setC} />
        <Slider label={<M t="\alpha" />} value={alpha} min={0.1} max={5} step={0.1} onChange={setAlpha} />
        <div className="readout">Toy 1-D VAE (not from the slides, same four steps). Push log σ² toward 0 and μ toward 0 to shrink L₂ to 0; make c·a ≈ 1 to shrink L₁. They pull against each other.</div>
      </div>
    </div>
  )
}

/* ---------- L7: marginal likelihood is hard ---------- */
export function MargDemo() {
  const [tab, setTab] = useState<'cnt' | 'mc'>('cnt')
  const [k, setK] = useState(30)
  const [sx, setSx] = useState(0.15)
  const [T, setT] = useState(30)
  const [qoff, setQoff] = useState(0)
  const x = 2
  const truth = npdf(x, 0, Math.sqrt(1 + sx * sx))
  const pm = x / (1 + sx * sx), ps = Math.sqrt((sx * sx) / (1 + sx * sx))
  const runs = useMemo(() => {
    const out = { naive: [] as number[], is: [] as number[] }
    for (let rep = 0; rep < 25; rep++) {
      const r = rng(rep * 977 + 3)
      let a = 0, b = 0
      for (let t = 0; t < T; t++) {
        const z0 = gauss(r)
        a += npdf(x, z0, sx)
        const z1 = pm + qoff + ps * gauss(r)
        b += (npdf(x, z1, sx) * npdf(z1, 0, 1)) / npdf(z1, pm + qoff, ps)
      }
      out.naive.push(a / T); out.is.push(b / T)
    }
    return out
  }, [sx, T, qoff, pm, ps])
  const st = (v: number[]) => [Math.min(...v), v.reduce((s, y) => s + y, 0) / v.length, Math.max(...v)]
  const sn = st(runs.naive), si = st(runs.is)
  return (
    <div>
      <Seg value={tab} onChange={setTab} options={[{ v: 'cnt', label: 'How many terms in Σ_z p(x,z)?' }, { v: 'mc', label: 'Why naive Monte Carlo fails' }]} />
      {tab === 'cnt' ? (
        <div className="viz" style={{ marginTop: 12 }}>
          <div className="ctrls">
            <Slider label="binary latent features" value={k} min={1} max={60} step={1} onChange={setK} />
            <div className="readout">Σ<sub>z∈{'{0,1}'}^{k}</sub> p(x,z) has <b>2^{k} = {(2 ** k).toLocaleString()}</b> terms.<br />At a billion terms per second: <b>{f2((2 ** k) / 1e9, 2)} seconds</b> per data point per gradient step.</div>
          </div>
          <div className="readout">Slide 46: with 30 binary latent features there are 2³⁰ ≈ 10⁹ terms, and the sum must be recomputed for every training point. For continuous latents the integral has no closed form at all.</div>
        </div>
      ) : (
        <div className="viz" style={{ marginTop: 12 }}>
          <div className="ctrls">
            <Slider label="likelihood width σₓ (small = few z explain x)" value={sx} min={0.05} max={1} step={0.05} onChange={setSx} />
            <Slider label="samples T" value={T} min={5} max={300} step={5} onChange={setT} />
            <Slider label="how wrong is q (offset from posterior mean)" value={qoff} min={-2} max={2} step={0.1} onChange={setQoff} />
            <div className="readout">true p(x=2) = <b>{truth.toExponential(3)}</b></div>
          </div>
          <div className="readout">
            25 repeated estimates, T={T} each:<br />
            <b style={{ color: '#ff6b81' }}>naive: z ~ p(z)</b> → min {sn[0].toExponential(2)} · mean {sn[1].toExponential(2)} · max {sn[2].toExponential(2)}<br />
            <b style={{ color: '#4de1c1' }}>q near posterior</b> → min {si[0].toExponential(2)} · mean {si[1].toExponential(2)} · max {si[2].toExponential(2)}<br />
            <span className="muted">Naive sampling rarely hits the few z that explain x, so its estimates swing wildly. Sampling z from q(z) (≈ posterior) fixes the variance; that’s the role of the encoder.</span>
          </div>
        </div>
      )}
    </div>
  )
}

/* ---------- L8: variational inference + amortisation ---------- */
const postd = (z: number) => 0.65 * npdf(z, 2.2, 1) + 0.35 * npdf(z, -1.4, 0.7)
export function VIDemo() {
  const [tab, setTab] = useState<'vi' | 'am'>('vi')
  const [m, setM] = useState(-4)
  const [s, setS] = useState(0.75)
  const [xn, setXn] = useState(1.5)
  const zs = Array.from({ length: 321 }, (_, i) => -8 + (i * 16) / 320)
  const dz = 16 / 320
  const kl = (mm: number, ss: number) => zs.reduce((a, z) => { const q = npdf(z, mm, ss); const p = postd(z); return q > 1e-12 ? a + q * Math.log(q / Math.max(p, 1e-300)) * dz : a }, 0)
  const cur = kl(m, s)
  const best = useMemo(() => { let b = [0, 1, 1e9]; for (let mm = -5; mm <= 5; mm += 0.1) for (let ss = 0.3; ss <= 3; ss += 0.05) { const v = kl(mm, ss); if (v < b[2]) b = [mm, ss, v] } return b }, [])
  const W = 520, H = 210, X = (z: number) => 20 + ((z + 8) / 16) * (W - 40), Y = (y: number) => H - 22 - y * 330
  const logpx = -3
  // amortised: true phi* ~ linear in x
  const xsd = [-2, -1, 0.5, 1, 2.5], phi = xsd.map((v) => 0.8 * v + 0.15 + 0.1 * Math.sin(v * 3))
  const n = xsd.length
  const mx = xsd.reduce((a, b) => a + b, 0) / n, my = phi.reduce((a, b) => a + b, 0) / n
  const sl = xsd.reduce((a, v, i) => a + (v - mx) * (phi[i] - my), 0) / xsd.reduce((a, v) => a + (v - mx) ** 2, 0), ic = my - sl * mx
  return (
    <div>
      <Seg value={tab} onChange={setTab} options={[{ v: 'vi', label: 'Pick q(z;φ) close to the posterior' }, { v: 'am', label: 'Amortised inference' }]} />
      {tab === 'vi' ? (
        <div className="viz" style={{ marginTop: 12 }}>
          <svg className="svgbox" viewBox={`0 0 ${W} ${H}`}>
            <path d={path(zs.map((z) => [X(z), Y(postd(z))]))} fill="none" stroke="#7c9cff" strokeWidth={3} />
            <path d={path(zs.map((z) => [X(z), Y(npdf(z, m, s))]))} fill="none" stroke="#ffc857" strokeWidth={3} />
            <text x={20} y={14} fill="#7c9cff" fontSize="12">blue: true posterior p(z|x;θ)</text><text x={220} y={14} fill="#ffc857" fontSize="12">orange: q(z;φ) = N(φ₁, φ₂²)</text>
          </svg>
          <div className="ctrls">
            <Slider label="φ₁ (mean)" value={m} min={-5} max={5} step={0.1} onChange={setM} />
            <Slider label="φ₂ (std)" value={s} min={0.3} max={3} step={0.05} onChange={setS} />
            <button className="btn" onClick={() => { setM(+best[0].toFixed(1)); setS(+best[1].toFixed(2)) }}>Optimise φ for me</button>
            <div className="readout">D<sub>KL</sub>(q‖p(z|x)) = <b>{f2(cur, 3)}</b><br />ELBO = log p(x) − KL = <b>{f2(logpx - cur, 3)}</b> (assuming log p(x) = {logpx})<br /><span className="muted">Smaller KL ⇒ ELBO closer to log p(x). Two different φ give two different lower bounds.</span></div>
          </div>
        </div>
      ) : (
        <div className="viz" style={{ marginTop: 12 }}>
          <svg className="svgbox" viewBox="0 0 520 260">
            <line x1={20} y1={230} x2={500} y2={230} stroke="#2a3a54" />
            {xsd.map((v, i) => <circle key={i} cx={60 + ((v + 3) / 7) * 420} cy={230 - ((phi[i] + 2) / 5) * 200} r={6} fill="#7c9cff" />)}
            <line x1={60} y1={230 - ((sl * -3 + ic + 2) / 5) * 200} x2={480} y2={230 - ((sl * 4 + ic + 2) / 5) * 200} stroke="#ffc857" strokeWidth={2} />
            <circle cx={60 + ((xn + 3) / 7) * 420} cy={230 - ((sl * xn + ic + 2) / 5) * 200} r={8} fill="none" stroke="#3ddc97" strokeWidth={2.5} />
            <text x={20} y={16} fill="#8fa0b8" fontSize="12">blue = best φ* found by a separate optimisation for each x (expensive) · line = f_λ(x) learned once</text>
          </svg>
          <div className="ctrls">
            <Slider label="a new data point x" value={xn} min={-3} max={4} step={0.1} onChange={setXn} />
            <div className="readout">Per-datapoint VI: one optimisation per x. With a million points that’s a million optimisations.<br />Amortised: f<sub>λ</sub> maps x → φ in one forward pass: φ(x_new) ≈ <b>{f2(sl * xn + ic)}</b> (“regression on x ↦ φ*”), and it also works for unseen x.</div>
          </div>
        </div>
      )}
    </div>
  )
}
