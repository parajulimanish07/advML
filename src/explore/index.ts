import type { ComponentType } from 'react'

export type ExploreProps = { params: Record<string, unknown> }
import { ARTrain, AttentionDemo, AutoregDemo, ConvReceptive, KLMC, MadeDemo, ParamCount, SoftmaxMix } from './w2'
import { ELBODemo, LVMMix, LatentSample, MargDemo, PCADemo, Reparam, VAEStep, VIDemo } from './w3'
import { AggDemo, Equivar, GATDemo, GNNTrain, GraphPerm, MPDemo } from './w6'
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
  autoreg: w(AutoregDemo),
  paramcount: w(ParamCount),
  softmaxmix: w(SoftmaxMix),
  made: w(MadeDemo),
  attention: w(AttentionDemo),
  convrf: w(ConvReceptive),
  klmc: w(KLMC),
  lvmmix: w(LVMMix),
  pca: w(PCADemo),
  latentsample: w(LatentSample),
  reparam: w(Reparam),
  elbo: w(ELBODemo),
  vaestep: w(VAEStep),
  marg: w(MargDemo),
  vi: w(VIDemo),
  graphperm: w(GraphPerm),
  equivar: w(Equivar),
  mp: w(MPDemo),
  gnntrain: w(GNNTrain),
  agg: w(AggDemo),
  gat: w(GATDemo),
  artrain: w(ARTrain),
}
