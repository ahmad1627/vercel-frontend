function oversToBalls(value) {
  if (!/^\d+(\.[0-5])?$/.test(String(value))) throw Object.assign(new Error('Overs must use cricket notation, e.g. 5.5, never 5.6.'), {status:400});
  const [overs,balls='0']=String(value).split('.'); return Number(overs)*6+Number(balls);
}
/**
 * Custom ODI Fantasy Points Engine (Node.js)
 * Implements the exact scoring rules for the 2026 Pakistan ODI Tri-Nation Series.
 */

function calculatePlayerFantasyPoints(stats, role) {
  const breakdown = {};
  let totalPts = 0.0;

  const playedXi = stats.played_xi === true;
  if (!playedXi) return {points: 0, breakdown: {playing_xi: 0, final_base_pts: 0}};
  const runs = stats.runs || 0;
  const balls = stats.balls || 0;
  const fours = stats.fours || 0;
  const sixes = stats.sixes || 0;
  const dismissed = stats.dismissed || false;
  const ballsBowled = stats.balls_bowled ?? oversToBalls(stats.overs_bowled || 0);
  const oversBowled = ballsBowled / 6;
  const maidens = stats.maidens || 0;
  const runsConceded = stats.runs_conceded || 0;
  const wickets = stats.wickets || 0;
  const lbwBowledCount = stats.lbw_bowled_count || 0;
  const catches = stats.catches || 0;
  const stumpingsDirectRunouts = stats.stumpings_direct_runouts || 0;
  const indirectRunouts = stats.indirect_runouts || 0;

  // 1. Playing XI
  if (playedXi) {
    totalPts += 4.0;
    breakdown.playing_xi = 4.0;
  }

  // 2. Batting Points
  let battingPts = 0.0;
  if (runs > 0) {
    battingPts += runs * 1.0;
    breakdown.runs = runs * 1.0;
  }

  if (fours > 0) {
    battingPts += fours * 1.0;
    breakdown.boundary_fours = fours * 1.0;
  }

  if (sixes > 0) {
    battingPts += sixes * 2.0;
    breakdown.sixes = sixes * 2.0;
  }

  if (runs >= 100) {
    battingPts += 8.0;
    breakdown.century_bonus = 8.0;
  } else if (runs >= 50) {
    battingPts += 4.0;
    breakdown.half_century_bonus = 4.0;
  }

  // Duck dismissal
  if (dismissed && runs === 0 && ["BAT", "WK", "AR"].includes(role)) {
    battingPts -= 3.0;
    breakdown.duck_penalty = -3.0;
  }

  // Strike Rate Bonus / Penalty (Min 20 balls, bowlers exempt)
  if (balls >= 20 && ["BAT", "WK", "AR"].includes(role)) {
    const sr = (runs / balls) * 100.0;
    breakdown.strike_rate_value = parseFloat(sr.toFixed(2));
    if (sr > 140.0) {
      battingPts += 6.0;
      breakdown.strike_rate_bonus = 6.0;
    } else if (sr > 120.0) {
      battingPts += 4.0;
      breakdown.strike_rate_bonus = 4.0;
    } else if (sr >= 100.0) {
      battingPts += 2.0;
      breakdown.strike_rate_bonus = 2.0;
    } else if (sr >= 40.0 && sr <= 50.0) {
      battingPts -= 2.0;
      breakdown.strike_rate_penalty = -2.0;
    } else if (sr >= 30.0 && sr < 40.0) {
      battingPts -= 4.0;
      breakdown.strike_rate_penalty = -4.0;
    } else if (sr < 30.0) {
      battingPts -= 6.0;
      breakdown.strike_rate_penalty = -6.0;
    }
  }

  totalPts += battingPts;
  breakdown.batting_total = battingPts;

  // 3. Bowling Points
  let bowlingPts = 0.0;
  if (wickets > 0) {
    bowlingPts += wickets * 25.0;
    breakdown.wickets = wickets * 25.0;
  }

  if (lbwBowledCount > 0) {
    bowlingPts += lbwBowledCount * 8.0;
    breakdown.lbw_bowled_bonus = lbwBowledCount * 8.0;
  }

  if (wickets >= 5) {
    bowlingPts += 8.0;
    breakdown["5_wicket_haul"] = 8.0;
  } else if (wickets === 4) {
    bowlingPts += 4.0;
    breakdown["4_wicket_haul"] = 4.0;
  }

  if (maidens > 0) {
    bowlingPts += maidens * 4.0;
    breakdown.maidens = maidens * 4.0;
  }

  // Economy Rate Bonus / Penalty (Min 5 overs)
  if (oversBowled >= 5.0) {
    const econ = runsConceded / oversBowled;
    breakdown.economy_rate_value = parseFloat(econ.toFixed(2));
    if (econ < 2.5) {
      bowlingPts += 6.0;
      breakdown.economy_bonus = 6.0;
    } else if (econ < 3.5) {
      bowlingPts += 4.0;
      breakdown.economy_bonus = 4.0;
    } else if (econ <= 4.5) {
      bowlingPts += 2.0;
      breakdown.economy_bonus = 2.0;
    } else if (econ >= 7.0 && econ <= 8.0) {
      bowlingPts -= 2.0;
      breakdown.economy_penalty = -2.0;
    } else if (econ > 8.0 && econ <= 9.0) {
      bowlingPts -= 4.0;
      breakdown.economy_penalty = -4.0;
    } else if (econ > 9.0) {
      bowlingPts -= 6.0;
      breakdown.economy_penalty = -6.0;
    }
  }

  totalPts += bowlingPts;
  breakdown.bowling_total = bowlingPts;

  // 4. Fielding Points
  let fieldingPts = 0.0;
  if (catches > 0) {
    fieldingPts += catches * 8.0;
    breakdown.catches = catches * 8.0;
    if (catches >= 3) {
      fieldingPts += 4.0;
      breakdown["3_catches_bonus"] = 4.0;
    }
  }

  if (stumpingsDirectRunouts > 0) {
    fieldingPts += stumpingsDirectRunouts * 12.0;
    breakdown.stumpings_direct_runouts = stumpingsDirectRunouts * 12.0;
  }

  if (indirectRunouts > 0) {
    fieldingPts += indirectRunouts * 6.0;
    breakdown.indirect_runouts = indirectRunouts * 6.0;
  }

  totalPts += fieldingPts;
  breakdown.fielding_total = fieldingPts;

  const finalScore = parseFloat(totalPts.toFixed(1));
  breakdown.final_base_pts = finalScore;

  return { points: finalScore, breakdown };
}

function calculateTeamPoints(playersStatsMap, captainId, viceCaptainId) {
  let teamTotal = 0.0;
  const effectivePtsMap = {};

  for (const [playerId, basePts] of Object.entries(playersStatsMap)) {
    const id = parseInt(playerId, 10);
    let eff = basePts;
    if (id === captainId) {
      eff = parseFloat((basePts * 2.0).toFixed(1));
    } else if (id === viceCaptainId) {
      eff = parseFloat((basePts * 1.5).toFixed(1));
    } else {
      eff = parseFloat(basePts.toFixed(1));
    }
    effectivePtsMap[id] = eff;
    teamTotal += eff;
  }

  return {
    totalPoints: parseFloat(teamTotal.toFixed(1)),
    effectivePtsMap
  };
}

module.exports = {
  oversToBalls,
  calculatePlayerFantasyPoints,
  calculateTeamPoints
};
