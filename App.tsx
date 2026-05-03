
import React, { useState, useEffect } from 'react';
import { User, AnimalProfile, Status, SoundAnalysisResult, AccessibilitySettings } from './types';
import Navigation from './components/Navigation';
import { analyzeAnimalBehavior, GeminiError } from './services/geminiService';
import { auth, db } from './services/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, collection, addDoc } from 'firebase/firestore';

// View Components
import Home from './views/Home';
import Onboarding from './views/Onboarding';
import Authentication from './views/Authentication';
import Translator from './views/Translator';
import TeachAI from './views/TeachAI';
import Devices from './views/Devices';
import ProfileView from './views/ProfileView';

const defaultAccessibility: AccessibilitySettings = {
  highContrast: false,
  largeText: false,
  simplifiedUI: false,
  screenReaderOptimized: false
};

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<AnimalProfile | null>(null);
  const [currentTab, setCurrentTab] = useState('home');
  const [recentStatus, setRecentStatus] = useState<Status>('Calm');
  const [lastAnalysis, setLastAnalysis] = useState<SoundAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userRef = doc(db, 'users', firebaseUser.uid);
          const userSnap = await getDoc(userRef);
          
          let userData: User;
          if (!userSnap.exists()) {
            userData = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
              photoURL: firebaseUser.photoURL,
              accessibilitySettings: defaultAccessibility
            };
            await setDoc(userRef, {
              ...userData,
              createdAt: serverTimestamp()
            });
          } else {
            const data = userSnap.data();
            userData = {
              uid: data.uid,
              email: data.email,
              displayName: data.displayName,
              photoURL: data.photoURL,
              accessibilitySettings: data.accessibilitySettings || defaultAccessibility
            };
          }
          setUser(userData);

          const savedProfile = localStorage.getItem(`asi_profile_${firebaseUser.uid}`);
          if (savedProfile) {
            setProfile(JSON.parse(savedProfile));
          }
        } catch (err) {
          console.error("Auth sync error:", err);
        }
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const updateAccessibility = async (settings: Partial<AccessibilitySettings>) => {
    if (!user) return;
    const newSettings = { ...user.accessibilitySettings!, ...settings };
    setUser({ ...user, accessibilitySettings: newSettings });
    try {
      await setDoc(doc(db, 'users', user.uid), { accessibilitySettings: newSettings }, { merge: true });
    } catch (err) {
      console.error("Error updating accessibility:", err);
    }
  };

  const handleProfileComplete = async (newProfile: AnimalProfile) => {
    if (!user) return;
    try {
      setProfile(newProfile);
      localStorage.setItem(`asi_profile_${user.uid}`, JSON.stringify(newProfile));
      const profileRef = doc(db, 'profiles', user.uid);
      await setDoc(profileRef, {
        ...newProfile,
        userId: user.uid,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      console.error("Error saving profile:", err);
    }
  };

  const handleAnalyze = async (media: string, mime: string, isAudio: boolean) => {
    if (!profile || !user) return;
    setError(null);
    try {
      const result = await analyzeAnimalBehavior(profile, media, mime, isAudio);
      setLastAnalysis(result);
      setRecentStatus(result.status);

      const historyRef = collection(db, 'history');
      await addDoc(historyRef, {
        userId: user.uid,
        timestamp: serverTimestamp(),
        emotion: result.emotion,
        intent: result.intent,
        confidence: result.confidence,
        status: result.status,
        explanation: result.explanation
      });
    } catch (err: any) {
      console.error(err);
      setError(err instanceof GeminiError ? err.message : "Connection lost. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Authentication onLogin={(userData: any) => setUser(userData)} />;
  }

  if (!profile) {
    return <Onboarding onComplete={handleProfileComplete} />;
  }

  const renderContent = () => {
    const commonProps = {
      accessibility: user.accessibilitySettings || defaultAccessibility
    };

    switch (currentTab) {
      case 'home':
        return <Home 
          profile={profile} 
          status={recentStatus} 
          lastAnalysis={lastAnalysis}
          onQuickAnalyze={() => setCurrentTab('translator')}
          {...commonProps}
        />;
      case 'translator':
        return <Translator profile={profile} onAnalyze={handleAnalyze} {...commonProps} />;
      case 'teach':
        return <TeachAI profile={profile} {...commonProps} />;
      case 'devices':
        return <Devices {...commonProps} />;
      case 'profile':
        return (
          <ProfileView 
            profile={profile} 
            user={user} 
            onReset={() => setProfile(null)} 
            onUpdateAccessibility={updateAccessibility}
            {...commonProps}
          />
        );
      default:
        return <Home profile={profile} status={recentStatus} lastAnalysis={null} onQuickAnalyze={() => {}} {...commonProps} />;
    }
  };

  return (
    <div className={`min-h-screen flex flex-col pb-16 transition-all duration-300 ${
      user.accessibilitySettings?.highContrast ? 'bg-black text-white' : 'bg-slate-50 text-slate-900'
    } ${user.accessibilitySettings?.largeText ? 'text-lg' : 'text-base'}`}>
      
      {error && (
        <div className="fixed top-20 left-4 right-4 z-50 animate-in slide-in-from-top-4">
          <div className="bg-red-500 text-white p-4 rounded-2xl shadow-2xl flex items-center justify-between">
            <span className="flex-1 text-sm font-bold">{error}</span>
            <button onClick={() => setError(null)} className="ml-4 opacity-50 hover:opacity-100">
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>
        </div>
      )}

      <header className={`px-4 py-4 border-b sticky top-0 z-40 transition-colors ${
        user.accessibilitySettings?.highContrast ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'
      }`}>
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
              <i className="fa-solid fa-paw"></i>
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
              ASI
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button className="text-slate-500 relative">
              <i className="fa-regular fa-bell text-xl"></i>
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden">
              {user.photoURL ? (
                <img src={user.photoURL} alt={user.displayName || 'User'} />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-indigo-100 text-indigo-600 font-bold">
                  {user.displayName?.[0] || user.email?.[0] || '?'}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full p-4 overflow-y-auto">
        {renderContent()}
      </main>

      <Navigation currentTab={currentTab} accessibility={user.accessibilitySettings || defaultAccessibility} onTabChange={setCurrentTab} />
    </div>
  );
};

export default App;
