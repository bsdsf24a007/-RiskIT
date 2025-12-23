
import { GoogleGenAI, Type } from "@google/genai";
import { RecommendationResponse, ComparisonResponse, AnalysisResponse, GroundingSource } from "../types";

// Helper to get the key and sanitize it
const getApiKey = () => {
  let key = process.env.API_KEY;
  
  // Handle stringified 'undefined' or 'null' from build injection
  if (!key || key === "undefined" || key === "null") {
    throw new Error("BUILD_ERROR: API_KEY is undefined. You must set it in Vercel/System Env and REDEPLOY.");
  }

  // Sanitize: Remove quotes and whitespace that users often accidentally paste
  key = key.trim().replace(/^["'](.+)["']$/, '$1');

  if (key.length < 20) {
    throw new Error(`INVALID_KEY: The provided API_KEY is too short (${key.length} chars). Check your Vercel settings.`);
  }

  if (!key.startsWith("AIza")) {
    throw new Error("INVALID_KEY: Key must start with 'AIza'. Check your Gemini API key.");
  }

  return key;
};

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

const MODEL_NAME = 'gemini-3-flash-preview';

export const getArchitectStrategy = async (amount: string, market: string, horizon: string, halal: boolean): Promise<RecommendationResponse> => {
  const ai = getClient();
  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: `Architect a portfolio for $${amount} in the ${market} ecosystem. Horizon: ${horizon}. Halal: ${halal}.`,
    config: {
      systemInstruction: `You are a Quantitative Architect. 
      MARKET RESOLUTION: If the user provides a country name like "Pakistan", "USA", or "UK", automatically resolve this to its primary stock exchange (e.g., Pakistan Stock Exchange, NYSE/NASDAQ, London Stock Exchange). 
      DATA FIDELITY: The "trend" array MUST contain 7 integers with high variance (e.g., [42, 58, 31, 89, 64, 95, 72]). DO NOT return flat or repetitive values.
      If Halal is true, strictly exclude non-halal entities. Return JSON.`,
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

  return { ...JSON.parse(response.text || "{}"), sources: extractSources(response) };
};

export const getComparison = async (s1: string, s2: string, market: string, halal: boolean): Promise<ComparisonResponse> => {
  const ai = getClient();
  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: `Compare ${s1} vs ${s2} in context of ${market}. Halal filter: ${halal}.`,
    config: {
      systemInstruction: `Risk Arb Specialist: Compare two nodes across distinct financial dimensions. Provide unique values for s1Value/s2Value. Ensure the s1Percent/s2Percent values represent relative dominance clearly. Output JSON.`,
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

  return { ...JSON.parse(response.text || "{}"), sources: extractSources(response) };
};

export const getAnalysis = async (ticker: string, market: string, horizon: string, halal: boolean): Promise<AnalysisResponse> => {
  const ai = getClient();
  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: `Deep Audit of ${ticker} in ${market}. Halal: ${halal}.`,
    config: {
      systemInstruction: `Analyze the ticker health. 
      If input is a country name (e.g. "Pakistan"), automatically analyze its main stock index (PSX). 
      HEALTH: Decimal between 0 and 1. 
      METRICS: Include 6 data-driven metrics: Market Cap, P/E Ratio, Dividend Yield, Price/Book, Debt-to-Equity, and Beta. 
      CATALYSTS: Include 3 specific catalysts with high/medium/low impact. 
      Output JSON.`,
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

  return { ...JSON.parse(response.text || "{}"), sources: extractSources(response) };
};

// Fix: Extract grounding sources for the Pulse logic as required by the guidelines
export const getLogicPulse = async (): Promise<{ items: any[]; sources: GroundingSource[] }> => {
  const ai = getClient();
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

  return {
    items: JSON.parse(response.text || "[]"),
    sources: extractSources(response)
  };
};
