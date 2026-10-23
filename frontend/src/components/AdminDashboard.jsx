import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { 
  Shield, Lock, Unlock, Zap, Trophy, Play, CheckCircle2, RotateCcw, 
  AlertTriangle, Users, Award, Sparkles, ChevronRight, X, Plus, Minus, Search, Calendar, MapPin
} from 'lucide-react';

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

const emptyInnings = () => ({ runs: 0, wickets: 0, overs: '0' });

export default function AdminDashboard({ activeMatch, onSimulationComplete, onLockToggle, onOpenAuth }) {
  const { user, login } = useAuth();
  const [matches, setMatches] = useState([]);
  const [selectedMatchId, setSelectedMatchId] = useState('4');
  const [data, setData] = useState(null);
  const [rows, setRows] = useState([]);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [date, setDate] = useState('');
  const [venue, setVenue] = useState('');
  const [result, setResult] = useState('WIN');
  const [winner, setWinner] = useState('');
  const [innings, setInnings] = useState({ a: emptyInnings(), b: emptyInnings() });
  const [filterTeam, setFilterTeam] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [adminLoggingIn, setAdminLoggingIn] = useState(false);
  const [adminEmailInput, setAdminEmailInput] = useState('');
  const [adminPasswordInput, setAdminPasswordInput] = useState('');

  // Load matches list on mount
  useEffect(() => {
    fetchMatches();
  }, []);

  // When user is admin or match ID changes, load match stats
  useEffect(() => {
    if (user?.is_admin) {
      loadStats(selectedMatchId);
    }
  }, [user?.is_admin, selectedMatchId]);

  async function fetchMatches() {
    try {
      const res = await api.get('/matches');
      setMatches(res.data);
      // Default to match 4 if available
      const m4 = res.data.find(m => m.id === 4) || res.data.find(m => m.is_active) || res.data[0];
      if (m4 && !selectedMatchId) {
        setSelectedMatchId(String(m4.id));
      }
    } catch (err) {
      console.error('Failed to load matches for admin:', err);
    }
  }

  async function loadStats(targetId) {
    const idToLoad = targetId || selectedMatchId || '4';
    try {
      setBusy(true);
      const res = await api.get(`/admin/matches/${idToLoad}/stats`);
      setData(res.data);
      setSelectedMatchId(String(idToLoad));

      setRows(
        res.data.players.map(p => ({
          player_id: p.id,
          played_xi: false,
          dismissed: false,
          ...Object.fromEntries(fields.map(([f]) => [f, 0])),
          ...(res.data.stats.find(s => s.player_id === p.id) || {})
        }))
      );

      const d = new Date(res.data.match.match_date);
      setDate(new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16));
      setVenue(res.data.match.venue);
      setResult(res.data.match.result || 'WIN');
      setWinner(res.data.match.winner_team || res.data.match.team_a);
      setInnings(res.data.match.innings || { a: emptyInnings(), b: emptyInnings() });
    } catch (err) {
      setMessage(err.response?.data?.detail || 'Failed to load match statistics.');
    } finally {
      setBusy(false);
    }
  }

  // Secure Administrator Manual Sign In
  async function handleManualAdminLogin(e) {
    if (e) e.preventDefault();
    if (!adminEmailInput.trim() || !adminPasswordInput) {
      setMessage('Please enter both administrator email and password.');
      return;
    }
    try {
      setAdminLoggingIn(true);
      setMessage('');
      const loggedUser = await login(adminEmailInput.trim(), adminPasswordInput);
      if (!loggedUser?.is_admin) {
        setMessage('Access denied: This account does not have administrator privileges.');
        return;
      }
      setMessage('✅ Welcome Ahmad Tahseen! Admin Control Center unlocked.');
      await fetchMatches();
      await loadStats('4');
    } catch (err) {
      setMessage(err.response?.data?.detail || 'Invalid email or password. Access denied.');
    } finally {
      setAdminLoggingIn(false);
    }
  }

  // Quick Lock / Unlock Toggle
  async function handleToggleLock(targetId) {
    const matchId = targetId || selectedMatchId || '4';
    try {
      setBusy(true);
      setMessage('');
      const res = await api.post(`/admin/toggle-lock/${matchId}`);
      setMessage(res.data.message);
      await loadStats(matchId);
      await fetchMatches();
      onLockToggle?.();
    } catch (err) {
      setMessage(err.response?.data?.detail || 'Failed to toggle lineup lock.');
    } finally {
      setBusy(false);
    }
  }

  // Activate Fixture for squad selection
  async function handleActivateMatch(targetId) {
    const matchId = targetId || selectedMatchId || '4';
    try {
      setBusy(true);
      setMessage('');
      const res = await api.post(`/admin/matches/${matchId}/activate`);
      setMessage(res.data.message);
      await loadStats(matchId);
      await fetchMatches();
      onSimulationComplete?.();
    } catch (err) {
      setMessage(err.response?.data?.detail || 'Failed to activate match.');
    } finally {
      setBusy(false);
    }
  }

  // Edit table cell
  function editRow(index, key, value) {
    setRows(old => old.map((r, i) => (i === index ? { ...r, [key]: value } : r)));
  }

  // Quick plus/minus delta on stats
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

  // 1-Click Realistic Scorecard Generator
  function handleGenerateRealisticScorecard() {
    if (!data) return;
    const teamA = data.match.team_a;
    const teamB = data.match.team_b;

    const squadA = data.players.filter(p => p.team === teamA);
    const squadB = data.players.filter(p => p.team === teamB);

    // Pick 11 starting players for each squad
    const playingA = new Set(squadA.slice(0, 11).map(p => p.id));
    const playingB = new Set(squadB.slice(0, 11).map(p => p.id));

    const updatedRows = rows.map(r => {
      const p = data.players.find(x => x.id === r.player_id);
      if (!p) return r;

      const isPlaying = playingA.has(p.id) || playingB.has(p.id);

      if (!isPlaying) {
        return {
          ...r,
          played_xi: false,
          dismissed: false,
          runs: 0,
          balls: 0,
          fours: 0,
          sixes: 0,
          overs_bowled: 0,
          maidens: 0,
          runs_conceded: 0,
          wickets: 0,
          lbw_bowled_count: 0,
          catches: 0,
          stumpings_direct_runouts: 0,
          indirect_runouts: 0
        };
      }

      // Realistic stats based on real player form
      if (p.name.includes('Babar')) {
        return { ...r, played_xi: true, dismissed: true, runs: 82, balls: 76, fours: 9, sixes: 2, overs_bowled: 0, maidens: 0, runs_conceded: 0, wickets: 0, lbw_bowled_count: 0, catches: 1 };
      }
      if (p.name.includes('Fakhar')) {
        return { ...r, played_xi: true, dismissed: true, runs: 54, balls: 42, fours: 6, sixes: 2, overs_bowled: 0, maidens: 0, runs_conceded: 0, wickets: 0, lbw_bowled_count: 0, catches: 0 };
      }
      if (p.name.includes('Saim Ayub')) {
        return { ...r, played_xi: true, dismissed: true, runs: 36, balls: 29, fours: 4, sixes: 1, overs_bowled: 0, maidens: 0, runs_conceded: 0, wickets: 0, lbw_bowled_count: 0, catches: 1 };
      }
      if (p.name.includes('Shaheen')) {
        return { ...r, played_xi: true, dismissed: false, runs: 14, balls: 9, fours: 1, sixes: 1, overs_bowled: '10', maidens: 1, runs_conceded: 45, wickets: 3, lbw_bowled_count: 2, catches: 1 };
      }
      if (p.name.includes('Naseem')) {
        return { ...r, played_xi: true, dismissed: true, runs: 8, balls: 6, fours: 1, sixes: 0, overs_bowled: '9', maidens: 0, runs_conceded: 42, wickets: 2, lbw_bowled_count: 1, catches: 0 };
      }
      if (p.name.includes('Haris Rauf')) {
        return { ...r, played_xi: true, dismissed: false, runs: 6, balls: 4, fours: 0, sixes: 0, overs_bowled: '9.4', maidens: 0, runs_conceded: 48, wickets: 3, lbw_bowled_count: 1, catches: 0 };
      }
      if (p.name.includes('Salman Ali Agha')) {
        return { ...r, played_xi: true, dismissed: true, runs: 42, balls: 34, fours: 4, sixes: 1, overs_bowled: '4', maidens: 0, runs_conceded: 24, wickets: 1, lbw_bowled_count: 0, catches: 1 };
      }
      if (p.name.includes('Shadab')) {
        return { ...r, played_xi: true, dismissed: true, runs: 28, balls: 22, fours: 2, sixes: 1, overs_bowled: '8', maidens: 0, runs_conceded: 46, wickets: 1, lbw_bowled_count: 0, catches: 2 };
      }
      if (p.name.includes('Brook')) {
        return { ...r, played_xi: true, dismissed: true, runs: 74, balls: 65, fours: 8, sixes: 3, overs_bowled: 0, maidens: 0, runs_conceded: 0, wickets: 0, lbw_bowled_count: 0, catches: 1 };
      }
      if (p.name.includes('Root')) {
        return { ...r, played_xi: true, dismissed: true, runs: 58, balls: 68, fours: 5, sixes: 0, overs_bowled: '3', maidens: 0, runs_conceded: 18, wickets: 0, lbw_bowled_count: 0, catches: 1 };
      }
      if (p.name.includes('Duckett')) {
        return { ...r, played_xi: true, dismissed: true, runs: 46, balls: 38, fours: 6, sixes: 0, overs_bowled: 0, maidens: 0, runs_conceded: 0, wickets: 0, lbw_bowled_count: 0, catches: 0 };
      }
      if (p.name.includes('Curran')) {
        return { ...r, played_xi: true, dismissed: true, runs: 32, balls: 26, fours: 3, sixes: 1, overs_bowled: '8', maidens: 0, runs_conceded: 52, wickets: 2, lbw_bowled_count: 1, catches: 0 };
      }
      if (p.name.includes('Rashid')) {
        return { ...r, played_xi: true, dismissed: true, runs: 12, balls: 14, fours: 1, sixes: 0, overs_bowled: '10', maidens: 1, runs_conceded: 44, wickets: 2, lbw_bowled_count: 1, catches: 0 };
      }
      if (p.name.includes('Atkinson')) {
        return { ...r, played_xi: true, dismissed: true, runs: 8, balls: 9, fours: 0, sixes: 0, overs_bowled: '9', maidens: 0, runs_conceded: 50, wickets: 2, lbw_bowled_count: 1, catches: 1 };
      }

      // Default role assignments
      if (p.role === 'BAT' || p.role === 'WK') {
        return { ...r, played_xi: true, dismissed: true, runs: 24, balls: 20, fours: 2, sixes: 0, overs_bowled: 0, maidens: 0, runs_conceded: 0, wickets: 0, catches: 1 };
      } else if (p.role === 'BOWL') {
        return { ...r, played_xi: true, dismissed: false, runs: 5, balls: 6, fours: 0, sixes: 0, overs_bowled: '8', maidens: 0, runs_conceded: 44, wickets: 1, lbw_bowled_count: 0, catches: 0 };
      } else {
        return { ...r, played_xi: true, dismissed: true, runs: 18, balls: 16, fours: 2, sixes: 0, overs_bowled: '5', maidens: 0, runs_conceded: 28, wickets: 1, lbw_bowled_count: 0, catches: 0 };
      }
    });

    setRows(updatedRows);
    setResult('WIN');
    setWinner(teamA);
    setInnings({
      a: { runs: 288, wickets: 7, overs: '50' },
      b: { runs: 274, wickets: 10, overs: '48.4' }
    });
    setMessage('⚡ Generated thrilling realistic scorecard! Click "Finalize Match & Crown Daily Winner" below to declare results.');
  }

  // Save Stats or Finalize
  async function handleSave(finalize) {
    if (finalize && !window.confirm('Finalize this match result? This will declare the Daily Fantasy Winner, update all player fantasy points, and calculate the tournament leaderboard!')) {
      return;
    }

    try {
      setBusy(true);
      setMessage('');
      const res = await api.post(`/admin/matches/${selectedMatchId}/stats`, {
        stats: rows,
        finalize,
        result,
        winner_team: winner,
        innings,
        revision: data.revision
      });
      setMessage(res.data.message);
      await loadStats(selectedMatchId);
      await fetchMatches();
      onSimulationComplete?.();
    } catch (err) {
      setMessage(err.response?.data?.detail || 'Failed to save statistics. Ensure the match is locked first.');
    } finally {
      setBusy(false);
    }
  }

  // Reset Tournament
  async function handleResetTournament() {
    if (!window.confirm('Are you sure you want to reset the tournament? All fantasy lineups from Match 4 onward will be cleared.')) {
      return;
    }
    try {
      setBusy(true);
      setMessage('');
      const res = await api.post('/admin/reset-tournament', { confirm: 'RESET' });
      setMessage(res.data.message);
      await fetchMatches();
      await loadStats('4');
      onSimulationComplete?.();
    } catch (err) {
      setMessage(err.response?.data?.detail || 'Tournament reset failed.');
    } finally {
      setBusy(false);
    }
  }

  // =========================================================================
  // VIEW 1: USER IS NOT LOGGED IN AS ADMIN -> SHOW PROMINENT LOGIN GATEWAY
  // =========================================================================
  if (!user || !user.is_admin) {
    return (
      <div className="max-w-2xl mx-auto my-8 bg-[#031c15] border-2 border-amber-400/80 rounded-3xl p-6 sm:p-10 text-center space-y-6 shadow-2xl">
        <div className="w-16 h-16 rounded-2xl bg-amber-400/10 border-2 border-amber-400 flex items-center justify-center mx-auto shadow-lg shadow-amber-400/10">
          <Shield className="w-8 h-8 text-amber-400 stroke-[2.5]" />
        </div>

        <div>
          <span className="text-[11px] font-black uppercase tracking-widest text-amber-300 bg-amber-950 px-3.5 py-1 rounded-full border border-amber-500/60">
            Tournament Super Administrator Portal
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-white mt-3">
            Admin Control Center
          </h1>
          <p className="text-xs sm:text-sm text-emerald-300/90 mt-2 max-w-md mx-auto">
            You must be logged in with the official Tournament Administrator account (<strong className="text-white">Ahmad Tahseen</strong>) to lock/unlock lineups, enter live scores, and crown Daily Fantasy Winners.
          </p>
        </div>

        {message && (
          <div className="p-3 bg-red-950/80 border border-red-500 rounded-xl text-xs font-bold text-red-200">
            {message}
          </div>
        )}

        {/* Secure Admin Credentials Login Form */}
        <form onSubmit={handleManualAdminLogin} className="bg-[#02241b] border border-emerald-800 rounded-2xl p-5 space-y-3.5 text-left">
          <div className="flex items-center justify-between border-b border-emerald-900 pb-2">
            <span className="text-xs font-bold text-slate-300">Authorized Personnel Only</span>
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-500/40">
              Admin Sign In
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Admin Email Address</label>
            <input
              type="email"
              required
              placeholder="Enter administrator email..."
              value={adminEmailInput}
              onChange={(e) => setAdminEmailInput(e.target.value)}
              className="w-full bg-[#031d16] border border-emerald-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Admin Password</label>
            <input
              type="password"
              required
              placeholder="Enter administrator password..."
              value={adminPasswordInput}
              onChange={(e) => setAdminPasswordInput(e.target.value)}
              className="w-full bg-[#031d16] border border-emerald-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
            />
          </div>

          <button
            type="submit"
            disabled={adminLoggingIn}
            className="w-full py-3 rounded-xl bg-linear-to-r from-amber-400 via-amber-500 to-amber-400 hover:from-amber-300 hover:to-amber-500 text-emerald-950 font-black text-xs uppercase tracking-wider transition-all shadow-xl shadow-amber-400/20 active:scale-98 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
          >
            <Shield className="w-4 h-4 stroke-[2.5]" />
            <span>{adminLoggingIn ? 'Verifying Admin Credentials...' : 'Unlock Admin Control Center'}</span>
          </button>
        </form>

        <p className="text-[11px] text-slate-400">
          Players and managers: please use <button onClick={onOpenAuth} className="text-amber-400 underline font-bold">Sign In / Register Team</button> in the top right.
        </p>
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: LOGGED IN AS ADMIN -> FULL ADMIN CONTROL DASHBOARD
  // =========================================================================
  const currentMatch = data?.match;
  const isMatchLocked = currentMatch ? Boolean(currentMatch.is_locked || currentMatch.effective_locked || currentMatch.status === 'LIVE' || currentMatch.status === 'COMPLETED') : false;
  const isCompleted = currentMatch?.status === 'COMPLETED';

  const filteredRows = rows.filter(r => {
    const p = data?.players?.find(x => x.id === r.player_id);
    if (!p) return false;
    const matchesTeam = filterTeam === 'ALL' || p.team === filterTeam;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTeam && matchesSearch;
  });

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      
      {/* Super Admin Top Header Banner */}
      <div className="bg-linear-to-r from-emerald-950 via-[#032018] to-emerald-950 border-2 border-amber-400/80 rounded-2xl p-5 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 text-center md:text-left">
            <div className="w-12 h-12 rounded-xl bg-amber-400 text-emerald-950 flex items-center justify-center font-black shadow-md flex-shrink-0">
              <Shield className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2 justify-center md:justify-start">
                <span className="text-[10px] font-black uppercase tracking-wider bg-amber-400 text-emerald-950 px-2 py-0.5 rounded-full">
                  SUPER ADMIN
                </span>
                <span className="text-xs font-bold text-amber-300">
                  {user.full_name} ({user.email})
                </span>
              </div>
              <h1 className="text-lg sm:text-xl font-black text-white mt-1">
                2026 Tri-Series Commissioner Control Dashboard
              </h1>
              <p className="text-xs text-emerald-300/90">
                Lock/Unlock cousin lineups, enter match scores, simulate realistic play, and announce Daily Fantasy Winners!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleResetTournament}
              disabled={busy}
              className="px-3 py-2 rounded-xl bg-red-950/80 hover:bg-red-900 border border-red-600 text-red-200 font-bold text-xs transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
              title="Reset tournament back to initial Game 4"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Tournament
            </button>
          </div>
        </div>
      </div>

      {message && (
        <div role="status" className="p-4 bg-[#02241b] border-2 border-amber-400 rounded-xl text-xs sm:text-sm font-bold text-amber-300 shadow-lg flex items-center gap-2.5 animate-fadeIn">
          <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {/* MASTER LINEUP LOCK CONTROLLER & FIXTURE SELECTOR */}
      <div className="bg-[#031c15] border-2 border-emerald-700/80 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-emerald-800">
          
          {/* Left: Fixture selector */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <label className="text-xs font-bold text-amber-300 uppercase tracking-wider flex-shrink-0">
              Select Match to Administer:
            </label>
            <select
              aria-label="Admin fixture select"
              className="bg-[#021812] border-2 border-emerald-600 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-amber-400 cursor-pointer"
              value={selectedMatchId}
              onChange={e => loadStats(e.target.value)}
              disabled={busy}
            >
              {matches.map(m => (
                <option value={m.id} key={m.id}>
                  Game {m.match_number}: {m.title} — [{m.status}]
                </option>
              ))}
            </select>
          </div>

          {/* Right: Master Lineup Lock / Unlock Button */}
          {currentMatch && (
            <div className="flex items-center gap-2.5 flex-wrap">
              {!isCompleted && (
                <button
                  onClick={() => handleToggleLock(selectedMatchId)}
                  disabled={busy}
                  className={`px-5 py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 shadow-xl cursor-pointer active:scale-95 ${
                    isMatchLocked
                      ? 'bg-amber-400 hover:bg-amber-300 text-emerald-950 border-2 border-amber-300 ring-2 ring-amber-400/40'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white border-2 border-emerald-400'
                  }`}
                >
                  {isMatchLocked ? (
                    <>
                      <Lock className="w-4 h-4 stroke-[2.5]" />
                      <span>Lineups are LOCKED (Click to Unlock)</span>
                    </>
                  ) : (
                    <>
                      <Unlock className="w-4 h-4 stroke-[2.5]" />
                      <span>Lineups are OPEN (Click to Lock)</span>
                    </>
                  )}
                </button>
              )}

              {!currentMatch.is_active && !isCompleted && (
                <button
                  type="button"
                  onClick={() => handleActivateMatch(selectedMatchId)}
                  disabled={busy}
                  className="px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  Make Active Fixture
                </button>
              )}
            </div>
          )}
        </div>

        {/* Selected Match Quick Info Card */}
        {currentMatch && (
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs bg-[#022018] border border-emerald-800 rounded-xl p-3.5">
            <div className="flex items-center gap-3">
              <span className={`px-2.5 py-1 rounded-full font-black text-[10px] uppercase tracking-wider ${
                isCompleted
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-600'
                  : isMatchLocked
                  ? 'bg-amber-950 text-amber-300 border border-amber-500'
                  : 'bg-emerald-700 text-white'
              }`}>
                {isCompleted ? 'COMPLETED' : isMatchLocked ? 'LINEUPS LOCKED' : 'OPEN FOR SELECTION'}
              </span>
              <strong className="text-white text-sm">
                Game {currentMatch.match_number}: {currentMatch.title}
              </strong>
            </div>

            <div className="flex items-center gap-4 text-slate-300">
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3 text-emerald-400" />
                {currentMatch.venue}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3 text-amber-400" />
                {new Date(currentMatch.match_date).toLocaleDateString()} at {new Date(currentMatch.match_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* MATCH SCORING & FINALIZATION CONTROLS */}
      {data && (
        <div className="bg-[#031c15] border-2 border-emerald-700/80 rounded-2xl p-5 shadow-xl space-y-5">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-emerald-800">
            <div>
              <h2 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-400" />
                <span>Enter Match Results & Player Statistics</span>
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                Lock the match first, then use the 1-Click Generator or manually enter runs, wickets, and catches.
              </p>
            </div>

            {/* 1-Click Realistic Scorecard Generator Button */}
            <button
              onClick={handleGenerateRealisticScorecard}
              disabled={busy}
              className="px-4 py-2.5 rounded-xl bg-linear-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-emerald-950 font-black text-xs uppercase tracking-wider transition-all shadow-lg active:scale-95 flex items-center gap-2 cursor-pointer self-start sm:self-auto"
            >
              <Zap className="w-4 h-4 fill-emerald-950" />
              <span>⚡ 1-Click Auto-Fill Realistic Scorecard</span>
            </button>
          </div>

          {/* Innings Totals & Result Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-[#022018] border border-emerald-800/80 rounded-xl p-4 text-xs">
            {/* Team A Innings */}
            <div className="space-y-2">
              <label className="font-bold text-amber-300 block">
                {data.match.team_a} Innings Score:
              </label>
              <div className="flex items-center gap-2">
                <input
                  aria-label={`${data.match.team_a} Runs`}
                  type="number"
                  className="w-20 bg-[#021812] border border-emerald-700 rounded-lg p-1.5 text-white text-xs font-bold"
                  placeholder="Runs"
                  value={innings.a.runs}
                  onChange={e => setInnings({ ...innings, a: { ...innings.a, runs: Number(e.target.value) } })}
                />
                <span className="text-slate-400">/</span>
                <input
                  aria-label={`${data.match.team_a} Wickets`}
                  type="number"
                  className="w-16 bg-[#021812] border border-emerald-700 rounded-lg p-1.5 text-white text-xs font-bold"
                  placeholder="Wkts"
                  value={innings.a.wickets}
                  onChange={e => setInnings({ ...innings, a: { ...innings.a, wickets: Number(e.target.value) } })}
                />
                <span className="text-slate-400">in</span>
                <input
                  aria-label={`${data.match.team_a} Overs`}
                  type="text"
                  className="w-16 bg-[#021812] border border-emerald-700 rounded-lg p-1.5 text-white text-xs font-bold"
                  placeholder="Overs"
                  value={innings.a.overs}
                  onChange={e => setInnings({ ...innings, a: { ...innings.a, overs: e.target.value } })}
                />
                <span className="text-slate-400">ov</span>
              </div>
            </div>

            {/* Team B Innings */}
            <div className="space-y-2">
              <label className="font-bold text-amber-300 block">
                {data.match.team_b} Innings Score:
              </label>
              <div className="flex items-center gap-2">
                <input
                  aria-label={`${data.match.team_b} Runs`}
                  type="number"
                  className="w-20 bg-[#021812] border border-emerald-700 rounded-lg p-1.5 text-white text-xs font-bold"
                  placeholder="Runs"
                  value={innings.b.runs}
                  onChange={e => setInnings({ ...innings, b: { ...innings.b, runs: Number(e.target.value) } })}
                />
                <span className="text-slate-400">/</span>
                <input
                  aria-label={`${data.match.team_b} Wickets`}
                  type="number"
                  className="w-16 bg-[#021812] border border-emerald-700 rounded-lg p-1.5 text-white text-xs font-bold"
                  placeholder="Wkts"
                  value={innings.b.wickets}
                  onChange={e => setInnings({ ...innings, b: { ...innings.b, wickets: Number(e.target.value) } })}
                />
                <span className="text-slate-400">in</span>
                <input
                  aria-label={`${data.match.team_b} Overs`}
                  type="text"
                  className="w-16 bg-[#021812] border border-emerald-700 rounded-lg p-1.5 text-white text-xs font-bold"
                  placeholder="Overs"
                  value={innings.b.overs}
                  onChange={e => setInnings({ ...innings, b: { ...innings.b, overs: e.target.value } })}
                />
                <span className="text-slate-400">ov</span>
              </div>
            </div>

            {/* Match Winner */}
            <div className="space-y-2">
              <label className="font-bold text-amber-300 block">Match Winner:</label>
              <div className="flex items-center gap-2">
                <select
                  aria-label="Result type"
                  className="bg-[#021812] border border-emerald-700 rounded-lg p-1.5 text-white text-xs font-bold cursor-pointer"
                  value={result}
                  onChange={e => setResult(e.target.value)}
                >
                  <option value="WIN">Decisive Win</option>
                  <option value="TIE">Tied Match</option>
                  <option value="NO_RESULT">No Result / Abandoned</option>
                </select>

                {result === 'WIN' && (
                  <select
                    aria-label="Winning Team"
                    className="bg-[#021812] border border-emerald-700 rounded-lg p-1.5 text-white text-xs font-bold cursor-pointer"
                    value={winner}
                    onChange={e => setWinner(e.target.value)}
                  >
                    <option value={data.match.team_a}>{data.match.team_a}</option>
                    <option value={data.match.team_b}>{data.match.team_b}</option>
                  </select>
                )}
              </div>
            </div>
          </div>

          {/* Search & Team Filter for Players */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setFilterTeam('ALL')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  filterTeam === 'ALL' ? 'bg-amber-400 text-emerald-950' : 'bg-emerald-900/60 text-slate-300 hover:text-white'
                }`}
              >
                All Players ({rows.length})
              </button>
              <button
                onClick={() => setFilterTeam(data.match.team_a)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  filterTeam === data.match.team_a ? 'bg-amber-400 text-emerald-950' : 'bg-emerald-900/60 text-slate-300 hover:text-white'
                }`}
              >
                {data.match.team_a} Squad
              </button>
              <button
                onClick={() => setFilterTeam(data.match.team_b)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  filterTeam === data.match.team_b ? 'bg-amber-400 text-emerald-950' : 'bg-emerald-900/60 text-slate-300 hover:text-white'
                }`}
              >
                {data.match.team_b} Squad
              </button>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search player name..."
                className="bg-[#021812] border border-emerald-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400 w-full sm:w-56"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Player Statistics Grid */}
          <div className="overflow-x-auto border border-emerald-800 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-emerald-950/80 border-b border-emerald-800 text-[10px] font-black uppercase tracking-wider text-slate-300">
                  <th className="py-2.5 px-3">Player</th>
                  <th className="py-2.5 px-2 text-center">Team</th>
                  <th className="py-2.5 px-2 text-center">Role</th>
                  <th className="py-2.5 px-2 text-center">Playing XI</th>
                  <th className="py-2.5 px-2 text-center">Runs</th>
                  <th className="py-2.5 px-2 text-center">Balls</th>
                  <th className="py-2.5 px-2 text-center">4s / 6s</th>
                  <th className="py-2.5 px-2 text-center">Overs</th>
                  <th className="py-2.5 px-2 text-center">Wkts</th>
                  <th className="py-2.5 px-2 text-center">Catches</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-900/40">
                {filteredRows.map(r => {
                  const p = data.players.find(x => x.id === r.player_id);
                  const rowIndex = rows.findIndex(x => x.player_id === r.player_id);

                  return (
                    <tr key={r.player_id} className={`hover:bg-emerald-900/30 ${r.played_xi ? 'bg-emerald-950/30' : ''}`}>
                      <td className="py-2 px-3 font-bold text-white whitespace-nowrap">
                        {p?.name}
                        {p?.is_captain && <span className="ml-1 text-[9px] text-amber-400 font-black">(C)</span>}
                      </td>
                      <td className="py-2 px-2 text-center font-bold text-amber-300">{p?.team}</td>
                      <td className="py-2 px-2 text-center text-slate-400">{p?.role}</td>
                      <td className="py-2 px-2 text-center">
                        <input
                          type="checkbox"
                          checked={r.played_xi}
                          onChange={e => editRow(rowIndex, 'played_xi', e.target.checked)}
                          className="w-4 h-4 rounded text-amber-400 focus:ring-0 cursor-pointer"
                        />
                      </td>
                      <td className="py-2 px-2 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => adjustStat(rowIndex, 'runs', -5)} className="w-5 h-5 rounded bg-emerald-900 text-slate-300 text-[10px] font-bold">-</button>
                          <input
                            type="number"
                            className="w-14 bg-[#021812] border border-emerald-700 rounded p-1 text-center font-bold text-white text-xs"
                            value={r.runs}
                            onChange={e => editRow(rowIndex, 'runs', Number(e.target.value))}
                          />
                          <button onClick={() => adjustStat(rowIndex, 'runs', 5)} className="w-5 h-5 rounded bg-emerald-900 text-slate-300 text-[10px] font-bold">+</button>
                        </div>
                      </td>
                      <td className="py-2 px-2 text-center">
                        <input
                          type="number"
                          className="w-12 bg-[#021812] border border-emerald-700 rounded p-1 text-center text-white text-xs"
                          value={r.balls}
                          onChange={e => editRow(rowIndex, 'balls', Number(e.target.value))}
                        />
                      </td>
                      <td className="py-2 px-2 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <input
                            type="number"
                            placeholder="4s"
                            className="w-10 bg-[#021812] border border-emerald-700 rounded p-1 text-center text-white text-xs"
                            value={r.fours}
                            onChange={e => editRow(rowIndex, 'fours', Number(e.target.value))}
                          />
                          <input
                            type="number"
                            placeholder="6s"
                            className="w-10 bg-[#021812] border border-emerald-700 rounded p-1 text-center text-white text-xs"
                            value={r.sixes}
                            onChange={e => editRow(rowIndex, 'sixes', Number(e.target.value))}
                          />
                        </div>
                      </td>
                      <td className="py-2 px-2 text-center">
                        <input
                          type="text"
                          className="w-12 bg-[#021812] border border-emerald-700 rounded p-1 text-center text-white text-xs"
                          value={r.overs_bowled}
                          onChange={e => editRow(rowIndex, 'overs_bowled', e.target.value)}
                        />
                      </td>
                      <td className="py-2 px-2 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => adjustStat(rowIndex, 'wickets', -1)} className="w-5 h-5 rounded bg-emerald-900 text-slate-300 text-[10px] font-bold">-</button>
                          <input
                            type="number"
                            className="w-10 bg-[#021812] border border-emerald-700 rounded p-1 text-center font-bold text-amber-300 text-xs"
                            value={r.wickets}
                            onChange={e => editRow(rowIndex, 'wickets', Number(e.target.value))}
                          />
                          <button onClick={() => adjustStat(rowIndex, 'wickets', 1)} className="w-5 h-5 rounded bg-emerald-900 text-slate-300 text-[10px] font-bold">+</button>
                        </div>
                      </td>
                      <td className="py-2 px-2 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => adjustStat(rowIndex, 'catches', -1)} className="w-5 h-5 rounded bg-emerald-900 text-slate-300 text-[10px] font-bold">-</button>
                          <input
                            type="number"
                            className="w-10 bg-[#021812] border border-emerald-700 rounded p-1 text-center text-white text-xs"
                            value={r.catches}
                            onChange={e => editRow(rowIndex, 'catches', Number(e.target.value))}
                          />
                          <button onClick={() => adjustStat(rowIndex, 'catches', 1)} className="w-5 h-5 rounded bg-emerald-900 text-slate-300 text-[10px] font-bold">+</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ACTION BUTTONS: SAVE LIVE STATS / FINALIZE RESULT */}
          <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-emerald-800">
            <button
              onClick={() => handleSave(false)}
              disabled={busy}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-emerald-900/80 hover:bg-emerald-800 border border-emerald-600 text-emerald-200 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50"
            >
              Save Live Stats (Do Not Finalize Yet)
            </button>

            <button
              onClick={() => handleSave(true)}
              disabled={busy}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-linear-to-r from-amber-400 via-amber-500 to-amber-400 hover:from-amber-300 hover:to-amber-500 text-emerald-950 font-black text-xs uppercase tracking-wider transition-all shadow-xl shadow-amber-400/20 active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Trophy className="w-4 h-4 stroke-[2.5]" />
              <span>🏆 Finalize Match Result & Crown Daily Winner</span>
            </button>
          </div>

        </div>
      )}

    </div>
  );
}
