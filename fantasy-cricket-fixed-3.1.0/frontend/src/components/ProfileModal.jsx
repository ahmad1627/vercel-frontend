import { prepareAvatar } from '../imageUpload';
import React, { useState, useEffect } from 'react';
import { X, Camera, User, Shield, Mail, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80',
  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=120&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=120&q=80',
  'https://images.unsplash.com/photo-1628157582853-a796fa650a6a?auto=format&fit=crop&w=120&q=80',
];

const ProfileModal = ({ isOpen, onClose }) => {
  const { user, updateAvatar } = useAuth();
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  useEffect(()=>{if(isOpen){setAvatarUrl(user?.avatar_url || '');setError(null);}},[isOpen,user?.id,user?.avatar_url]);

  if (!isOpen || !user) return null;

  const handleFileUpload = async (e) => {
    const file=e.target.files?.[0]; if(!file)return;
    try { setAvatarUrl(await prepareAvatar(file)); setError(null); }
    catch(error){setError(error.message || 'Could not read this image.');}
  };

  const handleSaveAvatar = async () => {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      await updateAvatar(avatarUrl);
      setMessage('Profile photo updated successfully!');
      setTimeout(() => {
        setMessage(null);
        onClose();
      }, 1200);
    } catch (err) {
      console.error('Error saving avatar:', err);
      setError('Failed to update profile picture.');
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
            <User className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-black text-white">Manager Profile & Avatar</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-emerald-900/60"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-950/80 border border-red-600/80 text-xs text-red-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {message && (
            <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-600/80 text-xs text-emerald-200 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
              <span>{message}</span>
            </div>
          )}

          {/* Current Avatar Display */}
          <div className="flex flex-col items-center">
            <div className="relative w-24 h-24 rounded-full overflow-hidden border-3 border-amber-400 shadow-xl bg-emerald-950 flex items-center justify-center mb-3">
              {avatarUrl ? (
                <img src={avatarUrl} alt={user.full_name || 'Profile'} className="w-full h-full object-cover" />
              ) : (
                <User className="w-12 h-12 text-slate-400" />
              )}
            </div>

            <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-900 hover:bg-emerald-800 text-amber-300 border border-emerald-700 text-xs font-bold transition-all shadow-xs">
              <Camera className="w-3.5 h-3.5" />
              <span>Upload New Picture</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            {/* Presets */}
            <div className="flex items-center gap-2 mt-3">
              {PRESET_AVATARS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setAvatarUrl(preset)}
                  className={`w-8 h-8 rounded-full overflow-hidden border transition-all ${
                    avatarUrl === preset ? 'ring-2 ring-amber-400 scale-110 border-amber-400' : 'border-emerald-800 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={preset} alt={`Preset ${idx}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* User Details */}
          <div className="space-y-2 text-xs pt-2 border-t border-emerald-900">
            <div className="flex justify-between py-1 border-b border-emerald-900/60">
              <span className="text-slate-400">Full Name:</span>
              <span className="font-bold text-white">{user.full_name || 'Not set'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-emerald-900/60">
              <span className="text-slate-400">Fantasy Franchise:</span>
              <span className="font-bold text-amber-300">{user.fantasy_team_name || 'Not set'}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Registered Email:</span>
              <span className="font-mono text-slate-300">{user.email}</span>
            </div>
          </div>

          <button
            onClick={handleSaveAvatar}
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-linear-to-r from-amber-400 to-amber-500 hover:from-amber-300 text-emerald-950 font-black text-xs uppercase tracking-wider transition-all shadow-lg active:scale-98"
          >
            {loading ? 'Saving...' : 'Save Profile Picture'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default ProfileModal;
