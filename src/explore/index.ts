import type { ComponentType } from 'react'

export type ExploreProps = { params: Record<string, unknown> }
import { ARTrain, AttentionDemo, AutoregDemo, ConvReceptive, KLMC, MadeDemo, ParamCount, SoftmaxMix } from './w2'
import { ELBODemo, LVMMix, LatentSample, MargDemo, PCADemo, Reparam, VAEStep, VIDemo } from './w3'
import { AggDemo, Equivar, GATDemo, GNNTrain, GraphPerm, MPDemo } from './w6'
import { ModulesDemo, GraphManip, HeadsDemo, LinkPredDemo, MetricsDemo, OverSmooth, ReceptiveField, SplitDemo } from './w7'
import { HeteroAgg, LinkRank, RGCNLayer, RGCNParams, Relations } from './w8'
import { BellmanGrid, CliffDemo, DDPGDemo, DQNTarget, DiscountDemo, MazeAgent, Overestimate, QLearnGrid, VQDemo } from './w9'
import { Distribution, GDDemo, GMMDemo, Gaussian2D, JointBayes, MLEDemo, Moments } from './w1'

const w = (c: ComponentType<never>) => c as unknown as ComponentType<ExploreProps>
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
  oversmooth: w(OverSmooth),
  modules: w(ModulesDemo),
  receptive: w(ReceptiveField),
  graphmanip: w(GraphManip),
  heads: w(HeadsDemo),
  metrics: w(MetricsDemo),
  split: w(SplitDemo),
  linkpred: w(LinkPredDemo),
  relations: w(Relations),
  rgcnlayer: w(RGCNLayer),
  rgcnparams: w(RGCNParams),
  linkrank: w(LinkRank),
  heteroagg: w(HeteroAgg),
  maze: w(MazeAgent),
  discount: w(DiscountDemo),
  vq: w(VQDemo),
  bellman: w(BellmanGrid),
  qlearn: w(QLearnGrid),
  cliff: w(CliffDemo),
  dqn: w(DQNTarget),
  ddpg: w(DDPGDemo),
  overest: w(Overestimate),
  artrain: w(ARTrain),
}
