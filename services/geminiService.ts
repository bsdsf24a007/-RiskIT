
import { GoogleGenAI, Type } from "@google/genai";
import { RecommendationResponse, ComparisonResponse, AnalysisResponse, GroundingSource } from "../types";

// The API key must be obtained exclusively from the environment variable process.env.API_KEY.
const getApiKey = () => {
  const rawKey = process.env.API_KEY;
  if (!rawKey) return "";
  // Sanitize: Remove quotes, spaces, and invisible characters
  return rawKey.trim().replace(/^["']|["']$/g, '');
};

// Return hint for debugging without exposing the whole key
export const getApiKeyHint = () => {
  const key = getApiKey();
  if (!key) return "NOT_SET";
  return `${key.substring(0, 4)}...${key.substring(key.length - 4)}`;
};

// Always use new GoogleGenAI({ apiKey: process.env.API_KEY })
const getClient = () => new GoogleGenAI({ apiKey: getApiKey() });

const extractSources = (response: any): GroundingSource[] => {
  const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
  if (!chunks) return [];
  return chunks
    .filter((c: any) => c.web)
    .map((c: any) => ({
      title: c.web.title || 'Source',
      uri: c.web.uri
    }));
};

// Use 'gemini-3-pro-preview' for Complex Text Tasks like advanced reasoning and quantitative architecture.
const MODEL_NAME = 'gemini-3-pro-preview';

export const getArchitectStrategy = async (amount: string, market: string, horizon: string, halal: boolean): Promise<RecommendationResponse> => {
  const ai = getClient();
  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Architect a portfolio for $${amount} in the ${market} ecosystem. Horizon: ${horizon}. Halal: ${halal}.`,
      config: {
        systemInstruction: `You are a Quantitative Architect. MARKET RESOLUTION: If user provides a country, resolve to its main exchange. DATA FIDELITY: Trend MUST be 7 variant integers. Halal: strictly exclude non-halal. Return JSON.`,
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            strategy: { type: Type.STRING },
            nodes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  ticker: { type: Type.STRING },
                  name: { type: Type.STRING },
                  trend: { type: Type.ARRAY, items: { type: Type.INTEGER } }
                },
                required: ["ticker", "name", "trend"]
              }
            }
          },
          required: ["strategy", "nodes"]
        }
      }
    });
    // The text property directly returns the string output.
    const textOutput = response.text || "{}";
    return { ...JSON.parse(textOutput), sources: extractSources(response) };
  } catch (error: any) {
    if (error.message?.includes('400') || error.message?.includes('API key not valid')) {
      throw new Error("API_KEY_INVALID: Google rejected this key.");
    }
    throw error;
  }
};

export const getComparison = async (s1: string, s2: string, market: string, halal: boolean): Promise<ComparisonResponse> => {
  const ai = getClient();
  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Compare ${s1} vs ${s2} in context of ${market}. Halal filter: ${halal}.`,
      config: {
        systemInstruction: `Compare two financial nodes. Provide unique values for s1Value/s2Value. Output JSON.`,
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            winner: { type: Type.STRING },
            decision: { type: Type.STRING },
            summary: { type: Type.STRING },
            scorecard: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  label: { type: Type.STRING },
                  s1Value: { type: Type.STRING },
                  s2Value: { type: Type.STRING },
                  s1Percent: { type: Type.NUMBER },
                  s2Percent: { type: Type.NUMBER }
                },
                required: ["label", "s1Value", "s2Value", "s1Percent", "s2Percent"]
              }
            }
          },
          required: ["winner", "decision", "summary", "scorecard"]
        }
      }
    });
    const textOutput = response.text || "{}";
    return { ...JSON.parse(textOutput), sources: extractSources(response) };
  } catch (error: any) {
    if (error.message?.includes('400') || error.message?.includes('API key not valid')) {
      throw new Error("API_KEY_INVALID: Google rejected this key.");
    }
    throw error;
  }
};

export const getAnalysis = async (ticker: string, market: string, horizon: string, halal: boolean): Promise<AnalysisResponse> => {
  const ai = getClient();
  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Deep Audit of ${ticker} in ${market}. Halal: ${halal}.`,
      config: {
        systemInstruction: `Analyze ticker health. METRICS: 6 data-driven metrics. Output JSON.`,
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            ticker: { type: Type.STRING },
            name: { type: Type.STRING },
            health: { type: Type.NUMBER },
            desc: { type: Type.STRING },
            short: { type: Type.STRING },
            long: { type: Type.STRING },
            metrics: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  label: { type: Type.STRING },
                  value: { type: Type.STRING },
                  status: { type: Type.STRING }
                }
              }
            },
            sentiment: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  label: { type: Type.STRING },
                  score: { type: Type.NUMBER }
                }
              }
            },
            catalysts: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  impact: { type: Type.STRING }
                }
              }
            }
          },
          required: ["ticker", "name", "health", "desc", "short", "long", "metrics", "sentiment", "catalysts"]
        }
      }
    });
    const textOutput = response.text || "{}";
    return { ...JSON.parse(textOutput), sources: extractSources(response) };
  } catch (error: any) {
    if (error.message?.includes('400') || error.message?.includes('API key not valid')) {
      throw new Error("API_KEY_INVALID: Google rejected this key.");
    }
    throw error;
  }
};

export const getLogicPulse = async (): Promise<{ items: any[]; sources: GroundingSource[] }> => {
  const ai = getClient();
  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: 'Latest high-impact financial events globally.',
      config: {
        systemInstruction: `Fetch 5 real-time market news events. Output JSON.`,
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              time: { type: Type.STRING },
              impact: { type: Type.STRING },
              sector: { type: Type.STRING }
            }
          }
        }
      }
    });
    const textOutput = response.text || "[]";
    return {
      items: JSON.parse(textOutput),
      sources: extractSources(response)
    };
  } catch (error: any) {
    if (error.message?.includes('400') || error.message?.includes('API key not valid')) {
      throw new Error("API_KEY_INVALID: Google rejected this key.");
    }
    throw error;
  }
};
