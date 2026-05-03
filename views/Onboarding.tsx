
import React, { useState } from 'react';
import { AnimalProfile, AnimalType, Environment } from '../types';

interface OnboardingProps {
  onComplete: (profile: AnimalProfile) => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [formData, setFormData] = useState<AnimalProfile>({
    name: '',
    type: 'Dog',
    environment: 'Indoor',
    age: '',
    breed: ''
  });

  const animalTypes: AnimalType[] = ['Dog', 'Cat', 'Bird', 'Livestock', 'Exotic', 'Wild'];
  const environments: Environment[] = ['Indoor', 'Outdoor', 'Farm', 'Forest', 'Urban'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name) {
      onComplete(formData);
    }
  };

  return (
    <div className="min-h-screen p-6 bg-slate-50 flex flex-col">
      <div className="max-w-md mx-auto w-full">
        <h2 className="text-2xl font-bold mt-8 mb-2">Create Animal Profile</h2>
        <p className="text-slate-500 mb-8">Let's set up the AI context for your animal companion.</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Animal Name *</label>
              <input
                required
                type="text"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g. Luna"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Animal Type</label>
              <div className="grid grid-cols-3 gap-2">
                {animalTypes.map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setFormData({ ...formData, type })}
                    className={`py-2 px-1 rounded-lg text-xs font-bold border transition-all ${
                      formData.type === type 
                        ? 'bg-indigo-600 text-white border-indigo-600' 
                        : 'bg-white text-slate-600 border-slate-200'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Environment</label>
              <select
                className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                value={formData.environment}
                onChange={(e) => setFormData({ ...formData, environment: e.target.value as Environment })}
              >
                {environments.map(env => <option key={env} value={env}>{env}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Age (Optional)</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="3 years"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Breed (Optional)</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Labrador"
                  value={formData.breed}
                  onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-indigo-100 hover:bg-indigo-700"
          >
            Continue to Dashboard
          </button>
        </form>
      </div>
    </div>
  );
};

export default Onboarding;
