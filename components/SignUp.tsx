
import React, { useState } from 'react';
import { User, Lock, ArrowRight, ArrowLeft, BadgeCheck, Shield, Mail } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

interface SignUpProps {
  onSignUp: (data: any) => void;
  onBack: () => void;
}

export const SignUp: React.FC<SignUpProps> = ({ onSignUp, onBack }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // 1. Sign up with Supabase Auth
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            username: username,
            role: 'STAFF' // Default role
          }
        }
      });

      if (authError) throw authError;

      // 2. Create Profile entry (handled via Triggers usually, or manually here)
      if (data.user) {
         const { error: profileError } = await supabase.from('profiles').insert([{
             id: data.user.id,
             email: email,
             username: username,
             full_name: name,
             role: 'STAFF',
             is_active: false // Require admin approval
         }]);
         if (profileError) console.error("Profile creation warning:", profileError);
      }

      setSubmitted(true);
      if(onSignUp) onSignUp({ name, username, email });
    } catch (err: any) {
      setError(err.message || 'Failed to sign up');
    } finally {
      setIsLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 text-center border border-slate-100">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <BadgeCheck size={32} />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Request Submitted</h2>
          <p className="text-slate-500 mb-6">
            Your account request has been sent. Please wait for an administrator to approve your account before logging in.
          </p>
          <button
            onClick={onBack}
            className="text-indigo-600 font-medium hover:text-indigo-700 flex items-center justify-center gap-2 mx-auto"
          >
            <ArrowLeft size={16} /> Back to Login
          </button>
        </div>
      </div>
    );
  }

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
          <h2 className="text-xl font-bold text-slate-800 mb-2">Join the team</h2>
          <p className="text-slate-500 mb-8">Create an account to manage expenses.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                placeholder="John Doe"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
              <div className="relative">
                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail size={18} />
                </div>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    placeholder="john@example.com"
                    required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Username</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User size={18} />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  placeholder="jdoe"
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
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {error && <p className="text-sm text-rose-600">{error}</p>}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl font-medium shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2 mt-4"
            >
              {isLoading ? 'Submitting...' : 'Submit Request'} <ArrowRight size={18} />
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={onBack}
              className="text-sm text-slate-500 hover:text-slate-800 font-medium transition-colors"
            >
              Already have an account? Sign in
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
