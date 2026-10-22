import React from 'react';
import { Trophy, Shield, User as UserIcon, LogOut, LogIn, Sparkles, Camera, CheckCircle2, Award } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Navbar = ({ activeTab, setActiveTab, onOpenAuth, onOpenProfile, onOpenRules, hasMyTeam, myTeamName }) => {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-[#031a14]/95 backdrop-blur-md border-b border-emerald-900/60 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Logo */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('builder')}>
            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-amber-400 via-amber-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Trophy className="w-5 h-5 text-emerald-950 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight text-white flex items-center gap-1.5">
                  TRI-SERIES <span className="text-amber-400">2026</span>
                </span>
                <span className="text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded tracking-wider uppercase">
                  ODI
                </span>
              </div>
              <p className="text-[11px] text-emerald-400/80 font-medium hidden sm:block">
                Pakistan • England • Sri Lanka
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1.5">
            <button
              onClick={() => setActiveTab('builder')}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'builder'
                  ? 'bg-emerald-800/80 text-amber-300 shadow-xs border border-emerald-700/60'
                  : 'text-slate-300 hover:text-white hover:bg-emerald-900/40'
              }`}
            >
              Squad Builder
            </button>

            {/* My Team Tab button if logged in */}
            {user && (
              <button
                onClick={() => setActiveTab('builder')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 border ${
                  hasMyTeam
                    ? 'bg-amber-400/10 text-amber-300 border-amber-400/40 hover:bg-amber-400/20'
                    : 'bg-emerald-950/60 text-emerald-300 border-emerald-700 hover:bg-emerald-900/50'
                }`}
                title="View your saved 11-player lineup"
              >
                <Shield className="w-3.5 h-3.5 text-amber-400" />
                <span>My Lineup</span>
                {hasMyTeam ? (
                  <span className="bg-amber-400 text-emerald-950 font-black text-[9px] px-1 rounded-full">
                    11/11
                  </span>
                ) : (
                  <span className="bg-slate-800 text-slate-400 font-bold text-[9px] px-1 rounded-full">
                    0/11
                  </span>
                )}
              </button>
            )}

            <button
              onClick={() => setActiveTab('leaderboard')}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'leaderboard'
                  ? 'bg-emerald-800/80 text-amber-300 shadow-xs border border-emerald-700/60'
                  : 'text-slate-300 hover:text-white hover:bg-emerald-900/40'
              }`}
            >
              <Trophy className="w-4 h-4 text-amber-400" />
              Leaderboard
            </button>
            <button
              onClick={() => setActiveTab('standings')}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'standings'
                  ? 'bg-emerald-800/80 text-amber-300 shadow-xs border border-emerald-700/60'
                  : 'text-slate-300 hover:text-white hover:bg-emerald-900/40'
              }`}
            >
              Tri-Series Standings
            </button>
            <button
              onClick={onOpenRules}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-amber-300 hover:bg-emerald-900/40 transition-all flex items-center gap-1.5"
              title="Custom ODI World Cup Scoring System"
            >
              <Award className="w-3.5 h-3.5 text-amber-400" />
              Scoring Rules
            </button>

            {/* DEDICATED ADMIN PANEL TAB - ONLY VISIBLE TO AHMAD TAHSEEN (ADMIN) */}
            {user?.is_admin && (
              <button
                onClick={() => setActiveTab('admin')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 border shadow-sm ${
                  activeTab === 'admin'
                    ? 'bg-amber-400 text-emerald-950 border-amber-300 ring-2 ring-amber-400/50'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/50 hover:bg-amber-500/30'
                }`}
                title="Tournament Super Admin: Lock lineups, enter scores, finalize results"
              >
                <Shield className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Admin Panel</span>
                <span className="bg-amber-400 text-emerald-950 font-black text-[9px] px-1 rounded-full animate-pulse">
                  ADMIN
                </span>
              </button>
            )}
          </nav>

          {/* User Profile / Auth State */}
          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-2.5">
                <div className="hidden sm:flex flex-col items-end cursor-pointer" onClick={onOpenProfile}>
                  <span className="text-xs font-bold text-amber-300 flex items-center gap-1">
                    {user.is_admin ? (
                      <span className="bg-amber-400 text-emerald-950 text-[9px] font-black px-1.5 py-0.2 rounded uppercase">
                        ADMIN
                      </span>
                    ) : (
                      <Sparkles className="w-3 h-3 text-amber-400" />
                    )}
                    {user.fantasy_team_name || 'My Fantasy XI'}
                  </span>
                  <span className="text-[11px] text-slate-300">
                    {user.full_name || user.email.split('@')[0]}
                  </span>
                </div>

                {/* Profile Picture / Avatar Trigger */}
                <div
                  onClick={onOpenProfile}
                  className="relative group cursor-pointer w-10 h-10 rounded-full border-2 border-amber-400 overflow-hidden shadow-md bg-emerald-950 flex items-center justify-center transition-transform hover:scale-105"
                  title="Click to view/change profile picture"
                >
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt={user.full_name || 'User'} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-amber-400 font-black text-sm">
                      {user.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
                    </span>
                  )}
                  {/* Camera overlay on hover */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <Camera className="w-3.5 h-3.5 text-white" />
                  </div>
                </div>

                <button
                  onClick={logout}
                  title="Sign Out"
                  className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="flex items-center gap-2 bg-linear-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-emerald-950 px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-wider transition-all shadow-md shadow-amber-500/20 active:scale-95"
              >
                <LogIn className="w-4 h-4 stroke-[2.5]" />
                Sign In / Register
              </button>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};

export default Navbar;
