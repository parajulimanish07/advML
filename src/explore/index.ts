import type { ComponentType } from 'react'

export type ExploreProps = { params: Record<string, unknown> }
import { Distribution, GDDemo, GMMDemo, Gaussian2D, JointBayes, MLEDemo, Moments } from './w1'

const w = (c: ComponentType) => c as unknown as ComponentType<ExploreProps>
export const EXPLORE: Record<string, ComponentType<ExploreProps>> = {
  distribution: w(Distribution),
  jointbayes: w(JointBayes),
  moments: w(Moments),
  gaussian2d: w(Gaussian2D),
  mle: w(MLEDemo),
  gmm: w(GMMDemo),
  gd: w(GDDemo),
}
