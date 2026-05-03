
import React, { useState } from 'react';
import { signInWithGoogle } from '../services/firebase';
import { motion } from 'motion/react';

interface AuthenticationProps {
  onLogin: (user: any) => void;
}

const Authentication: React.FC<AuthenticationProps> = ({ onLogin }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const user = await signInWithGoogle();
      onLogin(user);
    } catch (err: any) {
      console.error("Auth Error:", err);
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Sign-in cancelled. Please keep the Google window open to proceed.');
      } else if (err.code === 'auth/popup-blocked') {
        setError('Popup blocked! Please allow popups for this site to sign in with Google.');
      } else if (err.message?.includes('Permission dismissed')) {
        setError('Sign-in prompt was missed or dismissed. Please try clicking the button again.');
      } else {
        setError(err.message || 'Failed to sign in with Google. Check your connection.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-indigo-50 to-white">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-indigo-100 p-8"
      >
        <div className="flex justify-center mb-8">
          <div className="w-20 h-20 bg-indigo-600 rounded-2xl flex items-center justify-center text-white text-4xl shadow-lg shadow-indigo-200">
            <i className="fa-solid fa-paw"></i>
          </div>
        </div>
        
        <h2 className="text-2xl font-bold text-center mb-2">Welcome to ASI</h2>
        <p className="text-slate-500 text-center mb-8">Animal Sound Intelligence</p>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <button 
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 bg-white border border-slate-200 py-4 rounded-xl font-bold hover:bg-slate-50 transition-all hover:shadow-md disabled:opacity-50"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <i className="fa-brands fa-google text-lg text-indigo-600"></i>
                Continue with Google
              </>
            )}
          </button>
        </div>

        <p className="mt-8 text-center text-xs text-slate-400 leading-relaxed">
          By continuing, you agree to ASI's Terms of Service and Privacy Policy. 
          Your interactions help improve our AI to better understand animal welfare.
        </p>
      </motion.div>
    </div>
  );
};

export default Authentication;
