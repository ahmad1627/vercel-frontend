"""
ICC / IPL Official ODI Fantasy Points Engine
Implements the exact scoring rules for the 2026 Pakistan ODI Tri-Nation Series.
"""

from typing import Dict, Any, Tuple

def calculate_player_fantasy_points(
    role: str,
    played_xi: bool = True,
    runs: int = 0,
    balls: int = 0,
    fours: int = 0,
    sixes: int = 0,
    dismissed: bool = False,
    overs_bowled: float = 0.0,
    maidens: int = 0,
    runs_conceded: int = 0,
    wickets: int = 0,
    lbw_bowled_count: int = 0,
    catches: int = 0,
    stumpings_direct_runouts: int = 0,
    indirect_runouts: int = 0,
) -> Tuple[float, Dict[str, Any]]:
    """
    Calculates total fantasy points and detailed points breakdown for an ODI player.
    """
    breakdown = {}
    total_pts = 0.0

    # 1. Playing XI
    if played_xi:
        total_pts += 4.0
        breakdown["playing_xi"] = 4.0

    # 2. Batting Points
    batting_pts = 0.0
    if runs > 0:
        batting_pts += runs * 1.0
        breakdown["runs"] = runs * 1.0

    if fours > 0:
        batting_pts += fours * 1.0
        breakdown["boundary_fours"] = fours * 1.0

    if sixes > 0:
        batting_pts += sixes * 2.0
        breakdown["sixes"] = sixes * 2.0

    # Half Century / Century
    if runs >= 100:
        batting_pts += 8.0
        breakdown["century_bonus"] = 8.0
    elif runs >= 50:
        batting_pts += 4.0
        breakdown["half_century_bonus"] = 4.0

    # Duck dismissal (BAT, WK, or AR out for 0)
    if dismissed and runs == 0 and role in ["BAT", "WK", "AR"]:
        batting_pts -= 3.0
        breakdown["duck_penalty"] = -3.0

    # Strike Rate Bonus / Penalty (Min 20 balls faced, bowlers exempt)
    if balls >= 20 and role in ["BAT", "WK", "AR"]:
        sr = (runs / balls) * 100.0
        breakdown["strike_rate_value"] = round(sr, 2)
        if sr > 140.0:
            batting_pts += 6.0
            breakdown["strike_rate_bonus"] = 6.0
        elif 120.01 <= sr <= 140.0:
            batting_pts += 4.0
            breakdown["strike_rate_bonus"] = 4.0
        elif 100.0 <= sr <= 120.0:
            batting_pts += 2.0
            breakdown["strike_rate_bonus"] = 2.0
        elif 40.0 <= sr <= 50.0:
            batting_pts -= 2.0
            breakdown["strike_rate_penalty"] = -2.0
        elif 30.0 <= sr <= 39.99:
            batting_pts -= 4.0
            breakdown["strike_rate_penalty"] = -4.0
        elif sr < 30.0:
            batting_pts -= 6.0
            breakdown["strike_rate_penalty"] = -6.0

    total_pts += batting_pts
    breakdown["batting_total"] = batting_pts

    # 3. Bowling Points
    bowling_pts = 0.0
    if wickets > 0:
        bowling_pts += wickets * 25.0
        breakdown["wickets"] = wickets * 25.0

    if lbw_bowled_count > 0:
        bowling_pts += lbw_bowled_count * 8.0
        breakdown["lbw_bowled_bonus"] = lbw_bowled_count * 8.0

    # 4-Wicket & 5-Wicket Hauls
    if wickets >= 5:
        bowling_pts += 8.0
        breakdown["5_wicket_haul"] = 8.0
    elif wickets == 4:
        bowling_pts += 4.0
        breakdown["4_wicket_haul"] = 4.0

    if maidens > 0:
        bowling_pts += maidens * 4.0
        breakdown["maidens"] = maidens * 4.0

    # Economy Rate Bonus / Penalty (Minimum 5 overs bowled)
    if overs_bowled >= 5.0:
        econ = runs_conceded / overs_bowled
        breakdown["economy_rate_value"] = round(econ, 2)
        if econ < 2.5:
            bowling_pts += 6.0
            breakdown["economy_bonus"] = 6.0
        elif 2.5 <= econ <= 3.49:
            bowling_pts += 4.0
            breakdown["economy_bonus"] = 4.0
        elif 3.5 <= econ <= 4.5:
            bowling_pts += 2.0
            breakdown["economy_bonus"] = 2.0
        elif 7.0 <= econ <= 8.0:
            bowling_pts -= 2.0
            breakdown["economy_penalty"] = -2.0
        elif 8.01 <= econ <= 9.0:
            bowling_pts -= 4.0
            breakdown["economy_penalty"] = -4.0
        elif econ > 9.0:
            bowling_pts -= 6.0
            breakdown["economy_penalty"] = -6.0

    total_pts += bowling_pts
    breakdown["bowling_total"] = bowling_pts

    # 4. Fielding Points
    fielding_pts = 0.0
    if catches > 0:
        fielding_pts += catches * 8.0
        breakdown["catches"] = catches * 8.0
        if catches >= 3:
            fielding_pts += 4.0
            breakdown["3_catches_bonus"] = 4.0

    if stumpings_direct_runouts > 0:
        fielding_pts += stumpings_direct_runouts * 12.0
        breakdown["stumpings_direct_runouts"] = stumpings_direct_runouts * 12.0

    if indirect_runouts > 0:
        fielding_pts += indirect_runouts * 6.0
        breakdown["indirect_runouts"] = indirect_runouts * 6.0

    total_pts += fielding_pts
    breakdown["fielding_total"] = fielding_pts

    breakdown["final_base_pts"] = round(total_pts, 1)
    return round(total_pts, 1), breakdown


def calculate_team_points(
    players_stats: Dict[int, float],
    captain_id: int,
    vice_captain_id: int
) -> Tuple[float, Dict[int, float]]:
    """
    Applies 2.0x for Captain and 1.5x for Vice-Captain.
    Returns (total_team_points, player_multiplied_points_map).
    """
    team_total = 0.0
    effective_pts_map = {}

    for player_id, base_pts in players_stats.items():
        if player_id == captain_id:
            eff = round(base_pts * 2.0, 1)
        elif player_id == vice_captain_id:
            eff = round(base_pts * 1.5, 1)
        else:
            eff = round(base_pts, 1)
        effective_pts_map[player_id] = eff
        team_total += eff

    return round(team_total, 1), effective_pts_map
