import React, { useState, useEffect } from 'react';
import { X, Trophy, Shield, Award, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';

const UserTeamPitchModal = ({ isOpen, onClose, teamDetails, loading }) => {
  const [selectedPlayerForBreakdown, setSelectedPlayerForBreakdown] = useState(null);

  useEffect(()=>setSelectedPlayerForBreakdown(null),[teamDetails?.team_id]);
  if (!isOpen) return null;

  if (loading || !teamDetails) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <div className="bg-[#031c15] border border-emerald-800 rounded-2xl p-6 text-center text-amber-300">
          Loading fantasy lineup details...
        </div>
      </div>
    );
  }

  const {
    fantasy_team_name,
    full_name,
    total_points,
    rank,
    match,
    categorized_players
  } = teamDetails;

  const wk = categorized_players?.WK || [];
  const bat = categorized_players?.BAT || [];
  const ar = categorized_players?.AR || [];
  const bowl = categorized_players?.BOWL || [];

  const renderPlayerToken = (player) => {
    const isC = player.is_captain;
    const isVC = player.is_vice_captain;
    const isPak = player.team === 'PAK';
    const isEng = player.team === 'ENG';
    const isInspected = selectedPlayerForBreakdown?.id === player.id;

    return (
      <div
        key={player.id}
        onClick={() => setSelectedPlayerForBreakdown(player)}
        className={`relative flex flex-col items-center mx-1.5 sm:mx-2.5 my-1.5 cursor-pointer transition-transform hover:scale-105 ${
          isInspected ? 'scale-110' : ''
        }`}
      >
        {/* Avatar */}
        <div
          className={`relative w-12 h-12 sm:w-14 sm:h-14 rounded-full flex flex-col items-center justify-center font-bold text-xs shadow-xl border-2 ${
            isC
              ? 'border-amber-400 bg-linear-to-b from-amber-500 to-amber-700 text-emerald-950 ring-2 ring-amber-300 ring-offset-2 ring-offset-emerald-900'
              : isVC
              ? 'border-indigo-400 bg-linear-to-b from-slate-200 to-slate-400 text-slate-900 ring-2 ring-indigo-400 ring-offset-2 ring-offset-emerald-900'
              : isPak
              ? 'border-emerald-400 bg-linear-to-b from-emerald-700 to-emerald-900 text-white'
              : isEng
              ? 'border-blue-400 bg-linear-to-b from-blue-800 to-blue-950 text-white'
              : 'border-amber-400 bg-linear-to-b from-amber-700 to-amber-900 text-white'
          }`}
        >
          {isC && (
            <span className="absolute -top-2 bg-amber-400 text-emerald-950 font-black text-[9px] px-1.5 py-0.2 rounded-full border border-amber-200">
              2X (C)
            </span>
          )}
          {isVC && (
            <span className="absolute -top-2 bg-indigo-500 text-white font-black text-[9px] px-1.5 py-0.2 rounded-full border border-indigo-200">
              1.5X (VC)
            </span>
          )}

          <span className="text-[11px] font-black">{player.role}</span>
          <span className="text-[9px] uppercase">{player.team}</span>
        </div>

        {/* Name tag */}
        <div className="mt-1 px-1.5 py-0.5 rounded bg-black/80 border border-emerald-500/40 text-[10px] sm:text-[11px] font-bold text-white text-center max-w-[85px] sm:max-w-[95px] truncate">
          {player.name.split(' ').slice(-1)[0]}
        </div>

        {/* Points Tag */}
        <div className="mt-0.5 px-2 py-0.2 rounded-full bg-emerald-950 border border-amber-400/80 text-[10px] font-extrabold text-amber-300">
          {player.effective_points} pts
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#031c15] border border-emerald-800 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-emerald-900/80 flex items-center justify-between bg-linear-to-r from-emerald-950 to-[#031c15]">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full border-2 border-amber-400 overflow-hidden flex-shrink-0 bg-emerald-950 flex items-center justify-center shadow-lg">
              {teamDetails.avatar_url ? (
                <img src={teamDetails.avatar_url} alt={full_name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-amber-300 font-black text-sm">
                  {full_name ? full_name.charAt(0).toUpperCase() : 'U'}
                </span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white">
                  {fantasy_team_name}
                </h2>
                {rank === 1 && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-400 text-emerald-950 text-[10px] font-extrabold flex items-center gap-1 shadow">
                    <Trophy className="w-3 h-3" /> MATCH WINNER
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300">
                Manager: <strong className="text-amber-300">{full_name}</strong> • Match: {match?.title || '2026 Pakistan ODI Tri-Series'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400">Total Score</span>
              <div className="text-xl sm:text-2xl font-black text-amber-400">
                {total_points} <span className="text-xs text-slate-300 font-semibold">PTS</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-emerald-900/60"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col lg:flex-row gap-4">
          
          {/* Turf Pitch (Left 65%) */}
          <div className="flex-1 rounded-xl cricket-turf-bg border-4 border-emerald-700/60 p-3 sm:p-5 flex flex-col justify-between min-h-[440px] relative shadow-inner">
            <div className="absolute inset-2 border-2 border-white/20 rounded-[45%] pointer-events-none" />
            <div className="absolute inset-8 border border-dashed border-white/25 rounded-[45%] pointer-events-none" />

            {/* WICKETKEEPERS */}
            <div className="relative z-10 flex flex-col items-center">
              <span className="text-[10px] font-black tracking-widest text-emerald-300/80 uppercase bg-black/40 px-2 rounded mb-0.5">
                Wicketkeeper
              </span>
              <div className="flex items-center justify-center flex-wrap">
                {wk.map(renderPlayerToken)}
              </div>
            </div>

            {/* BATTERS */}
            <div className="relative z-10 flex flex-col items-center">
              <span className="text-[10px] font-black tracking-widest text-emerald-300/80 uppercase bg-black/40 px-2 rounded mb-0.5">
                Batters
              </span>
              <div className="flex items-center justify-center flex-wrap">
                {bat.map(renderPlayerToken)}
              </div>
            </div>

            {/* ALL-ROUNDERS */}
            <div className="relative z-10 flex flex-col items-center">
              <span className="text-[10px] font-black tracking-widest text-emerald-300/80 uppercase bg-black/40 px-2 rounded mb-0.5">
                All-Rounders
              </span>
              <div className="flex items-center justify-center flex-wrap">
                {ar.map(renderPlayerToken)}
              </div>
            </div>

            {/* BOWLERS */}
            <div className="relative z-10 flex flex-col items-center">
              <span className="text-[10px] font-black tracking-widest text-emerald-300/80 uppercase bg-black/40 px-2 rounded mb-0.5">
                Bowlers
              </span>
              <div className="flex items-center justify-center flex-wrap">
                {bowl.map(renderPlayerToken)}
              </div>
            </div>
          </div>

          {/* Player Score Breakdown Panel (Right 35%) */}
          <div className="w-full lg:w-80 bg-[#02241b] border border-emerald-900 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-emerald-900/80 mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
                  Player Point Breakdown
                </span>
                <span className="text-[10px] text-slate-400">
                  Click player on pitch
                </span>
              </div>

              {selectedPlayerForBreakdown ? (
                <div className="space-y-3">
                  <div className="p-3 rounded-lg bg-emerald-950/80 border border-emerald-700">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-sm text-white">
                        {selectedPlayerForBreakdown.name}
                      </span>
                      <span className="text-xs font-bold text-amber-300">
                        {selectedPlayerForBreakdown.effective_points} pts
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-300 mt-0.5">
                      {selectedPlayerForBreakdown.team} • {selectedPlayerForBreakdown.role} • Multiplier: {selectedPlayerForBreakdown.multiplier}x
                    </div>
                  </div>

                  {/* Stat Items */}
                  <div className="space-y-1">
                    {Object.entries(selectedPlayerForBreakdown.stat_summary.points_breakdown || {}).filter(([key])=>!key.endsWith('_total') && !key.endsWith('_value') && key !== 'final_base_pts').map(([key,value])=><div key={key} className="flex justify-between py-1 border-b border-emerald-900"><span>{key.replaceAll('_',' ')}</span><strong>{value} pts</strong></div>)}
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center text-xs text-slate-400">
                  Select any player on the pitch turf to inspect their ODI fantasy scoring breakdown.
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-emerald-900/80 text-[11px] text-slate-400">
              Scoring Engine: Custom ODI scoring
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default UserTeamPitchModal;
