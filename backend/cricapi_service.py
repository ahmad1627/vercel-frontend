"""
CricAPI Service & Realistic Tri-Series Match Simulation Engine
Provides live API integration with api.cricapi.com and realistic ODI simulation presets.
"""

import os
import random
import httpx
from typing import Dict, Any, List

CRICAPI_KEY = os.getenv("CRICAPI_KEY", "demo_cricapi_key_2026")
CRICAPI_BASE_URL = "https://api.cricapi.com/v1"

def get_simulated_match_scorecard(match_id: int, team_a: str, team_b: str, all_players: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Generates an authentic, detailed ODI scorecard for the given matchup and players.
    """
    team_a_players = [p for p in all_players if p["team"] == team_a]
    team_b_players = [p for p in all_players if p["team"] == team_b]

    # Pre-crafted realistic performance profiles based on match_id
    stats = []

    # Playing XI selection (11 from each team)
    playing_a = team_a_players[:11] if len(team_a_players) >= 11 else team_a_players
    playing_b = team_b_players[:11] if len(team_b_players) >= 11 else team_b_players
    bench_a = team_a_players[11:]
    bench_b = team_b_players[11:]

    # Bench players did not play XI
    for p in bench_a + bench_b:
        stats.append({
            "player_id": p["id"],
            "name": p["name"],
            "team": p["team"],
            "role": p["role"],
            "played_xi": False,
            "runs": 0, "balls": 0, "fours": 0, "sixes": 0, "dismissed": False,
            "overs_bowled": 0.0, "maidens": 0, "runs_conceded": 0, "wickets": 0, "lbw_bowled_count": 0,
            "catches": 0, "stumpings_direct_runouts": 0, "indirect_runouts": 0
        })

    # Realistic presets for Match 1 (PAK vs ENG)
    if match_id == 1 or (team_a == "PAK" and team_b == "ENG") or (team_a == "ENG" and team_b == "PAK"):
        preset_stats = {
            # PAK
            "Babar Azam": {"runs": 88, "balls": 74, "fours": 9, "sixes": 2, "dismissed": True, "catches": 1},
            "Fakhar Zaman": {"runs": 54, "balls": 48, "fours": 6, "sixes": 1, "dismissed": True, "catches": 0},
            "Saim Ayub": {"runs": 31, "balls": 24, "fours": 4, "sixes": 0, "dismissed": True, "catches": 1},
            "Hasan Nawaz": {"runs": 18, "balls": 15, "fours": 2, "sixes": 1, "dismissed": True, "catches": 0},
            "Saad Baig": {"runs": 24, "balls": 22, "fours": 2, "sixes": 0, "dismissed": True, "stumpings_direct_runouts": 1, "catches": 2},
            "Muhammad Ghazi Ghori": {"runs": 0, "balls": 0, "played_xi": False},
            "Salman Ali Agha": {"runs": 42, "balls": 35, "fours": 3, "sixes": 1, "dismissed": True, "overs_bowled": 5.0, "runs_conceded": 28, "wickets": 1, "catches": 1},
            "Shadab Khan": {"runs": 29, "balls": 20, "fours": 2, "sixes": 1, "dismissed": False, "overs_bowled": 8.0, "maidens": 0, "runs_conceded": 42, "wickets": 1, "lbw_bowled_count": 1},
            "Faheem Ashraf": {"runs": 15, "balls": 12, "fours": 1, "sixes": 0, "dismissed": False, "overs_bowled": 6.0, "runs_conceded": 36, "wickets": 1},
            "Shaheen Shah Afridi": {"runs": 8, "balls": 6, "fours": 1, "sixes": 0, "dismissed": True, "overs_bowled": 10.0, "maidens": 2, "runs_conceded": 44, "wickets": 3, "lbw_bowled_count": 2, "catches": 1},
            "Naseem Shah": {"runs": 4, "balls": 4, "dismissed": False, "overs_bowled": 9.0, "maidens": 1, "runs_conceded": 46, "wickets": 2, "lbw_bowled_count": 1},
            "Haris Rauf": {"runs": 2, "balls": 3, "dismissed": False, "overs_bowled": 10.0, "maidens": 0, "runs_conceded": 54, "wickets": 2, "lbw_bowled_count": 1},
            "Abrar Ahmed": {"overs_bowled": 7.0, "runs_conceded": 35, "wickets": 1},

            # ENG
            "Harry Brook": {"runs": 76, "balls": 58, "fours": 7, "sixes": 3, "dismissed": True, "catches": 1},
            "Joe Root": {"runs": 64, "balls": 70, "fours": 5, "sixes": 0, "dismissed": True, "catches": 2},
            "Ben Duckett": {"runs": 32, "balls": 25, "fours": 4, "sixes": 1, "dismissed": True},
            "Jordan Cox": {"runs": 22, "balls": 20, "fours": 2, "sixes": 0, "dismissed": True, "catches": 2, "stumpings_direct_runouts": 1},
            "Tom Banton": {"runs": 0, "balls": 0, "played_xi": False},
            "Sam Curran": {"runs": 38, "balls": 28, "fours": 3, "sixes": 1, "dismissed": True, "overs_bowled": 9.0, "runs_conceded": 52, "wickets": 2, "lbw_bowled_count": 1},
            "Will Jacks": {"runs": 25, "balls": 18, "fours": 2, "sixes": 1, "dismissed": True, "overs_bowled": 5.0, "runs_conceded": 26, "wickets": 1},
            "Liam Dawson": {"runs": 14, "balls": 16, "dismissed": False, "overs_bowled": 6.0, "runs_conceded": 32, "wickets": 1},
            "Jamie Overton": {"runs": 10, "balls": 8, "fours": 1, "sixes": 0, "dismissed": False, "overs_bowled": 5.0, "runs_conceded": 34, "wickets": 0},
            "Adil Rashid": {"runs": 6, "balls": 9, "dismissed": True, "overs_bowled": 10.0, "maidens": 1, "runs_conceded": 45, "wickets": 3, "lbw_bowled_count": 1, "catches": 1},
            "Gus Atkinson": {"runs": 4, "balls": 5, "dismissed": False, "overs_bowled": 9.0, "maidens": 0, "runs_conceded": 56, "wickets": 2, "lbw_bowled_count": 1},
            "Josh Tongue": {"runs": 1, "balls": 2, "dismissed": False, "overs_bowled": 6.0, "runs_conceded": 38, "wickets": 1},
        }
    else:
        # Dynamic realistic generator for subsequent matches
        preset_stats = {}

    for p in playing_a + playing_b:
        name = p["name"]
        role = p["role"]
        
        if name in preset_stats:
            p_data = preset_stats[name]
            stats.append({
                "player_id": p["id"],
                "name": name,
                "team": p["team"],
                "role": role,
                "played_xi": p_data.get("played_xi", True),
                "runs": p_data.get("runs", 0),
                "balls": p_data.get("balls", 0),
                "fours": p_data.get("fours", 0),
                "sixes": p_data.get("sixes", 0),
                "dismissed": p_data.get("dismissed", True),
                "overs_bowled": p_data.get("overs_bowled", 0.0),
                "maidens": p_data.get("maidens", 0),
                "runs_conceded": p_data.get("runs_conceded", 0),
                "wickets": p_data.get("wickets", 0),
                "lbw_bowled_count": p_data.get("lbw_bowled_count", 0),
                "catches": p_data.get("catches", 0),
                "stumpings_direct_runouts": p_data.get("stumpings_direct_runouts", 0),
                "indirect_runouts": p_data.get("indirect_runouts", 0)
            })
        else:
            # Generate realistic ODI performance based on role
            played = True
            runs = 0
            balls = 0
            fours = 0
            sixes = 0
            dismissed = random.choice([True, True, False])
            overs = 0.0
            maidens = 0
            runs_conc = 0
            wkts = 0
            lbw_b = 0
            catches = random.choices([0, 1, 2, 3], weights=[0.6, 0.25, 0.12, 0.03])[0]
            stump = 1 if role == "WK" and random.random() < 0.25 else 0

            if role in ["BAT", "WK"]:
                runs = random.randint(12, 92)
                balls = max(10, int(runs * random.uniform(0.8, 1.25)))
                fours = max(0, runs // 10)
                sixes = max(0, (runs - (fours * 4)) // 12)
            elif role == "AR":
                runs = random.randint(8, 55)
                balls = max(6, int(runs * random.uniform(0.7, 1.1)))
                fours = max(0, runs // 12)
                sixes = max(0, (runs - (fours * 4)) // 15)
                overs = float(random.choice([4, 6, 8, 10]))
                maidens = 1 if random.random() < 0.25 else 0
                runs_conc = int(overs * random.uniform(4.5, 6.2))
                wkts = random.choices([0, 1, 2, 3], weights=[0.4, 0.35, 0.2, 0.05])[0]
                lbw_b = min(wkts, 1 if random.random() < 0.5 else 0)
            elif role == "BOWL":
                runs = random.randint(0, 15)
                balls = max(2, runs)
                overs = float(random.choice([7, 8, 9, 10]))
                maidens = random.choice([0, 1, 2])
                runs_conc = int(overs * random.uniform(3.8, 5.8))
                wkts = random.choices([0, 1, 2, 3, 4, 5], weights=[0.2, 0.3, 0.28, 0.14, 0.06, 0.02])[0]
                lbw_b = min(wkts, random.choice([0, 1, 2]))

            stats.append({
                "player_id": p["id"],
                "name": name,
                "team": p["team"],
                "role": role,
                "played_xi": played,
                "runs": runs,
                "balls": balls,
                "fours": fours,
                "sixes": sixes,
                "dismissed": dismissed,
                "overs_bowled": overs,
                "maidens": maidens,
                "runs_conceded": runs_conc,
                "wickets": wkts,
                "lbw_bowled_count": lbw_b,
                "catches": catches,
                "stumpings_direct_runouts": stump,
                "indirect_runouts": 0
            })

    # Summary
    summary = {
        "match_id": match_id,
        "match_title": f"{team_a} vs {team_b}",
        "summary_text": f"High intensity ODI clash between {team_a} and {team_b}. Match concluded with exceptional batting and bowling performances.",
        "player_stats": stats,
    }
    return summary


async def fetch_live_cricapi_scorecard(cricapi_match_id: str) -> Dict[str, Any]:
    """
    Connects to live CricAPI endpoint if configured.
    """
    if not CRICAPI_KEY or CRICAPI_KEY.startswith("demo"):
        return {"status": "fallback", "message": "Using realistic simulation engine (Live CRICAPI_KEY not configured)."}
    
    url = f"{CRICAPI_BASE_URL}/match_scorecard?apikey={CRICAPI_KEY}&id={cricapi_match_id}"
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(url)
            if resp.status_code == 200:
                return resp.json()
    except Exception as e:
        print(f"[CRICAPI ERROR] {e}")
    
    return {"status": "error", "message": "Failed to fetch from CricAPI, fallback available."}
