
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

export class GeminiError extends Error {
  constructor(public message: string, public code?: string) {
    super(message);
    this.name = 'GeminiError';
  }
}

export const analyzeAnimalBehavior = async (
  profile: AnimalProfile,
  mediaData: string,
  mimeType: string,
  isAudio: boolean
): Promise<SoundAnalysisResult> => {
  if (!API_KEY) {
    throw new GeminiError("API Key is missing. Please check your environment variables.", "MISSING_KEY");
  }

  try {
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    const model = "gemini-3-flash-preview";
    
    // Sharpened prompt for better sound recognition and faster response
    const prompt = `Analyze this ${isAudio ? 'audio recording' : 'video clip'} of a ${profile.type} named ${profile.name} (${profile.breed || 'Unknown breed'}) in a ${profile.environment} environment. 
    Focus intensity on the animal's vocalizations or body language.
    Identify:
    1. Primary emotion (e.g., Happy, Anxious, Territorial).
    2. Intent or message (e.g., "I want food", "Protecting my space", "I am in pain").
    3. Health/Safety risk level.
    
    Return ONLY a JSON object with: emotion, intent, confidence (0-1), explanation, status (one of: Calm, Alert, Distressed, Emergency), and suggestedActions (array of strings).`;

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
        // Removed thinkingConfig for speed. Removed Search to keep it fast for simple sounds.
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            emotion: { type: Type.STRING },
            intent: { type: Type.STRING },
            confidence: { type: Type.NUMBER },
            explanation: { type: Type.STRING },
            status: { type: Type.STRING },
            suggestedActions: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["emotion", "intent", "confidence", "explanation", "status"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new GeminiError("The AI didn't return any analysis. The sound might be too quiet or unclear.", "EMPTY_RESPONSE");

    const result = JSON.parse(text);
    return { 
      ...result, 
      groundingLinks: response.candidates?.[0]?.groundingMetadata?.groundingChunks
        ?.filter(chunk => chunk.web)
        ?.map(chunk => ({ uri: chunk.web.uri, title: chunk.web.title })) || [] 
    };
  } catch (error: any) {
    console.error("Gemini Analysis Error:", error);
    if (error instanceof GeminiError) throw error;
    
    // Map API errors to human-friendly messages
    if (error.message?.includes("API_KEY_INVALID")) {
      throw new GeminiError("Invalid API Key. Please verify your credentials.", "AUTH_ERROR");
    }
    if (error.message?.includes("quota")) {
      throw new GeminiError("AI usage limit reached. Please try again later.", "QUOTA_EXCEEDED");
    }
    if (error.message?.includes("deadline") || error.code === "DEADLINE_EXCEEDED") {
      throw new GeminiError("The analysis took too long. Check your internet connection or try a shorter clip.", "TIMEOUT");
    }
    
    throw new GeminiError("We couldn't analyze the sound. Make sure the noise is clear and try again.", "UNCERTAIN");
  }
};

export const generateTTS = async (text: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-3.1-flash-tts-preview",
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
