import React from 'react';
import { Trophy, Shield, Calendar, User as UserIcon, LogIn, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const MobileBottomNav = ({ activeTab, setActiveTab, onOpenAuth }) => {
  const { user } = useAuth();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-[#031a14]/95 backdrop-blur-md border-t border-emerald-900/80 px-2 py-1 shadow-2xl">
      <div className="grid grid-cols-5 gap-1">
        <button
          onClick={() => setActiveTab('builder')}
          className={`flex flex-col items-center justify-center py-1.5 rounded-xl transition-all ${
            activeTab === 'builder'
              ? 'text-amber-400 font-bold bg-emerald-900/50'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Shield className="w-5 h-5" />
          <span className="text-[9px] mt-0.5">My Squad</span>
        </button>

        <button
          onClick={() => setActiveTab('leaderboard')}
          className={`flex flex-col items-center justify-center py-1.5 rounded-xl transition-all ${
            activeTab === 'leaderboard'
              ? 'text-amber-400 font-bold bg-emerald-900/50'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Trophy className="w-5 h-5" />
          <span className="text-[9px] mt-0.5">Ranks</span>
        </button>

        <button
          onClick={() => setActiveTab('standings')}
          className={`flex flex-col items-center justify-center py-1.5 rounded-xl transition-all ${
            activeTab === 'standings'
              ? 'text-amber-400 font-bold bg-emerald-900/50'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Calendar className="w-5 h-5" />
          <span className="text-[9px] mt-0.5">Standings</span>
        </button>

        {/* Mobile Admin Button */}
        <button
          onClick={() => setActiveTab('admin')}
          className={`flex flex-col items-center justify-center py-1.5 rounded-xl transition-all ${
            activeTab === 'admin'
              ? 'text-amber-400 font-black bg-amber-950/80 border border-amber-500/60'
              : user?.is_admin
              ? 'text-amber-300 font-bold'
              : 'text-slate-400 hover:text-amber-400'
          }`}
        >
          <Shield className="w-5 h-5 text-amber-400" />
          <span className="text-[9px] mt-0.5">Admin</span>
        </button>

        <button
          onClick={user ? () => setActiveTab('builder') : onOpenAuth}
          className={`flex flex-col items-center justify-center py-1.5 rounded-xl transition-all ${
            user ? 'text-emerald-400' : 'text-amber-400 font-bold'
          }`}
        >
          {user ? (
            <>
              <div className="w-5 h-5 rounded-full bg-emerald-900 border border-emerald-500 text-amber-300 flex items-center justify-center text-[10px] font-black">
                {user.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
              </div>
              <span className="text-[9px] mt-0.5 truncate max-w-[50px]">
                {user.fantasy_team_name ? user.fantasy_team_name.split(' ')[0] : 'Profile'}
              </span>
            </>
          ) : (
            <>
              <LogIn className="w-5 h-5" />
              <span className="text-[9px] mt-0.5">Sign In</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default MobileBottomNav;
