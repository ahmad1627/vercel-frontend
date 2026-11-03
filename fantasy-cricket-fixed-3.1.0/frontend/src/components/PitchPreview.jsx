import React from 'react';
import { Shield, Sparkles, Check, AlertCircle, Trash2, Award, Lock, CheckCircle2 } from 'lucide-react';

const PitchPreview = ({
  selectedPlayers,
  captainId,
  viceCaptainId,
  boosterId,
  onSetBooster,
  onSetCaptain,
  onSetViceCaptain,
  onRemovePlayer,
  onSaveTeam,
  validationErrors,
  isSubmitting,
  teamA,
  teamB,
  isLocked,
  selectedMatch,
}) => {
  // Separate players into the 4 rows
  const wkPlayers = selectedPlayers.filter((p) => p.role === 'WK');
  const batPlayers = selectedPlayers.filter((p) => p.role === 'BAT');
  const arPlayers = selectedPlayers.filter((p) => p.role === 'AR');
  const bowlPlayers = selectedPlayers.filter((p) => p.role === 'BOWL');

  const teamACount = selectedPlayers.filter((p) => p.team === teamA).length;
  const teamBCount = selectedPlayers.filter((p) => p.team === teamB).length;

  const isValid = selectedPlayers.length === 11 &&
    validationErrors.length === 0 &&
    captainId &&
    viceCaptainId && boosterId &&
    new Set([captainId, viceCaptainId, boosterId]).size === 3;

  const renderPlayerNode = (player) => {
    const isC = player.id === captainId;
    const isVC = player.id === viceCaptainId;
    const isBooster = player.id === boosterId;
    const isIndia = player.team === 'IND';
    const isNZ = player.team === 'NZ';

    return (
      <div key={player.id} className="relative group flex flex-col items-center mx-1 sm:mx-2 my-1 transition-transform hover:scale-105">
        {/* Remove Button on hover */}
        {!isLocked && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemovePlayer(player.id);
            }}
            className="absolute -top-1.5 -right-1.5 z-20 w-5 h-5 rounded-full bg-red-600/90 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[10px] shadow-md hover:bg-red-500"
            title="Remove player"
          >
            ✕
          </button>
        )}

        {/* Player Avatar / Jersey */}
        <div
          className={`relative w-12 h-12 sm:w-14 sm:h-14 rounded-full flex flex-col items-center justify-center font-bold text-xs shadow-xl transition-all border-2 ${
            isBooster
              ? 'border-fuchsia-400 bg-linear-to-b from-fuchsia-700 to-fuchsia-900 text-white ring-2 ring-fuchsia-400 ring-offset-2 ring-offset-emerald-900'
              : isC
              ? 'border-amber-400 bg-linear-to-b from-amber-500 to-amber-700 text-emerald-950 ring-2 ring-amber-300 ring-offset-2 ring-offset-emerald-900'
              : isVC
              ? 'border-indigo-400 bg-linear-to-b from-slate-200 to-slate-400 text-slate-900 ring-2 ring-indigo-400 ring-offset-2 ring-offset-emerald-900'
              : isIndia
              ? 'border-blue-400 bg-linear-to-b from-blue-800 to-blue-950 text-white'
              : isNZ
              ? 'border-slate-300 bg-linear-to-b from-slate-800 to-black text-white'
              : 'border-yellow-400 bg-linear-to-b from-yellow-700 to-yellow-900 text-white'
          }`}
        >
          {/* Captain / Vice Captain Badge Pill */}
          {isC && (
            <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-amber-400 text-emerald-950 font-black text-[9px] px-1.5 py-0.2 rounded-full border border-amber-200 shadow-xs">
              2X
            </span>
          )}
          {isBooster && <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-fuchsia-500 text-white font-black text-[9px] px-1.5 py-0.2 rounded-full border border-fuchsia-200 shadow-xs">3X</span>}
          {isVC && (
            <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-indigo-500 text-white font-black text-[9px] px-1.5 py-0.2 rounded-full border border-indigo-200 shadow-xs">
              1.5X
            </span>
          )}

          <span className="text-[11px] font-black tracking-tight">{player.role}</span>
          <span className="text-[9px] uppercase opacity-90">{player.team}</span>
        </div>

        {/* Player Name Tag */}
        <div className="mt-1 px-1.5 py-0.5 rounded bg-black/80 backdrop-blur-sm border border-emerald-500/30 text-[10px] sm:text-[11px] font-bold text-white text-center max-w-[80px] sm:max-w-[95px] truncate shadow">
          {player.name.split(' ').slice(-1)[0]}
        </div>

        {/* C & VC Toggle Buttons */}
        {!isLocked && (
          <div className="mt-1 flex items-center gap-1 z-10">
            <button
              onClick={() => onSetCaptain(player.id)}
              className={`w-5 h-5 rounded-full text-[9px] font-black transition-all border ${
                isC
                  ? 'bg-amber-400 text-emerald-950 border-amber-300 shadow-md font-bold'
                  : 'bg-emerald-950/90 text-amber-300 border-amber-400/40 hover:bg-amber-400/20'
              }`}
              title="Make Captain (2.0x points)"
            >
              C
            </button>
            <button
              onClick={() => onSetBooster?.(player.id)}
              className={`w-6 h-5 rounded-full text-[9px] font-black transition-all border ${isBooster ? 'bg-fuchsia-500 text-white border-fuchsia-300' : 'bg-emerald-950/90 text-fuchsia-300 border-fuchsia-400/40 hover:bg-fuchsia-400/20'}`}
              title="Make 3X Booster"
            >3X</button>
            <button
              onClick={() => onSetViceCaptain(player.id)}
              className={`w-5 h-5 rounded-full text-[9px] font-black transition-all border ${
                isVC
                  ? 'bg-indigo-400 text-emerald-950 border-indigo-300 shadow-md font-bold'
                  : 'bg-emerald-950/90 text-indigo-300 border-indigo-400/40 hover:bg-indigo-400/20'
              }`}
              title="Make Vice-Captain (1.5x points)"
            >
              VC
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-[#031a14] border border-emerald-900/80 rounded-2xl p-4 shadow-2xl">
      {/* Turf Header */}
      <div className="flex items-center justify-between pb-3 border-b border-emerald-900/60 mb-3">
        <div>
          <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            2D Turf Pitch Formation
          </h3>
          <p className="text-[11px] text-emerald-300/80">
            Choose C (2X), VC (1.5X) and 3X on different players
          </p>
        </div>

        {/* Team breakdown */}
        <div className="flex items-center gap-2 text-xs font-bold">
          <span className="px-2 py-0.5 rounded bg-emerald-900 border border-emerald-500 text-emerald-300">
            {teamA}: {teamACount}
          </span>
          <span className="px-2 py-0.5 rounded bg-blue-900 border border-blue-500 text-blue-300">
            {teamB}: {teamBCount}
          </span>
        </div>
      </div>

      {/* Interactive Cricket Pitch Canvas */}
      <div className="relative flex-1 min-h-[460px] sm:min-h-[500px] rounded-xl overflow-hidden cricket-turf-bg border-4 border-emerald-700/60 p-2 sm:p-4 flex flex-col justify-between">
        
        {/* Field Oval Markings */}
        <div className="absolute inset-2 sm:inset-4 border-2 border-white/20 rounded-[45%] pointer-events-none" />
        <div className="absolute inset-8 sm:inset-12 border border-dashed border-white/25 rounded-[45%] pointer-events-none" />

        {/* Center Pitch Dirt Strip */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 sm:w-20 h-32 sm:h-40 wicket-strip rounded opacity-85 border border-amber-300/40 pointer-events-none flex flex-col justify-between items-center py-2">
          {/* Stumps & Crease */}
          <div className="w-12 h-1 bg-white/70" />
          <div className="text-[9px] font-black text-amber-950 uppercase tracking-widest rotate-90">
            TURF
          </div>
          <div className="w-12 h-1 bg-white/70" />
        </div>

        {/* ROW 1: WICKETKEEPERS */}
        <div className="relative z-10 flex flex-col items-center">
          <span className="text-[10px] font-black tracking-widest text-emerald-300/70 uppercase bg-black/40 px-2 rounded mb-0.5">
            Wicketkeeper ({wkPlayers.length})
          </span>
          <div className="flex items-center justify-center flex-wrap">
            {wkPlayers.length > 0 ? (
              wkPlayers.map(renderPlayerNode)
            ) : (
              <div className="text-[11px] text-amber-200/70 italic py-1 bg-black/20 px-3 rounded">
                Select 1 to 4 Wicketkeepers
              </div>
            )}
          </div>
        </div>

        {/* ROW 2: BATTERS */}
        <div className="relative z-10 flex flex-col items-center">
          <span className="text-[10px] font-black tracking-widest text-emerald-300/70 uppercase bg-black/40 px-2 rounded mb-0.5">
            Batters ({batPlayers.length})
          </span>
          <div className="flex items-center justify-center flex-wrap">
            {batPlayers.length > 0 ? (
              batPlayers.map(renderPlayerNode)
            ) : (
              <div className="text-[11px] text-amber-200/70 italic py-1 bg-black/20 px-3 rounded">
                Select 3 to 6 Batters
              </div>
            )}
          </div>
        </div>

        {/* ROW 3: ALL-ROUNDERS */}
        <div className="relative z-10 flex flex-col items-center">
          <span className="text-[10px] font-black tracking-widest text-emerald-300/70 uppercase bg-black/40 px-2 rounded mb-0.5">
            All-Rounders ({arPlayers.length})
          </span>
          <div className="flex items-center justify-center flex-wrap">
            {arPlayers.length > 0 ? (
              arPlayers.map(renderPlayerNode)
            ) : (
              <div className="text-[11px] text-amber-200/70 italic py-1 bg-black/20 px-3 rounded">
                Select 1 to 4 All-Rounders
              </div>
            )}
          </div>
        </div>

        {/* ROW 4: BOWLERS */}
        <div className="relative z-10 flex flex-col items-center">
          <span className="text-[10px] font-black tracking-widest text-emerald-300/70 uppercase bg-black/40 px-2 rounded mb-0.5">
            Bowlers ({bowlPlayers.length})
          </span>
          <div className="flex items-center justify-center flex-wrap">
            {bowlPlayers.length > 0 ? (
              bowlPlayers.map(renderPlayerNode)
            ) : (
              <div className="text-[11px] text-amber-200/70 italic py-1 bg-black/20 px-3 rounded">
                Select 3 to 6 Bowlers
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Validation Checklist / Errors */}
      {validationErrors.length > 0 ? (
        <div className="mt-3 p-2.5 rounded-xl bg-amber-950/60 border border-amber-600/60 text-xs text-amber-200 flex flex-col gap-1">
          <div className="font-bold flex items-center gap-1.5 text-amber-400">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            Lineup Requirements Checklist:
          </div>
          <ul className="list-disc pl-5 space-y-0.5 text-[11px]">
            {validationErrors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="mt-3 p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-500/60 text-xs text-emerald-200 flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-400 stroke-[3]" />
          <span className="font-semibold">
            {selectedPlayers.length === 11 && captainId && viceCaptainId
              ? 'All selection rules and multipliers satisfied! Ready to save.'
              : `${11 - selectedPlayers.length} more player(s) required to complete 11.`}
          </span>
        </div>
      )}

      {/* Save Lineup Button or Granular Locked Notification */}
      {selectedMatch && !selectedMatch.is_active && selectedMatch.status !== 'COMPLETED' ? (
        <div className="mt-3 p-3 rounded-xl bg-slate-950/90 border border-slate-700/80 text-center shadow-lg">
          <div className="flex items-center justify-center gap-2 text-slate-300 font-extrabold text-xs uppercase tracking-wider mb-1">
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            Awaiting Previous Result
          </div>
          <p className="text-[11px] text-slate-400 leading-tight">
            Lineup submission opens after the administrator finalizes the preceding match.
          </p>
        </div>
      ) : selectedMatch && selectedMatch.status === 'COMPLETED' ? (
        <div className="mt-3 p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/80 text-center shadow-lg">
          <div className="flex items-center justify-center gap-2 text-amber-300 font-extrabold text-xs uppercase tracking-wider mb-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            Match Completed • Results Archived
          </div>
          <p className="text-[11px] text-emerald-200 leading-tight">
            Final fantasy scores are recorded. Switch to the next fixture to build a fresh 11-player squad!
          </p>
        </div>
      ) : isLocked ? (
        <div className="mt-3 p-3 rounded-xl bg-amber-950/80 border border-amber-500/80 text-center shadow-lg">
          <div className="flex items-center justify-center gap-2 text-amber-300 font-extrabold text-xs uppercase tracking-wider mb-1">
            <Lock className="w-3.5 h-3.5" />
            Lineup Locked (Deadline / Admin Lock)
          </div>
          <p className="text-[11px] text-slate-300 leading-tight">
            Squad is locked in for this match. Points update after the administrator saves the match scorecard.
          </p>
        </div>
      ) : (
        <button
          onClick={onSaveTeam}
          disabled={!isValid || isSubmitting}
          className={`mt-3 w-full py-3 rounded-xl font-black text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg ${
            isValid && !isSubmitting
              ? 'bg-linear-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-emerald-950 shadow-amber-500/25 active:scale-[0.98]'
              : 'bg-emerald-950/60 text-slate-500 border border-emerald-900 cursor-not-allowed'
          }`}
        >
          {isSubmitting ? (
            'Saving Lineup...'
          ) : (
            <>
              <Shield className="w-4 h-4 fill-emerald-950" />
              Save 11-Player Fantasy Lineup
            </>
          )}
        </button>
      )}
    </div>
  );
};

export default PitchPreview;
