import React, { useState, useEffect } from 'react';
import { Trophy, Medal, Shield, Eye, Calendar, Sparkles, ChevronRight, User as UserIcon, Clock, Award, Star, Search, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api';

const Leaderboard = ({ matches, activeMatchId, onInspectTeam }) => {
  const { user } = useAuth();
  
  // View mode: 'overall' | 'match'
  const [viewMode, setViewMode] = useState('overall');
  
  // Match-specific leaderboard state
  const [selectedMatchId, setSelectedMatchId] = useState(activeMatchId || 4);
  const [matchLeaderboardData, setMatchLeaderboardData] = useState([]);
  const [matchInfo, setMatchInfo] = useState(null);
  
  // Overall tournament leaderboard state
  const [overallData, setOverallData] = useState([]);
  const [overallMeta, setOverallMeta] = useState({ completed_matches: 0, is_series_concluded: false });

  const [loading, setLoading] = useState(true);
  const [filterMyTeamOnly, setFilterMyTeamOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (activeMatchId) {
      setSelectedMatchId(activeMatchId);
    }
  }, [activeMatchId]);

  // Load Match Leaderboard
  const fetchMatchLeaderboard = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/leaderboard?match_id=${selectedMatchId}`);
      setMatchLeaderboardData(res.data.leaderboard || []);
      setMatchInfo(res.data.match || null);
    } catch (err) {
      console.error('Failed to load match leaderboard:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load Overall Cumulative Leaderboard
  const fetchOverallLeaderboard = async () => {
    setLoading(true);
    try {
      const res = await api.get('/leaderboard/overall');
      setOverallData(res.data.leaderboard || []);
      setOverallMeta({
        completed_matches: res.data.completed_matches || 0,
        is_series_concluded: res.data.is_series_concluded || false,
      });
    } catch (err) {
      console.error('Failed to load overall leaderboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (viewMode === 'overall') {
      fetchOverallLeaderboard();
    } else {
      fetchMatchLeaderboard();
    }
  }, [viewMode, selectedMatchId]);

  useEffect(()=>{const timer=setInterval(()=>{if(!document.hidden){viewMode==='overall'?fetchOverallLeaderboard():fetchMatchLeaderboard();}},15000);return ()=>clearInterval(timer);},[viewMode,selectedMatchId]);

  // Active match data filtering with strict 1-person-per-email deduplication
  const displayedMatchTeams = React.useMemo(() => {
    const seenUsers = new Set();
    const seenEmails = new Set();
    const seenNames = new Set();

    const list = matchLeaderboardData.filter((t) => {
      const uId = t.user_id ? String(t.user_id) : null;
      const email = t.email ? t.email.toLowerCase().trim() : null;
      const teamName = t.fantasy_team_name ? t.fantasy_team_name.toLowerCase().trim() : null;

      // Strict 1 team per user ID, email, or team name
      if (uId && seenUsers.has(uId)) return false;
      if (email && seenEmails.has(email)) return false;
      if (teamName && seenNames.has(teamName)) return false;

      if (uId) seenUsers.add(uId);
      if (email) seenEmails.add(email);
      if (teamName) seenNames.add(teamName);

      const matchesFilter = filterMyTeamOnly && user ? t.user_id === user.id : true;
      const matchesSearch = searchQuery === '' || 
        (t.fantasy_team_name && t.fantasy_team_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (t.full_name && t.full_name.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesFilter && matchesSearch;
    });

    // Check if the current logged in user already has their team listed
    const isUserAlreadyListed = user && (
      seenUsers.has(String(user.id)) ||
      (user.email && seenEmails.has(user.email.toLowerCase().trim())) ||
      (user.fantasy_team_name && seenNames.has(user.fantasy_team_name.toLowerCase().trim()))
    );

    // ONLY append fallback if user is definitely NOT in the server leaderboard yet
    if (user && !isUserAlreadyListed) {
      try {
        const raw = localStorage.getItem('fantasy_squad_m' + selectedMatchId + '_u' + user.id) ||
                    localStorage.getItem('fantasy_squad_m' + selectedMatchId);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && Array.isArray(parsed.player_ids) && parsed.player_ids.length === 11) {
            list.push({
              rank: list.length + 1,
              team_id: user.id,
              user_id: user.id,
              is_verified: false,
              fantasy_team_name: user.fantasy_team_name || 'My Fantasy XI',
              full_name: user.full_name || 'My Team',
              avatar_url: user.avatar_url,
              total_points: 0.0,
              is_winner: false
            });
          }
        }
      } catch (e) {}
    }

    return list;
  }, [matchLeaderboardData, filterMyTeamOnly, searchQuery, user, selectedMatchId]);

  // Overall tournament data filtering with strict 1-person-per-email deduplication
  const displayedOverallTeams = React.useMemo(() => {
    const seenUsers = new Set();
    const seenEmails = new Set();
    const seenNames = new Set();

    const list = overallData.filter((t) => {
      const uId = t.user_id ? String(t.user_id) : null;
      const email = t.email ? t.email.toLowerCase().trim() : null;
      const teamName = t.fantasy_team_name ? t.fantasy_team_name.toLowerCase().trim() : null;

      if (uId && seenUsers.has(uId)) return false;
      if (email && seenEmails.has(email)) return false;
      if (teamName && seenNames.has(teamName)) return false;

      if (uId) seenUsers.add(uId);
      if (email) seenEmails.add(email);
      if (teamName) seenNames.add(teamName);

      const matchesFilter = filterMyTeamOnly && user ? t.user_id === user.id : true;
      const matchesSearch = searchQuery === '' ||
        (t.fantasy_team_name && t.fantasy_team_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (t.full_name && t.full_name.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesFilter && matchesSearch;
    });

    const isUserAlreadyListed = user && (
      seenUsers.has(String(user.id)) ||
      (user.email && seenEmails.has(user.email.toLowerCase().trim())) ||
      (user.fantasy_team_name && seenNames.has(user.fantasy_team_name.toLowerCase().trim()))
    );

    if (user && !isUserAlreadyListed) {
      try {
        const raw = localStorage.getItem('fantasy_squad_m4_u' + user.id) || localStorage.getItem('fantasy_squad_m4');
        if (raw) {
          list.push({
            rank: list.length + 1,
            user_id: user.id,
            team_id: user.id,
            is_verified: false,
            full_name: user.full_name || 'My Team',
            fantasy_team_name: user.fantasy_team_name || 'My Fantasy XI',
            avatar_url: user.avatar_url,
            matches_played: 1,
            total_points: 0.0,
            match_scores: { 4: 0.0 }
          });
        }
      } catch (e) {}
    }

    return list;
  }, [overallData, filterMyTeamOnly, searchQuery, user]);

  const isMatchCompleted = matchInfo?.status === 'COMPLETED';

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      
      {/* Top Header Card & View Mode Switcher */}
      <div className="bg-[#031a14] border border-emerald-900/80 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Trophy className="w-6 h-6 text-amber-400" />
            <h2 className="text-lg sm:text-xl font-black text-white uppercase tracking-wider">
              2026 Tri-Series Fantasy Leaderboards
            </h2>
          </div>
          <p className="text-xs text-emerald-300/80 mt-1">
            Points updated from administrator-entered scorecards (Captain 2.0x, Vice-Captain 1.5x)
          </p>
        </div>

        {/* View Mode Switcher (Overall vs Match) */}
        <div className="flex items-center bg-[#02241b] border border-emerald-800 p-1 rounded-xl gap-1">
          <button
            onClick={() => setViewMode('overall')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 ${
              viewMode === 'overall'
                ? 'bg-amber-400 text-emerald-950 shadow-md'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            Overall Series Standings
          </button>
          <button
            onClick={() => setViewMode('match')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 ${
              viewMode === 'match'
                ? 'bg-amber-400 text-emerald-950 shadow-md'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            Match-by-Match
          </button>
        </div>
      </div>

      {/* Filter and Match Selector Bar */}
      <div className="bg-[#02241b] border border-emerald-900/90 rounded-2xl p-3.5 shadow-md flex flex-wrap items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search manager or team name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#031d16] border border-emerald-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-amber-400"
          />
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {user && (
            <button
              onClick={() => setFilterMyTeamOnly(!filterMyTeamOnly)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                filterMyTeamOnly
                  ? 'bg-amber-400 text-emerald-950 border-amber-300 shadow'
                  : 'bg-[#031d16] text-slate-300 border-emerald-800 hover:bg-emerald-900/50'
              }`}
            >
              {filterMyTeamOnly ? 'Showing My Team Only ✓' : 'Filter: Show My Team'}
            </button>
          )}

          {viewMode === 'match' && (
            <div className="flex items-center gap-1.5">
              <label className="text-xs font-bold text-slate-300">Fixture:</label>
              <select
                value={selectedMatchId}
                onChange={(e) => setSelectedMatchId(Number(e.target.value))}
                className="bg-[#031d16] border border-emerald-700 rounded-xl px-3 py-1.5 text-xs font-bold text-amber-300 focus:outline-none focus:border-amber-400 cursor-pointer"
              >
                {matches.map((m) => (
                  <option key={m.id} value={m.id}>
                    Game {m.match_number}: {m.team_a} vs {m.team_b} ({m.status === 'COMPLETED' ? 'Completed' : m.status})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* MODE 1: OVERALL SERIES STANDINGS (CUMULATIVE TOURNAMENT) */}
      {/* ======================================================== */}
      {viewMode === 'overall' && (
        <div className="space-y-4">
          
          {/* Tournament Progress Banner */}
          <div className="relative overflow-hidden bg-linear-to-r from-emerald-950 via-[#032018] to-emerald-950 border border-emerald-700/80 rounded-2xl p-5 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-linear-to-br from-amber-400 to-amber-600 text-emerald-950 flex items-center justify-center font-black shadow-md flex-shrink-0">
                <Trophy className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-500/40">
                  {overallMeta.completed_matches} OF 6 MATCHES COMPLETED
                </span>
                <h3 className="text-base sm:text-lg font-black text-white mt-1">
                  Overall Series Championship Leaderboard
                </h3>
                <p className="text-xs text-emerald-300/80">
                  Points from every match accumulate here. The manager with the highest total points at the final wins the Tri-Series Championship!
                </p>
              </div>
            </div>

            <div className="text-center sm:text-right flex-shrink-0">
              <span className="text-[10px] uppercase font-bold text-slate-400">Pre-Tournament Status</span>
              <div className="text-xs font-black text-amber-400 bg-black/40 px-3 py-1.5 rounded-lg border border-emerald-800">
                {overallMeta.completed_matches === 0 ? 'Awaiting results' : `${overallMeta.completed_matches}/6 Matches Live`}
              </div>
            </div>
          </div>

          {/* Overall Standings Table */}
          <div className="bg-[#031a14] border border-emerald-900/80 rounded-2xl shadow-xl overflow-hidden">
            <div className="p-4 border-b border-emerald-900/80 flex items-center justify-between bg-emerald-950/40">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-300">
                All Enrolled Managers ({displayedOverallTeams.length})
              </span>
              <span className="text-[11px] text-amber-400 font-semibold">
                Ranked by Total Cumulative Points Across All Fixtures
              </span>
            </div>

            {loading ? (
              <div className="py-12 text-center text-sm text-amber-300">
                Loading overall series standings...
              </div>
            ) : displayedOverallTeams.length === 0 ? (
              <div className="py-12 text-center text-sm text-slate-400 space-y-2">
                <p>No fantasy squads enrolled yet.</p>
                <p className="text-xs text-amber-400">
                  Sign up and build your lineup for Match 4 (Oct 25: Pakistan vs England) to enter the Series Championship!
                </p>
              </div>
            ) : (
              <div className="divide-y divide-emerald-900/40">
                {displayedOverallTeams.map((entry, idx) => {
                  const isChampion = entry.is_champion;
                  const isUserTeam = user && entry.user_id === user.id;

                  return (
                    <div
                      key={entry.user_id}
                      onClick={() => onInspectTeam && onInspectTeam(entry.team_id || entry.user_id)}
                      className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all hover:bg-emerald-900/40 cursor-pointer ${
                        isUserTeam ? 'bg-amber-950/30 border-l-4 border-l-amber-400' : ''
                      }`}
                    >
                      {/* Left: Rank, Avatar & Info */}
                      <div className="flex items-center gap-3 sm:gap-4">
                        {/* Rank Badge */}
                        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0 shadow">
                          {idx === 0 && entry.total_points > 0 ? (
                            <div className="w-full h-full rounded-xl bg-linear-to-br from-amber-400 to-amber-600 text-emerald-950 flex items-center justify-center text-base">
                              🏆
                            </div>
                          ) : (
                            <div className="w-full h-full rounded-xl bg-[#02241b] border border-emerald-800 text-slate-300 flex items-center justify-center font-bold text-xs">
                              #{entry.rank}
                            </div>
                          )}
                        </div>

                        {/* Avatar */}
                        <div className="w-10 h-10 rounded-full border border-amber-400/80 overflow-hidden flex-shrink-0 bg-emerald-950 flex items-center justify-center shadow">
                          {entry.avatar_url ? (
                            <img src={entry.avatar_url} alt={entry.full_name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-amber-300 font-bold text-xs">
                              {entry.full_name ? entry.full_name.charAt(0).toUpperCase() : 'U'}
                            </span>
                          )}
                        </div>

                        {/* Team & Manager */}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-sm sm:text-base text-white">
                              {entry.fantasy_team_name}
                            </span>
                            {isUserTeam && (
                              <span className="px-1.5 py-0.2 rounded bg-amber-400 text-emerald-950 font-black text-[9px] uppercase shadow">
                                YOU
                              </span>
                            )}
                            {isChampion && (
                              <span className="px-1.5 py-0.2 rounded bg-amber-400 text-emerald-950 font-black text-[9px] uppercase shadow flex items-center gap-1">
                                <Sparkles className="w-2.5 h-2.5" />
                                2026 CHAMPION
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 flex-wrap text-xs text-slate-400">
                            <span>Manager: <strong className="text-emerald-300">{entry.full_name}</strong></span>
                            {entry.is_verified && (
                              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-800/80 shadow-xs font-semibold">
                                <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                                Account
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Matches & Total Points */}
                      <div className="flex items-center justify-between sm:justify-end gap-4 pl-12 sm:pl-0">
                        {/* Matches Breakdown */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {Object.entries(entry.match_scores || {}).map(([mId, score]) => (
                            <span
                              key={mId}
                              className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950 border border-emerald-800 text-slate-300"
                            >
                              G{mId}: <strong className="text-amber-300">{score}</strong>
                            </span>
                          ))}
                          <span className="text-[11px] text-slate-400 font-semibold ml-1">
                            ({entry.matches_played}/6 matches)
                          </span>
                        </div>

                        {/* Total Score */}
                        <div className="text-right flex-shrink-0">
                          <div className="text-lg sm:text-xl font-black text-amber-400">
                            {entry.total_points} <span className="text-xs text-slate-400 font-semibold">PTS</span>
                          </div>
                          <span className="text-[10px] text-emerald-400 block">
                            Cumulative Total
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODE 2: MATCH-BY-MATCH SPECIFIC LEADERBOARD */}
      {/* ======================================================== */}
      {viewMode === 'match' && (
        <div className="space-y-4">
          
          {/* Match Status Banner: Upcoming vs Completed */}
          {!isMatchCompleted ? (
            <div className="bg-linear-to-r from-emerald-950 via-[#032018] to-emerald-950 border border-emerald-700/80 rounded-2xl p-5 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-amber-400/20 border border-amber-400 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-6 h-6 text-amber-400 animate-pulse" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-500/40">
                    MATCH {matchInfo?.id || 1} • {matchInfo?.title || 'Pakistan vs England'}
                  </span>
                  <h3 className="text-base sm:text-lg font-black text-white mt-1">
                    {matchInfo?.venue || 'Rawalpindi Cricket Stadium'}
                  </h3>
                  <p className="text-xs text-emerald-300/80">
                    Lineup selections lock at the deadline. Points update after administrator score entry.
                  </p>
                </div>
              </div>

              <div className="text-center sm:text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400">Match Phase</span>
                <div className="text-xs font-black text-amber-400 bg-black/40 px-3 py-1.5 rounded-lg border border-emerald-800">
                  0 PTS (Pre-Match Registration)
                </div>
              </div>
            </div>
          ) : (
            /* Daily Winner Showcase Card if Match is Completed */
            matchLeaderboardData.length > 0 && matchLeaderboardData[0].total_points>0 && (
              <div className="relative overflow-hidden bg-linear-to-r from-amber-500/20 via-emerald-900/60 to-amber-500/10 border-2 border-amber-400 rounded-2xl p-6 shadow-2xl gold-glow">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />
                
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-4 text-center sm:text-left">
                    <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-amber-300 via-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
                      <Trophy className="w-9 h-9 text-emerald-950 stroke-[2.5]" />
                    </div>
                    <div>
                      <span className="text-[11px] font-black uppercase tracking-widest text-amber-300 flex items-center gap-1.5 justify-center sm:justify-start">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        {matchLeaderboardData.filter(t=>t.rank===1).length>1?'JOINT MATCH WINNERS':'MATCH WINNER'}
                      </span>
                      <h3 className="text-xl sm:text-2xl font-black text-white">
                        {matchLeaderboardData.filter(t=>t.rank===1).map(t=>t.fantasy_team_name).join(' • ')}
                      </h3>
                      <p className="text-xs text-emerald-200">
                        Manager: <strong className="text-white">{matchLeaderboardData[0].full_name}</strong> • Match: {matchInfo?.title}
                      </p>
                    </div>
                  </div>

                  <div className="text-center sm:text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-300">Winning Score</span>
                    <div className="text-3xl font-black text-amber-400">
                      {matchLeaderboardData[0].total_points} <span className="text-sm text-slate-300">PTS</span>
                    </div>
                    <button
                      onClick={() => onInspectTeam(matchLeaderboardData[0].team_id)}
                      className="mt-2 px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-emerald-950 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 mx-auto sm:ml-auto shadow"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View Pitch Lineup
                    </button>
                  </div>
                </div>
              </div>
            )
          )}

          {/* Match Leaderboard Table */}
          <div className="bg-[#031a14] border border-emerald-900/80 rounded-2xl shadow-xl overflow-hidden">
            <div className="p-4 border-b border-emerald-900/80 flex items-center justify-between bg-emerald-950/40">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-300">
                Match Lineups ({displayedMatchTeams.length})
              </span>
              <span className="text-[11px] text-emerald-400 font-semibold">
                Click any row to inspect 2D pitch formation & breakdown
              </span>
            </div>

            {loading ? (
              <div className="py-12 text-center text-sm text-amber-300">
                Loading match standings...
              </div>
            ) : displayedMatchTeams.length === 0 ? (
              <div className="py-12 text-center text-sm text-slate-400 space-y-2">
                <p>No fantasy squads submitted for this fixture yet.</p>
                <p className="text-xs text-amber-400">
                  Select your 11 players for this game in the Squad Builder to join this leaderboard!
                </p>
              </div>
            ) : (
              <div className="divide-y divide-emerald-900/40">
                {displayedMatchTeams.map((team, idx) => {
                  const isFirst = team.rank === 1 && isMatchCompleted && team.total_points>0;
                  const isUserTeam = user && team.user_id === user.id;

                  return (
                    <div
                      key={team.team_id}
                      onClick={() => onInspectTeam && onInspectTeam(team.team_id || team.user_id)}
                      className={`p-4 flex items-center justify-between cursor-pointer transition-all hover:bg-emerald-900/40 ${
                        isUserTeam ? 'bg-amber-950/30 border-l-4 border-l-amber-400' : ''
                      }`}
                    >
                      {/* Rank & User Info */}
                      <div className="flex items-center gap-3 sm:gap-4">
                        {/* Rank Badge */}
                        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0 shadow">
                          {isFirst ? (
                            <div className="w-full h-full rounded-xl bg-linear-to-br from-amber-400 to-amber-600 text-emerald-950 flex items-center justify-center text-base">
                              🏆
                            </div>
                          ) : (
                            <div className="w-full h-full rounded-xl bg-[#02241b] border border-emerald-800 text-slate-300 flex items-center justify-center font-bold text-xs">
                              #{team.rank}
                            </div>
                          )}
                        </div>

                        {/* Avatar Image */}
                        <div className="w-10 h-10 rounded-full border border-amber-400/80 overflow-hidden flex-shrink-0 bg-emerald-950 flex items-center justify-center shadow">
                          {team.avatar_url ? (
                            <img src={team.avatar_url} alt={team.full_name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-amber-300 font-bold text-xs">
                              {team.full_name ? team.full_name.charAt(0).toUpperCase() : 'U'}
                            </span>
                          )}
                        </div>

                        {/* Team & User Names */}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-sm sm:text-base text-white">
                              {team.fantasy_team_name}
                            </span>
                            {isUserTeam && (
                              <span className="px-1.5 py-0.2 rounded bg-amber-400 text-emerald-950 font-black text-[9px] uppercase shadow">
                                YOU
                              </span>
                            )}
                            {isFirst && (
                              <span className="px-1.5 py-0.2 rounded bg-amber-400 text-emerald-950 font-black text-[9px] uppercase shadow">
                                GOLD WINNER
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 flex-wrap text-xs text-slate-400">
                            <span>Manager: <strong className="text-emerald-300">{team.full_name}</strong></span>
                            {team.is_verified && (
                              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-800/80 shadow-xs font-semibold">
                                <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                                Account
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Points & Arrow */}
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="text-base sm:text-lg font-black text-amber-400">
                            {team.total_points} <span className="text-xs text-slate-400 font-semibold">PTS</span>
                          </div>
                          <span className="text-[10px] text-emerald-400 hidden sm:inline">
                            {isMatchCompleted ? 'Final Match Score' : 'Pre-Match (Ready)'}
                          </span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-500" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default Leaderboard;
