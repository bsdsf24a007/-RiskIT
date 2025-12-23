
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
  if (key.startsWith("AIza")) return "GEMINI_3_PRO_IMG";
  return "DISCONNECTED";
};

export const getApiKeyHint = () => {
  const key = getApiKey();
  if (!key) return "NOT_SET";
  return `${key.substring(0, 4)}...${key.substring(key.length - 4)}`;
};

/**
 * Robust JSON parsing for Gemini responses.
 * Grounding tools often inject citations like [1] or markdown blocks which break standard JSON.parse.
 */
const safeJsonParse = (text: string | undefined) => {
  if (!text) return null;
  try {
    // Remove markdown code blocks if present
    let cleaned = text.replace(/```json|```/g, "").trim();
    // Remove grounding citations like [1], [2], etc.
    cleaned = cleaned.replace(/\[\d+\]/g, "");
    // Remove potential leading/trailing non-json text
    const firstBrace = cleaned.indexOf('{');
    const firstBracket = cleaned.indexOf('[');
    let start = -1;
    if (firstBrace !== -1 && firstBracket !== -1) start = Math.min(firstBrace, firstBracket);
    else start = Math.max(firstBrace, firstBracket);
    
    if (start !== -1) {
      const lastBrace = cleaned.lastIndexOf('}');
      const lastBracket = cleaned.lastIndexOf(']');
      const end = Math.max(lastBrace, lastBracket);
      cleaned = cleaned.substring(start, end + 1);
    }
    
    return JSON.parse(cleaned);
  } catch (e) {
    console.error("Critical Parse Error:", e, "Raw Text:", text);
    return null;
  }
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
const GEMINI_SEARCH_MODEL = 'gemini-3-pro-image-preview';

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
  VISUAL DATA: The 'trend' array MUST represent realistic market volatility.
  Return JSON: { "strategy": "string", "nodes": [{"ticker": "string", "name": "string", "trend": [int]}] }`;
  
  const prompt = `Architect a portfolio for $${amount} in the ${market} market ecosystem. Horizon: ${horizon}. Halal: ${halal}. Suggest the top 10 stocks. Ensure trend data is included for visualization.`;

  if (key.startsWith("gsk_")) {
    const text = await callGroq(prompt, systemInstruction);
    return { ...JSON.parse(text), sources: [] };
  }

  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  const response = await ai.models.generateContent({
    model: GEMINI_SEARCH_MODEL,
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
  const data = safeJsonParse(response.text);
  if (!data) throw new Error("Synthesis node failure.");
  return { ...data, sources: extractSources(response) };
};

export const getComparison = async (s1: string, s2: string, market: string, halal: boolean): Promise<ComparisonResponse> => {
  const key = getApiKey();
  const systemInstruction = `Compare two financial nodes using standard market benchmarks. Return JSON: { "winner": "ticker", "decision": "string", "summary": "string", "scorecard": [{"label": "string", "s1Value": "string", "s2Value": "string", "s1Percent": number, "s2Percent": number}] }`;
  const prompt = `Institutional Duel: Compare ${s1} vs ${s2} within the ${market} market context. Halal filter: ${halal}.`;

  if (key.startsWith("gsk_")) {
    const text = await callGroq(prompt, systemInstruction);
    return { ...JSON.parse(text), sources: [] };
  }

  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  const response = await ai.models.generateContent({
    model: GEMINI_SEARCH_MODEL,
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
  const data = safeJsonParse(response.text);
  if (!data) throw new Error("Comparative logic synthesis failed.");
  return { ...data, sources: extractSources(response) };
};

export const getAnalysis = async (ticker: string, market: string, horizon: string, halal: boolean): Promise<AnalysisResponse> => {
  const key = getApiKey();
  const systemInstruction = `You are a Senior Financial Analyst. Audit the ticker for institutional-grade intelligence.
  MANDATORY JSON STRUCTURE:
  {
    "ticker": "string",
    "name": "string",
    "health": int,
    "riskScore": int (1-10),
    "desc": "string",
    "short": "Bullish Bias",
    "long": "Stability Rating",
    "fundamentals": [{"label": "P/E Ratio", "value": "string", "status": "positive|negative|neutral"}, {"label": "Market Cap", "value": "string", "status": "neutral"}],
    "technicals": [{"label": "RSI (14)", "value": "string", "status": "positive"}, {"label": "Beta", "value": "string", "status": "neutral"}],
    "sentiment": { "bullish": int, "bearish": int, "summary": "string" },
    "catalysts": [{"title": "string", "impact": "high|medium|low", "description": "string"}]
  }`;
  
  const prompt = `Comprehensive Pathfinder Audit for ${ticker}. Analyze market segment: ${market}. Consider Halal filter: ${halal}. Focus on real-time data where possible. Request at least 4 fundamental and 4 technical metrics.`;

  if (key.startsWith("gsk_")) {
    const text = await callGroq(prompt, systemInstruction);
    return { ...JSON.parse(text), sources: [] };
  }

  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  const response = await ai.models.generateContent({
    model: GEMINI_SEARCH_MODEL,
    contents: prompt,
    config: {
      systemInstruction,
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json"
    }
  });
  const data = safeJsonParse(response.text);
  if (!data) throw new Error("Pathfinder deep scan failed.");
  return { ...data, sources: extractSources(response) };
};

export const getLogicPulse = async (): Promise<{ items: any[]; sources: GroundingSource[] }> => {
  const key = getApiKey();
  const systemInstruction = `Fetch exactly 5 recent global financial news events. 
  Return JSON: [{ "title": "string", "time": "string", "impact": "High|Medium", "sector": "string" }]`;
  const prompt = 'Fetch top 5 most recent impactful global financial news from the last 24 hours.';

  if (key.startsWith("gsk_")) {
    const text = await callGroq(prompt, systemInstruction);
    return { items: JSON.parse(text), sources: [] };
  }

  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  const response = await ai.models.generateContent({
    model: GEMINI_SEARCH_MODEL,
    contents: prompt,
    config: {
      systemInstruction,
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json"
    }
  });
  const data = safeJsonParse(response.text);
  if (!data || !Array.isArray(data)) throw new Error("Intel feed sync failed.");
  return {
    items: data,
    sources: extractSources(response)
  };
};
