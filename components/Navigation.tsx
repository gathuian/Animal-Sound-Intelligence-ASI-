
import React from 'react';
import { AccessibilitySettings } from '../types';

interface NavigationProps {
  currentTab: string;
  accessibility: AccessibilitySettings;
  onTabChange: (tab: string) => void;
}

const Navigation: React.FC<NavigationProps> = ({ currentTab, accessibility, onTabChange }) => {
  const tabs = [
    { id: 'home', icon: 'fa-house', label: 'Home' },
    { id: 'translator', icon: 'fa-language', label: 'Translate' },
    { id: 'teach', icon: 'fa-graduation-cap', label: 'Teach AI' },
    { id: 'devices', icon: 'fa-link', label: 'Devices' },
    { id: 'profile', icon: 'fa-paw', label: 'Profile' },
  ];

  const highContrast = accessibility.highContrast;

  return (
    <nav className={`fixed bottom-0 left-0 right-0 flex justify-around items-center h-16 px-2 pb-safe z-50 transition-colors border-t ${
      highContrast ? 'bg-black border-zinc-800' : 'bg-white border-slate-200'
    }`}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`flex flex-col items-center justify-center w-full h-full transition-colors ${
            currentTab === tab.id 
              ? (highContrast ? 'text-white' : 'text-indigo-600') 
              : (highContrast ? 'text-zinc-600' : 'text-slate-400')
          }`}
        >
          <i className={`fa-solid ${tab.icon} ${accessibility.largeText ? 'text-xl' : 'text-lg'}`}></i>
          {(!accessibility.simplifiedUI || currentTab === tab.id) && (
            <span className={`mt-1 font-bold italic tracking-wide ${accessibility.largeText ? 'text-xs' : 'text-[10px]'}`}>{tab.label}</span>
          )}
        </button>
      ))}
    </nav>
  );
};

export default Navigation;
