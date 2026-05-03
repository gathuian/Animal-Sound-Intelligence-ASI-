
import React from 'react';

const Devices: React.FC = () => {
  const devices = [
    { id: 1, name: 'Home Cam Pro', type: 'Security Camera', active: true, icon: 'fa-video' },
    { id: 2, name: 'ASI Smart Collar', type: 'Pet Collar', active: true, icon: 'fa-shield-dog' },
    { id: 3, name: 'Echo Speaker', type: 'Smart Speaker', active: false, icon: 'fa-volume-high' },
    { id: 4, name: 'Nursery Monitor', type: 'Baby Monitor', active: false, icon: 'fa-baby' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">IoT Integration</h2>
        <button className="p-2 bg-indigo-600 text-white rounded-xl">
          <i className="fa-solid fa-plus"></i>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {devices.map(device => (
          <div key={device.id} className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl ${device.active ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
              <i className={`fa-solid ${device.icon}`}></i>
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-slate-800">{device.name}</h4>
              <p className="text-xs text-slate-500">{device.type}</p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${device.active ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                {device.active ? 'Streaming' : 'Offline'}
              </span>
              <button className="text-slate-400 hover:text-indigo-600">
                <i className="fa-solid fa-ellipsis-vertical"></i>
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl space-y-4">
        <h3 className="font-bold flex items-center gap-2">
          <i className="fa-solid fa-headset text-indigo-400"></i>
          Emergency Auto-Response
        </h3>
        <p className="text-slate-400 text-sm">
          When an emergency is detected, ASI can automatically trigger connected devices to calm your animal or alert neighbors.
        </p>
        <div className="flex items-center justify-between pt-2">
          <span className="text-sm font-medium">Enable Feature</span>
          <div className="w-12 h-6 bg-indigo-600 rounded-full flex items-center px-1">
            <div className="w-4 h-4 bg-white rounded-full ml-auto"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Devices;
