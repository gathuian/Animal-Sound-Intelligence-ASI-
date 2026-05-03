
import React, { useState } from 'react';
import { AnimalProfile, Status, SoundAnalysisResult } from '../types';
import { generateTTS, decode, decodeAudioData } from '../services/geminiService';

interface HomeProps {
  profile: AnimalProfile;
  status: Status;
  lastAnalysis: SoundAnalysisResult | null;
  onQuickAnalyze: () => void;
}

const Home: React.FC<HomeProps> = ({ profile, status, lastAnalysis, onQuickAnalyze }) => {
  const [playingTts, setPlayingTts] = useState(false);

  const getStatusColor = (s: Status) => {
    switch (s) {
      case 'Calm': return 'bg-emerald-500';
      case 'Alert': return 'bg-amber-500';
      case 'Distressed': return 'bg-orange-500';
      case 'Emergency': return 'bg-red-500';
      default: return 'bg-slate-400';
    }
  };

  const playTranslation = async () => {
    if (!lastAnalysis || playingTts) return;
    setPlayingTts(true);
    try {
      const base64 = await generateTTS(lastAnalysis.explanation);
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const buffer = await decodeAudioData(decode(base64), ctx, 24000, 1);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.onended = () => setPlayingTts(false);
      source.start();
    } catch (err) {
      console.error(err);
      setPlayingTts(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* Welcome Card */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Hello, {profile.name}'s Family</h2>
          <p className="text-slate-500">Context: {profile.environment} Environment</p>
        </div>
        <div className="p-3 bg-indigo-100 rounded-2xl text-indigo-600">
          <i className="fa-solid fa-sparkles text-xl"></i>
        </div>
      </div>

      {/* Status Banner */}
      <div className={`p-4 rounded-3xl border flex items-center gap-4 shadow-sm transition-all duration-500 ${status === 'Emergency' ? 'bg-red-50 border-red-200 animate-pulse' : 'bg-white border-slate-100'}`}>
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg ${getStatusColor(status)}`}>
          <i className={`fa-solid ${status === 'Emergency' ? 'fa-triangle-exclamation' : 'fa-heart-circle-check'} text-2xl`}></i>
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-slate-800 leading-tight">Current State: {status}</h3>
          <p className="text-sm text-slate-600">{status === 'Calm' ? 'Peaceful and relaxed.' : 'Requires your attention now.'}</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <button onClick={onQuickAnalyze} className="group bg-white p-5 rounded-3xl border border-slate-100 shadow-sm hover:shadow-indigo-100 hover:border-indigo-200 transition-all text-left">
          <div className="w-12 h-12 bg-indigo-50 group-hover:bg-indigo-600 group-hover:text-white rounded-2xl flex items-center justify-center text-indigo-600 transition-colors mb-4">
            <i className="fa-solid fa-microphone-lines text-lg"></i>
          </div>
          <span className="font-bold text-slate-800 block">Listen Live</span>
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Gemini Live Mode</span>
        </button>
        <button className="group bg-slate-900 p-5 rounded-3xl shadow-xl hover:bg-slate-800 transition-all text-left text-white">
          <div className="w-12 h-12 bg-slate-800 group-hover:bg-indigo-500 rounded-2xl flex items-center justify-center text-indigo-400 group-hover:text-white transition-colors mb-4">
            <i className="fa-solid fa-video text-lg"></i>
          </div>
          <span className="font-bold block">Smart Vision</span>
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Video Understanding</span>
        </button>
      </div>

      {/* AI Insights Card */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-800 flex items-center gap-2 text-lg">
            <i className="fa-solid fa-brain-circuit text-indigo-500"></i>
            Behavorial Analysis
          </h3>
          <button onClick={playTranslation} disabled={!lastAnalysis || playingTts} className={`text-indigo-600 hover:scale-110 transition-transform ${playingTts ? 'animate-pulse' : ''}`}>
             <i className={`fa-solid ${playingTts ? 'fa-volume-high' : 'fa-volume-low'} text-xl`}></i>
          </button>
        </div>
        
        {lastAnalysis ? (
          <div className="space-y-4">
            <div className="p-5 bg-indigo-50/50 rounded-3xl border border-indigo-50">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-black text-indigo-600 uppercase tracking-widest">{lastAnalysis.emotion}</span>
                <span className="text-[10px] font-bold bg-white/80 px-2 py-1 rounded-full text-indigo-700 shadow-sm">
                   {Math.round(lastAnalysis.confidence * 100)}% Confidence
                </span>
              </div>
              <p className="text-slate-700 text-sm leading-relaxed font-medium">"{lastAnalysis.explanation}"</p>
            </div>

            {lastAnalysis.suggestedActions && (
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2">Next Steps</p>
                <div className="flex flex-wrap gap-2">
                  {lastAnalysis.suggestedActions.map((action, i) => (
                    <span key={i} className="text-[11px] bg-slate-100 text-slate-600 px-3 py-1.5 rounded-full font-bold">
                      {action}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {lastAnalysis.groundingLinks && lastAnalysis.groundingLinks.length > 0 && (
              <div className="pt-2 border-t border-slate-50 space-y-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2">Verified Care Advice</p>
                {lastAnalysis.groundingLinks.map((link, i) => (
                  <a 
                    key={i} 
                    href={link.uri} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="flex items-center gap-2 p-2 rounded-xl hover:bg-slate-50 transition-colors group"
                  >
                    <i className="fa-solid fa-link text-indigo-400 text-xs"></i>
                    <span className="text-xs text-indigo-600 font-bold group-hover:underline truncate">{link.title}</span>
                  </a>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12 space-y-4">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
              <i className="fa-solid fa-waveform-lines text-3xl text-slate-200"></i>
            </div>
            <p className="text-slate-400 text-sm max-w-[200px] mx-auto leading-relaxed font-medium">
              Start a translation to see AI-powered behavioral insights.
            </p>
          </div>
        )}
      </div>

      {/* Near Help Section (Maps Integration Placeholder) */}
      <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-6 rounded-[2.5rem] text-white shadow-xl shadow-indigo-100">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xl font-bold">Pet Help Nearby</h3>
            <p className="text-indigo-100 text-xs font-medium opacity-80">Connected to Google Maps Grounding</p>
          </div>
          <i className="fa-solid fa-map-location-dot text-3xl opacity-20"></i>
        </div>
        <div className="flex gap-2">
          <button className="flex-1 bg-white/20 hover:bg-white/30 backdrop-blur-md py-3 rounded-2xl text-xs font-bold transition-all">
            Find Vets
          </button>
          <button className="flex-1 bg-white text-indigo-600 py-3 rounded-2xl text-xs font-bold shadow-lg shadow-indigo-900/20 hover:scale-[1.02] transition-all">
            Emergencies
          </button>
        </div>
      </div>
    </div>
  );
};

export default Home;
