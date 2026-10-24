function computeStandings(matches) {
  const result = ['PAK', 'ENG', 'SL'].map(team => ({
    team, played: 0, won: 0, lost: 0, tied: 0, no_result: 0, points: 0, nrr: 0,
    forRuns: 0, againstRuns: 0, forBalls: 0, againstBalls: 0
  }));

  for (const m of matches.filter(m => m.status === 'COMPLETED' && m.match_number !== 7)) {
    const a = result.find(s => s.team === m.team_a);
    const b = result.find(s => s.team === m.team_b);
    if (!a || !b) continue;

    a.played++;
    b.played++;

    if (m.result === 'NO_RESULT') {
      a.no_result++; b.no_result++; a.points++; b.points++;
      continue;
    }

    if (m.result === 'TIE') {
      a.tied++; b.tied++; a.points++; b.points++;
    } else {
      const w = m.winner_team === a.team ? a : b;
      const l = w === a ? b : a;
      w.won++;
      w.points += 2;
      l.lost++;
    }

    if (m.innings && m.innings.a && m.innings.b) {
      const x = m.innings.a;
      const y = m.innings.b;
      const xb = x.wickets === 10 ? 300 : (x.balls || 300);
      const yb = y.wickets === 10 ? 300 : (y.balls || 300);
      a.forRuns += x.runs;
      a.againstRuns += y.runs;
      a.forBalls += xb;
      a.againstBalls += yb;
      b.forRuns += y.runs;
      b.againstRuns += x.runs;
      b.forBalls += yb;
      b.againstBalls += xb;
    }
  }

  for (const s of result) {
    s.nrr = s.forBalls && s.againstBalls
      ? Number((6 * s.forRuns / s.forBalls - 6 * s.againstRuns / s.againstBalls).toFixed(3))
      : 0;
  }
  return result;
}

module.exports = computeStandings;
