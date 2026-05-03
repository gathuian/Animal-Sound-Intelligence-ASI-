
import React, { useState } from 'react';
import { AnimalProfile, Status, SoundAnalysisResult, AccessibilitySettings } from '../types';
import { generateTTS, decode, decodeAudioData } from '../services/geminiService';

interface HomeProps {
  profile: AnimalProfile;
  status: Status;
  lastAnalysis: SoundAnalysisResult | null;
  accessibility: AccessibilitySettings;
  onQuickAnalyze: () => void;
}

const Home: React.FC<HomeProps> = ({ profile, status, lastAnalysis, accessibility, onQuickAnalyze }) => {
  const [playingTts, setPlayingTts] = useState(false);
  const highContrast = accessibility.highContrast;

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
    <div className={`space-y-6 transition-all duration-300 ${accessibility.largeText ? 'text-lg' : 'text-base'}`}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`font-bold transition-colors ${highContrast ? 'text-white text-3xl' : 'text-2xl text-slate-800'}`}>
            Hello, {profile.name}'s Family
          </h2>
          <p className={`${highContrast ? 'text-zinc-500' : 'text-slate-500'}`}>
            Context: {profile.environment}
          </p>
        </div>
        {!accessibility.simplifiedUI && (
          <div className={`p-3 rounded-2xl transition-colors ${highContrast ? 'bg-zinc-800 text-white' : 'bg-indigo-100 text-indigo-600'}`}>
            <i className="fa-solid fa-sparkles text-xl"></i>
          </div>
        )}
      </div>

      <div className={`p-4 rounded-3xl border flex items-center gap-4 shadow-sm transition-all duration-300 ${
        status === 'Emergency' 
          ? (highContrast ? 'bg-red-950 border-red-500 animate-pulse' : 'bg-red-50 border-red-200 animate-pulse') 
          : (highContrast ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-100 shadow-sm shadow-indigo-50/20')
      }`}>
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0 ${getStatusColor(status)}`}>
          <i className={`fa-solid ${status === 'Emergency' ? 'fa-triangle-exclamation' : 'fa-heart-circle-check'} text-3xl`}></i>
        </div>
        <div className="flex-1">
          <h3 className={`font-black leading-tight ${highContrast ? 'text-white' : 'text-slate-800'}`}>Current State: {status}</h3>
          <p className={`text-sm ${highContrast ? 'text-zinc-400' : 'text-slate-600'}`}>
            {status === 'Calm' ? 'Everything seems normal.' : 'Attention may be required.'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <button onClick={onQuickAnalyze} className={`group p-5 rounded-3xl border shadow-sm transition-all text-left ${
          highContrast ? 'bg-zinc-900 border-zinc-800 hover:bg-zinc-800' : 'bg-white border-slate-100 hover:shadow-indigo-100 hover:border-indigo-200'
        }`}>
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all mb-4 ${
            highContrast ? 'bg-zinc-800 text-white group-hover:bg-indigo-600' : 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white'
          }`}>
            <i className="fa-solid fa-microphone-lines text-lg"></i>
          </div>
          <span className={`font-bold block ${highContrast ? 'text-white' : 'text-slate-800'}`}>Listen Live</span>
          <span className={`text-[10px] font-black uppercase tracking-widest ${highContrast ? 'text-zinc-600' : 'text-slate-400'}`}>Live API</span>
        </button>
        <button className={`group p-5 rounded-3xl border shadow-sm transition-all text-left ${
          highContrast ? 'bg-white border-white text-black' : 'bg-slate-900 border-slate-900 text-white'
        }`}>
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all mb-4 ${
            highContrast ? 'bg-slate-200 text-black' : 'bg-slate-800 text-indigo-400 group-hover:text-white'
          }`}>
            <i className="fa-solid fa-video text-lg"></i>
          </div>
          <span className="font-bold block">Smart Vision</span>
          <span className={`text-[10px] font-black uppercase tracking-widest ${highContrast ? 'text-zinc-400 opacity-60' : 'text-slate-500'}`}>Motion Cam</span>
        </button>
      </div>

      <div className={`rounded-[2.5rem] border shadow-sm p-6 space-y-4 transition-colors ${
        highContrast ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-100'
      }`}>
        <div className="flex items-center justify-between">
          <h3 className={`font-bold flex items-center gap-2 text-lg ${highContrast ? 'text-white' : 'text-slate-800'}`}>
            <i className="fa-solid fa-brain-circuit text-indigo-500"></i>
            Behavorial Analysis
          </h3>
          <button onClick={playTranslation} disabled={!lastAnalysis || playingTts} className={`text-indigo-600 hover:scale-110 transition-transform ${playingTts ? 'animate-pulse' : ''} ${!lastAnalysis ? 'opacity-20' : ''}`}>
             <i className={`fa-solid ${playingTts ? 'fa-volume-high' : 'fa-volume-low'} text-xl`}></i>
          </button>
        </div>
        
        {lastAnalysis ? (
          <div className="space-y-4">
            <div className={`p-5 rounded-3xl border transition-colors ${
              highContrast ? 'bg-black border-zinc-800 shadow-inner' : 'bg-indigo-50/50 border-indigo-50'
            }`}>
              <div className="flex justify-between items-center mb-3">
                <span className={`text-sm font-black uppercase tracking-widest ${highContrast ? 'text-indigo-400' : 'text-indigo-600'}`}>{lastAnalysis.emotion}</span>
                <span className={`text-[10px] font-bold px-2 py-1 rounded-full shadow-sm ${highContrast ? 'bg-zinc-800 text-zinc-300' : 'bg-white/80 text-indigo-700'}`}>
                   {Math.round(lastAnalysis.confidence * 100)}% Confidence
                </span>
              </div>
              <p className={`font-medium italic leading-relaxed ${highContrast ? 'text-zinc-300' : 'text-slate-700'}`}>"{lastAnalysis.explanation}"</p>
            </div>

            {lastAnalysis.suggestedActions && !accessibility.simplifiedUI && (
              <div className="space-y-2">
                <p className={`text-[10px] font-bold uppercase tracking-widest px-2 ${highContrast ? 'text-zinc-600' : 'text-slate-400'}`}>Next Steps</p>
                <div className="flex flex-wrap gap-2">
                  {lastAnalysis.suggestedActions.map((action, i) => (
                    <span key={i} className={`text-[11px] px-3 py-1.5 rounded-full font-bold shadow-sm ${
                      highContrast ? 'bg-zinc-800 text-zinc-300 border border-zinc-700' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {action}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12 space-y-4">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto ${highContrast ? 'bg-black border border-zinc-800' : 'bg-slate-50'}`}>
              <i className={`fa-solid fa-waveform-lines text-3xl ${highContrast ? 'text-zinc-800' : 'text-slate-200'}`}></i>
            </div>
            <p className={`text-sm max-w-[200px] mx-auto leading-relaxed font-medium ${highContrast ? 'text-zinc-600' : 'text-slate-400'}`}>
              Start a translation to see AI-powered behavioral insights.
            </p>
          </div>
        )}
      </div>
      {/* Near Help Section (Maps Integration Placeholder) */}
      {!accessibility.simplifiedUI && (
        <div className={`p-6 rounded-[2.5rem] text-white shadow-xl shadow-indigo-100 transition-colors ${
          highContrast ? 'bg-zinc-900 border border-zinc-800' : 'bg-gradient-to-br from-indigo-600 to-purple-700'
        }`}>
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-xl font-bold">Pet Help Nearby</h3>
              <p className={`text-xs font-medium opacity-80 ${highContrast ? 'text-zinc-500' : 'text-indigo-100'}`}>
                Crisis Support Grounding
              </p>
            </div>
            <i className="fa-solid fa-map-location-dot text-3xl opacity-20"></i>
          </div>
          <div className="flex gap-2">
            <button className={`flex-1 backdrop-blur-md py-3 rounded-2xl text-xs font-bold transition-all ${
              highContrast ? 'bg-zinc-800 text-white border border-zinc-700' : 'bg-white/20 hover:bg-white/30'
            }`}>
              Find Vets
            </button>
            <button className={`flex-1 py-3 rounded-2xl text-xs font-bold shadow-lg transition-all ${
              highContrast ? 'bg-white text-black' : 'bg-white text-indigo-600'
            }`}>
              Emergencies
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
