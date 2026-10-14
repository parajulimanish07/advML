# COMP8221 Advanced Machine Learning: Content Map (Phase 1, DRAFT)

**Status: 7 of 9 lecture packs read. Two are missing and Week 5 has no file (see "Gaps" below).**

**Citation convention.** `p.N` is the PDF page number. The printed slide counter on Weeks 1–3 is one lower (PDF p.12 shows "10 / 32"). On Weeks 6–9 the two match. File short names:
`W1`=`2026_S2_MQ_COMP8221_Week1.pdf`, `UG`=`..._Week1_unit_guide.pdf`, `W2`, `W3` likewise, `W6`=`GraphNN-w6.pdf`, `W7`=`COMP8221_Week 7.pdf`, `W8`=`COMP8221_Week 8.pdf`, `W9`=`COMP8221_week9.pdf`.

"Exam likelihood" lists are **my inference from slide emphasis**, not from any exam paper. The slides don't say what is examined. Content tagged *(extra)* is not on the slides.

---

## 0. Gaps and decisions needed

| # | Issue | What I found |
|---|---|---|
| 1 | **"Lecture 4"** (Drive file `Lecture 4-20261015.zip`, 7.6 MB) | The Drive connector cannot transfer files this large (the connection drops). **Not read.** Per the unit guide (UG p.4), weeks 1–4 are "Deep generative models (graphical models, VAE, diffusion models, etc.)", so it is probably diffusion/GANs/flows, but I won't guess. |
| 2 | **"Understanding DRL Algorithms"** (two copies, 7.4 MB each) | Same problem. **Not read.** This is presumably Week 10 (DQN/policy gradient/actor-critic details). The two Drive copies have the same byte size, so they are almost certainly identical, but I couldn't hash them. |
| 3 | **Week 5** | The folder has no Week 5 file. UG p.4 puts GNNs in weeks 5–8. Either Week 5 is the start of the GNN block, or it is missing from the folder. **Please check.** |
| 4 | **The "three GNN packs"** | They are **sequential weeks, not parts of one lecture**: `GraphNN-w6` = Week 6 (GCN, GraphSAGE, GAT), `Week 7` = framework, augmentation, training, `Week 8` = heterogeneous graphs and RGCN. Two copies of Week 7 were byte-identical (SHA-256 match) and I dropped one. |
| 5 | Weeks 11–12 DRL | No files. Probably only the two missing packs exist. |

Also noted: Week 1 zip contains the **Unit Guide**. Assessment is 2 assignments at 30% each and an exam at 40% (UG p.5). Lecturers are Q. Xu (weeks 1–6, 13) and Z. Qu (weeks 7–13) (UG p.3).

**Proposed world order (course order):** W1 Probability & Optimisation → W2 Autoregressive Models → W3 Latent Variable Models & VAE → *W4 (missing)* → *W5 (missing?)* → W6 GCN/GraphSAGE/GAT → W7 GNN Design & Training → W8 Heterogeneous Graphs → W9 Intro to Deep RL → *W10 Deep RL Algorithms (missing)*.

---

## World 1 — Week 1: Probability, Graphical Models, Optimisation
Source: W1 (36 pp.), UG. Prerequisites: none.

### Topics in order
1. **Random variables, sample space, observations.** $\Omega$, $x\sim p(x)$, $\mathcal D=\{x_1,\dots\}$. (W1 p.5)
2. **Probability distributions.** Discrete $0\le p(x)\le1$, continuous $p(x)\ge0$, and $\sum_x p(x)=1$ or $\int p(x)dx=1$. (p.6)
3. **Discrete joint and continuous pdf/cdf.** $P(x=x_i,y=y_j)=n_{ij}/\sum n_{ij}$; $P(a\le X\le b)=\int_a^b f(x)dx$; $F_X(x)=P(X\le x)$. (p.7–9)
4. **Sum rule, product rule, independence.** $p(x)=\sum_y p(x,y)$ (or $\int$); $p(x,y)=p(y|x)p(x)$; independent iff $p(x,y)=p(x)p(y)$. (p.10)
5. **i.i.d. assumption.** $p(x_1..x_N)=\prod_n p(x_n)$. (p.11)
6. **Bayes' theorem.** $p(x|y)=\dfrac{p(y|x)p(x)}{p(y)}$ (posterior, likelihood, prior, evidence). (p.12)
7. **Mean, covariance, variance.** $\mathrm{Cov}[x,y]=\mathbb E[xy]-\mathbb E[x]\mathbb E[y]$, $\mathbb V[x]=\mathrm{Cov}[x,x]$. (p.13–14)
8. **Sums and affine transforms.** $\mathbb V[x+y]=\mathbb V[x]+\mathbb V[y]+2\mathrm{Cov}[x,y]$; $\mathbb E[Ax+b]=A\mathbb E[x]+b$; $\mathbb V[Ax+b]=A\mathbb V[x]A^\top$. (p.15)
9. **Parametric families.** Bernoulli $\theta^x(1-\theta)^{1-x}$, categorical $\prod_k\theta_k^{[x=k]}$. (p.16)
10. **Gaussians.** Univariate and multivariate pdf, standard normal; sums and linear maps ($Ax\sim\mathcal N(A\mu,A\Sigma A^\top)$). (p.17–19)
11. **Sampling a multivariate Gaussian.** $y=Lx+\mu$ with $LL^\top=\Sigma$ (Cholesky), $x\sim\mathcal N(0,I)$. (p.20)
12. **Learning by maximum likelihood.** $\theta^*=\arg\max_\theta\sum_n\log p(x_n;\theta)$. (p.21)
13. **Generalisation.** (p.22)
14. **Probabilistic graphical models.** Grey = observed, white = latent; $p(A,B,C)=p(C|A,B)p(A)p(B)$. (p.24)
15. **Gaussian mixture models.** Cat-weight example; $p(x)=\sum_k\omega_k\mathcal N(x;\mu_k,\sigma_k^2)$; log-likelihood as log-sum-exp; trained by **EM** (E: compute $p(z)$ responsibilities; M: update params) or gradient methods. (p.25–29)
16. **Gradient descent.** $x_{i+1}=x_i-\gamma_i\nabla f(x_i)$; with a suitable step size $f(x_0)\ge f(x_1)\ge\dots$ converges to a local minimum. Worked 2-D quadratic from $x_0=[-3,-1]^\top$. (p.31–34)

### Equations / algorithms to feature
Bayes (p.12), sum/product rule (p.10), Gaussian pdf (p.17), Cholesky sampling (p.20), MLE (p.21), GMM (p.26, 28), GD update (p.32), Eq. (7) sum/transform rules (p.15).

### Likely-examined (inference)
1. Bayes' theorem and the names of its terms.
2. Gaussian linear-transform rules and Cholesky sampling.
3. MLE under i.i.d. (why the log-sum).
4. GMM as a latent-variable model, and EM's two steps.
5. Gradient descent behaviour (step-size effect on the ill-conditioned quadratic).

### Classic misconceptions
- A pdf value can exceed 1 (only the integral must be 1). Discrete $p(x)\le1$ vs continuous $f(x)\ge0$.
- Uncorrelated ≠ independent. The slide asks "what if $x,y$ independent?" (Cov = 0, converse false) *(extra clarification)*.
- Flipping a coin: identical (same $p$) vs independent (no influence between flips), which are separate assumptions (p.11).
- $p(x|y)\ne p(y|x)$ (pixels|weather vs weather|pixels, p.10).
- Large step size can diverge *(extra)*, and GD only guarantees a *local* minimum (p.32).

### Planned mechanics (Phase 2)
Distribution sliders (Gaussian $\mu,\sigma$, 2-D covariance ellipse), Cholesky sampling demo, drag-the-data GMM with E/M step button, GD on the slide's quadratic with a step-size slider.

---

## World 2 — Week 2: Autoregressive Generative Models
Source: W2 (41 pp.). Prerequisites: W1 (chain rule, Bernoulli/categorical/Gaussian, MLE).

### Topics in order
1. **Goal of a generative model:** generation, density estimation, unsupervised representation learning. (p.3)
2. **Logistic regression and MLP as $p(Y|X)$.** $\sigma(z)=1/(1+e^{-z})$. (p.4)
3. **Binarised MNIST setup.** $x\in\{0,1\}^{784}$; choose a model family, then search $\theta$. (p.5)
4. **Autoregressive chain rule.** $p(x_1..x_n)=p(x_1)p(x_2|x_1)\cdots$ (p.6)
5. **FVSBN.** $\hat x_i=\sigma(\alpha_0^i+\sum_{j<i}\alpha_j^ix_j)$; evaluation = multiply conditionals; sampling = sequential; **≈ $n^2/2$ parameters**. (p.7–8)
6. **NADE.** $h_i=\sigma(A_ix_{<i}+c)$, $\hat x_i=\sigma(\alpha_ih_i+b_i)$; weight tying $h_i=\sigma(W_{<i}x_{<i}+c)$. (p.9–11)
7. **Categorical outputs (softmax)** and **RNADE** (continuous, mixture of $K$ Gaussians). (p.12–14)
8. **Autoregressive vs autoencoders.** A vanilla autoencoder is *not* generative. (p.15–16)
9. **MADE.** Masks enforce the DAG ordering; one pass produces all conditionals. (p.17)
10. **RNN.** $h_{t+1}=\tanh(W_{hh}h_t+W_{xh}x_{t+1})$, $o_{t+1}=W_{hy}h_{t+1}$; constant parameter count; char-RNN "hello" example. Pros/cons and issues (long-range gradient problems, sequential). (p.18–21)
11. **Attention and generative Transformers.** Query/key/summary; masked self-attention. (p.22–23)
12. **PixelRNN, PixelCNN (masked convolutions), WaveNet (dilated convolutions).** (p.24–29)
13. **Summary of autoregressive models.** (p.30)
14. **Learning goal and KL divergence.** $D(p\|q)=\sum_xp(x)\log\frac{p(x)}{q(x)}\ge0$, 0 iff $p=q$; $2^{784}\approx10^{235}$ images. (p.31–35)
15. **Monte Carlo estimation.** $\hat g=\frac1T\sum_tg(x^t)$ ("$\hat g$ is itself a random variable"). (p.36)
16. **MLE for autoregressive models.** $\ell(\theta)=\sum_j\sum_i\log p_{neural}(x_i^{(j)}|x^{(j)}_{<i};\theta_i)$, trained with backprop-based gradient steps. (p.37–38)
17. **Conditional generative models.** Loss $-\log p_\theta(y|x)$. (p.39)
18. **Recap.** Higher log-likelihood ≠ better-looking samples. (p.40)

### Likely-examined (inference)
1. Chain-rule factorisation and why FVSBN has ~$n^2/2$ parameters.
2. FVSBN → NADE (weight tying) → MADE (masks) differences.
3. Why vanilla autoencoders aren't generative, and what masking fixes.
4. RNN vs Transformer pros/cons (sequential vs parallel training, gradient issues).
5. KL divergence properties and MLE as minimising KL to data *(the link to KL is implicit on p.34–37)*.

### Misconceptions
- Autoregressive *sampling* is inherently sequential, but *likelihood evaluation* can be parallel (MADE/Transformer, not RNN) (p.16, 20, 30).
- Softmax generalises the sigmoid (p.12).
- A model with high log-likelihood can still give poor samples (p.40).
- MADE ordering: unit for $p(x_2)$ cannot depend on any input (p.17).

### Planned mechanics
Pixel-by-pixel sampler on a tiny binary grid; mask-drawing puzzle for MADE (click which connections survive for a chosen ordering); attention heat-map query/key demo; KL slider between two Gaussians.

---

## World 3 — Week 3: Latent Variable Models, VAE, Variational Inference
Source: W3 (70 pp., many image slides, checked). Prerequisites: W1 (Gaussian, GMM, EM), W2 (autoencoders, MLE, KL).

### Topics in order
1. **Recap:** autoregressive pros/cons. (p.3)
2. **Motivation for latent variables.** $z$ = hidden factors of variation; deep LVM $z\sim\mathcal N(0,I)$, $p(x|z)=\mathcal N(\mu_\theta(z),\Sigma_\theta(z))$. (p.5–7)
3. **Mixture of Gaussians as shallow LVM.** Clustering via posterior $p(z|x)$. (p.8–12)
4. **PCA.** Directions of max variance → transform → keep top components. (p.13–15)
5. **Autoencoders.** Basic MLP AE, MSE loss $\|x-x'\|_2^2$ (without non-linearity ≈ PCA, latents not necessarily orthogonal); conv AE 784→32→784; dropout, denoising (add noise/dropout at input), sparse ($L_1$ penalty). (p.16–21)
6. **Why plain encoders can't sample well:** odd-shaped distribution, not centred at 0, not continuous. (p.23–24)
7. **VAE sampling.** Diagonal Gaussian, $z=\mu+\sigma\odot\epsilon$, $\epsilon\sim\mathcal N(0,I)$; **log-var trick** $z=\mu+e^{\log(\sigma^2)/2}\epsilon$. (p.25–28)
8. **VAE loss.** $\mathcal L=\alpha\mathcal L_1+\mathcal L_2$; $\mathcal L_2=D_{KL}[\mathcal N(\mu,\sigma)\|\mathcal N(0,1)]=-\tfrac12\sum(1+\log\sigma^2-\mu^2-\sigma^2)$; BCE for Bernoulli, MSE for Gaussian outputs. (p.29–31)
9. **ELBO derivation.** $\log p(x;\theta)\ge\mathbb E_{q_\phi}[\log p(z,x;\theta)-\log q_\phi(z|x)]=\mathbb E_{q_\phi}[\log p(x|z)]-D_{KL}(q_\phi(z|x)\|p(z))$ (p.32–33). Autoencoder perspective and the "Alice and Bob space mission" story (p.34–35).
10. **VAE in action.** Encoder Linear(D,256)→LeakyReLU→Linear(256,2M)→split; decoder → softmax over $L$ categories; 4-step procedure. (p.36–38)
11. **LVM summary.** Ancestral sampling easy; likelihood intractable. (p.39)
12. **Mixture view and marginal likelihood.** $p(x)=\sum_zp(z)p(x|z)$; VAE = "infinite mixture of Gaussians"; 30 binary latents = $2^{30}$ terms; naive Monte Carlo fails (optional). (p.41–47)
13. **ELBO via Jensen.** $\log\mathbb E_q[f]\ge\mathbb E_q[\log f]$; $\log p(x)=\mathrm{ELBO}+D_{KL}(q\|p(z|x))$; tight iff $q=p(z|x;\theta)$. (p.48–50, 53, 56–57, 70)
14. **Variational inference.** Pick $\phi$ so $q(z;\phi)$ ≈ posterior; example $\phi_i\approx1$ on the top of a "9" (p.51–52, 58–59).
15. **Learning with ELBO.** $\nabla_\theta$ easy; $\nabla_\phi$ is harder; **reparameterisation** $z=\mu+\sigma\epsilon$ gives $\nabla_\phi\mathbb E_q[r]=\mathbb E_\epsilon[\nabla_\phi r(g(\epsilon;\phi))]$; REINFORCE mentioned as the general alternative "later in the course" (p.60–64).
16. **Amortised inference.** One network $f_\lambda:x\mapsto\phi$ instead of per-datapoint $\phi^i$; train by SGD on $\sum_i\mathcal L(x^i;\theta,\phi)$. (p.65–67)
17. **Summary: pros/cons of LVMs; GANs as the alternative.** (p.54–55)

### Likely-examined (inference)
1. ELBO derivation (Jensen) and its two decompositions (entropy form; reconstruction − KL form).
2. Reparameterisation trick: why needed, what it does for gradients.
3. $\log p(x)=\text{ELBO}+D_{KL}(q\|p(z|x))$ and when the bound is tight.
4. Role of each VAE loss term (KL regularises latent to prior; why plain AE can't sample).
5. Amortised vs per-datapoint inference.

### Misconceptions
- ELBO is a lower bound for *any* $q$; it's tight only when $q$ equals the true posterior (p.50).
- $\mathbb E[\log\cdot]\ne\log\mathbb E[\cdot]$ (p.68), which is why the single-sample log-estimate is biased.
- The KL term does not "reduce reconstruction quality for its own sake"; it makes the latent space samplable (p.34–35).
- VAE samples at test time from the *prior* $p(z)$, not from $q(z|x)$.
- Reparameterisation moves randomness into $\epsilon$; the sampling itself isn't differentiable, but $g(\epsilon;\phi)$ is.

### Planned mechanics
2-D latent space explorer (draw $\mu,\sigma$ and watch samples); KL-weight $\alpha$ slider trading off reconstruction vs sample quality; step-through ELBO derivation (order the lines); reparameterisation gradient comparison.

---

## World 4 — Week 4 ("Lecture 4") — **NOT READ**
Pending file. Likely subtopics from UG p.4 "diffusion models, etc." but not to be assumed.

## World 5 — Week 5 — **NO FILE**

---

## World 6 — Week 6: Graph Convolutional Networks, GraphSAGE, GAT
Source: W6 (43 pp.; equations are images, checked). Lecturer Q. Xu. Prerequisites: neural-network basics, softmax and cross-entropy (W2).

### Topics in order
1. **Graph-structured data.** Arbitrary size, no canonical node order, dynamic/multimodal. (p.3–4)
2. **Deep graph encoders** $Enc(v)$. (p.5)
3. **Graph set-up.** $G=(V,E)$, adjacency $A$, features $X\in\mathbb R^{|V|\times m}$, neighbours $N(v)$. (p.6)
4. **Naïve approach (adjacency + features into an MLP) fails**, since the graph has no canonical node order. (p.7–8, 14)
5. **Permutation invariance and equivariance.** Invariant: graph → vector, $f(A_1,X_1)=f(A_2,X_2)$. Equivariant: graph → matrix, permuting the input permutes the output. $|V|!$ orderings. (p.9–13)
6. **GCN: neighbourhood aggregation.** Nodes aggregate neighbours' messages; layer-$k$ embedding sees $k$ hops. (p.15–18)
7. **GCN layer.** $h_v^{(0)}=x_v$; $h_v^{(k+1)}=\sigma\!\Big(W_k\sum_{u\in N(v)}\frac{h_u^{(k)}}{|N(v)|}+B_kh_v^{(k)}\Big)$; $z_v=h_v^{(K)}$. Worked example on nodes A,B,C. (p.18–19, 24)
8. **GCN is permutation invariant (per node) and equivariant (whole graph).** (p.20–23)
9. **Training.** Supervised: cross-entropy $CE(y,f(x))=-\sum_iy_i\log f_\theta(x)_i$. Unsupervised: similar nodes → similar embeddings, $L=\sum CE(y_{u,v},DEC(z_u,z_v))$ with dot-product decoder. (p.25–27)
10. **GNN model overview.** Define aggregation, define loss, train on a batch of computation graphs, generate embeddings for unseen nodes; **parameters shared** so GNN generalises (inductive), e.g. protein graph organism A→B. (p.28–31)
11. **General GNN framework.** Layer = Message + Aggregation; (1) message, (2) aggregation, (3) layer connectivity, (4) graph augmentation, (5) learning objective. GCN fits (assumes self-edges). (p.32–33)
12. **GraphSAGE.** $h_v^{(l)}=\sigma\big(W^{(l)}\cdot\mathrm{CONCAT}(h_v^{(l-1)},\mathrm{AGG}(\{h_u^{(l-1)},\forall u\in N(v)\}))\big)$; two-stage aggregation; AGG choices: **Mean**, **Pool** (MLP then Mean/Max), **LSTM** on a *shuffled* neighbour order. (p.34–35)
13. **Graph Attention Networks.** GCN/SAGE weights $\alpha_{vu}=1/|N(v)|$ (all equal); GAT learns them: $e_{vu}=a(W^{(l)}h_u,W^{(l)}h_v)$, $\alpha_{vu}=\frac{\exp(e_{vu})}{\sum_{k\in N(v)}\exp(e_{vk})}$, $h_v^{(l)}=\sigma(\sum_u\alpha_{vu}W^{(l)}h_u)$; $a$ can be one linear layer on the concatenation; **multi-head** (concat or sum) stabilises training. Benefits: efficient, sparse, localised, inductive. (p.36–42)
14. **Think about:** GNN vs CNN; issues with the framework. (p.43)

### Likely-examined (inference)
1. The GCN layer equation (what each term does, count parameters, compute one layer by hand).
2. Invariance vs equivariance (definitions plus why the naïve MLP fails).
3. GCN vs GraphSAGE vs GAT: what changes.
4. Why parameters are shared and what "inductive" means.
5. Attention weights: softmax-normalised, why multi-head.

### Misconceptions
- Invariant ≠ equivariant: the node-level embedding is permutation-*invariant to input order*, but the output matrix is *equivariant* (p.12, 20–23).
- GCN aggregation uses a **mean**, with a *separate* self-weight $B_k$. GraphSAGE concatenates; "GCN includes self in the sum via self-edges" in the framework view (p.33). Don't conflate.
- Attention $\alpha_{vu}$ is only normalised over $N(v)$.
- LSTM aggregator is not permutation-invariant unless the neighbours are shuffled/randomly ordered (p.35).
- Layer $k$ = $k$-hop information, not "$k$ neighbours".

### Planned mechanics
Click-to-step message passing on a small graph with live feature vectors; aggregator chooser (sum / mean / max / attention) with embedding plots; reorder-the-nodes toggle showing equivariance; attention-weight slider demo.

---

## World 7 — Week 7: GNN Design, Augmentation, Training
Source: W7 (50 pp.). Lecturer Z. Qu. Prerequisites: W6.

### Topics in order
1. **Modern modules in a GNN layer.** Batch norm (re-centre to zero mean, rescale to unit variance), dropout (prob. $p$ zero in training; all neurons at test; applied to the linear message layer $m_u^{(l)}=W^{(l)}h_u^{(l-1)}$), activations (ReLU common; sigmoid only to restrict range; tanh, PReLU). Attention/gating. (p.5–11)
2. **Stacking layers; the over-smoothing problem.** All node embeddings converge to the same value. (p.12–13)
3. **Receptive field** = $K$-hop neighbourhood; overlap grows quickly with depth → embeddings similar → over-smoothing. (p.14–16)
4. **Layer connectivity.** Don't make $L$ unnecessarily large. Fixes: (1) deeper transformation/aggregation inside each layer, (2) pre-/post-process MLP layers, (3) **skip connections**: $h_v^{(l)}=\sigma(\sum W^{(l)}\frac{h_u^{(l-1)}}{|N(v)|}+h_v^{(l-1)})$, i.e. $F(x)+x$; $N$ skip connections → $2^N$ paths, a mixture of shallow and deep GNNs. Slide leaves "skip two layers?" open. (p.17–22)
5. **Graph manipulation.** Problem → fix: no features → feature augmentation (constants or one-hot unique IDs); too sparse → virtual edges (2-hop) / **virtual node** connected to all (shortest path 10 → 2); too dense → neighbour sampling; too large → subgraph sampling. (p.23–30)
6. **Training pipeline.** Input graph → GNN → node embeddings → prediction head → predictions vs labels → loss → evaluation. (p.31–32)
7. **Prediction heads.** Node: $\hat y_v=W^{head}h_v^{(L)}$ (or $d=k$). Edge: concat + Linear, or dot product $(h_v^{(L)})^\top h_u^{(L)}$ (1-way), or $k$ bilinear heads $W^{(1..k)}$. Graph: global **mean / max / sum** pooling (others: hierarchical, sort, attention). (p.33–38)
8. **Losses and metrics.** Cross-entropy $-\sum_jy_j\log\hat y_j$; MSE $\sum_j(y_j-\hat y_j)^2$; accuracy, precision $\frac{TP}{TP+FP}$, recall $\frac{TP}{TP+FN}$, F1 $\frac{2PR}{P+R}$. (p.40–42)
9. **Dataset splits for graphs.** Nodes are *not* independent. **Transductive** (one graph, whole graph visible, split labels only; node/edge tasks) vs **inductive** (break edges between splits, multiple graphs, splits observe only their own graph; node/edge/graph tasks). Graph classification: inductive only. (p.43–47)
10. **Link prediction pipeline.** Self-supervised; hide edges: **message edges** vs **supervision edges** (supervision edges are *not* fed into the GNN); inductive vs transductive variants. (p.48–50)

### Likely-examined (inference)
1. Over-smoothing: cause (receptive-field overlap) and the three remedies, especially skip connections.
2. Transductive vs inductive splits, and why random splitting fails on graphs.
3. Prediction heads for node/edge/graph tasks; pooling choices.
4. Link prediction: message vs supervision edges.
5. Precision/recall/F1 computation.

### Misconceptions
- "More layers = better" (true in CNNs for classification but **not** for GNNs, p.17).
- Virtual nodes shorten path lengths (to 2), they don't add information by themselves.
- Dropout at *test* time uses all neurons (p.8).
- Dot-product edge head only fits 1-way prediction without extra weights (p.36).
- Supervision edges must not be message edges.

### Planned mechanics
Over-smoothing lab: add layers (with/without skip) and watch embeddings collapse, plus a receptive-field highlighter; split sorter (drag nodes/edges into transductive vs inductive); link-prediction edge-hider; metrics calculator.

---

## World 8 — Week 8: Heterogeneous Graphs and RGCN
Source: W8 (47 pp.). Lecturer Z. Qu. Prerequisites: W6–W7.

### Topics in order
1. **Motivation.** Multiple node and edge types; **relation type** (node_start, edge, node_end), e.g. 2 node types × 2 edge types → 8 relation types. (p.3–5)
2. **Definition.** $G=(V,E,\tau,\phi)$; $r(u,v)=(\tau(u),\phi(u,v),\tau(v))$. Examples: e-commerce graph, Microsoft Academic Graph. (p.6–7)
3. **Types as features** (one-hot) reduce a heterogeneous graph to a homogeneous one; **when you need a true heterogeneous graph:** (1) different feature shapes per type, (2) different relation types need different models. More expressive but costlier. (p.8–10)
4. **Relational GCN.** Different weights per relation. Worked 1-relation example ($h_A^1$, $h_A^2$, $h_A^3$ question) then RGCN: $h_v^{(l+1)}=\sigma\Big(\sum_{r\in R}\sum_{u\in N_v^r}\frac{1}{|N_v^r|}W_r^{(l)}h_u^{(l)}+W_0^{(l)}h_v^{(l)}\Big)$; worked 2-relation example for $h_A^1$. (p.11–23)
5. **Scalability.** $W_r^{(l)}\in\mathbb R^{d^{(l+1)}\times d^{(l)}}$ grows with $|R|$ → overfitting. Fixes: **block-diagonal** matrices ($B$ blocks → params ÷ $B$; e.g. $6\times4$ with 2 blocks = 12 vs 24; no cross-block feature mixing), and **basis learning** $W_r=\sum_{b=1}^Ba_{rb}V_b$ (params $(d^{(l+1)}d^{(l)}+|R|)\cdot B$; saves a lot when $B\ll|R|$, little when $B\approx|R|$). (p.24–32)
6. **RGCN tasks.** Node classification (final layer in $\mathbb R^K$). **Link prediction**: relation-specific score $f_{r}(h_E,h_A)=h_E^\top W_rh_A$; negatives by perturbing the supervision edge (must not be a training message/supervision edge); loss $\ell=-\log\sigma(f_{r_3}(h_E,h_A))-\log(1-\sigma(f_{r_3}(h_E,h_B)))$; evaluate by ranking: **Hits@k** $=\mathbb 1[RK\le k]$, **Reciprocal Rank** $=1/RK$. (p.33–40)
7. **Extending the GNN design space.** Per-relation message $m_u^{(l)}=\mathrm{MSG}_r^{(l)}(h_u^{(l-1)})$; two-stage aggregation ($\mathrm{AGG}_r$ within relation, $\mathrm{AGG}_{all}$ across; e.g. Concat/Sum); per-node-type MLP layers; skip/norm still useful; sampling per relation type or global; heterogeneous prediction heads (node: $W^{(H)}_{T(v)}$; edge: Linear$_r$(Concat); graph: AGG over per-type heads). (p.41–47)

### Likely-examined (inference)
1. Write/compute an RGCN layer for a small two-relation graph.
2. Parameter counts: full vs block-diagonal vs basis learning (the formulas on p.26, 31).
3. When a heterogeneous graph is *needed* vs one-hot type features.
4. Link prediction training (negative sampling) and evaluation (Hits@k, MRR-style reciprocal rank).
5. Limitation of block-diagonal matrices.

### Misconceptions
- Normalisation is per relation: $1/|N_v^r|$, not $1/|N_v|$ (p.21).
- A negative edge must not be a real edge (the slide's $(E,r_3,C)$ is *not* a valid negative, p.36).
- Basis learning shares $V_b$ across relations but the coefficients $a_{rb}$ are per relation; bases are *not* shared across layers (p.31).
- Hits@k and RR are both "higher is better".

### Planned mechanics
Build-your-own RGCN: pick relations, compute $h_A^1$ numerically; parameter-count slider ($d$, $|R|$, $B$) comparing three schemes; negative-edge picker; rank-and-score calculator.

---

## World 9 — Week 9: Introduction to Deep Reinforcement Learning
Source: W9 (58 pp.). Lecturer Z. Qu. Prerequisites: W1 (expectation), W2/W3 (gradient training), W6–8 not needed.

### Topics in order
1. **Motivation and taxonomy.** AlphaGo, robotics, driving, games; policy gradients (REINFORCE), value-based (DQN), actor-critic (DDPG, SAC), model-based (Dyna), on- vs off-policy. (p.4–5, 55)
2. **MDP** $(S,A,r,p,\rho,\gamma)$; maze example ($-1$/step, $-2$ obstacle, $+10$ cheese, $\gamma=0.9$); **policy** $\pi(a|s)$; trajectory loop. (p.6–12)
3. **Monte Carlo return.** $G_t=r_t+\gamma r_{t+1}+\gamma^2r_{t+2}+\cdots$; exercise: trajectory with rewards $-0.04,-0.04,-0.04,+1.0$, $\gamma=0.9$ (slide leaves the answer blank). (p.13–14)
4. **Why discount.** Convenience, avoids infinite returns, favours near rewards; Sutton Ex. 3.22: $\gamma=0$ → $\pi_{left}$; $\gamma=0.9$ → $\pi_{right}$; $\gamma=0.5$ → tie. (p.15–18)
5. **Value functions.** $V^\pi(s)=\mathbb E[\sum_t\gamma^tr(s_t,a_t)|s_0=s]$, $Q^\pi(s,a)$; goal-grid examples $V=\gamma$, $\gamma^3$, $Q(\text{Up})=\gamma^3$ vs $Q(\text{Down})=\gamma$. (p.19–23)
6. **Optimality.** $V^*(s)=\max_\pi V^\pi(s)$, $Q^*$, $\pi^*=\arg\max_\pi V^\pi$; multiple optimal policies share $V^*,Q^*$; $V^*(s)=\max_aQ^*(s,a)$; $Q^*(s,a)=\mathbb E_{s'}[r(s,a)+\gamma V^*(s')]$ (no expectation if deterministic). (p.24–30)
7. **Q-learning.** $a^*=\arg\max_aQ^*(s,a)$; Q-table (tabular) vs $Q_\varphi$ network (continuous). (p.31–34)
8. **Bellman equations.** $V^*(s_t)=\mathbb E[r_t+\gamma V^*(s_{t+1})]$; $Q^*(s_t,a_t)=\mathbb E[r+\gamma\max_{a'}Q^*(s_{t+1},a')]$. Gridworld A/B example: $v^*(A)=10+\gamma v^*(A')$, $v^*(A')=\gamma^4v^*(A)$ ⇒ $(1-\gamma^5)v^*(A)=10$, $v^*(A)\approx24.4$. (p.35–39)
9. **Tabular update & algorithm.** $Q(s_t,a_t)\leftarrow Q+\alpha[r+\gamma\max_{a'}Q(s_{t+1},a')-Q]$; converges if all pairs keep being updated; **ε-greedy** behaviour. (p.40–42)
10. **SARSA** (on-policy): target uses the *chosen* next action; **Q-learning vs SARSA** on the cliff-walking example (optimal path vs safer path). The slide shows the figure with no commentary. (p.43–45)
11. **Deep Q-learning.** Target $y=r+\gamma(1-d)\max_{a'}Q_\varphi(s_{t+1},a')$; **MSBE** $L(\varphi,D)=\mathbb E[(Q_\varphi(s,a)-y)^2]$, minibatch GD; **target network** $Q_{\varphi'}$ for a fixed target. (p.46–48)
12. **Continuous actions: policy network** $\mu_\theta$; gradient *ascent* $\theta\leftarrow\theta+\alpha\nabla_\theta\frac1{|B|}\sum Q_\varphi(s,\mu_\theta(s))$; target $y=r+\gamma(1-d)Q_{\varphi'}(s_{t+1},\mu_\theta(s_{t+1}))$. (p.49–52)
13. **DDPG algorithm.** Replay buffer $D$; critic descent, actor ascent; Polyak targets $\varphi'\leftarrow\rho\varphi'+(1-\rho)\varphi$, same for $\theta'$. (p.53)
14. **Overestimation bias.** Noisy $Q_\varphi$ values (0.5, 0.2, −0.3 where $Q^*=0$) + $\max$ → inflated targets; sample-efficiency note; fixes: TD3, SAC, Maxmin Q-learning, REDQ (names/papers only). (p.56–58)

### Likely-examined (inference)
1. Compute returns and solve small Bellman equations (like $v^*(A)=24.4$).
2. $V$ vs $Q$, optimal versions and their relations.
3. Tabular Q-learning update by hand; Q-learning vs SARSA (off- vs on-policy).
4. Why target network, replay buffer and policy network (DDPG).
5. Overestimation bias from $\max$ over noisy estimates.

### Misconceptions
- $\gamma$ choice can change which policy is optimal (Ex. 3.22).
- Q-learning is off-policy: it learns $Q^*$ regardless of behaviour policy; SARSA learns the value of the policy it follows (p.41, 43).
- $V^*(s)=\max_aQ^*(s,a)$ — don't confuse with $\max_s$.
- Terminal flag $d$ zeroes the bootstrap term (p.47).
- Actor is *ascent* on $Q$, critic is *descent* on MSBE (p.51, 53).
- Wall-clock time ≠ sample efficiency (p.57).

### Planned mechanics
Gridworld with $\gamma$, rewards, ε sliders and cell-by-cell value iteration/Q-learning; be-the-agent mode; Bellman builder (assemble $Q^*$); cliff-walking Q-learning vs SARSA race; target-network on/off stability demo; overestimation demo with noisy Q.

---

## World 10 — Week 10 "Understanding Deep RL Algorithms" — **NOT READ**
Pending file. From W9 p.5, 55, 58 the lecture likely covers DQN, REINFORCE/policy gradients, actor-critic (DDPG/SAC/TD3), but this is only a guess from the Week 9 outline.

---

## Dependency graph
```
W1 prob/Gaussian/GMM/GD ─► W2 autoregressive (chain rule, MLE, KL) ─► W3 LVM/VAE (ELBO, reparam)
                                                         └─► W3 REINFORCE forward-reference ─► W9/W10
W6 GCN ─► W7 design/training ─► W8 heterogeneous/RGCN
W9 MDP/Q-learning ─► W10 deep RL algorithms (missing)
```
