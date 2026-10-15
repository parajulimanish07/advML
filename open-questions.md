# Open questions (slide ambiguities and gaps)

Page numbers are PDF pages (see `content-map.md`).

## Missing material
1. **Lecture 4** and **Understanding DRL Algorithms**: not downloadable through the Drive connector (7.4–7.6 MB). Not read.
2. **Week 5**: no file in the Drive folder. Is it missing, or is Week 6 the first GNN lecture?
3. Two copies of "Understanding DRL Algorithms" have the same byte size (7,431,456), so they are probably duplicates. I couldn't hash them to confirm.

## Slide inconsistencies / things I won't guess
| Where | Issue |
|---|---|
| W1 p.26 eq. (16) | Written as the *joint* $p(x,z)$, but the right-hand side $(1-\omega)\mathcal N(\cdot)+\omega\mathcal N(\cdot)$ is the *marginal* $p(x)$. Which should the game teach? I will treat it as the marginal. |
| W1 p.33 eq. (21) | **Resolved.** Re-rendered: $f(x)=\tfrac12x^\top\begin{pmatrix}2&1\\1&20\end{pmatrix}x-(5,3)x$; minimiser $(97/39,1/39)$. Used in World 1. |
| W2 p.15 | The autoencoder loss "for dataset D" is an image or blank. I will not state a specific loss from this slide. |
| W3 p.29 | $\mathcal L=\alpha\mathcal L_1+\mathcal L_2$: the slides don't say how to choose $\alpha$. (ELBO weights the two terms equally; $\alpha$ is a practical knob.) I will label that as extra. |
| W3 p.61 | "Later in the course we'll see REINFORCE." I expect this appears in the unread Weeks 10+ material. |
| W7 p.22 | "If we skip two layers, what is $h_v^{(l)}$?" Answer not on the slide. I'd derive it as $F_2(F_1(x)+x)+F_1(x)+x$-style, but it's ambiguous. I'll mark it extra or skip it. |
| W9 p.14 | Return exercise: reward labels read $-0.04,-0.04,-0.04$ and then "$r_3=1.0$" (label typo; likely $r_4$). With $\gamma=0.9$ I compute $G=-0.04-0.036-0.0324+0.729=0.6206$. The answer is not on the slide, so I'll mark it extra. |
| W9 p.52–53 | The target in the MSBE uses $\mu_\theta(s_{t+1})$ on p.52 but DDPG (p.53) maintains a *target policy* $\theta'$. The usual DDPG target uses $\mu_{\theta'}$. I'll follow p.53 and flag p.52. |
| W9 p.56 | Overestimation question ("what will happen during the update?") has no answer on the slide. Expected: $\max$ picks $0.5$ → target biased up. I'll mark this extra. |
| W9 p.44–45 | Q-learning vs SARSA slides are figures with no commentary. I will explain the cliff example as extra (standard textbook context). |
| W6 p.36 / p.19 | Notation: p.19 uses $B_0$, p.24 uses $B_k$. I'll use $B_k$. |

## Not on slides, so the quiz won't test it unless labelled "extra"
- What will be on the exam (UG only says exam = 40%).
- Weeks 11–13 content.

## Added while building the game
| Where | Issue |
|---|---|
| W9 p.14 | Return exercise: the answer is not on the slide, and the last reward label repeats "r3" (probably r4). The quiz uses the explicit rewards $-0.04,-0.04,-0.04,+1.0$ and says so. |
| W9 p.44–45 | Q-learning vs SARSA figure: the slides label "optimal path" and "safer path" but not which algorithm takes which. The quiz says so and marks the usual result (SARSA = safer) as extra. |
| W9 p.52 vs p.53 | Target in the MSBE uses $\mu_\theta$ on p.52 but DDPG (p.53) keeps a target policy $\theta'$. |
| W3 p.36–37 | Slide-36 ELBO formula is typeset in a way that is easy to misread; the game states the standard $\mathbb E_q[\log p(x|z)]-D_{KL}$ form from p.33 instead. |
| W2 p.35 | Asymmetry of KL is not stated on the slides; the quiz item is marked extra. |
| W6 p.34 vs p.18 | GCN (separate $W_k$, $B_k$) and GraphSAGE (concat then $W$) are mathematically very similar for the mean aggregator; the quiz doesn't claim they differ in that respect. |
| Explorers | Some demos (e.g. W3 latent-space cartoon, W9 toy actor–critic, W7 over-smoothing graph) are my own illustrations of the slide idea, not figures from the slides; their on-screen text says so where it matters. |
