import SquadAdmin from './SquadAdmin';
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { Shield, Lock, Unlock, Zap, Trophy, Play, CheckCircle2, RotateCcw, AlertTriangle, Users, Award, Sparkles, ChevronRight, X } from 'lucide-react';

const fields = [
  ['runs', 'Runs'],
  ['balls', 'Balls'],
  ['fours', '4s'],
  ['sixes', '6s'],
  ['overs_bowled', 'Overs'],
  ['maidens', 'Mdns'],
  ['runs_conceded', 'Runs conc'],
  ['wickets', 'Wkts'],
  ['lbw_bowled_count', 'Bwld/LBW'],
  ['catches', 'Ctch'],
  ['stumpings_direct_runouts', 'Stump/RO'],
  ['indirect_runouts', 'Ind RO']
];

const input = 'max-w-full bg-[#021812] border border-emerald-700/80 rounded-lg p-2 text-white text-xs focus:outline-none focus:border-amber-400';
const buttonPrimary = 'rounded-xl bg-linear-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 px-4 py-2 text-emerald-950 font-black text-xs uppercase tracking-wider transition-all shadow-md active:scale-95 disabled:opacity-40 cursor-pointer flex items-center justify-center gap-1.5';
const buttonSecondary = 'rounded-xl bg-emerald-900/60 hover:bg-emerald-800/80 border border-emerald-700/80 px-3 py-2 text-emerald-200 font-bold text-xs transition-all active:scale-95 disabled:opacity-40 cursor-pointer flex items-center justify-center gap-1.5';
const emptyInnings = () => ({ runs: 0, wickets: 0, overs: '0' });

export default function AdminToolbar({ activeMatch, onSimulationComplete, onResetComplete, onLockToggle, onOpenAdminDashboard }) {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [matches, setMatches] = useState([]);
  const [id, setId] = useState('1');
  const [data, setData] = useState(null);
  const [rows, setRows] = useState([]);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [date, setDate] = useState('');
  const [venue, setVenue] = useState('');
  const [result, setResult] = useState('WIN');
  const [winner, setWinner] = useState('');
  const [innings, setInnings] = useState({ a: emptyInnings(), b: emptyInnings() });
  const [users, setUsers] = useState([]);
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [filterTeam, setFilterTeam] = useState('ALL');

  if (!user?.is_admin) return null;

  async function load(matchId) {
    const targetId = matchId || id || 1;
    const r = await api.get(`/admin/matches/${targetId}/stats`);
    setData(r.data);
    setId(String(targetId));

    setRows(
      r.data.players.map(p => ({
        player_id: p.id,
        played_xi: false,
        dismissed: false,
        ...Object.fromEntries(fields.map(([f]) => [f, 0])),
        ...(r.data.stats.find(s => s.player_id === p.id) || {})
      }))
    );

    const d = new Date(r.data.match.match_date);
    setDate(new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16));
    setVenue(r.data.match.venue);
    setResult(r.data.match.result || 'WIN');
    setWinner(r.data.match.winner_team || r.data.match.team_a);
    setInnings(r.data.match.innings || { a: emptyInnings(), b: emptyInnings() });
  }

  async function action(fn) {
    setBusy(true);
    setMessage('');
    try {
      await fn();
    } catch (e) {
      setMessage(e.response?.data?.detail || 'Request failed. Reload before retrying.');
    } finally {
      setBusy(false);
    }
  }

  async function show() {
    setOpen(true);
    await action(async () => {
      const [m, u] = await Promise.all([api.get('/matches'), api.get('/admin/users')]);
      setMatches(m.data);
      setUsers(u.data);
      const activeId = activeMatch?.id || (m.data.find(x => x.is_active)?.id) || 1;
      await load(activeId);
    });
  }

  async function quickToggleLock(matchId) {
    const targetId = matchId || activeMatch?.id || id || 1;
    await action(async () => {
      const r = await api.post(`/admin/toggle-lock/${targetId}`);
      setMessage(r.data.message);
      if (data) await load(targetId);
      onLockToggle?.();
    });
  }

  async function save(finalize) {
    if (finalize && !window.confirm('Finalize this match result? This will declare the Daily Fantasy Winner and update the cumulative tournament leaderboard.')) {
      return;
    }
    await action(async () => {
      const r = await api.post(`/admin/matches/${id}/stats`, {
        stats: rows,
        finalize,
        result,
        winner_team: winner,
        innings,
        revision: data.revision
      });
      setMessage(r.data.message);
      await load(id);
      const m = await api.get('/matches');
      setMatches(m.data);
      onSimulationComplete?.();
    });
  }

  function editRow(index, key, value) {
    setRows(old => old.map((r, i) => (i === index ? { ...r, [key]: value } : r)));
  }

  function adjustStat(index, key, delta) {
    setRows(old =>
      old.map((r, i) => {
        if (i !== index) return r;
        const cur = Number(r[key] || 0);
        const next = Math.max(0, cur + delta);
        return { ...r, [key]: next, played_xi: true };
      })
    );
  }

  const currentMatchEffectiveLocked = data?.match ? Boolean(data.match.is_locked || data.match.status === 'LIVE' || data.match.status === 'COMPLETED') : false;
  const filteredRows = rows.filter(r => {
    if (filterTeam === 'ALL') return true;
    const p = data?.players?.find(x => x.id === r.player_id);
    return p?.team === filterTeam;
  });

  return (
    <section className="border-b border-amber-400/40 bg-linear-to-r from-emerald-950 via-[#032018] to-emerald-950 px-4 py-3 shadow-lg">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        
        {/* Left: Admin Status & Quick Lock Switch */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-400 text-emerald-950 flex items-center justify-center font-black shadow">
            <Shield className="w-4 h-4 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <strong className="text-xs sm:text-sm font-black text-amber-300 uppercase tracking-wide">
                ODI Competition Admin Control
              </strong>
              <span className="text-[10px] bg-amber-950 text-amber-300 font-bold px-2 py-0.5 rounded-full border border-amber-500/50">
                {user.full_name}
              </span>
            </div>
            <p className="text-[11px] text-emerald-300/80">
              Active Match: <strong className="text-white">{activeMatch?.title || '1st ODI: New Zealand vs India'}</strong>
            </p>
          </div>
        </div>

        {/* Center: Quick 1-Click Lock/Unlock Toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => quickToggleLock(activeMatch?.id || id || 1)}
            className={`px-3.5 py-1.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 shadow ${
              activeMatch?.is_locked
                ? 'bg-amber-500 hover:bg-amber-400 text-emerald-950 border border-amber-300'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-400'
            }`}
            title="Toggle whether users can submit or edit lineups"
            disabled={busy}
          >
            {activeMatch?.is_locked ? (
              <>
                <Lock className="w-3.5 h-3.5 stroke-[2.5]" />
                Lineups LOCKED (Click to Unlock)
              </>
            ) : (
              <>
                <Unlock className="w-3.5 h-3.5 stroke-[2.5]" />
                Lineups OPEN (Click to Lock)
              </>
            )}
          </button>

          <button
            onClick={show}
            className={buttonPrimary}
            disabled={busy}
          >
            <Trophy className="w-3.5 h-3.5" />
            🏆 Enter Scores & Update Points
          </button>
          {onOpenAdminDashboard && (
            <button
              onClick={onOpenAdminDashboard}
              className={buttonSecondary}
              disabled={busy}
              title="Open full admin center dashboard"
            >
              <Shield className="w-3.5 h-3.5 text-amber-400" />
              Full Admin Center
            </button>
          )}
        </div>
      </div>

      {/* Main Admin Modal */}
      {open && (
        <div className="fixed inset-0 z-[70] bg-black/90 p-3 sm:p-6 overflow-y-auto backdrop-blur-sm animate-fadeIn">
          <div className="max-w-7xl mx-auto bg-[#031c15] border-2 border-emerald-700/80 rounded-2xl p-5 sm:p-6 space-y-5 shadow-2xl">
            
            {/* Modal Header */}
            <header className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-emerald-800 gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-400 text-emerald-950 flex items-center justify-center font-black">
                    <Trophy className="w-4 h-4 stroke-[2.5]" />
                  </div>
                  <h2 className="text-lg sm:text-xl font-black text-white uppercase tracking-wider">
                    India vs New Zealand ODI Scoring & Administration
                  </h2>
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  Manage five ODI fixtures and enter verified scorecards. Live cricket API sync is not configured.
                </p>
              </div>

              <button
                className="self-end sm:self-auto p-2 rounded-xl bg-emerald-900/60 hover:bg-emerald-800 text-slate-300 hover:text-white border border-emerald-700 cursor-pointer"
                onClick={() => setOpen(false)}
                disabled={busy}
              >
                <X className="w-5 h-5" />
              </button>
            </header>

            {message && (
              <div role="status" className="p-3.5 bg-[#02241b] border-2 border-amber-400 rounded-xl text-xs sm:text-sm font-bold text-amber-300 shadow flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span>{message}</span>
              </div>
            )}

            <fieldset disabled={busy} className="space-y-5 disabled:opacity-60">
              
              {/* Fixture Selection Bar */}
              <div className="bg-[#022018] border border-emerald-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <label className="text-xs font-bold text-amber-300">Select Fixture:</label>
                  <select
                    aria-label="Admin fixture"
                    className="bg-[#031d16] border border-emerald-700 rounded-xl px-3 py-1.5 text-xs font-bold text-white focus:outline-none focus:border-amber-400 cursor-pointer"
                    value={id}
                    onChange={e => action(() => load(e.target.value))}
                  >
                    {matches.map(m => (
                      <option value={m.id} key={m.id}>
                        ODI {m.match_number}: {m.title} — [{m.status}]
                      </option>
                    ))}
                  </select>
                </div>

                {data && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => action(async () => {
                        const r = await api.post(`/admin/matches/${id}/activate`);
                        setMessage(r.data.message);
                        await load(id);
                        onSimulationComplete?.();
                      })}
                      className={buttonSecondary}
                      title="Set this match as currently active for all users"
                    >
                      <Play className="w-3.5 h-3.5 text-amber-400" />
                      Set as Active Match
                    </button>

                    <button
                      type="button"
                      onClick={() => action(async () => {
                        const r = await api.post(`/admin/toggle-lock/${id}`);
                        setMessage(r.data.message);
                        await load(id);
                        onLockToggle?.();
                      })}
                      className={`px-3.5 py-1.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 shadow ${
                        data.match.is_locked
                          ? 'bg-amber-400 text-emerald-950'
                          : 'bg-emerald-600 text-white'
                      }`}
                    >
                      {data.match.is_locked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                      {data.match.is_locked ? 'Unlock Lineups' : 'Lock Lineups'}
                    </button>
                  </div>
                )}
              </div>

              {data && (
                <>
                  {/* Quick Scorecard Generator Hero Card */}
                  <div className="bg-linear-to-r from-amber-500/10 via-emerald-900/40 to-amber-500/10 border-2 border-amber-400/80 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 bg-amber-950/90 px-2.5 py-0.5 rounded-full border border-amber-500/50">
                        1-Click Easy Scoring Feature
                      </span>
                      <h3 className="text-base sm:text-lg font-black text-white mt-1">
                        Verified ODI Scorecard Entry ({data.match.team_a} vs {data.match.team_b})
                      </h3>
                      <p className="text-xs text-emerald-200">
                        Live score API is not configured. Use the manual form below with verified scorecard statistics; no demo points are generated.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs text-amber-300 font-bold">Manual verified data only</span>
                    </div>
                  </div>

                  {/* Team Filter & Quick Table Controls */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-300">Filter Team:</span>
                      <button
                        type="button"
                        onClick={() => setFilterTeam('ALL')}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                          filterTeam === 'ALL' ? 'bg-amber-400 text-emerald-950' : 'bg-emerald-900/60 text-slate-300'
                        }`}
                      >
                        All Players ({rows.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setFilterTeam(data.match.team_a)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                          filterTeam === data.match.team_a ? 'bg-amber-400 text-emerald-950' : 'bg-emerald-900/60 text-slate-300'
                        }`}
                      >
                        {data.match.team_a}
                      </button>
                      <button
                        type="button"
                        onClick={() => setFilterTeam(data.match.team_b)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                          filterTeam === data.match.team_b ? 'bg-amber-400 text-emerald-950' : 'bg-emerald-900/60 text-slate-300'
                        }`}
                      >
                        {data.match.team_b}
                      </button>
                    </div>

                    <div className="text-xs text-amber-300 font-semibold">
                      Playing XI Selected: <strong className="text-white">{rows.filter(r => r.played_xi).length}</strong> / 22
                    </div>
                  </div>

                  {/* Player Stats Table */}
                  <div className="overflow-x-auto border border-emerald-800 rounded-xl shadow-inner max-h-[420px] overflow-y-auto">
                    <table className="text-xs w-full">
                      <thead className="bg-[#021812] sticky top-0 z-10 border-b border-emerald-800">
                        <tr>
                          <th className="p-2.5 text-left min-w-40">Player Name</th>
                          <th className="p-2 text-center">Playing XI</th>
                          <th className="p-2 text-center">Out?</th>
                          {fields.map(([f, label]) => (
                            <th key={f} className="p-2 min-w-16 text-center">{label}</th>
                          ))}
                          <th className="p-2 min-w-28 text-center">Quick Adjust</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-emerald-900/40">
                        {filteredRows.map((row) => {
                          const originalIdx = rows.findIndex(r => r.player_id === row.player_id);
                          const p = data.players.find(x => x.id === row.player_id);
                          if (!p) return null;

                          return (
                            <tr key={row.player_id} className={`transition-colors hover:bg-emerald-950/60 ${row.played_xi ? 'bg-emerald-950/20' : 'opacity-60'}`}>
                              <td className="p-2 min-w-40">
                                <span className="font-bold text-white text-xs">{p.name}</span>
                                <div className="text-[10px] text-emerald-300 flex items-center gap-1">
                                  <span>{p.team}</span> • <span>{p.role}</span>
                                </div>
                              </td>
                              <td className="text-center p-2">
                                <input
                                  aria-label={`${p.name} playing XI`}
                                  type="checkbox"
                                  className="w-4 h-4 accent-amber-400 cursor-pointer"
                                  checked={row.played_xi}
                                  onChange={e => editRow(originalIdx, 'played_xi', e.target.checked)}
                                />
                              </td>
                              <td className="text-center p-2">
                                <input
                                  aria-label={`${p.name} dismissed`}
                                  type="checkbox"
                                  className="w-4 h-4 accent-red-500 cursor-pointer"
                                  checked={row.dismissed}
                                  onChange={e => editRow(originalIdx, 'dismissed', e.target.checked)}
                                />
                              </td>
                              {fields.map(([f]) => (
                                <td key={f} className="p-1 text-center">
                                  <input
                                    aria-label={`${p.name} ${f}`}
                                    type={f === 'overs_bowled' ? 'text' : 'number'}
                                    min="0"
                                    step="1"
                                    className="w-16 bg-[#021812] border border-emerald-700/80 rounded px-1.5 py-1 text-center text-xs text-white focus:outline-none focus:border-amber-400"
                                    value={row[f] ?? 0}
                                    onChange={e => editRow(originalIdx, f, f === 'overs_bowled' ? e.target.value : Number(e.target.value))}
                                  />
                                </td>
                              ))}
                              {/* Quick Adjustment Steppers */}
                              <td className="p-1 text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => adjustStat(originalIdx, 'runs', 10)}
                                    className="px-1.5 py-0.5 rounded bg-amber-400/20 hover:bg-amber-400/40 text-amber-300 text-[10px] font-bold border border-amber-400/30"
                                    title="Add 10 runs"
                                  >
                                    +10R
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => adjustStat(originalIdx, 'wickets', 1)}
                                    className="px-1.5 py-0.5 rounded bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-300 text-[10px] font-bold border border-emerald-500/30"
                                    title="Add 1 wicket"
                                  >
                                    +1W
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => adjustStat(originalIdx, 'catches', 1)}
                                    className="px-1.5 py-0.5 rounded bg-blue-500/20 hover:bg-blue-500/40 text-blue-300 text-[10px] font-bold border border-blue-500/30"
                                    title="Add 1 catch"
                                  >
                                    +1C
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Innings & Result Panel */}
                  <div className="bg-[#022018] border border-emerald-800 rounded-xl p-4 space-y-4 shadow-lg">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-800 pb-3">
                      <div>
                        <h4 className="font-black text-sm text-white uppercase tracking-wider flex items-center gap-1.5">
                          <Trophy className="w-4 h-4 text-amber-400" />
                          Final Match Innings & Outcome
                        </h4>
                        <p className="text-[11px] text-emerald-300">
                          Confirm the winning team and team scores to calculate net run rate (NRR) and series standings.
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <select
                          aria-label="Result type"
                          className={input}
                          value={result}
                          onChange={e => setResult(e.target.value)}
                        >
                          <option value="WIN">Win</option>
                          <option value="TIE">Tie</option>
                          <option value="NO_RESULT">No result</option>
                        </select>

                        {result === 'WIN' && (
                          <select
                            aria-label="Winning team"
                            className={input}
                            value={winner}
                            onChange={e => setWinner(e.target.value)}
                          >
                            <option value={data.match.team_a}>{data.match.team_a} Won</option>
                            <option value={data.match.team_b}>{data.match.team_b} Won</option>
                          </select>
                        )}
                      </div>
                    </div>

                    {result !== 'NO_RESULT' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {['a', 'b'].map(side => (
                          <div key={side} className="bg-[#031d16] border border-emerald-700/80 rounded-xl p-3 space-y-2">
                            <span className="text-xs font-black text-amber-300 uppercase block">
                              {data.match['team_' + side]} Innings Score
                            </span>
                            <div className="grid grid-cols-3 gap-2">
                              {['runs', 'wickets', 'overs'].map(f => (
                                <label key={f} className="text-[10px] text-slate-300 block font-bold capitalize">
                                  {f}
                                  <input
                                    aria-label={`${side} innings ${f}`}
                                    className={input + ' block w-full mt-1'}
                                    value={innings[side][f]}
                                    type={f === 'overs' ? 'text' : 'number'}
                                    min="0"
                                    onChange={e =>
                                      setInnings(old => ({
                                        ...old,
                                        [side]: { ...old[side], [f]: f === 'overs' ? e.target.value : Number(e.target.value) }
                                      }))
                                    }
                                  />
                                </label>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                      <button
                        type="button"
                        className={buttonSecondary}
                        disabled={data.match.status === 'COMPLETED'}
                        onClick={() => save(false)}
                      >
                        Save Live Scores (Without Finalizing)
                      </button>

                      <button
                        type="button"
                        className={buttonPrimary}
                        onClick={() => save(true)}
                      >
                        <Trophy className="w-4 h-4 fill-emerald-950" />
                        🏆 Finalize Match Result & Crown Daily Winner!
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* Squad Admin & Advanced Tools */}
              <SquadAdmin />

              <details className="border-t border-emerald-800 pt-3">
                <summary className="cursor-pointer text-xs font-bold text-slate-300 hover:text-white">
                  Account Recovery (Password Reset for Users)
                </summary>
                <div className="p-3 bg-[#022018] rounded-xl mt-2 flex flex-wrap items-center gap-2">
                  <select
                    aria-label="Account to reset"
                    className={input}
                    value={userId}
                    onChange={e => setUserId(e.target.value)}
                  >
                    <option value="">Select Cousin Account</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.full_name || u.email} — {u.email}
                      </option>
                    ))}
                  </select>
                  <input
                    aria-label="New account password"
                    className={input}
                    type="password"
                    placeholder="New password (10+ characters)"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className={buttonSecondary}
                    disabled={!userId || password.length < 10}
                    onClick={() =>
                      action(async () => {
                        const r = await api.post(`/admin/users/${userId}/password`, { password });
                        setPassword('');
                        setMessage(r.data.message);
                        if (Number(userId) === user.id) logout();
                      })
                    }
                  >
                    Change Password
                  </button>
                </div>
              </details>

              <details className="border-t border-red-900/60 pt-3">
                <summary className="text-red-400 cursor-pointer text-xs font-bold hover:text-red-300">
                  Reset India vs New Zealand ODI competition
                </summary>
                <div className="p-3 bg-red-950/30 border border-red-900 rounded-xl mt-2 flex items-center justify-between gap-3">
                  <p className="text-xs text-slate-300">
                    Clears all five ODI fantasy lineups and scores, while keeping registered accounts and restoring the original five fixtures.
                  </p>
                  <button
                    type="button"
                    className="bg-red-800 hover:bg-red-700 text-white rounded-xl px-4 py-2 font-black text-xs uppercase tracking-wider transition-all cursor-pointer flex-shrink-0"
                    onClick={() => {
                      if (window.prompt('Type RESET to remove all five ODI lineups and reset fixtures') === 'RESET') {
                        action(async () => {
                          const r = await api.post('/admin/reset-tournament', { confirm: 'RESET' });
                          setMessage(r.data.message);
                          await load(1);
                          onResetComplete?.();
                        });
                      }
                    }}
                  >
                    Reset Tournament
                  </button>
                </div>
              </details>

            </fieldset>
          </div>
        </div>
      )}
    </section>
  );
}
