
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

export interface Metric {
  label: string;
  value: string;
  status: 'positive' | 'negative' | 'neutral';
}

export interface AnalysisResponse {
  ticker: string;
  name: string;
  health: number; // 0-100 score
  riskScore: number; // 1-10 rating
  desc: string;
  short: string;
  long: string;
  fundamentals: Metric[];
  technicals: Metric[];
  sentiment: {
    bullish: number;
    bearish: number;
    summary: string;
  };
  catalysts: {
    title: string;
    impact: 'high' | 'medium' | 'low';
    description: string;
  }[];
  sources?: GroundingSource[];
}

export type TabType = 'architect' | 'comparator' | 'pathfinder' | 'pulse';
