
import React from 'react';
import { AnimalProfile } from '../types';
import { logout } from '../services/firebase';

interface ProfileViewProps {
  profile: AnimalProfile;
  onReset: () => void;
}

const ProfileView: React.FC<ProfileViewProps> = ({ profile, onReset }) => {
  const handleSignOut = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="relative">
        <div className="h-32 bg-indigo-600 rounded-3xl overflow-hidden">
          <img src="https://picsum.photos/seed/bg/600/200" className="w-full h-full object-cover opacity-50" alt="Cover" />
        </div>
        <div className="absolute -bottom-10 left-6 flex items-end gap-4">
          <div className="w-24 h-24 rounded-3xl border-4 border-slate-50 bg-white shadow-xl overflow-hidden">
             <img src={`https://picsum.photos/seed/${profile.name}/200/200`} className="w-full h-full object-cover" alt="Profile" />
          </div>
          <div className="pb-2">
            <h2 className="text-2xl font-bold text-slate-900">{profile.name}</h2>
            <span className="text-indigo-600 font-bold text-sm">{profile.type} • {profile.age || 'Adult'}</span>
          </div>
        </div>
      </div>

      <div className="mt-16 space-y-4">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-800">Animal Details</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <span className="text-xs text-slate-400 font-bold uppercase">Breed</span>
              <p className="text-sm font-medium">{profile.breed || 'Not specified'}</p>
            </div>
            <div className="space-y-1">
              <span className="text-xs text-slate-400 font-bold uppercase">Environment</span>
              <p className="text-sm font-medium">{profile.environment}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <button className="w-full px-6 py-4 flex items-center gap-4 hover:bg-slate-50 transition-all text-slate-700">
            <i className="fa-solid fa-heart-pulse w-5"></i>
            <span className="flex-1 text-left font-medium">Health & Vaccination</span>
            <i className="fa-solid fa-chevron-right text-xs text-slate-300"></i>
          </button>
          <div className="h-px bg-slate-50 mx-6"></div>
          <button className="w-full px-6 py-4 flex items-center gap-4 hover:bg-slate-50 transition-all text-slate-700">
            <i className="fa-solid fa-universal-access w-5"></i>
            <span className="flex-1 text-left font-medium">Accessibility Mode</span>
            <i className="fa-solid fa-chevron-right text-xs text-slate-300"></i>
          </button>
          <div className="h-px bg-slate-50 mx-6"></div>
          <button className="w-full px-6 py-4 flex items-center gap-4 hover:bg-slate-50 transition-all text-slate-700">
            <i className="fa-solid fa-shield-halved w-5"></i>
            <span className="flex-1 text-left font-medium">Privacy & Data</span>
            <i className="fa-solid fa-chevron-right text-xs text-slate-300"></i>
          </button>
        </div>

        <button 
          onClick={onReset}
          className="w-full p-4 text-slate-500 font-bold border-2 border-slate-50 hover:bg-slate-50 rounded-2xl transition-all"
        >
          Reset Animal Profile
        </button>

        <button 
          onClick={handleSignOut}
          className="w-full p-4 text-red-500 font-bold border-2 border-red-50 hover:bg-red-50 rounded-2xl transition-all"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
};

export default ProfileView;
