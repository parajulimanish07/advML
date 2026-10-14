export type Src = {
  file: string // key in SOURCES, e.g. 'W1'
  page: number // PDF page number
  extra?: boolean // true => not in lecture (standard textbook context)
}

export type Question = {
  id: string
  type: 'mcq' | 'numeric' | 'bug' | 'false'
  scenario?: string // shared context for multi-step boss problems
  step?: string // e.g. "Part 2 of 3"
  prompt: string
  options?: string[]
  correct?: number // index into options (mcq / bug / false)
  value?: number // numeric answer
  tol?: number // absolute tolerance for numeric
  unit?: string
  explanation: string
  source: Src
}

export type Build =
  | { type: 'order'; prompt: string; items: string[]; explanation: string; source: Src }
  | {
      type: 'fill'
      prompt: string
      template: string // use {0}, {1} for blanks
      blanks: { options: string[]; correct: number }[]
      explanation: string
      source: Src
    }
  | {
      type: 'predict'
      prompt: string
      kind: 'mcq' | 'numeric'
      options?: string[]
      correct?: number
      value?: number
      tol?: number
      reveal: string
      source: Src
    }

export type Level = {
  id: string
  title: string
  blurb: string
  source: Src[]
  hook: { title: string; text: string; recall: string }
  explore: { component: string; params?: Record<string, unknown>; intro: string; tasks: string[]; takeaway: string }
  build: Build
  questions: Question[]
}

export type CheatItem = { label: string; latex?: string; note: string; source: Src }
export type Cheat = { title: string; items: CheatItem[] }

export type Boss = { title: string; intro: string; questions: Question[] }

export type WorldMeta = {
  id: string
  title: string
  week: string
  subtitle: string
  emoji: string
  color: string
  status: 'ready' | 'missing'
  missingNote?: string
  levels: string[] // file stems of level files in order
}
