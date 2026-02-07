
import { GoogleGenAI, Type } from "@google/genai";
import { AIAdvice, MarineLife } from "../types";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeDetection = async (fish: MarineLife, direction: string, lang: 'zh' | 'en' = 'zh'): Promise<AIAdvice> => {
  const ai = getAI();
  const prompt = `
    As an expert marine biologist and diving safety AI. 
    Analyze the detection of: ${fish.name} (${fish.scientificName}).
    It is currently located in the ${direction} direction of the diver.
    Is it poisonous? ${fish.isPoisonous}. 
    Toxicity Level: ${fish.toxicityLevel || 0}/10.
    
    Provide safety advice for a diver's smart glasses HUD in ${lang === 'zh' ? 'Chinese' : 'English'}.
    - If dangerous: Provide URGENT warning and an escape direction (opposite of ${direction}).
    - If safe: Provide a short educational fun fact.
    Keep it concise for HUD display (max 30 words).
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            species: { type: Type.STRING },
            isDangerous: { type: Type.BOOLEAN },
            warningText: { type: Type.STRING },
            escapeDirection: { type: Type.STRING },
            educationalFact: { type: Type.STRING }
          },
          required: ["species", "isDangerous", "warningText"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("Empty response");
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return {
      species: fish.name,
      isDangerous: fish.isPoisonous,
      warningText: fish.isPoisonous ? "DANGER: Toxic organism detected nearby!" : "Safe organism detected.",
      educationalFact: fish.description
    };
  }
};

export const generateDiveReport = async (
  detections: any[],
  location: string,
  lang: 'zh' | 'en' = 'zh',
  speciesNames?: string
): Promise<string> => {
  const ai = getAI();
  const summary = speciesNames || detections.map(d => d.fishId).join(", ");
  const prompt = `
    Generate a poetic and informative dive summary for a diver who explored ${location} in ${lang === 'zh' ? 'Chinese' : 'English'}.
    They encountered these species: ${summary}.
    Highlight one exciting moment and one safety note.
    Format in professional Markdown.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt
    });
    return response.text || "Dive successfully completed.";
  } catch (error) {
    return "Dive successfully completed.";
  }
};
