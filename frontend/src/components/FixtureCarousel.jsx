import React from 'react';
import { Calendar, MapPin, Lock, CheckCircle2, PlayCircle, Trophy, Sparkles, Clock } from 'lucide-react';

const FixtureCarousel = ({ matches, selectedMatch, onSelectMatch }) => {
  // Flag / Team color helper
  const getTeamBadge = (team) => {
    switch (team) {
      case 'PAK':
        return { name: 'Pakistan', bg: 'bg-emerald-950/80 border-emerald-500 text-emerald-300', icon: '🇵🇰' };
      case 'ENG':
        return { name: 'England', bg: 'bg-blue-950/80 border-rose-500 text-blue-200', icon: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' };
      case 'SL':
        return { name: 'Sri Lanka', bg: 'bg-indigo-950/80 border-amber-500 text-indigo-200', icon: '🇱🇰' };
      default:
        return { name: 'TBD', bg: 'bg-slate-900 border-amber-400 text-amber-300', icon: '🏆' };
    }
  };

  const formatMatchDate = (isoString) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      }) + ' • ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return isoString;
    }
  };

  const formatShortDate = (isoString) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="w-full bg-[#022018]/90 border border-emerald-900/60 rounded-2xl p-4 sm:p-5 shadow-xl mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3.5">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-amber-400" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">
            Official Tri-Series Fixtures (Rawalpindi & Lahore Leg)
          </h2>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-emerald-400 font-semibold hidden sm:inline">
            Matches 1-3: Rawalpindi | Matches 4-7: Gaddafi Stadium, Lahore
          </span>
          <span className="px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-700/80 text-[10px] font-bold text-amber-300">
            Fantasy Starts Match 4 (Oct 25)
          </span>
        </div>
      </div>

      {/* Horizontal Carousel */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
        {matches.map((m) => {
          const isSelected = selectedMatch && selectedMatch.id === m.id;
          const isMatchActive = m.is_active;
          const isCompleted = m.status === 'COMPLETED';
          const isPreOct25 = m.match_number < 4;
          const isLocked = m.is_locked || m.status === 'LIVE';
          const isFinal = m.match_number === 7;
          const teamA = getTeamBadge(m.team_a);
          const teamB = getTeamBadge(m.team_b);

          return (
            <div
              key={m.id}
              onClick={() => onSelectMatch(m)}
              className={`relative cursor-pointer rounded-xl p-3.5 transition-all flex flex-col justify-between border ${
                isSelected
                  ? 'bg-linear-to-b from-emerald-800/90 to-emerald-950 border-amber-400 shadow-lg shadow-amber-400/10 ring-1 ring-amber-400'
                  : isMatchActive && !isLocked
                  ? 'bg-emerald-900/40 border-emerald-500/80 hover:border-emerald-400'
                  : isMatchActive && isLocked
                  ? 'bg-amber-950/40 border-amber-500/80 hover:border-amber-400'
                  : isCompleted
                  ? 'bg-slate-900/60 border-slate-700/60 hover:border-slate-600'
                  : 'bg-[#031c15]/60 border-emerald-950/80 hover:border-emerald-800 opacity-80 hover:opacity-100'
              }`}
            >
              {/* Match Header Tag */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-amber-300">
                  {isFinal ? 'THE FINAL' : `GAME ${m.match_number}`}
                </span>

                {isCompleted ? (
                  <span className="text-[9px] font-semibold flex items-center gap-1 text-slate-300 bg-slate-800/80 px-2 py-0.5 rounded-full border border-slate-700">
                    <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" /> Finished
                  </span>
                ) : isMatchActive ? (
                  isLocked ? (
                    <span className="text-[10px] font-extrabold flex items-center gap-1 text-amber-200 bg-amber-950 px-2 py-0.5 rounded-full border border-amber-500/60">
                      <Lock className="w-2.5 h-2.5 text-amber-400" /> Locked
                    </span>
                  ) : (
                    <span className="text-[10px] font-extrabold flex items-center gap-1 text-emerald-950 bg-amber-400 px-2 py-0.5 rounded-full animate-pulse shadow-xs">
                      <PlayCircle className="w-3 h-3 fill-emerald-950 text-amber-400" /> Active (Open)
                    </span>
                  )
                ) : isFinal ? (
                  <span className="text-[10px] font-bold flex items-center gap-1 text-amber-300 bg-amber-950/80 border border-amber-600/80 px-2 py-0.5 rounded-full">
                    <Trophy className="w-3 h-3 text-amber-400" /> Final
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold flex items-center gap-1 text-slate-400 bg-slate-900/80 px-2 py-0.5 rounded-full border border-slate-800">
                    <Lock className="w-2.5 h-2.5 text-slate-500" /> Unlocks {formatShortDate(m.match_date)}
                  </span>
                )}
              </div>

              {/* Matchup */}
              <div className="my-1.5 flex items-center justify-between">
                <div className="flex flex-col items-center flex-1">
                  <span className="text-lg">{teamA.icon}</span>
                  <span className="text-xs font-bold text-white tracking-wider mt-0.5">{m.team_a}</span>
                </div>
                <div className="px-2 text-[11px] font-bold text-amber-400/90">VS</div>
                <div className="flex flex-col items-center flex-1">
                  <span className="text-lg">{teamB.icon}</span>
                  <span className="text-xs font-bold text-white tracking-wider mt-0.5">{m.team_b}</span>
                </div>
              </div>

              {/* Venue & Date */}
              <div className="mt-2 pt-2 border-t border-emerald-950/80 text-[10px] text-slate-300 flex flex-col gap-0.5">
                <div className="flex items-center gap-1 font-medium text-amber-200/90 truncate">
                  <Calendar className="w-3 h-3 flex-shrink-0 text-amber-400" />
                  <span>{formatMatchDate(m.match_date)}</span>
                </div>
                <div className="flex items-center gap-1 text-slate-400 truncate">
                  <MapPin className="w-3 h-3 flex-shrink-0 text-emerald-400" />
                  <span className="truncate">{m.venue.split(',')[0]}</span>
                </div>
              </div>

              {/* Winner Banner or Status */}
              {isCompleted && m.winner_team ? (
                <div className="mt-2 bg-emerald-950 border border-emerald-700/60 rounded px-1.5 py-0.5 text-center text-[10px] font-bold text-amber-300 flex items-center justify-center gap-1">
                  <Trophy className="w-3 h-3 text-amber-400" />
                  <span>Won by {m.winner_team}</span>
                </div>
              ) : isPreOct25 ? (
                <div className="mt-2 bg-slate-950/80 border border-slate-800 rounded px-1.5 py-0.5 text-center text-[9px] font-bold text-slate-400">
                  Rawalpindi Leg (Closed)
                </div>
              ) : !isMatchActive && !isCompleted ? (
                <div className="mt-2 bg-slate-950/70 border border-slate-800 rounded px-1.5 py-0.5 text-center text-[9px] font-bold text-slate-400 flex items-center justify-center gap-1">
                  <Lock className="w-2.5 h-2.5 text-slate-500" />
                  <span>Awaiting previous result</span>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FixtureCarousel;
