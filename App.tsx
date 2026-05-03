
import React, { useState, useEffect } from 'react';
import { AnimalProfile, Status, SoundAnalysisResult } from './types';
import Navigation from './components/Navigation';
import { analyzeAnimalBehavior } from './services/geminiService';
import { auth, db } from './services/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, collection, addDoc } from 'firebase/firestore';

// View Components
import Home from './views/Home';
import Onboarding from './views/Onboarding';
import Authentication from './views/Authentication';
import Translator from './views/Translator';
import TeachAI from './views/TeachAI';
import Devices from './views/Devices';
import ProfileView from './views/ProfileView';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<AnimalProfile | null>(null);
  const [currentTab, setCurrentTab] = useState('home');
  const [recentStatus, setRecentStatus] = useState<Status>('Calm');
  const [lastAnalysis, setLastAnalysis] = useState<SoundAnalysisResult | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          // Sync user to Firestore
          const userRef = doc(db, 'users', firebaseUser.uid);
          const userSnap = await getDoc(userRef);
          
          if (!userSnap.exists()) {
            await setDoc(userRef, {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName || '',
              photoURL: firebaseUser.photoURL || '',
              createdAt: serverTimestamp()
            });
          }

          // Try to load animal profile from local storage or firestore (fallback)
          const savedProfile = localStorage.getItem(`asi_profile_${firebaseUser.uid}`);
          if (savedProfile) {
            setProfile(JSON.parse(savedProfile));
          }
        } catch (err) {
          console.error("Firestore sync error:", err);
          // If Firestore is not ready or rules are failing, we still have the firebaseUser in local state
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogin = (userData: User) => {
    setUser(userData);
  };

  const handleProfileComplete = async (newProfile: AnimalProfile) => {
    if (!user) return;
    try {
      setProfile(newProfile);
      localStorage.setItem(`asi_profile_${user.uid}`, JSON.stringify(newProfile));

      // Save to profiles collection
      const profileRef = doc(db, 'profiles', user.uid); // Using UID as ID for simplicity if 1:1, or addDoc
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
    try {
      const result = await analyzeAnimalBehavior(profile, media, mime, isAudio);
      setLastAnalysis(result);
      setRecentStatus(result.status);

      // Save to history collection
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
    } catch (err) {
      console.error(err);
      alert("Error analyzing media. Please try again.");
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
    return <Authentication onLogin={handleLogin} />;
  }

  if (!profile) {
    return <Onboarding onComplete={handleProfileComplete} />;
  }

  const renderContent = () => {
    switch (currentTab) {
      case 'home':
        return <Home 
          profile={profile} 
          status={recentStatus} 
          lastAnalysis={lastAnalysis}
          onQuickAnalyze={() => setCurrentTab('translator')}
        />;
      case 'translator':
        return <Translator profile={profile} onAnalyze={handleAnalyze} />;
      case 'teach':
        return <TeachAI profile={profile} />;
      case 'devices':
        return <Devices />;
      case 'profile':
        return <ProfileView profile={profile} onReset={() => setProfile(null)} />;
      default:
        return <Home profile={profile} status={recentStatus} lastAnalysis={null} onQuickAnalyze={() => {}} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pb-16">
      <header className="bg-white px-4 py-4 border-b border-slate-200 sticky top-0 z-40">
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

      <Navigation currentTab={currentTab} onTabChange={setCurrentTab} />
    </div>
  );
};

export default App;
