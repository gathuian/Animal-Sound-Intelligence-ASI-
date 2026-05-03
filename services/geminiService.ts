
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { AnimalProfile, SoundAnalysisResult, Status, GroundingLink } from "../types";

const API_KEY = process.env.API_KEY || "";

// Helpers for Audio PCM processing
export function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export const analyzeAnimalBehavior = async (
  profile: AnimalProfile,
  mediaData: string,
  mimeType: string,
  isAudio: boolean
): Promise<SoundAnalysisResult> => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  const model = "gemini-2.0-flash-exp";
  
  const prompt = `Analyze this ${isAudio ? 'audio recording' : 'video clip'} of a ${profile.type} named ${profile.name} (Breed: ${profile.breed || 'Unknown'}) in a ${profile.environment} environment.
  Determine the animal's emotional state, intent, and current risk level.
  If you detect potential health issues or distress, use Google Search to find relevant care advice or common behavioral patterns for this breed.
  Respond with a structured JSON object.`;

  const response = await ai.models.generateContent({
    model,
    contents: {
      parts: [
        { inlineData: { data: mediaData.split(',')[1] || mediaData, mimeType } },
        { text: prompt }
      ]
    },
    config: {
      responseMimeType: "application/json",
      tools: [{ googleSearch: {} }],
      thinkingConfig: { thinkingBudget: 1000 },
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          emotion: { type: Type.STRING },
          intent: { type: Type.STRING },
          confidence: { type: Type.NUMBER },
          explanation: { type: Type.STRING },
          status: { type: Type.STRING, description: "One of: Calm, Alert, Distressed, Emergency" },
          suggestedActions: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["emotion", "intent", "confidence", "explanation", "status"]
      }
    }
  });

  const groundingLinks: GroundingLink[] = response.candidates?.[0]?.groundingMetadata?.groundingChunks
    ?.filter(chunk => chunk.web)
    ?.map(chunk => ({ uri: chunk.web.uri, title: chunk.web.title })) || [];

  try {
    const result = JSON.parse(response.text);
    return { ...result, groundingLinks };
  } catch (e) {
    console.error("Failed to parse Gemini response", e);
    throw new Error("Invalid analysis format received");
  }
};

export const generateTTS = async (text: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: `Say with empathy and clarity: ${text}` }] }],
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
  if (!base64Audio) throw new Error("No audio generated");
  return base64Audio;
};
