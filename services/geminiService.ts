
import { GoogleGenAI, Type } from "@google/genai";
import { RecommendationResponse, ComparisonResponse, AnalysisResponse, GroundingSource } from "../types";

// The API key is obtained exclusively from process.env.API_KEY.
const getApiKey = () => {
  const rawKey = process.env.API_KEY;
  if (!rawKey) return "";
  return rawKey.trim().replace(/^["']|["']$/g, '');
};

export const getEngineStatus = () => {
  const key = getApiKey();
  if (key.startsWith("gsk_")) return "GROQ_L3_70B";
  if (key.startsWith("AIza")) return "GEMINI_3_PRO";
  return "DISCONNECTED";
};

export const getApiKeyHint = () => {
  const key = getApiKey();
  if (!key) return "NOT_SET";
  return `${key.substring(0, 4)}...${key.substring(key.length - 4)}`;
};

// --- Groq Integration ---
const callGroq = async (prompt: string, systemInstruction: string) => {
  const apiKey = getApiKey();
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemInstruction + " IMPORTANT: Return ONLY valid JSON." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.2
    })
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(`GROQ_ERROR: ${err.error?.message || response.statusText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
};

// --- Gemini Integration ---
const getGeminiClient = () => new GoogleGenAI({ apiKey: getApiKey() });
const GEMINI_MODEL = 'gemini-3-pro-preview';

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

// --- Unified Services ---

export const getArchitectStrategy = async (amount: string, market: string, horizon: string, halal: boolean): Promise<RecommendationResponse> => {
  const key = getApiKey();
  const systemInstruction = `You are a Quantitative Architect. 
  MANDATE: Provide exactly 10 high-conviction stock nodes. 
  VISUAL DATA: The 'trend' array MUST represent realistic market volatility with significant numeric variation (no flat lines). 
  Return JSON: { "strategy": "string", "nodes": [{"ticker": "string", "name": "string", "trend": [int]}] }`;
  
  const prompt = `Architect a portfolio for $${amount} in the ${market} ecosystem. Horizon: ${horizon}. Halal: ${halal}. Suggest the top 10 stocks. Ensure the trend data shows active price action.`;

  if (key.startsWith("gsk_")) {
    const text = await callGroq(prompt, systemInstruction);
    return { ...JSON.parse(text), sources: [] };
  }

  const ai = getGeminiClient();
  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: prompt,
    config: {
      systemInstruction,
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          strategy: { type: Type.STRING },
          nodes: {
            type: Type.ARRAY,
            minItems: 10,
            maxItems: 10,
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
  const key = getApiKey();
  const systemInstruction = `Compare two financial nodes. Use standard market benchmarks. Return JSON: { "winner": "ticker", "decision": "string", "summary": "string", "scorecard": [{"label": "string", "s1Value": "string", "s2Value": "string", "s1Percent": number, "s2Percent": number}] }`;
  const prompt = `Institutional Duel: ${s1} vs ${s2} in ${market}. Halal filter: ${halal}.`;

  if (key.startsWith("gsk_")) {
    const text = await callGroq(prompt, systemInstruction);
    return { ...JSON.parse(text), sources: [] };
  }

  const ai = getGeminiClient();
  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: prompt,
    config: {
      systemInstruction,
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
  const key = getApiKey();
  const systemInstruction = `Audit ticker/index. MANDATORY: The 'sentiment' array MUST contain exactly two objects: one for "Bullish Sentiment" and one for "Bearish Sentiment". 
  Return JSON: { "ticker": "string", "name": "string", "health": float, "desc": "string", "short": "string", "long": "string", "metrics": [{"label": "string", "value": "string", "status": "positive|negative|neutral"}], "sentiment": [{"label": "string", "score": int}], "catalysts": [{"title": "string", "impact": "high|medium|low"}] }`;
  const prompt = `Deep Audit: ${ticker} in ${market}. Halal: ${halal}.`;

  if (key.startsWith("gsk_")) {
    const text = await callGroq(prompt, systemInstruction);
    return { ...JSON.parse(text), sources: [] };
  }

  const ai = getGeminiClient();
  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: prompt,
    config: {
      systemInstruction,
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
            minItems: 2,
            maxItems: 2,
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

export const getLogicPulse = async (): Promise<{ items: any[]; sources: GroundingSource[] }> => {
  const key = getApiKey();
  const systemInstruction = `Fetch 5 real-time news events. Return JSON: [{ "title": "string", "time": "string", "impact": "High|Medium", "sector": "string" }]`;
  const prompt = 'Institutional market intel feed.';

  if (key.startsWith("gsk_")) {
    const text = await callGroq(prompt, systemInstruction);
    return { items: JSON.parse(text), sources: [] };
  }

  const ai = getGeminiClient();
  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: prompt,
    config: {
      systemInstruction,
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
