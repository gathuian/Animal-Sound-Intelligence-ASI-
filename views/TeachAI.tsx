
import React, { useState } from 'react';
import { AnimalProfile } from '../types';

interface TeachAIProps {
  profile: AnimalProfile;
}

const TeachAI: React.FC<TeachAIProps> = ({ profile }) => {
  const [explanation, setExplanation] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleTrain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!explanation || !isVerified) return;

    setSubmitting(true);
    // Simulate training process
    setTimeout(() => {
      setSubmitting(false);
      alert(`Thank you! ASI has updated its context for ${profile.name} based on your feedback.`);
      setExplanation('');
      setIsVerified(false);
    }, 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white text-xl">
          <i className="fa-solid fa-graduation-cap"></i>
        </div>
        <div>
          <h2 className="text-xl font-bold">Teach the AI</h2>
          <p className="text-sm text-slate-500">Improve ASI accuracy for {profile.name}.</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
        <div className="space-y-2">
          <label className="block font-bold text-slate-700">1. Select Sample</label>
          <button className="w-full flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-2xl hover:bg-slate-100 transition-colors">
            <span className="text-sm text-slate-600">Choose from recent recordings...</span>
            <i className="fa-solid fa-chevron-right text-slate-400"></i>
          </button>
        </div>

        <div className="space-y-2">
          <label className="block font-bold text-slate-700">2. Your Explanation</label>
          <textarea
            className="w-full h-32 p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
            placeholder="Tell us what this sound or behavior means in this context..."
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
          ></textarea>
        </div>

        <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-2xl border border-amber-100">
          <input
            type="checkbox"
            id="verify"
            className="mt-1 w-4 h-4 rounded border-amber-300 text-indigo-600 focus:ring-indigo-500"
            checked={isVerified}
            onChange={(e) => setIsVerified(e.target.checked)}
          />
          <label htmlFor="verify" className="text-xs text-amber-800 leading-tight">
            I confirm that this explanation is honest and accurate based on my observation of {profile.name}.
          </label>
        </div>

        <button
          onClick={handleTrain}
          disabled={submitting || !explanation || !isVerified}
          className={`w-full py-4 rounded-2xl font-bold shadow-lg transition-all flex items-center justify-center gap-2 ${
            submitting || !explanation || !isVerified 
              ? 'bg-slate-200 text-slate-400' 
              : 'bg-indigo-600 text-white shadow-indigo-200 hover:bg-indigo-700'
          }`}
        >
          {submitting ? (
            <i className="fa-solid fa-circle-notch animate-spin"></i>
          ) : (
            <i className="fa-solid fa-bolt"></i>
          )}
          {submitting ? 'Updating Neural Weights...' : 'Train AI Now'}
        </button>
      </div>

      <div className="bg-indigo-50 p-6 rounded-3xl">
        <h4 className="font-bold text-indigo-900 mb-2">Why Teach the AI?</h4>
        <p className="text-sm text-indigo-700 leading-relaxed">
          Every animal has a unique dialect. By providing verified explanations, you help ASI build a personalized 
          communication profile for {profile.name}, increasing translation confidence by up to 85%.
        </p>
      </div>
    </div>
  );
};

export default TeachAI;
