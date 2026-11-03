import { prepareAvatar } from '../imageUpload';
import React, { useState, useEffect } from 'react';
import { Sparkles, User, Shield, AlertCircle, ArrowRight, Camera, Image, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80',
  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=120&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=120&q=80',
  'https://images.unsplash.com/photo-1628157582853-a796fa650a6a?auto=format&fit=crop&w=120&q=80',
];

const OnboardingModal = ({ isOpen }) => {
  const { user, completeOnboarding } = useAuth();
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [fantasyTeamName, setFantasyTeamName] = useState(user?.fantasy_team_name || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || PRESET_AVATARS[0]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(()=>{if(isOpen){setAvatarUrl(user?.avatar_url || '');setError(null);}},[isOpen,user?.id,user?.avatar_url]);

  if (!isOpen) return null;

  const handleFileUpload = async (e) => {
    const file=e.target.files?.[0]; if(!file)return;
    try { setAvatarUrl(await prepareAvatar(file)); setError(null); }
    catch(error){setError(error.message || 'Could not read this image.');}
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const fName = fullName.trim();
    const tName = fantasyTeamName.trim();

    if (!fName) {
      setError('Please provide your Full Name.');
      return;
    }
    if (tName.length < 3) {
      setError('Fantasy Team Name must be at least 3 characters.');
      return;
    }

    setLoading(true);
    try {
      await completeOnboarding(fName, tName, avatarUrl);
    } catch (err) {
      console.error('Onboarding failed:', err);
      setError(err.response?.data?.detail || 'Failed to complete profile setup. Please try a different team name.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#031c15] border-2 border-amber-400 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden gold-glow">
        
        {/* Header */}
        <div className="p-5 text-center border-b border-emerald-900 bg-linear-to-b from-emerald-950 to-[#031c15]">
          <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-amber-400 via-amber-500 to-emerald-600 flex items-center justify-center mx-auto mb-2 shadow-lg shadow-amber-500/20">
            <Sparkles className="w-6 h-6 text-emerald-950 stroke-[2.5]" />
          </div>
          <h2 className="text-lg sm:text-xl font-black text-white uppercase tracking-tight">
            India vs New Zealand ODI Fantasy 2026
          </h2>
          <p className="text-xs text-emerald-300/90 mt-0.5 max-w-sm mx-auto">
            Set up your manager profile before entering the India vs New Zealand ODI fantasy series.
          </p>
        </div>

        {/* Form Body */}
        <div className="p-5 sm:p-6 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-950/80 border border-red-600/80 text-xs text-red-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Profile Picture Upload & Presets */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-2">
                Manager Profile Picture (Optional)
              </label>
              
              <div className="flex items-center gap-4 p-3 rounded-xl bg-[#02241b] border border-emerald-900/80">
                {/* Current Avatar Preview */}
                <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-amber-400 flex-shrink-0 shadow-md bg-emerald-950 flex items-center justify-center">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar Preview" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-8 h-8 text-slate-400" />
                  )}
                </div>

                {/* Upload Action */}
                <div className="flex-1">
                  <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-900 hover:bg-emerald-800 text-amber-300 border border-emerald-700 text-xs font-bold transition-all shadow-xs">
                    <Camera className="w-3.5 h-3.5" />
                    <span>Upload Photo</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Upload your picture (JPG/PNG max 2MB) or pick an avatar below:
                  </p>

                  {/* Preset Avatars */}
                  <div className="flex items-center gap-2 mt-2">
                    {PRESET_AVATARS.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setAvatarUrl(preset)}
                        className={`w-7 h-7 rounded-full overflow-hidden border transition-all ${
                          avatarUrl === preset ? 'ring-2 ring-amber-400 scale-110 border-amber-400' : 'border-emerald-800 opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img src={preset} alt={`Preset ${idx}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Your Full Name (displayed on Leaderboard)
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Ahmad Tahseen"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-[#02241b] border border-emerald-900 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            {/* Unique Fantasy Team Name */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Unique Fantasy Team Name
              </label>
              <div className="relative">
                <Shield className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Lahore Royals XI, Kiwi Strikers"
                  value={fantasyTeamName}
                  onChange={(e) => setFantasyTeamName(e.target.value)}
                  className="w-full bg-[#02241b] border border-emerald-900 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Your fantasy team competes across five separate India vs New Zealand ODI leaderboards.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 rounded-xl bg-linear-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-emerald-950 font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 active:scale-98"
            >
              {loading ? 'Registering Franchise...' : (
                <>
                  Complete Setup & Build Team
                  <ArrowRight className="w-4 h-4 stroke-[3]" />
                </>
              )}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};

export default OnboardingModal;
