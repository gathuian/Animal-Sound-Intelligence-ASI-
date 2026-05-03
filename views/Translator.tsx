
import React, { useState, useRef, useEffect } from 'react';
import { AnimalProfile, AccessibilitySettings } from '../types';
import { GoogleGenAI, Modality, LiveServerMessage } from '@google/genai';
import { encode, decode, decodeAudioData } from '../services/geminiService';

interface TranslatorProps {
  profile: AnimalProfile;
  accessibility: AccessibilitySettings;
  onAnalyze: (media: string, mime: string, isAudio: boolean) => Promise<void>;
}

const Translator: React.FC<TranslatorProps> = ({ profile, accessibility, onAnalyze }) => {
  const [isLive, setIsLive] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState<string[]>([]);
  const [useCamera, setUseCamera] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Live API Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sessionRef = useRef<any>(null);
  const nextStartTimeRef = useRef(0);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number>(0);

  const highContrast = accessibility.highContrast;

  // Visualizer Animation
  const drawVisualizer = () => {
    if (!analyserRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyserRef.current.getByteTimeDomainData(dataArray);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineWidth = 3;
    ctx.strokeStyle = highContrast ? '#fff' : '#4f46e5';
    ctx.beginPath();

    const sliceWidth = canvas.width / bufferLength;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
      const v = dataArray[i] / 128.0;
      const y = (v * canvas.height) / 2;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
      x += sliceWidth;
    }

    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();
    animationFrameRef.current = requestAnimationFrame(drawVisualizer);
  };

  const startLiveSession = async () => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
      
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;

      const constraints: MediaStreamConstraints = { 
        audio: true,
        video: useCamera ? { facingMode: 'environment' } : false
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (useCamera && videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      const sessionPromise = ai.live.connect({
        model: 'gemini-3.1-flash-live-preview',
        callbacks: {
          onopen: () => {
            setIsLive(true);
            const source = audioContextRef.current!.createMediaStreamSource(stream);
            source.connect(analyserRef.current!);
            
            const scriptProcessor = audioContextRef.current!.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              if (sessionRef.current) {
                const inputData = e.inputBuffer.getChannelData(0);
                const int16 = new Int16Array(inputData.length);
                for (let i = 0; i < inputData.length; i++) {
                  int16[i] = Math.max(-1, Math.min(1, inputData[i])) * 32767;
                }
                sessionRef.current.send({
                  realtimeInput: {
                    mediaChunks: [{
                      data: encode(new Uint8Array(int16.buffer)),
                      mimeType: 'audio/pcm;rate=16000'
                    }]
                  }
                });
              }
            };
            
            source.connect(scriptProcessor);
            scriptProcessor.connect(audioContextRef.current!.destination);
            drawVisualizer();

            // Video frame sending loop
            if (useCamera) {
              const sendVideoFrame = () => {
                if (!sessionRef.current || !videoRef.current) return;
                
                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = 320;
                tempCanvas.height = 240;
                const tempCtx = tempCanvas.getContext('2d');
                if (tempCtx) {
                  tempCtx.drawImage(videoRef.current, 0, 0, 320, 240);
                  const base64 = tempCanvas.toDataURL('image/jpeg', 0.5).split(',')[1];
                  sessionRef.current.send({
                    realtimeInput: {
                      mediaChunks: [{
                        data: base64,
                        mimeType: 'image/jpeg'
                      }]
                    }
                  });
                }
                setTimeout(sendVideoFrame, 1000); // 1 FPS for balance
              };
              setTimeout(sendVideoFrame, 2000); // Wait for warm up
            }
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.outputTranscription) {
              setLiveTranscript(prev => [...prev.slice(-4), message.serverContent!.outputTranscription!.text]);
            }

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
            }
          },
          onerror: (e) => console.error("Live Error", e),
          onclose: () => setIsLive(false),
        },
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: `You are an expert animal behaviorist translator. 
          The animal is a ${profile.type} named ${profile.name}.
          ${profile.breed ? `Breed: ${profile.breed}.` : ''} 
          Environment: ${profile.environment}.
          
          If you see a video feed, analyze body language (ears, tail, posture).
          If you hear audio, analyze pitch and duration of vocalizations.
          
          Translate the animal's thoughts into SHORT, witty, characterful first-person phrases.
          Example: "Human! The food bowl is dangerously empty. My survival is at stake!"
          Keep it to 1 sentence.`,
          outputAudioTranscription: {},
        }
      });

      sessionRef.current = await sessionPromise;
    } catch (err: any) {
      console.error("Live translation error:", err);
      const isPermissionError = err.name === 'NotAllowedError' || err.message?.includes('Permission dismissed');
      alert(isPermissionError 
        ? "Microphone (and Camera) access was dismissed or denied." 
        : "Media access is required for Live translation.");
    }
  };

  const stopLiveSession = () => {
    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }
    if (audioContextRef.current) audioContextRef.current.close();
    if (outputAudioContextRef.current) outputAudioContextRef.current.close();
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    cancelAnimationFrame(animationFrameRef.current);
    setIsLive(false);
  };

  useEffect(() => {
    return () => stopLiveSession();
  }, []);

  return (
    <div className={`space-y-6 flex flex-col items-center pb-12 ${accessibility.largeText ? 'text-lg' : 'text-base'}`}>
      <div className="w-full text-center space-y-1">
        <h2 className={`font-bold transition-colors ${highContrast ? 'text-white text-3xl' : 'text-2xl'}`}>Smart Translator</h2>
        <p className={`${highContrast ? 'text-zinc-400' : 'text-slate-500'}`}>
          {isLive ? `Tuning into ${profile.name}...` : `Interpret ${profile.name}'s world.`}
        </p>
      </div>

      <div className="flex items-center gap-4 mb-2">
         <button 
           onClick={() => setUseCamera(!useCamera)}
           disabled={isLive}
           className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all text-xs font-bold uppercase tracking-widest ${
             useCamera 
              ? (highContrast ? 'bg-white text-black' : 'bg-indigo-600 text-white shadow-lg shadow-indigo-200') 
              : (highContrast ? 'bg-zinc-800 text-zinc-500' : 'bg-slate-100 text-slate-500')
           }`}
         >
           <i className={`fa-solid ${useCamera ? 'fa-video' : 'fa-video-slash'}`}></i>
           {useCamera ? 'Visual Mode ON' : 'Visual Mode OFF'}
         </button>
      </div>

      <div className="relative flex items-center justify-center h-72 w-full max-w-sm">
        {isLive && useCamera && (
          <video 
            ref={videoRef} 
            autoPlay 
            muted 
            playsInline 
            className="absolute inset-0 w-full h-full object-cover rounded-[3rem] opacity-40 grayscale"
          />
        )}
        
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
           {isLive && (
             <canvas 
               ref={canvasRef} 
               width={300} 
               height={100} 
               className="w-full h-24 mb-4"
             />
           )}
           <button
            onClick={isLive ? stopLiveSession : startLiveSession}
            disabled={analyzing}
            className={`relative z-10 w-44 h-44 rounded-full flex flex-col items-center justify-center transition-all shadow-2xl ${
              isLive ? 'bg-red-500 scale-105 shadow-red-200' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'
            }`}
          >
            <i className={`fa-solid ${isLive ? 'fa-stop' : 'fa-microphone'} text-5xl text-white mb-2`}></i>
            <span className="text-white text-[10px] font-bold tracking-widest uppercase">
              {isLive ? 'Stop Live' : analyzing ? 'Analyzing...' : 'Listen Live'}
            </span>
          </button>
        </div>
      </div>

      {isLive && liveTranscript.length > 0 && (
        <div className="w-full max-w-sm space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h4 className={`text-[10px] font-bold uppercase tracking-widest text-center ${highContrast ? 'text-zinc-500' : 'text-slate-400'}`}>AI Interpretation</h4>
          <div className={`p-6 rounded-3xl border shadow-xl min-h-[100px] flex flex-col justify-center text-center transition-colors ${
            highContrast ? 'bg-zinc-900 border-zinc-800' : 'bg-white/90 backdrop-blur-md border-indigo-50 shadow-indigo-50'
          }`}>
             <p className={`font-medium italic leading-relaxed ${highContrast ? 'text-white' : 'text-indigo-900'}`}>"{liveTranscript[liveTranscript.length - 1]}"</p>
          </div>
        </div>
      )}

      {/* Simplified controls for accessibility */}
      {!isLive && (!accessibility.simplifiedUI || user.accessibilitySettings?.simplifiedUI === false) && (
        <div className="w-full max-w-sm space-y-4">
          <div className="relative text-center my-6">
            <span className={`px-2 text-[10px] font-bold uppercase tracking-widest relative z-10 ${
              highContrast ? 'bg-black text-zinc-500' : 'bg-slate-50 text-slate-400'
            }`}>Or legacy modes</span>
            <div className={`absolute top-1/2 left-0 right-0 h-px -z-0 ${highContrast ? 'bg-zinc-800' : 'bg-slate-200'}`}></div>
          </div>

          <input type="file" ref={fileInputRef} onChange={(e) => {
             const file = e.target.files?.[0];
             if (file) {
               setAnalyzing(true);
               const reader = new FileReader();
               reader.onload = async () => onAnalyze(reader.result as string, file.type, file.type.startsWith('audio')).finally(() => setAnalyzing(false));
               reader.readAsDataURL(file);
             }
          }} className="hidden" accept="audio/*,video/*" />
          
          <button
            onClick={() => fileInputRef.current?.click()}
            className={`w-full py-6 rounded-3xl border-2 border-dashed transition-all flex flex-col items-center gap-2 ${
              highContrast ? 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-600' : 'bg-white border-slate-300 text-slate-500 hover:border-indigo-400 hover:text-indigo-600'
            }`}
          >
            <i className="fa-solid fa-cloud-arrow-up text-2xl"></i>
            <span className="font-bold text-sm">Upload File</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default Translator;
