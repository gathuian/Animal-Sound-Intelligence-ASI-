
import React, { useState } from 'react';
import { AccessibilitySettings } from '../types';

interface DeivcesProps {
  accessibility: AccessibilitySettings;
}

const Devices: React.FC<DeivcesProps> = ({ accessibility }) => {
  const [backgroundListening, setBackgroundListening] = useState(false);
  
  const highContrast = accessibility.highContrast;

  const devices = [
    { id: 1, name: 'Home Cam Pro', type: 'Security Camera', active: true, icon: 'fa-video' },
    { id: 2, name: 'ASI Smart Collar', type: 'Pet Collar', active: true, icon: 'fa-shield-dog', hasBackground: true },
    { id: 3, name: 'Echo Speaker', type: 'Smart Speaker', active: false, icon: 'fa-volume-high' },
    { id: 4, name: 'Nursery Monitor', type: 'Baby Monitor', active: false, icon: 'fa-baby' },
  ];

  return (
    <div className={`space-y-6 ${accessibility.largeText ? 'text-lg' : 'text-base'}`}>
      <div className="flex items-center justify-between">
        <h2 className={`font-bold transition-colors ${highContrast ? 'text-white text-3xl' : 'text-2xl'}`}>IoT Integration</h2>
        <button className={`p-2 rounded-xl transition-colors ${highContrast ? 'bg-white text-black' : 'bg-indigo-600 text-white shadow-lg'}`}>
          <i className="fa-solid fa-plus"></i>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {devices.map(device => (
          <div key={device.id} className={`p-4 rounded-3xl border shadow-sm transition-colors ${
            highContrast ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-100'
          }`}>
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl transition-colors ${
                device.active 
                  ? (highContrast ? 'bg-white text-black' : 'bg-indigo-100 text-indigo-600') 
                  : (highContrast ? 'bg-zinc-800 text-zinc-600' : 'bg-slate-100 text-slate-400')
              }`}>
                <i className={`fa-solid ${device.icon}`}></i>
              </div>
              <div className="flex-1">
                <h4 className={`font-bold transition-colors ${highContrast ? 'text-white' : 'text-slate-800'}`}>{device.name}</h4>
                <p className={`text-xs ${highContrast ? 'text-zinc-500' : 'text-slate-500'}`}>{device.type}</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider transition-colors ${
                  device.active 
                    ? (highContrast ? 'bg-zinc-800 text-emerald-400 border border-emerald-900/30' : 'bg-emerald-100 text-emerald-600') 
                    : (highContrast ? 'bg-zinc-800 text-zinc-600' : 'bg-slate-100 text-slate-400')
                }`}>
                  {device.active ? 'Streaming' : 'Offline'}
                </span>
                <button className={`hover:text-indigo-600 transition-colors ${highContrast ? 'text-zinc-600' : 'text-slate-400'}`}>
                  <i className="fa-solid fa-gear"></i>
                </button>
              </div>
            </div>

            {device.hasBackground && (
              <div className={`mt-4 pt-4 border-t transition-colors flex items-center justify-between ${
                highContrast ? 'border-zinc-800' : 'border-slate-50'
              }`}>
                <div className="flex items-center gap-2">
                  <i className={`fa-solid fa-ear-listen text-xs ${highContrast ? 'text-zinc-500' : 'text-indigo-400'}`}></i>
                  <span className={`text-xs font-bold uppercase tracking-wider ${highContrast ? 'text-zinc-400' : 'text-slate-500'}`}>
                    Background Listening Analysis
                  </span>
                </div>
                <button 
                  onClick={() => setBackgroundListening(!backgroundListening)}
                  className={`w-10 h-5 rounded-full relative transition-colors ${backgroundListening ? 'bg-emerald-500' : 'bg-slate-200'}`}
                  aria-label="Toggle Background Listening"
                >
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${backgroundListening ? 'right-0.5' : 'left-0.5'}`}></div>
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className={`p-6 rounded-3xl shadow-xl space-y-4 transition-colors ${
        highContrast ? 'bg-white text-black' : 'bg-slate-900 text-white'
      }`}>
        <h3 className={`font-bold flex items-center gap-2 ${accessibility.largeText ? 'text-xl' : 'text-lg'}`}>
          <i className="fa-solid fa-headset text-indigo-400"></i>
          Emergency Response
        </h3>
        <p className={`text-sm leading-relaxed ${highContrast ? 'text-zinc-600' : 'text-slate-400'}`}>
          When an emergency state (Alert or Distressed) is detected, ASI will automatically trigger connected devices to calm your pet or alert neighbors.
        </p>
        {!accessibility.simplifiedUI && (
          <div className="flex items-center justify-between pt-2">
            <span className="text-sm font-medium">Auto-Trigger Enabled</span>
            <div className={`w-12 h-6 rounded-full flex items-center px-1 ${highContrast ? 'bg-black' : 'bg-indigo-600'}`}>
              <div className="w-4 h-4 bg-white rounded-full ml-auto"></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Devices;
