import React, { useState, useEffect, useRef } from 'react';
import Navbar from './components/Navbar';
import AdminToolbar from './components/AdminToolbar';
import AdminDashboard from './components/AdminDashboard';
import FixtureCarousel from './components/FixtureCarousel';
import TeamBuilder from './components/TeamBuilder';
import PitchPreview from './components/PitchPreview';
import CaptainModal from './components/CaptainModal';
import Leaderboard from './components/Leaderboard';
import UserTeamPitchModal from './components/UserTeamPitchModal';
import TriSeriesStandings from './components/TriSeriesStandings';
import AuthModal from './components/AuthModal';
import ForgotPasswordModal from './components/ForgotPasswordModal';
import OnboardingModal from './components/OnboardingModal';
import ProfileModal from './components/ProfileModal';
import RulesModal from './components/RulesModal';
import MobileDrawer from './components/MobileDrawer';
import MobileBottomNav from './components/MobileBottomNav';
import { useAuth } from './context/AuthContext';
import { Clock, Shield, CheckCircle2 } from 'lucide-react';
import api from './api';

// Dynamic Live Countdown Banner for the currently active fixture
const MatchCountdownBanner = ({ match }) => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    if (!match?.match_date) return;

    const calculate = () => {
      const target = new Date(match.match_date).getTime();
      const now = new Date().getTime();
      const diff = Math.max(0, target - now);

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / 1000 / 60) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      setTimeLeft({ days, hours, minutes, seconds });
    };

    calculate();
    const interval = setInterval(calculate, 1000);
    return () => clearInterval(interval);
  }, [match?.match_date]);

  if (!match) return null;

  const isLocked = match.is_locked || match.status === 'LIVE';
  const isCompleted = match.status === 'COMPLETED';

  const formatMatchDateHeader = (isoString) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }).toUpperCase();
    } catch {
      return 'OCT 2026';
    }
  };

  return (
    <div className="mb-5 bg-linear-to-r from-emerald-950 via-[#03241b] to-emerald-950 border-2 border-amber-400/80 rounded-2xl p-4 sm:p-5 shadow-2xl relative overflow-hidden gold-glow">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 text-center md:text-left">
          <div className="w-12 h-12 rounded-xl bg-linear-to-br from-amber-400 to-amber-600 text-emerald-950 flex items-center justify-center font-black shadow-md flex-shrink-0">
            {isCompleted ? (
              <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
            ) : isLocked ? (
              <Shield className="w-6 h-6 stroke-[2.5]" />
            ) : (
              <Clock className="w-6 h-6 stroke-[2.5]" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 justify-center md:justify-start">
              <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                isCompleted
                  ? 'bg-emerald-900 text-emerald-200 border border-emerald-500'
                  : isLocked
                  ? 'bg-amber-950 text-amber-300 border border-amber-500'
                  : 'bg-amber-400 text-emerald-950'
              }`}>
                {isCompleted
                  ? `GAME ${match.match_number} • COMPLETED`
                  : isLocked
                  ? `GAME ${match.match_number} • LINEUPS LOCKED`
                  : `GAME ${match.match_number} • STARTS ${formatMatchDateHeader(match.match_date)} • ${new Date(match.match_date).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}`}
              </span>
              <span className="text-[10px] text-emerald-300 font-bold hidden sm:inline">
                {match.venue}
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-white mt-1">
              {match.title}
            </h2>
            <p className="text-xs text-slate-300">
              {isCompleted
                ? `Match finished. ${match.scorecard_summary || `Won by ${match.winner_team}`}. Check Leaderboard for points breakdown!`
                : isLocked
                ? 'The lineup deadline has passed or the administrator locked this match. Points update after score entry.'
                : 'Pick your 11 players freely (zero credit cost) and assign Captain (2.0x) & Vice-Captain (1.5x) before the deadline!'}
            </p>
          </div>
        </div>

        {/* Live Countdown Display or Match Status Pill */}
        {isCompleted ? (
          <div className="bg-emerald-950/80 border border-emerald-500 rounded-xl px-4 py-2.5 text-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Match Status</span>
            <div className="text-sm font-black text-amber-400">Finished & Archived</div>
          </div>
        ) : isLocked ? (
          <div className="bg-amber-950/90 border border-amber-500 rounded-xl px-4 py-2.5 text-center shadow-inner">
            <span className="text-[10px] font-bold text-amber-300 uppercase flex items-center justify-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              Awaiting score updates
            </span>
            <div className="text-xs font-black text-white mt-0.5">Lineups Strictly Frozen</div>
          </div>
        ) : (
          <div className="flex items-center gap-2 bg-black/50 border border-emerald-700/80 rounded-xl px-4 py-2 shadow-inner">
            <div className="flex flex-col items-center">
              <span className="text-xl sm:text-2xl font-black text-amber-400 font-mono">{String(timeLeft.days).padStart(2, '0')}</span>
              <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Days</span>
            </div>
            <span className="text-amber-400 font-bold text-lg mb-2">:</span>
            <div className="flex flex-col items-center">
              <span className="text-xl sm:text-2xl font-black text-amber-400 font-mono">{String(timeLeft.hours).padStart(2, '0')}</span>
              <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Hours</span>
            </div>
            <span className="text-amber-400 font-bold text-lg mb-2">:</span>
            <div className="flex flex-col items-center">
              <span className="text-xl sm:text-2xl font-black text-amber-400 font-mono">{String(timeLeft.minutes).padStart(2, '0')}</span>
              <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Mins</span>
            </div>
            <span className="text-amber-400 font-bold text-lg mb-2">:</span>
            <div className="flex flex-col items-center">
              <span className="text-xl sm:text-2xl font-black text-amber-400 font-mono">{String(timeLeft.seconds).padStart(2, '0')}</span>
              <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Secs</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

function App() {
  const { user, sessionError } = useAuth();

  // Navigation & View States
  const [activeTab, setActiveTab] = useState('builder'); // 'builder' | 'leaderboard' | 'standings'
  
  // Tournament & Match Data
  const [matches, setMatches] = useState([]);
  const [activeMatch, setActiveMatch] = useState(null);
  const [selectedMatch, setSelectedMatch] = useState(null);

  // Players & Squads for current match
  const [categorizedPlayers, setCategorizedPlayers] = useState({ WK: [], BAT: [], AR: [], BOWL: [] });
  const [allPlayers, setAllPlayers] = useState([]);

  // User Lineup Selection
  const [selectedPlayers, setSelectedPlayers] = useState([]);
  const [captainId, setCaptainId] = useState(null);
  const [viceCaptainId, setViceCaptainId] = useState(null);
  const [validationErrors, setValidationErrors] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveToast, setSaveToast] = useState(null);
  const [savedSignature, setSavedSignature] = useState(null);
  const [loadError, setLoadError] = useState('');
  const squadSignature = JSON.stringify([selectedMatch?.id,selectedPlayers.map(p=>p.id),captainId,viceCaptainId]);
  const isSquadSaved = savedSignature === squadSignature;

  // Modals
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [isCaptainModalOpen, setIsCaptainModalOpen] = useState(false);
  const [isMobilePitchOpen, setIsMobilePitchOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isRulesOpen, setIsRulesOpen] = useState(false);

  const draftRef = useRef({ matchId: null, playerIds: [], captainId: null, viceCaptainId: null });
  const prevMatchIdRef = useRef(null);

  // Sync draft in memory & localStorage continuously so picks are never lost
  useEffect(() => {
    if (!selectedMatch) return;
    draftRef.current = {
      matchId: selectedMatch.id,
      playerIds: selectedPlayers.map((p) => p.id),
      captainId,
      viceCaptainId
    };
    if (selectedPlayers.length > 0) {
      try {
        const draftObj = {
          match_id: selectedMatch.id,
          player_ids: selectedPlayers.map((p) => p.id),
          captain_id: captainId,
          vice_captain_id: viceCaptainId
        };
        localStorage.setItem('fantasy_draft_m' + selectedMatch.id, JSON.stringify(draftObj));
        if (user) {
          localStorage.setItem('fantasy_draft_m' + selectedMatch.id + '_u' + user.id, JSON.stringify(draftObj));
        }
      } catch (e) {}
    }
  }, [selectedMatch?.id, selectedPlayers, captainId, viceCaptainId, user?.id]);

  const isCurrentMatchLocked = Boolean(
    selectedMatch?.is_locked ||
    selectedMatch?.status === 'LIVE' ||
    selectedMatch?.status === 'COMPLETED'
  );

  // Inspect User Team Pitch Modal (from Leaderboard)
  const [inspectedTeamId, setInspectedTeamId] = useState(null);
  const [inspectedTeamDetails, setInspectedTeamDetails] = useState(null);
  const [isInspecting, setIsInspecting] = useState(false);

  // Load Matches on boot
  const loadMatches = async () => {
    try {
      const res = await api.get('/matches');
      setLoadError('');
      setMatches(res.data);

      const actRes = await api.get('/matches/active');
      setActiveMatch(actRes.data);
      if (!selectedMatch) {
        setSelectedMatch(actRes.data);
      } else {
        const updated = res.data.find((m) => m.id === selectedMatch.id);
        if (updated) setSelectedMatch(prev=>JSON.stringify(prev)===JSON.stringify(updated)?prev:updated);
      }
    } catch (err) {
      const msg = err.response?.data?.detail || (err.code === 'ERR_NETWORK' || !err.response ? 'Backend server is not reachable on port 5000. Start it in VS Code with "npm run dev".' : 'Could not load the game. Check your connection and retry.'); setLoadError(msg);
    }
  };

  useEffect(() => {
    loadMatches();
  }, []);

  useEffect(() => {
    const timer=setInterval(()=>{if(!document.hidden)loadMatches();},15000);
    return ()=>clearInterval(timer);
  }, [selectedMatch?.id]);

  // Load Players for currently selected match
  useEffect(() => {
    if (!selectedMatch) return;
    let cancelled = false;
    const matchChanged = prevMatchIdRef.current !== selectedMatch.id;
    prevMatchIdRef.current = selectedMatch.id;

    if (matchChanged) {
      setSavedSignature(null);
    }

    const fetchPlayers = async () => {
      try {
        const res = await api.get(`/matches/${selectedMatch.id}/players`);
        if (cancelled) return;
        setCategorizedPlayers(res.data.categorized_players);
        setAllPlayers(res.data.all_players);

        const storageKey = 'fantasy_squad_m' + selectedMatch.id + (user ? '_u' + user.id : '');
        let cachedSquad = null;
        try {
          const raw = localStorage.getItem(storageKey) || 
                      localStorage.getItem('fantasy_squad_m' + selectedMatch.id) ||
                      localStorage.getItem('fantasy_draft_m' + selectedMatch.id) ||
                      localStorage.getItem('pending_fantasy_squad');
          if (raw) cachedSquad = JSON.parse(raw);
        } catch (e) {}

        // Load existing saved fantasy team if user is logged in
        if (user) {
          try {
            const teamRes = await api.get(`/teams/my-team?match_id=${selectedMatch.id}`);
            if (cancelled) return;
            if (teamRes.data.has_team && teamRes.data.team) {
              const myTeam = teamRes.data.team;
              // Map team players from all_players
              const loadedSquad = myTeam.players.map((p) => {
                const found = res.data.all_players.find((ap) => ap.id === p.id);
                return found || p;
              });
              setSelectedPlayers(loadedSquad);
              setSavedSignature(JSON.stringify([selectedMatch.id, loadedSquad.map((p) => p.id), myTeam.captain_id, myTeam.vice_captain_id]));
              setCaptainId(myTeam.captain_id);
              setViceCaptainId(myTeam.vice_captain_id);
              try {
                localStorage.setItem(storageKey, JSON.stringify({
                  match_id: selectedMatch.id,
                  player_ids: loadedSquad.map((p) => p.id),
                  captain_id: myTeam.captain_id,
                  vice_captain_id: myTeam.vice_captain_id
                }));
                localStorage.removeItem('pending_fantasy_squad');
              } catch (e) {}
            } else {
              // Server has no team yet for this user.
              // Check in-memory draft (e.g. drafted just before logging in/signing up)
              let draftCandidate = null;
              if (draftRef.current.matchId === selectedMatch.id && draftRef.current.playerIds.length === 11) {
                draftCandidate = {
                  player_ids: draftRef.current.playerIds,
                  captain_id: draftRef.current.captainId,
                  vice_captain_id: draftRef.current.viceCaptainId
                };
              } else if (cachedSquad && Array.isArray(cachedSquad.player_ids) && cachedSquad.player_ids.length === 11) {
                draftCandidate = cachedSquad;
              }

              if (draftCandidate && draftCandidate.player_ids.length === 11) {
                const loadedSquad = draftCandidate.player_ids.map((pId) => res.data.all_players.find((ap) => ap.id === pId)).filter(Boolean);
                if (loadedSquad.length === 11) {
                  setSelectedPlayers(loadedSquad);
                  setSavedSignature(JSON.stringify([selectedMatch.id, loadedSquad.map((p) => p.id), draftCandidate.captain_id, draftCandidate.vice_captain_id]));
                  setCaptainId(draftCandidate.captain_id);
                  setViceCaptainId(draftCandidate.vice_captain_id);

                  // Auto-submit to backend so user immediately appears in database and leaderboard!
                  if (!isCurrentMatchLocked) {
                    api.post('/teams', {
                      match_id: selectedMatch.id,
                      player_ids: draftCandidate.player_ids,
                      captain_id: draftCandidate.captain_id,
                      vice_captain_id: draftCandidate.vice_captain_id
                    }).then(() => {
                      localStorage.removeItem('pending_fantasy_squad');
                      setSaveToast({
                        type: 'success',
                        text: 'Your 11-player squad has been saved and registered on the leaderboard!'
                      });
                      loadMatches();
                    }).catch(() => {});
                  }
                } else if (!matchChanged) {
                  // Keep whatever is currently selected
                } else {
                  setSelectedPlayers([]);
                  setCaptainId(null);
                  setViceCaptainId(null);
                }
              } else if (!matchChanged && selectedPlayers.length > 0) {
                // Keep active in-memory draft
              } else {
                setSelectedPlayers([]);
                setCaptainId(null);
                setViceCaptainId(null);
              }
            }
          } catch (e) {
            if (cachedSquad && Array.isArray(cachedSquad.player_ids) && cachedSquad.player_ids.length === 11) {
              const loadedSquad = cachedSquad.player_ids.map((pId) => res.data.all_players.find((ap) => ap.id === pId)).filter(Boolean);
              if (loadedSquad.length === 11) {
                setSelectedPlayers(loadedSquad);
                setCaptainId(cachedSquad.captain_id);
                setViceCaptainId(cachedSquad.vice_captain_id);
              }
            }
            setLoadError('Could not load your saved team. Your database team has not been removed. Reload before editing.');
          }
        } else {
          // Logged out / Guest user: restore previous draft for this match if available
          let draftCandidate = null;
          if (draftRef.current.matchId === selectedMatch.id && draftRef.current.playerIds.length > 0) {
            draftCandidate = {
              player_ids: draftRef.current.playerIds,
              captain_id: draftRef.current.captainId,
              vice_captain_id: draftRef.current.viceCaptainId
            };
          } else if (cachedSquad && Array.isArray(cachedSquad.player_ids) && cachedSquad.player_ids.length > 0) {
            draftCandidate = cachedSquad;
          }

          if (draftCandidate && draftCandidate.player_ids.length > 0) {
            const loadedSquad = draftCandidate.player_ids.map((pId) => res.data.all_players.find((ap) => ap.id === pId)).filter(Boolean);
            if (loadedSquad.length > 0) {
              setSelectedPlayers(loadedSquad);
              if (draftCandidate.captain_id) setCaptainId(draftCandidate.captain_id);
              if (draftCandidate.vice_captain_id) setViceCaptainId(draftCandidate.vice_captain_id);
            }
          } else if (matchChanged) {
            setSelectedPlayers([]);
            setCaptainId(null);
            setViceCaptainId(null);
          }
        }
      } catch (err) {
        console.error('Failed to load players:', err);
      }
    };
    fetchPlayers();
    return () => { cancelled = true; };
  }, [selectedMatch?.id, user?.id]);

  // Validate Team Selection in real-time
  useEffect(() => {
    if (!selectedMatch) return;
    const errors = [];
    const teamA = selectedMatch.team_a;
    const teamB = selectedMatch.team_b;

    // Total Players
    if (selectedPlayers.length < 11) {
      errors.push(`Select exactly 11 players (${11 - selectedPlayers.length} remaining).`);
    } else if (selectedPlayers.length > 11) {
      errors.push(`Only 11 players allowed (currently ${selectedPlayers.length}).`);
    }

    // Role Counts
    const counts = { WK: 0, BAT: 0, AR: 0, BOWL: 0 };
    const teamCounts = { [teamA]: 0, [teamB]: 0 };

    selectedPlayers.forEach((p) => {
      counts[p.role] = (counts[p.role] || 0) + 1;
      teamCounts[p.team] = (teamCounts[p.team] || 0) + 1;
    });

    if (counts.WK < 1) errors.push('Minimum 1 Wicketkeeper (WK) required.');
    if (counts.WK > 4) errors.push('Maximum 4 Wicketkeepers (WK) allowed.');

    if (counts.BAT < 3) errors.push('Minimum 3 Batters (BAT) required.');
    if (counts.BAT > 6) errors.push('Maximum 6 Batters (BAT) allowed.');

    if (counts.AR < 1) errors.push('Minimum 1 All-Rounder (AR) required.');
    if (counts.AR > 4) errors.push('Maximum 4 All-Rounders (AR) allowed.');

    if (counts.BOWL < 3) errors.push('Minimum 3 Bowlers (BOWL) required.');
    if (counts.BOWL > 6) errors.push('Maximum 6 Bowlers (BOWL) allowed.');

    // Team balance
    if (selectedPlayers.length > 0) {
      if (teamCounts[teamA] > 7) errors.push(`Maximum 7 players allowed from ${teamA}.`);
      if (teamCounts[teamB] > 7) errors.push(`Maximum 7 players allowed from ${teamB}.`);
      if (selectedPlayers.length === 11) {
        if (teamCounts[teamA] < 1) errors.push(`At least 1 player required from ${teamA}.`);
        if (teamCounts[teamB] < 1) errors.push(`At least 1 player required from ${teamB}.`);
      }
    }

    // Captain / Vice-Captain
    if (selectedPlayers.length === 11) {
      if (!captainId) errors.push('Assign a Captain (2.0x points).');
      if (!viceCaptainId) errors.push('Assign a Vice-Captain (1.5x points).');
      if (captainId && viceCaptainId && captainId === viceCaptainId) {
        errors.push('Captain and Vice-Captain cannot be the same player.');
      }
    }

    setValidationErrors(errors);
  }, [selectedPlayers, captainId, viceCaptainId, selectedMatch]);

  // Toggle player selection
  const handleTogglePlayer = (player) => {
    if (isCurrentMatchLocked) {
      alert('Lineup selections are strictly locked for this match (deadline / admin lock).');
      return;
    }

    const exists = selectedPlayers.some((p) => p.id === player.id);
    if (exists) {
      // Remove
      setSelectedPlayers((prev) => prev.filter((p) => p.id !== player.id));
      if (captainId === player.id) setCaptainId(null);
      if (viceCaptainId === player.id) setViceCaptainId(null);
    } else {
      // Check limits before adding
      if (selectedPlayers.length >= 11) {
        alert('You have already selected 11 players. Remove a player first to add another.');
        return;
      }

      const teamCount = selectedPlayers.filter((p) => p.team === player.team).length;
      if (teamCount >= 7) {
        alert(`Maximum 7 players allowed from ${player.team}.`);
        return;
      }

      const roleCount = selectedPlayers.filter((p) => p.role === player.role).length;
      const maxLimits = { WK: 4, BAT: 6, AR: 4, BOWL: 6 };
      if (roleCount >= maxLimits[player.role]) {
        alert(`Maximum ${maxLimits[player.role]} ${player.role}s allowed.`);
        return;
      }

      // Add
      const updated = [...selectedPlayers, player];
      setSelectedPlayers(updated);

      // Auto-assign Captain & Vice-Captain for convenience if empty
      if (!captainId) {
        setCaptainId(player.id);
      } else if (!viceCaptainId && player.id !== captainId) {
        setViceCaptainId(player.id);
      }
    }
  };

  const handleRemovePlayer = (playerId) => {
    setSelectedPlayers((prev) => prev.filter((p) => p.id !== playerId));
    if (captainId === playerId) setCaptainId(null);
    if (viceCaptainId === playerId) setViceCaptainId(null);
  };

  const handleSetCaptain = (playerId) => {
    if (viceCaptainId === playerId) {
      setViceCaptainId(captainId);
    }
    setCaptainId(playerId);
  };

  const handleSetViceCaptain = (playerId) => {
    if (captainId === playerId) {
      setCaptainId(viceCaptainId);
    }
    setViceCaptainId(playerId);
  };

  // Save Team to Backend
  const handleSaveTeam = async () => {
    if (isCurrentMatchLocked) {
      alert('Lineup submissions are strictly locked for this match (deadline / admin lock). Team modifications are not permitted.');
      return;
    }
    if (!user) {
      if (selectedPlayers.length === 11) {
        const pending = {
          match_id: selectedMatch.id,
          player_ids: selectedPlayers.map((p) => p.id),
          captain_id: captainId,
          vice_captain_id: viceCaptainId,
        };
        try {
          localStorage.setItem('pending_fantasy_squad', JSON.stringify(pending));
          localStorage.setItem('fantasy_draft_m' + selectedMatch.id, JSON.stringify(pending));
        } catch (e) {}
      }
      setIsAuthOpen(true);
      setSaveToast({
        type: 'error',
        text: 'Please sign in or register your account to submit your 11 players to the leaderboard.',
      });
      return;
    }
    if (selectedPlayers.length !== 11) {
      alert('Please select exactly 11 players before saving.');
      return;
    }
    if (!captainId || !viceCaptainId) {
      setIsCaptainModalOpen(true);
      return;
    }

    setIsSubmitting(true);
    setSaveToast(null);

    try {
      const payload = {
        match_id: selectedMatch.id,
        player_ids: selectedPlayers.map((p) => p.id),
        captain_id: captainId,
        vice_captain_id: viceCaptainId,
      };
      await api.post('/teams', payload);
      setSavedSignature(squadSignature);

      // Persist permanently in browser localStorage across all sessions
      const storageKey = 'fantasy_squad_m' + selectedMatch.id + (user ? '_u' + user.id : '');
      try {
        localStorage.setItem(storageKey, JSON.stringify(payload));
        localStorage.setItem('fantasy_squad_m' + selectedMatch.id, JSON.stringify(payload));
        localStorage.removeItem('pending_fantasy_squad');
      } catch (e) {}

      setSaveToast({
        type: 'success',
        text: 'Your 11-Player Fantasy Squad has been saved successfully to the server and entered into the leaderboard!',
      });
      setIsCaptainModalOpen(false);
      setIsMobilePitchOpen(false);
      loadMatches();
    } catch (err) {
      console.error('Failed to save team:', err);
      setSaveToast({
        type: 'error',
        text: err.response?.data?.detail || 'Failed to save lineup. Please review requirements.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Inspect User Team Pitch (from Leaderboard)
  const handleInspectTeam = async (teamId) => {
    setIsInspecting(true);
    try {
      const res = await api.get(`/leaderboard/team/${teamId}`);
      setInspectedTeamDetails(res.data);
      setInspectedTeamId(teamId);
    } catch (err) {
      if (user && (teamId === user.id || teamId === 'local_' + user.id || String(teamId) === String(user.id)) && selectedPlayers.length === 11) {
        const categorized = { WK: [], BAT: [], AR: [], BOWL: [] };
        selectedPlayers.forEach((p) => {
          const isC = p.id === captainId;
          const isVc = p.id === viceCaptainId;
          const mult = isC ? 2.0 : (isVc ? 1.5 : 1.0);
          const item = {
            id: p.id,
            name: p.name,
            team: p.team,
            role: p.role,
            is_captain: isC,
            is_vice_captain: isVc,
            multiplier: mult,
            base_points: 0.0,
            effective_points: 0.0,
            stat_summary: { fantasy_points: 0.0, runs: 0, wickets: 0, points_breakdown: {} }
          };
          if (categorized[p.role]) categorized[p.role].push(item);
        });
        setInspectedTeamDetails({
          team_id: user.id,
          fantasy_team_name: user.fantasy_team_name || 'My Fantasy XI',
          full_name: user.full_name || 'My Team',
          avatar_url: user.avatar_url,
          total_points: 0.0,
          rank: 1,
          match: {
            id: selectedMatch?.id || 4,
            title: selectedMatch?.title || 'Match 4: Pakistan vs England',
            status: selectedMatch?.status || 'ACTIVE',
            venue: selectedMatch?.venue || 'Gaddafi Stadium, Lahore'
          },
          categorized_players: categorized
        });
        setInspectedTeamId(user.id);
      } else {
        setSaveToast({ type: 'error', text: err.response?.data?.detail || 'Could not load lineup preview.' });
      }
    } finally {
      setIsInspecting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#021812] text-slate-100 flex flex-col pb-16 lg:pb-6">
      
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenRules={() => setIsRulesOpen(true)}
        hasMyTeam={isSquadSaved}
        myTeamName={user?.fantasy_team_name}
      />

      {/* Admin Simulation Controller Toolbar (ONLY visible to Ahmad Tahseen / Admin) */}
      {user?.is_admin && (
        <AdminToolbar
          activeMatch={activeMatch}
          onSimulationComplete={loadMatches}
          onResetComplete={loadMatches}
          onLockToggle={loadMatches}
          onOpenAdminDashboard={() => setActiveTab('admin')}
        />
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Active Match Dynamic Live Countdown Banner */}
        {sessionError && <p role="alert" className="mb-4 text-amber-300">{sessionError} <button className="underline" onClick={()=>window.location.reload()}>Reload</button></p>}
        {loadError && <div role="alert" className="mb-4 p-3 border border-red-500 rounded">{loadError} <button className="underline" onClick={loadMatches}>Retry</button></div>}
        <MatchCountdownBanner match={activeMatch} />
        {user && selectedPlayers.length>0 && !isSquadSaved && <p className="mb-4 text-amber-300" role="status">Unsaved changes — use Save Lineup to submit your team.</p>}

        {/* Schedule & Fixture Carousel (Top of Page) */}
        <FixtureCarousel
          matches={matches}
          selectedMatch={selectedMatch}
          onSelectMatch={(m) => setSelectedMatch(m)}
        />

        {/* User Lineup Saved Confirmation */}
        {user && isSquadSaved && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-950/80 border border-emerald-500 text-xs text-emerald-200 flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 stroke-[3]" />
              <span>
                Your 11-player squad for <strong className="text-amber-300">{selectedMatch?.title}</strong> is saved. Points update when the administrator enters match statistics.
              </span>
            </div>
            <button
              onClick={() => setActiveTab('builder')}
              className="px-2.5 py-1 rounded bg-amber-400 text-emerald-950 font-bold text-[11px]"
            >
              View My Squad
            </button>
          </div>
        )}

        {/* Save Toast notification */}
        {saveToast && (
          <div className={`mb-5 p-3 rounded-xl border text-xs font-bold flex items-center justify-between shadow-lg ${
            saveToast.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-500 text-emerald-200'
              : 'bg-red-950/90 border-red-500 text-red-200'
          }`}>
            <span>{saveToast.text}</span>
            <button onClick={() => setSaveToast(null)} className="text-sm font-bold">✕</button>
          </div>
        )}

        {/* TAB 1: MATCH & TEAM BUILDER (DESKTOP & MOBILE LAYOUT) */}
        {activeTab === 'builder' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left 60% Panel: Team Builder (Roles, Cards, Filters) */}
            <div className="lg:col-span-7 space-y-4">
              <TeamBuilder
                categorizedPlayers={categorizedPlayers}
                allPlayers={allPlayers}
                selectedPlayers={selectedPlayers}
                onTogglePlayer={handleTogglePlayer}
                onOpenMobilePitch={() => setIsMobilePitchOpen(true)}
                teamA={selectedMatch?.team_a || 'PAK'}
                teamB={selectedMatch?.team_b || 'ENG'}
                isLocked={isCurrentMatchLocked}
                captainId={captainId}
                viceCaptainId={viceCaptainId}
                onOpenRules={() => setIsRulesOpen(true)}
                selectedMatch={selectedMatch}
                activeMatch={activeMatch}
                onSelectMatch={(m) => setSelectedMatch(m)}
              />
            </div>

            {/* Right 40% Sticky Panel: 2D/3D Green Turf Pitch Preview */}
            <div className="hidden lg:block lg:col-span-5 sticky top-24">
              <PitchPreview
                selectedPlayers={selectedPlayers}
                captainId={captainId}
                viceCaptainId={viceCaptainId}
                onSetCaptain={handleSetCaptain}
                onSetViceCaptain={handleSetViceCaptain}
                onRemovePlayer={handleRemovePlayer}
                onSaveTeam={handleSaveTeam}
                validationErrors={validationErrors}
                isSubmitting={isSubmitting}
                teamA={selectedMatch?.team_a || 'PAK'}
                teamB={selectedMatch?.team_b || 'ENG'}
                isLocked={isCurrentMatchLocked}
                selectedMatch={selectedMatch}
              />
            </div>

          </div>
        )}

        {/* TAB 2: LEADERBOARD & WINNERS ARCHIVE */}
        {activeTab === 'leaderboard' && (
          <Leaderboard
            matches={matches}
            activeMatchId={selectedMatch?.id || 4}
            onInspectTeam={handleInspectTeam}
          />
        )}

        {/* TAB 3: TRI-SERIES STANDINGS */}
        {activeTab === 'standings' && (
          <TriSeriesStandings />
        )}

      </main>

      {/* Mobile Slide-Up Drawer for Turf Pitch */}
      <MobileDrawer
        isOpen={isMobilePitchOpen}
        onClose={() => setIsMobilePitchOpen(false)}
        selectedPlayers={selectedPlayers}
        captainId={captainId}
        viceCaptainId={viceCaptainId}
        onSetCaptain={handleSetCaptain}
        onSetViceCaptain={handleSetViceCaptain}
        onRemovePlayer={handleRemovePlayer}
        onSaveTeam={handleSaveTeam}
        validationErrors={validationErrors}
        isSubmitting={isSubmitting}
        teamA={selectedMatch?.team_a || 'PAK'}
        teamB={selectedMatch?.team_b || 'ENG'}
        isLocked={isCurrentMatchLocked}
        selectedMatch={selectedMatch}
      />

      {/* Captain Selection Modal */}
      <CaptainModal
        isOpen={isCaptainModalOpen}
        onClose={() => setIsCaptainModalOpen(false)}
        selectedPlayers={selectedPlayers}
        captainId={captainId}
        viceCaptainId={viceCaptainId}
        onSelectCaptain={handleSetCaptain}
        onSelectViceCaptain={handleSetViceCaptain}
        onConfirmSave={handleSaveTeam}
        isSubmitting={isSubmitting}
      />

      {/* Inspect User Team Pitch Modal (from Leaderboard) */}
      <UserTeamPitchModal
        isOpen={Boolean(inspectedTeamId)}
        onClose={() => { setInspectedTeamId(null); setInspectedTeamDetails(null); }}
        teamDetails={inspectedTeamDetails}
        loading={isInspecting}
        isAdmin={Boolean(user?.is_admin)}
        onRemoveTeam={async (teamId, teamName, managerName) => {
          if (!window.confirm(`Are you sure you want to permanently delete "${teamName || 'this team'}" (Manager: ${managerName || 'User'}) from the tournament leaderboard?`)) return;
          try {
            await api.delete(`/admin/teams/${teamId}`);
            try {
              const removed = JSON.parse(localStorage.getItem('admin_removed_teams') || '[]');
              removed.push(teamId);
              localStorage.setItem('admin_removed_teams', JSON.stringify(removed));
            } catch (e) {}
            alert(`Team "${teamName}" removed successfully by Administrator.`);
            setInspectedTeamId(null);
            setInspectedTeamDetails(null);
            loadMatches();
          } catch (err) {
            alert(err.response?.data?.detail || 'Failed to remove team. Ensure you are signed in as administrator.');
          }
        }}
      />

      {/* Auth Modal (Sign In / Register) */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onOpenForgotPassword={() => setIsForgotOpen(true)}
      />

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        isOpen={isForgotOpen}
        onClose={() => setIsForgotOpen(false)}
        onBackToLogin={() => setIsAuthOpen(true)}
      />

      {/* Mandatory First-Login Onboarding Modal */}
      <OnboardingModal
        isOpen={Boolean(user && user.onboarding_required)}
      />

      {/* Manager Profile & Avatar Modal */}
      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />

      {/* Custom ODI Fantasy Rules Modal */}
      <RulesModal
        isOpen={isRulesOpen}
        onClose={() => setIsRulesOpen(false)}
      />

      {/* Mobile Bottom Navigation Bar */}
      <MobileBottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

    </div>
  );
}

export default App;
