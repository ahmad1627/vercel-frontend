import React, { useState } from 'react';
import { X, Mail, Lock, User, Sparkles, AlertCircle, CheckCircle2, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const EMAIL_REGEX = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/;

const AuthModal = ({ isOpen, onClose, onOpenForgotPassword }) => {
  const { login, signup } = useAuth();
  const [isLoginTab, setIsLoginTab] = useState(true);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [fantasyTeamName, setFantasyTeamName] = useState('');
  
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!EMAIL_REGEX.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }
    if (password.length < (isLoginTab ? 1 : 10)) {
      setError('New passwords must be at least 10 characters.');
      return;
    }

    setLoading(true);
    try {
      if (isLoginTab) {
        await login(email.trim(), password);
      } else {
        await signup(email.trim(), password, fullName.trim(), fantasyTeamName.trim());
      }
      onClose();
    } catch (err) {
      console.error('Auth error:', err);
      setError(err.response?.data?.detail || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillAdminCredentials = () => {
    setEmail('ahmad@tahseen.pk');
    setPassword('Password123!');
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#031c15] border border-emerald-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        
        {/* Header Tabs */}
        <div className="flex border-b border-emerald-900 bg-emerald-950/60 relative">
          <button
            onClick={() => { setIsLoginTab(true); setError(null); }}
            className={`flex-1 py-3.5 text-center text-xs font-black uppercase tracking-wider transition-all ${
              isLoginTab
                ? 'text-amber-400 border-b-2 border-amber-400 bg-[#031c15]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => { setIsLoginTab(false); setError(null); }}
            className={`flex-1 py-3.5 text-center text-xs font-black uppercase tracking-wider transition-all ${
              !isLoginTab
                ? 'text-amber-400 border-b-2 border-amber-400 bg-[#031c15]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Register Team
          </button>
          <button
            onClick={onClose}
            className="absolute right-3 top-3 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-emerald-900/60"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-950/80 border border-red-600/80 text-xs text-red-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#02241b] border border-emerald-900 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-300">Password</label>
                {isLoginTab && <span className="text-[10px] text-slate-500">Contact admin for reset</span>}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#02241b] border border-emerald-900 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            {!isLoginTab && (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Full Name (Optional)</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="e.g. Ali Khan"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full bg-[#02241b] border border-emerald-900 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Unique Fantasy Team Name (Optional)</label>
                  <div className="relative">
                    <Sparkles className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="e.g. Lahore Royals XI"
                      value={fantasyTeamName}
                      onChange={(e) => setFantasyTeamName(e.target.value)}
                      className="w-full bg-[#02241b] border border-emerald-900 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-linear-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-emerald-950 font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-amber-500/20 active:scale-98 mt-2 cursor-pointer"
            >
              {loading ? 'Processing...' : isLoginTab ? 'Sign In to Account' : 'Register & Join Tournament'}
            </button>
          </form>

          {/* Quick Admin Login Shortcut */}
          {isLoginTab && (
            <div className="mt-4 pt-3 border-t border-emerald-900/60 text-center">
              <button
                type="button"
                onClick={fillAdminCredentials}
                className="text-[11px] font-bold text-amber-400 hover:text-amber-300 underline flex items-center justify-center gap-1.5 mx-auto transition-colors cursor-pointer"
              >
                <Shield className="w-3.5 h-3.5 text-amber-400" />
                <span>Fill Tournament Admin Login (Ahmad Tahseen)</span>
              </button>
            </div>
          )}

          <p className="mt-3 text-center text-[11px] text-slate-400">
            {isLoginTab
              ? 'Admin access enables lineup locks, score entry & winner announcements.'
              : 'Your fantasy team and points are saved to the tournament database.'}
          </p>

        </div>

      </div>
    </div>
  );
};

export default AuthModal;
