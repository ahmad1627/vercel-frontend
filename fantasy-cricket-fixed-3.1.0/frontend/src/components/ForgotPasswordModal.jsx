import React, { useState } from 'react';
import { X, Mail, KeyRound, Lock, CheckCircle2, AlertCircle, Copy, ArrowRight } from 'lucide-react';
import api from '../api';

const ForgotPasswordModal = ({ isOpen, onClose, onBackToLogin }) => {
  const [step, setStep] = useState(1); // 1: Request, 2: Reset
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [devToken, setDevToken] = useState(null);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleRequestToken = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);
    try {
      const res = await api.post('/auth/forgot-password', { email: email.trim() });
      setMessage(res.data.message);
      if (res.data.dev_reset_token) {
        setDevToken(res.data.dev_reset_token);
        setToken(res.data.dev_reset_token);
      }
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to request password reset.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/auth/reset-password', {
        email: email.trim(),
        token: token.trim(),
        new_password: newPassword,
      });
      setMessage(res.data.message);
      setTimeout(() => {
        onClose();
        if (onBackToLogin) onBackToLogin();
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#031c15] border border-emerald-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-emerald-900 bg-emerald-950/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-black text-white">
              {step === 1 ? 'Forgot Password' : 'Enter Reset Token'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-emerald-900/60"
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

          {message && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-950/80 border border-emerald-600/80 text-xs text-emerald-200 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
              <span>{message}</span>
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={handleRequestToken} className="space-y-4">
              <p className="text-xs text-slate-300">
                Enter your registered account email. A secure time-limited token will be dispatched to reset your password.
              </p>
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

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-emerald-950 font-black text-xs uppercase tracking-wider transition-all shadow-md active:scale-98"
              >
                {loading ? 'Sending Request...' : 'Send Reset Token'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-3.5">
              {devToken && (
                <div className="p-2.5 rounded-lg bg-amber-950/50 border border-amber-600/50 text-[11px] text-amber-200">
                  <div className="font-bold flex items-center justify-between">
                    <span>Developer Preview Token:</span>
                    <button
                      type="button"
                      onClick={() => setToken(devToken)}
                      className="text-amber-400 hover:underline flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" /> Auto-Fill
                    </button>
                  </div>
                  <code className="block mt-1 bg-black/40 px-2 py-0.5 rounded text-amber-300 font-mono select-all">
                    {devToken}
                  </code>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Reset Token / OTP</label>
                <input
                  type="text"
                  required
                  placeholder="Paste reset token here"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  className="w-full bg-[#02241b] border border-emerald-900 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">New Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    placeholder="Minimum 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-[#02241b] border border-emerald-900 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-linear-to-r from-amber-400 to-amber-500 hover:from-amber-300 text-emerald-950 font-black text-xs uppercase tracking-wider transition-all shadow-md active:scale-98"
              >
                {loading ? 'Resetting Password...' : 'Save New Password & Sign In'}
              </button>
            </form>
          )}

          <div className="mt-4 pt-3 border-t border-emerald-900 text-center">
            <button
              onClick={() => { onClose(); if (onBackToLogin) onBackToLogin(); }}
              className="text-xs text-emerald-400 hover:underline font-semibold"
            >
              Back to Sign In
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ForgotPasswordModal;
