import React, { useState } from 'react';
import { UserCheck, Plus, Check, Search, Shield, Eye, AlertTriangle, Award, Lock, CheckCircle2, ArrowRight } from 'lucide-react';

const TeamBuilder = ({
  categorizedPlayers,
  allPlayers,
  selectedPlayers,
  onTogglePlayer,
  onOpenMobilePitch,
  teamA,
  teamB,
  isLocked,
  captainId,
  viceCaptainId,
  onOpenRules,
  selectedMatch,
  activeMatch,
  onSelectMatch,
  onSaveTeam,
  onOpenCaptainModal,
  isSubmitting,
  isSquadSaved,
}) => {
  const [activeRole, setActiveRole] = useState('WK');
  const [teamFilter, setTeamFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const formatFutureDate = (isoString) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return isoString || 'Scheduled Date';
    }
  };

  // =========================================================================
  // CASE 0: PRE-25 OCT RAWALPINDI MATCHES (MATCHES 1 TO 3) - TEAM SELECTION DISABLED
  // =========================================================================
  const isPreOct25Match = selectedMatch && (
    selectedMatch.team_selection_disabled
  );

  if (isPreOct25Match) {
    return (
      <div className="flex flex-col bg-[#031a14] border-2 border-emerald-800/80 rounded-2xl p-6 sm:p-10 text-center space-y-5 shadow-2xl">
        <div className="w-16 h-16 rounded-2xl bg-amber-400/10 border-2 border-amber-400/80 flex items-center justify-center mx-auto shadow-lg shadow-amber-400/10">
          <CheckCircle2 className="w-8 h-8 text-amber-400" />
        </div>

        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 bg-amber-950/90 px-3 py-1 rounded-full border border-amber-500/50">
            RAWALPINDI LEG • MATCH {selectedMatch.match_number} (COMPLETED)
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-white mt-3">
            {teamA} vs {teamB} (Game {selectedMatch.match_number})
          </h2>
          <p className="text-xs text-amber-300 font-bold mt-1">
            {selectedMatch.scorecard_summary || `Finished in Rawalpindi • Won by ${selectedMatch.winner_team || teamA}`}
          </p>
          <p className="text-xs text-emerald-400 font-medium mt-1">
            {selectedMatch.venue} • {formatFutureDate(selectedMatch.match_date)}
          </p>
        </div>

        <div className="bg-[#02241b] border-2 border-amber-500/40 rounded-xl p-4 max-w-lg mx-auto text-xs text-slate-300 space-y-2">
          <p className="font-bold text-amber-300 flex items-center justify-center gap-1.5 text-sm">
            <Lock className="w-4 h-4 text-amber-400" />
            <span>Team Selection Closed for Matches Before October 25</span>
          </p>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            The Tri-Series Fantasy League officially starts with <strong className="text-white">Match 4: Pakistan vs England on Sunday, October 25, 2026 at Gaddafi Stadium, Lahore</strong>. Squad selection is disabled for all matches played before October 25.
          </p>
        </div>

        {activeMatch && (
          <div className="pt-2">
            <button
              onClick={() => onSelectMatch && onSelectMatch(activeMatch)}
              className="px-6 py-3.5 rounded-xl bg-linear-to-r from-amber-400 via-amber-500 to-amber-400 hover:from-amber-300 hover:to-amber-500 text-emerald-950 font-black text-xs uppercase tracking-wider transition-all shadow-xl shadow-amber-400/20 active:scale-95 flex items-center gap-2 mx-auto cursor-pointer"
            >
              <span>👉 Switch to Match 4 (Oct 25: PAK vs ENG) to Build Squad</span>
              <ArrowRight className="w-4 h-4 stroke-[3]" />
            </button>
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // CASE 1: FUTURE FIXTURE LOCKED VIEW (Matches whose scheduled date has not arrived)
  // =========================================================================
  const isFutureLocked = selectedMatch && !selectedMatch.is_active && selectedMatch.status !== 'COMPLETED';
  if (isFutureLocked) {
    return (
      <div className="flex flex-col bg-[#031a14] border-2 border-emerald-800/80 rounded-2xl p-6 sm:p-10 text-center space-y-5 shadow-2xl">
        <div className="w-16 h-16 rounded-2xl bg-amber-400/10 border-2 border-amber-400/80 flex items-center justify-center mx-auto shadow-lg shadow-amber-400/10">
          <Lock className="w-8 h-8 text-amber-400" />
        </div>

        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 bg-amber-950/90 px-3 py-1 rounded-full border border-amber-500/50">
            {selectedMatch.match_number === 7 ? 'THE GRAND FINAL (TOP 1 VS TOP 2) • GADDAFI STADIUM' : `FIXTURE LOCKED UNTIL ${formatFutureDate(selectedMatch.match_date)}`}
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-white mt-3">
            {selectedMatch.match_number === 7 ? 'The Final: Top 1 vs Top 2 (Lahore)' : `${teamA} vs ${teamB} (Game ${selectedMatch.match_number})`}
          </h2>
          <p className="text-xs text-emerald-300 font-semibold mt-1">
            {selectedMatch.venue} • Scheduled: {formatFutureDate(selectedMatch.match_date)} at {new Date(selectedMatch.match_date).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}
          </p>
        </div>

        <div className="bg-[#02241b] border border-emerald-800/80 rounded-xl p-4 max-w-lg mx-auto text-xs text-slate-300 space-y-2">
          <p className="font-semibold text-white">
            Daily Fantasy Lineup Lock Regulations:
          </p>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            Lineups for Game {selectedMatch.match_number} open after the administrator finalizes Game {selectedMatch.match_number - 1}. The configured start time is the submission deadline.
          </p>
        </div>

        {activeMatch && (
          <div className="pt-2">
            <button
              onClick={() => onSelectMatch && onSelectMatch(activeMatch)}
              className="px-5 py-3 rounded-xl bg-linear-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-emerald-950 font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-amber-400/20 active:scale-95 flex items-center gap-2 mx-auto"
            >
              <span>Switch to Active Match: {activeMatch.title} (Open for Squad Selection)</span>
              <ArrowRight className="w-4 h-4 stroke-[3]" />
            </button>
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // CASE 2: COMPLETED FIXTURE ARCHIVE VIEW
  // =========================================================================
  const isCompleted = selectedMatch && selectedMatch.status === 'COMPLETED';
  if (isCompleted) {
    return (
      <div className="flex flex-col bg-[#031a14] border-2 border-emerald-900/80 rounded-2xl p-6 sm:p-10 text-center space-y-5 shadow-2xl">
        <div className="w-16 h-16 rounded-2xl bg-emerald-900/40 border-2 border-emerald-500 flex items-center justify-center mx-auto shadow-lg">
          <CheckCircle2 className="w-8 h-8 text-emerald-400" />
        </div>
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-300 bg-emerald-950 px-3 py-1 rounded-full border border-emerald-600">
            MATCH COMPLETED • RESULTS FINALIZED
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-white mt-3">
            {teamA} vs {teamB} (Game {selectedMatch.match_number})
          </h2>
          <p className="text-xs text-amber-300 font-bold mt-1">
            {selectedMatch.scorecard_summary || `Won by ${selectedMatch.winner_team}`}
          </p>
        </div>
        <p className="text-xs text-slate-300 max-w-md mx-auto">
          This match has concluded and its daily winner has been crowned. Check the Leaderboard tab to view final player ratings and pitch breakdowns.
        </p>
        {activeMatch && activeMatch.id !== selectedMatch.id && (
          <div className="pt-2">
            <button
              onClick={() => onSelectMatch && onSelectMatch(activeMatch)}
              className="px-5 py-3 rounded-xl bg-linear-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-emerald-950 font-black text-xs uppercase tracking-wider transition-all shadow-lg active:scale-95 flex items-center gap-2 mx-auto"
            >
              <span>Go to Active Match: {activeMatch.title} (Build Lineup)</span>
              <ArrowRight className="w-4 h-4 stroke-[3]" />
            </button>
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // CASE 3: ACTIVE MATCH DAY SQUAD BUILDER (OPEN OR LOCKED AT 1ST BALL)
  // =========================================================================
  const selectedIds = new Set(selectedPlayers.map((p) => p.id));
  const teamACount = selectedPlayers.filter((p) => p.team === teamA).length;
  const teamBCount = selectedPlayers.filter((p) => p.team === teamB).length;

  // Role counts
  const roleCounts = {
    WK: selectedPlayers.filter((p) => p.role === 'WK').length,
    BAT: selectedPlayers.filter((p) => p.role === 'BAT').length,
    AR: selectedPlayers.filter((p) => p.role === 'AR').length,
    BOWL: selectedPlayers.filter((p) => p.role === 'BOWL').length,
  };

  const roleLimits = {
    WK: { min: 1, max: 4, label: 'Wicketkeeper' },
    BAT: { min: 3, max: 6, label: 'Batter' },
    AR: { min: 1, max: 4, label: 'All-Rounder' },
    BOWL: { min: 3, max: 6, label: 'Bowler' },
  };

  // Filter current role players
  const currentRolePlayers = (categorizedPlayers[activeRole] || []).filter((p) => {
    const matchesTeam = teamFilter === 'ALL' || p.team === teamFilter;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTeam && matchesSearch;
  });

  return (
    <div className="team-builder flex flex-col bg-[#031a14] border border-emerald-900/80 rounded-2xl p-4 sm:p-5 shadow-xl">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div><p className="text-xs tracking-widest uppercase text-emerald-400 font-bold">Your match. Your XI.</p><h2 className="text-2xl font-bold mt-1">Build your squad</h2><p className="text-sm text-slate-400 mt-1">Pick 11 → choose C / VC → save</p></div>
        <span role="status" className={`text-xs font-bold px-3 py-2 rounded-full ${isSquadSaved ? 'bg-emerald-800 text-emerald-100' : 'bg-amber-950 text-amber-200'}`}>{isSquadSaved ? '✓ Saved online' : 'Draft'}</span>
      </div>
      
      {/* Locked Match Notice Banner if 1st ball has been bowled */}
      {isLocked && (
        <div className="mb-4 p-3.5 rounded-xl bg-amber-950/80 border-2 border-amber-400 text-xs text-amber-200 flex items-start gap-3 shadow-lg">
          <div className="w-8 h-8 rounded-lg bg-amber-400 text-emerald-950 flex items-center justify-center font-bold flex-shrink-0 mt-0.5">
            <Lock className="w-4 h-4 stroke-[2.5]" />
          </div>
          <div className="flex-1">
            <div className="font-extrabold text-amber-300 uppercase tracking-wider text-xs">
              LINEUPS STRICTLY LOCKED (Deadline / Admin Lock)
            </div>
            <p className="text-[11px] text-slate-300 mt-0.5">
              Squad selections are frozen for this match. Only squads saved before the deadline count. Points update after the administrator saves statistics. The next fixture opens after finalization.
            </p>
          </div>
        </div>
      )}

      {/* Selection Progress Tracker */}
      <div className="bg-linear-to-r from-emerald-950/90 to-emerald-900/40 border border-emerald-800/80 rounded-xl p-3.5 mb-4 shadow-inner">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-extrabold tracking-wider text-slate-300">
                Squad Lineup
              </span>
              {onOpenRules && (
                <button
                  onClick={onOpenRules}
                  className="text-[10px] font-bold bg-amber-400/20 text-amber-300 hover:bg-amber-400/30 px-2 py-0.5 rounded border border-amber-400/40 flex items-center gap-1 transition-colors"
                  title="View custom ODI fantasy points breakdown"
                >
                  <Award className="w-3 h-3 text-amber-400" />
                  Scoring Rules
                </button>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xl font-black text-amber-400">
                {selectedPlayers.length}
                <span className="text-slate-400 text-sm font-semibold"> / 11 Players</span>
              </span>
              <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30">
                Zero Budget Limit
              </span>
            </div>
          </div>

          {/* Team balance counter */}
          <div className="flex items-center gap-2 text-xs font-bold">
            <div className={`px-2.5 py-1 rounded-lg border ${
              teamACount > 7
                ? 'bg-red-950 border-red-500 text-red-300'
                : 'bg-emerald-900/60 border-emerald-600 text-emerald-200'
            }`}>
              {teamA}: <span className="text-amber-300">{teamACount}</span>/7
            </div>
            <div className={`px-2.5 py-1 rounded-lg border ${
              teamBCount > 7
                ? 'bg-red-950 border-red-500 text-red-300'
                : 'bg-blue-900/60 border-blue-600 text-blue-200'
            }`}>
              {teamB}: <span className="text-amber-300">{teamBCount}</span>/7
            </div>
          </div>
        </div>

        {/* 11 Segments Visual Tracker */}
        <div className="grid grid-cols-11 gap-1 h-2 rounded overflow-hidden bg-emerald-950">
          {Array.from({ length: 11 }).map((_, idx) => (
            <div
              key={idx}
              className={`h-full rounded-sm transition-all duration-300 ${
                idx < selectedPlayers.length
                  ? 'bg-linear-to-r from-amber-400 to-amber-500 shadow-xs'
                  : 'bg-emerald-900/40'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Role Tabs */}
      <div className="grid grid-cols-4 gap-1.5 sm:gap-2 mb-4">
        {Object.entries(roleLimits).map(([role, limit]) => {
          const count = roleCounts[role] || 0;
          const isInRange = count >= limit.min && count <= limit.max;
          const isOver = count > limit.max;
          const isActive = activeRole === role;

          return (
            <button
              key={role}
              onClick={() => setActiveRole(role)}
              className={`p-2.5 sm:p-3 rounded-xl flex flex-col items-center justify-center transition-all border ${
                isActive
                  ? 'bg-linear-to-b from-emerald-800 to-emerald-950 border-amber-400 text-white shadow-lg ring-1 ring-amber-400'
                  : 'bg-[#02241b] border-emerald-900/80 text-slate-300 hover:border-emerald-700 hover:bg-emerald-900/40'
              }`}
            >
              <span className="text-xs sm:text-sm font-black tracking-wide">
                {role}
              </span>
              <span className="text-[10px] text-slate-400 font-medium">
                ({limit.min}-{limit.max})
              </span>
              <span
                className={`mt-1 text-[11px] font-black px-1.5 py-0.2 rounded-full ${
                  isOver
                    ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                    : isInRange && count > 0
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {count} selected
              </span>
            </button>
          );
        })}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 mb-3">
        {/* Team Filter Pills */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          {['ALL', teamA, teamB].map((t) => (
            <button
              key={t}
              onClick={() => setTeamFilter(t)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all border ${
                teamFilter === t
                  ? 'bg-amber-400 text-emerald-950 border-amber-300 shadow-xs'
                  : 'bg-emerald-950/80 text-slate-300 border-emerald-800/80 hover:bg-emerald-900'
              }`}
            >
              {t === 'ALL' ? 'All Teams' : t}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-48">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search player..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#022018] border border-emerald-900/90 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-amber-400"
          />
        </div>
      </div>

      {/* Role Rule Hint */}
      <div className="text-[11px] text-emerald-300/80 mb-2 flex items-center justify-between px-1">
        <span>
          Pick between <strong className="text-amber-300">{roleLimits[activeRole].min} and {roleLimits[activeRole].max}</strong> {roleLimits[activeRole].label}s
        </span>
        <span className="text-slate-400">
          Showing {currentRolePlayers.length} players
        </span>
      </div>

      {/* Players List */}
      <div className="space-y-2 lg:max-h-[600px] lg:overflow-y-auto pr-1">
        {currentRolePlayers.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            No players found for the selected filter.
          </div>
        ) : (
          currentRolePlayers.map((player) => {
            const isSelected = selectedIds.has(player.id);
            const isPak = player.team === 'PAK';
            const isEng = player.team === 'ENG';
            const isC = player.id === captainId;
            const isVC = player.id === viceCaptainId;

            return (
              <div
                key={player.id}
                className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                  isSelected
                    ? 'bg-linear-to-r from-emerald-900/70 to-emerald-950 border-amber-400/80 shadow-md'
                    : 'bg-[#02241b]/60 border-emerald-900/60 hover:border-emerald-700/80 hover:bg-[#02241b]'
                }`}
              >
                {/* Player details */}
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs border shadow ${
                      isPak
                        ? 'bg-emerald-900 border-emerald-500 text-emerald-300'
                        : isEng
                        ? 'bg-blue-900 border-blue-500 text-blue-200'
                        : 'bg-amber-900 border-amber-500 text-amber-200'
                    }`}
                  >
                    {player.role}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-extrabold text-sm text-white">
                        {player.name}
                      </span>
                      {player.is_captain && (
                        <span className="text-[9px] font-black bg-amber-400 text-emerald-950 px-1 py-0.2 rounded" title="National Team Captain">
                          C
                        </span>
                      )}
                      {isC && (
                        <span className="text-[9px] font-black bg-amber-400 text-emerald-950 px-1.5 py-0.2 rounded-full border border-amber-200">
                          2X CAPTAIN
                        </span>
                      )}
                      {isVC && (
                        <span className="text-[9px] font-black bg-indigo-500 text-white px-1.5 py-0.2 rounded-full border border-indigo-200">
                          1.5X VC
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-300">
                      <span className="font-bold text-emerald-400">{player.team}</span>
                      <span>•</span>
                      <span>{roleLimits[player.role].label}</span>
                    </div>
                  </div>
                </div>

                {/* Pick / Remove Button or Locked State */}
                {isLocked ? (
                  <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-900 border border-slate-700 text-slate-400">
                    {isSelected ? 'In Lineup ✓' : 'Locked'}
                  </span>
                ) : (
                  <button
                    aria-label={`${isSelected ? 'Remove' : 'Pick'} ${player.name}`}
                    onClick={() => onTogglePlayer(player)}
                    aria-pressed={isSelected}
                    className={`shrink-0 min-h-11 ml-2 px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1 ${
                      isSelected
                        ? 'bg-amber-400 hover:bg-amber-300 text-emerald-950 shadow-xs active:scale-95'
                        : 'bg-emerald-900/80 hover:bg-emerald-800 text-amber-300 border border-emerald-700/80 active:scale-95'
                    }`}
                  >
                    {isSelected ? (
                      <>
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        <span className="hidden sm:inline">Selected</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5 stroke-[3]" />
                        Pick
                      </>
                    )}
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Mobile Drawer Trigger */}
      <div className="lg:hidden mt-4 pt-3 border-t border-emerald-900/80 flex items-center gap-2 pb-16">
        <button
          onClick={onOpenMobilePitch}
          className="flex-1 py-3 rounded-xl bg-linear-to-r from-emerald-800 to-emerald-700 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow"
        >
          <Eye className="w-4 h-4 text-amber-400" />
          Preview Pitch Turf ({selectedPlayers.length}/11)
        </button>
      </div>

      {/* Floating Sticky Mobile Bottom Action Bar (Fixed above bottom nav) */}
      <div className="fixed bottom-14 left-0 right-0 z-30 lg:hidden bg-[#031d16]/95 backdrop-blur-md border-t-2 border-amber-400/90 px-3.5 py-2.5 shadow-2xl flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenMobilePitch}
            className="w-10 h-10 rounded-xl bg-emerald-900/80 border border-emerald-600 flex items-center justify-center text-slate-200 shadow active:scale-95 flex-shrink-0 cursor-pointer"
            title="Inspect 2D Pitch Lineup"
          >
            <Eye className="w-5 h-5 text-amber-400" />
          </button>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-black text-white">
                {selectedPlayers.length}
                <span className="text-slate-400 text-xs font-semibold"> / 11 Picked</span>
              </span>
              {selectedPlayers.length === 11 && (
                <span className="text-[9px] bg-emerald-500 text-emerald-950 font-black px-1.5 py-0.2 rounded-full uppercase">
                  XI PICKED
                </span>
              )}
            </div>
            <div className="text-[10px] text-emerald-300 font-semibold flex items-center gap-1">
              <span>{teamA}: {teamACount}</span> • <span>{teamB}: {teamBCount}</span>
            </div>
          </div>
        </div>

        <div>
          {isLocked ? (
            <span className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-900 border border-slate-700 text-slate-400">
              Lineups Frozen
            </span>
          ) : selectedPlayers.length === 11 ? (
            <button
              onClick={() => {
                if (onOpenCaptainModal) {
                  onOpenCaptainModal();
                } else if (onSaveTeam) {
                  onSaveTeam();
                }
              }}
              className="px-4 py-2.5 rounded-xl bg-linear-to-r from-amber-400 via-amber-500 to-amber-400 text-emerald-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-400/30 flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <span>{isSubmitting ? 'Saving…' : isSquadSaved ? 'Review Squad' : 'Review & Save'}</span>
              <ArrowRight className="w-3.5 h-3.5 stroke-[3]" />
            </button>
          ) : (
            <button
              onClick={() => alert(`Pick ${11 - selectedPlayers.length} more players to complete your 11-player squad.`)}
              className="px-3 py-2 rounded-xl bg-emerald-950 border border-emerald-700/80 text-amber-300 font-bold text-xs uppercase tracking-wider"
            >
              Pick {11 - selectedPlayers.length} More
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeamBuilder;
