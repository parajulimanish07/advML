# ADVML Quest

A map-based study game for **COMP8221 Advanced Machine Learning** (Macquarie). One *world* per lecture, one *level* per topic, a boss fight per world.

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # type-check + production build
```

No backend. Progress (XP, stars, streak, Mistake Journal, Review Dungeon cards) is saved in your browser's `localStorage`.
The **“unlock all”** checkbox in the top bar lets you jump to any level or boss for play-testing.

## What's in the game

| World | Lecture | Levels | Source |
|---|---|---|---|
| 1 · Probability Foundry | Week 1 | 7 | `2026_S2_MQ_COMP8221_Week1.pdf` |
| 2 · Autoregressive Alley | Week 2 | 8 | `..._Week2.pdf` |
| 3 · Latent Lagoon | Week 3 | 8 | `..._Week3.pdf` |
| 4 · Lecture 4 | Week 4 | – | *not loaded yet (file too large for the Drive connector)* |
| 5 · Week 5 | Week 5 | – | *no file found* |
| 6 · Graph Galaxy | Week 6 | 6 | `GraphNN-w6.pdf` |
| 7 · Deep Graph Forge | Week 7 | 8 | `COMP8221_Week 7.pdf` |
| 8 · Relation Realm | Week 8 | 6 | `COMP8221_Week 8.pdf` |
| 9 · Reward Reef | Week 9 | 9 | `COMP8221_week9.pdf` |
| 10 · Understanding Deep RL Algorithms | Week 10 | – | *not loaded yet* |

Every level has the same four steps: **Hook → Explore (interactive) → Build → Challenge**. Every world ends with a **Boss** (80 % to pass, timer, 3 lives, multi-step exam-style problems) that unlocks the next world and a one-page **Cheat Sheet**. Wrong answers go to the **Mistake Journal**, and every answered question enters the **Review Dungeon** (Leitner boxes).

Every question carries a `source` (`📖 Week X, slide Y`). Anything not in the lecture is labelled **extra (not in lecture)**. Ambiguities and slide errors are listed in `open-questions.md`; `content-map.md` is the Phase-1 map of the lectures.

## Editing / adding content

All content is plain JSON in `src/content/<world>/`, separate from the engine:

```
src/content/worlds.json            order of worlds
src/content/w1/world.json          title, colour, ordered list of level files
src/content/w1/l1-....json         one level: hook, explore (component + text), build, questions
src/content/w1/boss.json           boss questions (may share a `scenario` across parts)
src/content/w1/cheatsheet.json     cheat-sheet items
```

A question is `{id, type: "mcq"|"numeric"|"bug"|"false", prompt, options, correct, value, tol, explanation, source:{file,page,extra?}}`.
Maths uses KaTeX: `$inline$` and `$$display$$`. `source.page` is the **PDF** page number; the slide number shown is derived in `src/sources.ts`.
Answer options of multiple-choice questions are shuffled deterministically at load time, so `correct` always refers to the order in the file.

The interactive explorers are React components in `src/explore/` registered by name in `src/explore/index.ts`; a level picks one with `explore.component`.

## Adding the missing lectures

Drop the PDFs into `lectures/` (git-ignored), then ask for the new world(s) to be built: add `src/content/w4/` etc. following the layout above (a `status: "missing"` placeholder `world.json` already exists for weeks 4, 5 and 10; change it to `ready` and add `levels`).
