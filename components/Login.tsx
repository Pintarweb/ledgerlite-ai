
import React, { useState } from 'react';
import { BookOpen, User, Lock, ArrowRight, Loader2, Shield, Mail } from 'lucide-react';
import { UserRole } from '../types';

interface LoginProps {
  onLogin: (email: string, password?: string) => Promise<string | void>;
  onSignUpClick: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin, onSignUpClick }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const errorMsg = await onLogin(email, password);
      if (errorMsg) {
        setError(errorMsg);
      }
    } catch (e) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="mb-8 flex items-center gap-3 text-indigo-600">
        <div className="bg-indigo-600 text-white p-2.5 rounded-xl">
          <Shield size={32} />
        </div>
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">ArkAlliance</h1>
      </div>

      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-100">
        <div className="p-8">
          <h2 className="text-xl font-bold text-slate-800 mb-2">Welcome back</h2>
          <p className="text-slate-500 mb-8">Please enter your credentials to sign in.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  placeholder="name@company.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-rose-50 text-rose-600 text-sm font-medium animate-pulse border border-rose-100">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl font-medium shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2 mt-2"
            >
              {isLoading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <>
                  Sign In <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
             <p className="text-sm text-slate-500 mb-4">Don't have an account?</p>
             <button 
                onClick={onSignUpClick}
                className="text-indigo-600 font-semibold hover:text-indigo-800 transition-colors"
             >
                Create an account
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};
