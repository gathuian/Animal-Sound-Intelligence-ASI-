
import React from 'react';
import { User, AnimalProfile, AccessibilitySettings } from '../types';
import { logout } from '../services/firebase';

interface ProfileViewProps {
  profile: AnimalProfile;
  user: User;
  accessibility: AccessibilitySettings;
  onReset: () => void;
  onUpdateAccessibility: (settings: Partial<AccessibilitySettings>) => void;
}

const ProfileView: React.FC<ProfileViewProps> = ({ profile, user, accessibility, onReset, onUpdateAccessibility }) => {
  const handleSignOut = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const highContrast = accessibility.highContrast;

  return (
    <div className={`space-y-6 pb-8 ${accessibility.largeText ? 'text-lg' : 'text-base'}`}>
      <div className="relative">
        <div className={`h-32 rounded-3xl overflow-hidden transition-colors ${highContrast ? 'bg-zinc-800' : 'bg-indigo-600'}`}>
          <img 
            src={`https://picsum.photos/seed/${profile.name}_bg/600/200`} 
            className={`w-full h-full object-cover transition-opacity ${highContrast ? 'opacity-20 translate-y-0 grayscale' : 'opacity-50'}`} 
            alt="Cover" 
          />
        </div>
        <div className="absolute -bottom-10 left-6 flex items-end gap-4">
          <div className={`w-24 h-24 rounded-3xl border-4 shadow-xl overflow-hidden transition-colors ${
            highContrast ? 'bg-black border-zinc-800' : 'bg-white border-slate-50'
          }`}>
             <img src={`https://picsum.photos/seed/${profile.name}/200/200`} className="w-full h-full object-cover" alt="Profile" />
          </div>
          <div className="pb-2">
            <h2 className={`font-bold transition-colors ${highContrast ? 'text-white text-3xl' : 'text-slate-900 text-2xl'}`}>{profile.name}</h2>
            <span className={`font-bold text-sm ${highContrast ? 'text-zinc-400' : 'text-indigo-600'}`}>
              {profile.type} • {profile.age || 'Adult'}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-16 space-y-4">
        <div className={`p-6 rounded-3xl border shadow-sm space-y-4 transition-colors ${
          highContrast ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-100'
        }`}>
          <h3 className={`font-bold ${highContrast ? 'text-white' : 'text-slate-800'}`}>Animal Details</h3>
          {!accessibility.simplifiedUI ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className={`text-xs font-bold uppercase ${highContrast ? 'text-zinc-500' : 'text-slate-400'}`}>Breed</span>
                <p className="font-medium">{profile.breed || 'Not specified'}</p>
              </div>
              <div className="space-y-1">
                <span className={`text-xs font-bold uppercase ${highContrast ? 'text-zinc-500' : 'text-slate-400'}`}>Environment</span>
                <p className="font-medium">{profile.environment}</p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
               <p><span className="font-bold">Breed:</span> {profile.breed || 'Not specified'}</p>
               <p><span className="font-bold">Home:</span> {profile.environment}</p>
            </div>
          )}
        </div>

        <div className={`rounded-3xl border shadow-sm overflow-hidden transition-colors ${
          highContrast ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-100'
        }`}>
          <h4 className={`text-xs font-bold uppercase tracking-widest px-6 pt-4 mb-2 ${highContrast ? 'text-zinc-500' : 'text-slate-400'}`}>
            Accessibility Mode
          </h4>
          
          <div className="px-6 pb-4 space-y-3">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <i className={`fa-solid fa-circle-half-stroke ${highContrast ? 'text-white' : 'text-indigo-600'}`}></i>
                  <span className="font-medium">High Contrast</span>
                </div>
                <button 
                  onClick={() => onUpdateAccessibility({ highContrast: !accessibility.highContrast })}
                  className={`w-14 h-7 rounded-full relative transition-colors ${accessibility.highContrast ? 'bg-indigo-600' : 'bg-slate-200'}`}
                  aria-label="Toggle High Contrast"
                >
                  <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${accessibility.highContrast ? 'right-1' : 'left-1'}`}></div>
                </button>
             </div>

             <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <i className={`fa-solid fa-text-height ${highContrast ? 'text-white' : 'text-indigo-600'}`}></i>
                  <span className="font-medium">Large Text</span>
                </div>
                <button 
                  onClick={() => onUpdateAccessibility({ largeText: !accessibility.largeText })}
                  className={`w-14 h-7 rounded-full relative transition-colors ${accessibility.largeText ? 'bg-indigo-600' : 'bg-slate-200'}`}
                  aria-label="Toggle Large Text"
                >
                  <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${accessibility.largeText ? 'right-1' : 'left-1'}`}></div>
                </button>
             </div>

             <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <i className={`fa-solid fa-wand-magic-sparkles ${highContrast ? 'text-white' : 'text-indigo-600'}`}></i>
                  <span className="font-medium">Simplified UI</span>
                </div>
                <button 
                  onClick={() => onUpdateAccessibility({ simplifiedUI: !accessibility.simplifiedUI })}
                  className={`w-14 h-7 rounded-full relative transition-colors ${accessibility.simplifiedUI ? 'bg-indigo-600' : 'bg-slate-200'}`}
                  aria-label="Toggle Simplified UI"
                >
                  <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${accessibility.simplifiedUI ? 'right-1' : 'left-1'}`}></div>
                </button>
             </div>
          </div>
        </div>

        <div className="pt-2 space-y-3">
          <button 
            onClick={onReset}
            className={`w-full p-5 font-bold border-2 rounded-2xl transition-all ${
              highContrast ? 'border-zinc-800 text-zinc-300 hover:bg-zinc-800' : 'border-slate-100 text-slate-500 hover:bg-slate-50'
            }`}
          >
            Reset Animal Profile
          </button>

          <button 
            onClick={handleSignOut}
            className={`w-full p-5 font-bold border-2 rounded-2xl transition-all ${
              highContrast ? 'border-red-900 text-red-500 hover:bg-red-900/10' : 'border-red-50 text-red-500 hover:bg-red-50'
            }`}
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileView;
