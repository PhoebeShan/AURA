
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { ContributionType } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

// Cache key for the hugging sound
const HUG_SOUND_CACHE_KEY = 'aura_hug_sound_v1';

export const analyzeLabor = async (input: string) => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `请分析这项家务劳动/隐形劳动的价值，并将其量化: "${input}"`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          points: { type: Type.INTEGER, description: "总能量点数 (1点 = 1元人民币价值)" },
          type: { 
            type: Type.STRING, 
            enum: Object.values(ContributionType),
            description: "主要劳动贡献类型。" 
          },
          outsourceCost: { type: Type.NUMBER, description: "外包成本" },
          opportunityCost: { type: Type.NUMBER, description: "机会成本" },
          explanation: { type: Type.STRING, description: "核心贡献总结" },
          valuationLogic: { 
            type: Type.STRING, 
            description: "详细说明如何计算出外包成本和机会成本的数学过程。" 
          },
          referenceLink: { 
            type: Type.STRING, 
            description: "链接" 
          }
        },
        required: ["points", "type", "outsourceCost", "opportunityCost", "explanation", "valuationLogic", "referenceLink"]
      },
      systemInstruction: "你是一位专门研究家庭隐形劳动价值的社会经济学家。请始终使用简体中文回答。"
    }
  });

  return JSON.parse(response.text || '{}');
};

export interface MarketValuationResult {
  price: number;
  sources: { title: string; uri: string }[];
}

/**
 * High-performance Market Valuation with Google Search Grounding.
 * Specifically targets Chinese retail prices (CNY).
 */
export const getMarketValuation = async (wishTitle: string): Promise<MarketValuationResult> => {
  try {
    // We use gemini-3-flash-preview for the fastest possible search-grounded response.
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview', 
      contents: `查下“${wishTitle}”目前在中国主流消费市场（如京东、天猫、拼多多、携程或官网）的公允零售价格是多少人民币。
      只需返回最接近的单一数字，不要任何单位或符号。如果是一个价格区间，取中位数。`,
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0,
        thinkingConfig: { thinkingBudget: 0 }, // Optimized for speed
        maxOutputTokens: 100
      }
    });
    
    const text = response.text || '';
    // Extract only digits and decimal point
    const match = text.replace(/,/g, '').match(/\d+(\.\d+)?/);
    const price = match ? Math.round(parseFloat(match[0])) : 0;
    
    // Extract grounding sources
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources = chunks
      .filter((c: any) => c.web && c.web.uri)
      .map((c: any) => ({
        title: c.web.title || '市场公认参考价',
        uri: c.web.uri
      }))
      .slice(0, 1); // Get the most relevant one

    return { 
      price: price > 0 ? price : 500, // Reasonable fallback
      sources 
    };
  } catch (error) {
    console.error("Valuation Search Error:", error);
    return { price: 500, sources: [] };
  }
};

export const generateWishImage = async (wishTitle: string): Promise<string> => {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [{ text: `High quality cinematic photo of ${wishTitle}, minimalist luxury design, elegant lighting.` }]
    },
    config: {
      imageConfig: { aspectRatio: "1:1" }
    }
  });

  if (response.candidates?.[0]?.content?.parts) {
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  return `https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&q=80&w=400`;
};

export const generateHuggingSound = async (): Promise<string | null> => {
  const cached = localStorage.getItem(HUG_SOUND_CACHE_KEY);
  if (cached) return cached;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: '说出：抱抱！声音要非常温柔可爱。' }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });
    
    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      const dataUri = `data:audio/pcm;base64,${base64Audio}`;
      try {
        localStorage.setItem(HUG_SOUND_CACHE_KEY, dataUri);
      } catch (e) {
        console.warn("LocalStorage full, audio not cached.");
      }
      return dataUri;
    }
    return null;
  } catch (err: any) {
    return null;
  }
};
