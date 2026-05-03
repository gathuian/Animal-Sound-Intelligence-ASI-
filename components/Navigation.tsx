
import React from 'react';

interface NavigationProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
}

const Navigation: React.FC<NavigationProps> = ({ currentTab, onTabChange }) => {
  const tabs = [
    { id: 'home', icon: 'fa-house', label: 'Home' },
    { id: 'translator', icon: 'fa-language', label: 'Translate' },
    { id: 'teach', icon: 'fa-graduation-cap', label: 'Teach AI' },
    { id: 'devices', icon: 'fa-link', label: 'Devices' },
    { id: 'profile', icon: 'fa-paw', label: 'Profile' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around items-center h-16 px-2 pb-safe z-50">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`flex flex-col items-center justify-center w-full h-full transition-colors ${
            currentTab === tab.id ? 'text-indigo-600' : 'text-slate-400'
          }`}
        >
          <i className={`fa-solid ${tab.icon} text-lg`}></i>
          <span className="text-[10px] mt-1 font-medium">{tab.label}</span>
        </button>
      ))}
    </nav>
  );
};

export default Navigation;
