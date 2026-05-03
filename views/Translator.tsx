
import React, { useState, useRef, useEffect } from 'react';
import { AnimalProfile } from '../types';
import { GoogleGenAI, Modality, LiveServerMessage } from '@google/genai';
import { encode, decode, decodeAudioData } from '../services/geminiService';

interface TranslatorProps {
  profile: AnimalProfile;
  onAnalyze: (media: string, mime: string, isAudio: boolean) => Promise<void>;
}

const Translator: React.FC<TranslatorProps> = ({ profile, onAnalyze }) => {
  const [isLive, setIsLive] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Live API Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const sessionRef = useRef<any>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAnalyzing(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const data = reader.result as string;
      const isAudio = file.type.startsWith('audio');
      await onAnalyze(data, file.type, isAudio);
      setAnalyzing(false);
    };
    reader.readAsDataURL(file);
  };

  const startLiveSession = async () => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
      
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.0-flash-exp',
        callbacks: {
          onopen: () => {
            setIsLive(true);
            const source = audioContextRef.current!.createMediaStreamSource(stream);
            const scriptProcessor = audioContextRef.current!.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const l = inputData.length;
              const int16 = new Int16Array(l);
              for (let i = 0; i < l; i++) {
                int16[i] = inputData[i] * 32768;
              }
              const pcmBlob = {
                data: encode(new Uint8Array(int16.buffer)),
                mimeType: 'audio/pcm;rate=16000',
              };
              sessionPromise.then(session => session.sendRealtimeInput({ media: pcmBlob }));
            };
            
            source.connect(scriptProcessor);
            scriptProcessor.connect(audioContextRef.current!.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            // Handle Transcriptions
            if (message.serverContent?.outputTranscription) {
              setLiveTranscript(prev => [...prev.slice(-4), message.serverContent!.outputTranscription!.text]);
            }

            // Handle Audio output (The AI "Translating" back)
            const base64 = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64 && outputAudioContextRef.current) {
              const ctx = outputAudioContextRef.current;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              const buffer = await decodeAudioData(decode(base64), ctx, 24000, 1);
              const source = ctx.createBufferSource();
              source.buffer = buffer;
              source.connect(ctx.destination);
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              sourcesRef.current.add(source);
            }
          },
          onerror: (e) => console.error("Live Error", e),
          onclose: () => setIsLive(false),
        },
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: `You are an expert animal behaviorist translator for a ${profile.type} named ${profile.name}. 
          Listen to the audio and describe the animal's thoughts in short, characterful human phrases. 
          Use search grounding if you hear something unusual.`,
          outputAudioTranscription: {},
        }
      });

      sessionRef.current = await sessionPromise;
    } catch (err: any) {
      console.error("Live translation error:", err);
      const isPermissionError = err.name === 'NotAllowedError' || err.message?.includes('Permission dismissed');
      alert(isPermissionError 
        ? "Microphone access was dismissed or denied. Please check your browser's page settings and try again." 
        : "Microphone access is required for Live translation.");
    }
  };

  const stopLiveSession = () => {
    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }
    if (audioContextRef.current) audioContextRef.current.close();
    if (outputAudioContextRef.current) outputAudioContextRef.current.close();
    setIsLive(false);
  };

  return (
    <div className="space-y-6 flex flex-col items-center pb-12">
      <div className="w-full text-center">
        <h2 className="text-2xl font-bold">Smart Translator</h2>
        <p className="text-slate-500">
          {isLive ? `Listening to ${profile.name}...` : `Translate ${profile.name}'s thoughts.`}
        </p>
      </div>

      {/* Live Waveform Visualization Placeholder */}
      <div className="relative flex items-center justify-center h-64 w-64">
        {isLive && (
          <>
            <div className="absolute inset-0 bg-indigo-100 rounded-full animate-ping opacity-25"></div>
            <div className="absolute inset-4 bg-indigo-200 rounded-full animate-pulse opacity-40"></div>
          </>
        )}
        <button
          onClick={isLive ? stopLiveSession : startLiveSession}
          disabled={analyzing}
          className={`relative z-10 w-48 h-48 rounded-full flex flex-col items-center justify-center transition-all shadow-2xl ${
            isLive ? 'bg-red-500 scale-110 shadow-red-200' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'
          }`}
        >
          <i className={`fa-solid ${isLive ? 'fa-stop' : 'fa-microphone'} text-5xl text-white mb-2`}></i>
          <span className="text-white text-xs font-bold tracking-widest uppercase">
            {isLive ? 'Stop Live' : analyzing ? 'Analyzing...' : 'Listen Live'}
          </span>
        </button>
      </div>

      {/* Live Transcription Display */}
      {isLive && liveTranscript.length > 0 && (
        <div className="w-full max-w-sm space-y-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Real-time Interpretation</h4>
          <div className="bg-white/80 backdrop-blur-md p-4 rounded-2xl border border-indigo-100 shadow-xl shadow-indigo-50 min-h-[100px] flex flex-col justify-center text-center">
             <p className="text-indigo-900 font-medium italic">"{liveTranscript[liveTranscript.length - 1]}"</p>
          </div>
        </div>
      )}

      {/* Upload Section */}
      {!isLive && (
        <div className="w-full max-w-sm space-y-4">
          <div className="relative text-center my-4">
            <span className="px-2 bg-slate-50 text-slate-400 text-xs font-bold uppercase tracking-widest relative z-10">Or analyze history</span>
            <div className="absolute top-1/2 left-0 right-0 h-px bg-slate-200 -z-0"></div>
          </div>

          <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="audio/*,video/*" />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full bg-white border-2 border-dashed border-slate-300 py-6 rounded-3xl text-slate-500 hover:border-indigo-400 hover:text-indigo-600 transition-all flex flex-col items-center gap-2"
          >
            <i className="fa-solid fa-cloud-arrow-up text-2xl"></i>
            <span className="font-medium">Upload Audio or Video</span>
          </button>
        </div>
      )}

      {analyzing && (
        <div className="w-full max-w-sm p-4 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center gap-4">
          <div className="animate-spin text-indigo-600"><i className="fa-solid fa-circle-notch text-xl"></i></div>
          <div className="flex-1">
            <div className="h-2 w-full bg-indigo-100 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-600 animate-[loading_2s_ease-in-out_infinite]"></div>
            </div>
            <p className="text-xs font-bold text-indigo-600 mt-2 tracking-wide uppercase">AI Deep Thinking Analysis...</p>
          </div>
        </div>
      )}

      <style>{`
        @keyframes loading { 0% { width: 0% } 50% { width: 70% } 100% { width: 100% } }
      `}</style>
    </div>
  );
};

export default Translator;
