/**
 * CricAPI Service & Match Simulation Engine (Node.js)
 */

function getSimulatedMatchScorecard(matchId, teamA, teamB, allPlayers) {
  const teamAPlayers = allPlayers.filter(p => p.team === teamA);
  const teamBPlayers = allPlayers.filter(p => p.team === teamB);

  const playingA = teamAPlayers.slice(0, 11);
  const playingB = teamBPlayers.slice(0, 11);
  const benchA = teamAPlayers.slice(11);
  const benchB = teamBPlayers.slice(11);

  const stats = [];

  // Bench players
  for (const p of [...benchA, ...benchB]) {
    stats.push({
      player_id: p.id,
      name: p.name,
      team: p.team,
      role: p.role,
      played_xi: false,
      runs: 0, balls: 0, fours: 0, sixes: 0, dismissed: false,
      overs_bowled: 0.0, maidens: 0, runs_conceded: 0, wickets: 0, lbw_bowled_count: 0,
      catches: 0, stumpings_direct_runouts: 0, indirect_runouts: 0
    });
  }

  // Preset realistic stats for Match 1 (PAK vs ENG)
  const isPakEng = (teamA === 'PAK' && teamB === 'ENG') || (teamA === 'ENG' && teamB === 'PAK');
  
  const presetStats = {
    // PAK
    "Babar Azam": { runs: 88, balls: 74, fours: 9, sixes: 2, dismissed: true, catches: 1 },
    "Fakhar Zaman": { runs: 54, balls: 48, fours: 6, sixes: 1, dismissed: true, catches: 0 },
    "Saim Ayub": { runs: 31, balls: 24, fours: 4, sixes: 0, dismissed: true, catches: 1 },
    "Hasan Nawaz": { runs: 18, balls: 15, fours: 2, sixes: 1, dismissed: true, catches: 0 },
    "Saad Baig": { runs: 24, balls: 22, fours: 2, sixes: 0, dismissed: true, stumpings_direct_runouts: 1, catches: 2 },
    "Muhammad Ghazi Ghori": { runs: 0, balls: 0, played_xi: false },
    "Salman Ali Agha": { runs: 42, balls: 35, fours: 3, sixes: 1, dismissed: true, overs_bowled: 5.0, runs_conceded: 28, wickets: 1, catches: 1 },
    "Shadab Khan": { runs: 29, balls: 20, fours: 2, sixes: 1, dismissed: false, overs_bowled: 8.0, maidens: 0, runs_conceded: 42, wickets: 1, lbw_bowled_count: 1 },
    "Faheem Ashraf": { runs: 15, balls: 12, fours: 1, sixes: 0, dismissed: false, overs_bowled: 6.0, runs_conceded: 36, wickets: 1 },
    "Shaheen Shah Afridi": { runs: 8, balls: 6, fours: 1, sixes: 0, dismissed: true, overs_bowled: 10.0, maidens: 2, runs_conceded: 44, wickets: 3, lbw_bowled_count: 2, catches: 1 },
    "Naseem Shah": { runs: 4, balls: 4, dismissed: false, overs_bowled: 9.0, maidens: 1, runs_conceded: 46, wickets: 2, lbw_bowled_count: 1 },
    "Haris Rauf": { runs: 2, balls: 3, dismissed: false, overs_bowled: 10.0, maidens: 0, runs_conceded: 54, wickets: 2, lbw_bowled_count: 1 },
    "Abrar Ahmed": { overs_bowled: 7.0, runs_conceded: 35, wickets: 1 },

    // ENG
    "Harry Brook": { runs: 76, balls: 58, fours: 7, sixes: 3, dismissed: true, catches: 1 },
    "Joe Root": { runs: 64, balls: 70, fours: 5, sixes: 0, dismissed: true, catches: 2 },
    "Ben Duckett": { runs: 32, balls: 25, fours: 4, sixes: 1, dismissed: true },
    "Jordan Cox": { runs: 22, balls: 20, fours: 2, sixes: 0, dismissed: true, catches: 2, stumpings_direct_runouts: 1 },
    "Tom Banton": { runs: 0, balls: 0, played_xi: false },
    "Sam Curran": { runs: 38, balls: 28, fours: 3, sixes: 1, dismissed: true, overs_bowled: 9.0, runs_conceded: 52, wickets: 2, lbw_bowled_count: 1 },
    "Will Jacks": { runs: 25, balls: 18, fours: 2, sixes: 1, dismissed: true, overs_bowled: 5.0, runs_conceded: 26, wickets: 1 },
    "Liam Dawson": { runs: 14, balls: 16, dismissed: false, overs_bowled: 6.0, runs_conceded: 32, wickets: 1 },
    "Jamie Overton": { runs: 10, balls: 8, fours: 1, sixes: 0, dismissed: false, overs_bowled: 5.0, runs_conceded: 34, wickets: 0 },
    "Adil Rashid": { runs: 6, balls: 9, dismissed: true, overs_bowled: 10.0, maidens: 1, runs_conceded: 45, wickets: 3, lbw_bowled_count: 1, catches: 1 },
    "Gus Atkinson": { runs: 4, balls: 5, dismissed: false, overs_bowled: 9.0, maidens: 0, runs_conceded: 56, wickets: 2, lbw_bowled_count: 1 },
    "Josh Tongue": { runs: 1, balls: 2, dismissed: false, overs_bowled: 6.0, runs_conceded: 38, wickets: 1 },

    // SL Presets
    "Kusal Mendis": { runs: 68, balls: 56, fours: 6, sixes: 2, dismissed: true, catches: 1 },
    "Pathum Nissanka": { runs: 52, balls: 45, fours: 5, sixes: 1, dismissed: true },
    "Kamindu Mendis": { runs: 34, balls: 26, fours: 3, sixes: 1, dismissed: true, overs_bowled: 4.0, runs_conceded: 22, wickets: 1 },
    "Dasun Shanaka": { runs: 28, balls: 18, fours: 2, sixes: 1, dismissed: false, overs_bowled: 5.0, runs_conceded: 30, wickets: 1 },
    "Wanindu Hasaranga": { runs: 20, balls: 14, dismissed: true, overs_bowled: 10.0, maidens: 1, runs_conceded: 40, wickets: 3, lbw_bowled_count: 1 },
    "Maheesh Theekshana": { runs: 5, balls: 6, dismissed: false, overs_bowled: 10.0, maidens: 1, runs_conceded: 38, wickets: 2, lbw_bowled_count: 1 },
    "Dilshan Madushanka": { runs: 2, balls: 3, dismissed: false, overs_bowled: 9.0, runs_conceded: 48, wickets: 2 }
  };

  for (const p of [...playingA, ...playingB]) {
    const custom = presetStats[p.name] || {};
    stats.push({
      player_id: p.id,
      name: p.name,
      team: p.team,
      role: p.role,
      played_xi: custom.played_xi !== undefined ? custom.played_xi : true,
      runs: custom.runs || 0,
      balls: custom.balls || 0,
      fours: custom.fours || 0,
      sixes: custom.sixes || 0,
      dismissed: custom.dismissed !== undefined ? custom.dismissed : false,
      overs_bowled: custom.overs_bowled || 0.0,
      maidens: custom.maidens || 0,
      runs_conceded: custom.runs_conceded || 0,
      wickets: custom.wickets || 0,
      lbw_bowled_count: custom.lbw_bowled_count || 0,
      catches: custom.catches || 0,
      stumpings_direct_runouts: custom.stumpings_direct_runouts || 0,
      indirect_runouts: custom.indirect_runouts || 0
    });
  }

  // Match outcome
  const teamScoreA = "312/8 (50.0 ov)";
  const teamScoreB = "298/9 (50.0 ov)";
  const winner = teamA; // Team A wins high scoring thriller

  return {
    match_id: matchId,
    team_a: teamA,
    team_b: teamB,
    scorecard_summary: `${teamA} ${teamScoreA} def. ${teamB} ${teamScoreB} by 14 runs`,
    winner_team: winner,
    player_stats: stats
  };
}

module.exports = {
  getSimulatedMatchScorecard
};
