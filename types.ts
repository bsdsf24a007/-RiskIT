
export interface NodeData {
  ticker: string;
  name: string;
  trend: number[];
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface RecommendationResponse {
  strategy: string;
  nodes: NodeData[];
  sources?: GroundingSource[];
}

export interface ScorecardMetric {
  label: string;
  s1Value: string | number;
  s2Value: string | number;
  s1Percent: number; // 0-100 for visual bar
  s2Percent: number; // 0-100 for visual bar
}

export interface ComparisonResponse {
  winner: string;
  decision: string;
  summary: string;
  scorecard: ScorecardMetric[];
  sources?: GroundingSource[];
}

export interface AnalysisResponse {
  ticker: string;
  name: string;
  health: number;
  desc: string;
  short: string;
  long: string;
  metrics: {
    label: string;
    value: string;
    status: 'positive' | 'negative' | 'neutral';
  }[];
  sentiment: {
    label: string;
    score: number; // 0-100
  }[];
  catalysts: {
    title: string;
    impact: 'high' | 'medium' | 'low';
  }[];
  sources?: GroundingSource[];
}

export type TabType = 'architect' | 'comparator' | 'pathfinder' | 'pulse';
