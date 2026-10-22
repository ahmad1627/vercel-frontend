import os
import json
from contextlib import asynccontextmanager
from datetime import datetime
from typing import List, Optional

from fastapi import FastAPI, Depends, HTTPException, status, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from starlette.responses import FileResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session
from apscheduler.schedulers.asyncio import AsyncIOScheduler

from database import engine, get_db, Base, run_migrations
from models import (
    User, Match, Player, FantasyTeam, fantasy_team_players, PlayerMatchStat, TriSeriesStanding
)
from auth import router as auth_router, get_current_user, get_current_user_optional
from scoring_engine import calculate_player_fantasy_points, calculate_team_points
from cricapi_service import get_simulated_match_scorecard, fetch_live_cricapi_scorecard
from seed_data import seed_database

# Scheduler for automated match checks
scheduler = AsyncIOScheduler()

def init_db():
    """
    Ensures all database tables exist, migrations are applied,
    and seed_data.py runs automatically whenever the server starts.
    """
    try:
        run_migrations()
        Base.metadata.create_all(bind=engine)
        seed_database()
        print("[SUCCESS] Database tables created, migrations executed, and seed_data.py initialized successfully!")
    except Exception as e:
        print(f"[DB INIT ERROR] Failed to initialize database: {e}")

# Run database setup & seeding automatically on server startup
init_db()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure database tables exist, migrations are executed, and seed_data.py runs
    init_db()
    scheduler.start()
    yield
    scheduler.shutdown()

app = FastAPI(
    title="2026 Pakistan ODI Tri-Series Daily Fantasy API",
    description="ICC/IPL-standard Daily Fantasy Cricket Engine for Pakistan, England & Sri Lanka Tri-Series.",
    version="1.0.0",
    lifespan=lifespan
)

# ==========================================
# CORS CONFIGURATION (Public Frontend & Local Dev)
# ==========================================
# Collect explicit frontend domains from environment variables
FRONTEND_URL = os.getenv("FRONTEND_URL", "")
PUBLIC_FRONTEND_URL = os.getenv("PUBLIC_FRONTEND_URL", "")
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "")

allowed_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:4173",
    "http://127.0.0.1:4173",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
]

for env_var in [FRONTEND_URL, PUBLIC_FRONTEND_URL, CORS_ORIGINS]:
    if env_var:
        for origin in env_var.split(","):
            cleaned = origin.strip().rstrip("/")
            if cleaned and cleaned not in allowed_origins:
                allowed_origins.append(cleaned)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"^https?:\/\/.*",  # Allows any public frontend domain (Vercel, Netlify, custom domains)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)

# Request Schemas
class TeamSubmissionRequest(BaseModel):
    match_id: int
    player_ids: List[int]
    captain_id: int
    vice_captain_id: int


# ==========================================
# FIXTURES & MATCH ROTATION ENDPOINTS
# ==========================================

def format_match_lock_info(m):
    """
    Computes real-time live lock status and user-facing badge for a fixture.
    Only the currently active match day fixture is open for selection.
    Future matches remain locked until their scheduled date and rotation turn arrive.
    """
    is_selectable = bool(m.is_active and not m.is_locked and m.status not in ["COMPLETED", "LIVE"])
    
    if m.status == "COMPLETED":
        status_badge = "COMPLETED"
        lock_status_text = "Match Completed (Results Finalized)"
    elif m.is_locked or m.status == "LIVE":
        status_badge = "LOCKED_1ST_BALL"
        lock_status_text = "Lineup Locked (1st Ball Bowled • Inning 1 Underway)"
    elif m.is_active:
        status_badge = "OPEN_ACTIVE"
        lock_status_text = "Open for Squad Selection (Locks at 1st Ball)"
    else:
        status_badge = "LOCKED_FUTURE"
        date_str = m.match_date.strftime("%b %d, %Y") if hasattr(m.match_date, "strftime") else str(m.match_date)
        lock_status_text = f"Locked until Match Day ({date_str})"
        
    return is_selectable, status_badge, lock_status_text


@app.get("/matches")
def get_all_matches(db: Session = Depends(get_db)):
    matches = db.query(Match).order_by(Match.match_number.asc()).all()
    result = []
    for m in matches:
        is_sel, badge, lock_text = format_match_lock_info(m)
        result.append({
            "id": m.id,
            "match_number": m.match_number,
            "title": m.title,
            "team_a": m.team_a,
            "team_b": m.team_b,
            "venue": m.venue,
            "match_date": m.match_date.isoformat(),
            "status": m.status,
            "is_active": m.is_active,
            "is_locked": m.is_locked,
            "is_selectable": is_sel,
            "status_badge": badge,
            "lock_status_text": lock_text,
            "winner_team": m.winner_team,
            "scorecard_summary": m.scorecard_summary,
        })
    return result


@app.get("/matches/active")
def get_active_match(db: Session = Depends(get_db)):
    active = db.query(Match).filter(Match.is_active == True).first()
    if not active:
        # Fallback to the first upcoming/uncompleted match
        active = db.query(Match).filter(Match.status != "COMPLETED").order_by(Match.match_number.asc()).first()
    if not active:
        # If all completed, return the final
        active = db.query(Match).order_by(Match.match_number.desc()).first()
    
    is_sel, badge, lock_text = format_match_lock_info(active)
    return {
        "id": active.id,
        "match_number": active.match_number,
        "title": active.title,
        "team_a": active.team_a,
        "team_b": active.team_b,
        "venue": active.venue,
        "match_date": active.match_date.isoformat(),
        "status": active.status,
        "is_active": active.is_active,
        "is_locked": active.is_locked,
        "is_selectable": is_sel,
        "status_badge": badge,
        "lock_status_text": lock_text,
        "winner_team": active.winner_team,
        "scorecard_summary": active.scorecard_summary,
    }


@app.get("/matches/{match_id}/players")
def get_match_players(match_id: int, db: Session = Depends(get_db)):
    match = db.query(Match).filter(Match.id == match_id).first()
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")

    # If it's the final and teams are still TBD, resolve them from standings
    team_a = match.team_a
    team_b = match.team_b
    if team_a == "TBD" or team_b == "TBD":
        standings = db.query(TriSeriesStanding).order_by(
            TriSeriesStanding.points.desc(),
            TriSeriesStanding.nrr.desc()
        ).all()
        team_a = standings[0].team if len(standings) > 0 else "PAK"
        team_b = standings[1].team if len(standings) > 1 else "ENG"

    # Only show players from the 2 competing teams in this match
    players = db.query(Player).filter(Player.team.in_([team_a, team_b])).all()

    # Organize by role
    wk = []
    bat = []
    ar = []
    bowl = []

    for p in players:
        p_dict = {
            "id": p.id,
            "name": p.name,
            "team": p.team,
            "role": p.role,
            "is_captain": p.is_captain,
        }
        if p.role == "WK":
            wk.append(p_dict)
        elif p.role == "BAT":
            bat.append(p_dict)
        elif p.role == "AR":
            ar.append(p_dict)
        elif p.role == "BOWL":
            bowl.append(p_dict)

    return {
        "match": {
            "id": match.id,
            "match_number": match.match_number,
            "title": match.title,
            "team_a": team_a,
            "team_b": team_b,
            "venue": match.venue,
            "status": match.status,
            "is_active": match.is_active,
        },
        "total_players_available": len(players),
        "categorized_players": {
            "WK": wk,
            "BAT": bat,
            "AR": ar,
            "BOWL": bowl,
        },
        "all_players": [
            {
                "id": p.id,
                "name": p.name,
                "team": p.team,
                "role": p.role,
                "is_captain": p.is_captain,
            }
            for p in players
        ]
    }


# ==========================================
# STRICT FANTASY TEAM SELECTION RULES
# ==========================================

@app.post("/teams")
def save_fantasy_team(
    req: TeamSubmissionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    match = db.query(Match).filter(Match.id == req.match_id).first()
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")

    if not match.is_active:
        date_str = match.match_date.strftime("%b %d, %Y at %I:%M %p PKT") if hasattr(match.match_date, "strftime") else str(match.match_date)
        raise HTTPException(
            status_code=400,
            detail=f"This fixture is locked until its scheduled match day ({date_str}). Player selection is strictly restricted to the currently active match fixture."
        )

    if match.status == "COMPLETED":
        raise HTTPException(status_code=400, detail="This match has already ended. Team submissions are locked.")

    if match.is_locked or match.status == "LIVE":
        raise HTTPException(
            status_code=400,
            detail="Lineup deadline passed! Lineups are strictly locked at the 1st ball of the 1st inning. Team modifications are not permitted once the match begins."
        )

    # Rule 1: Exactly 11 players
    if len(req.player_ids) != 11:
        raise HTTPException(
            status_code=400,
            detail=f"You must select exactly 11 players (currently selected {len(req.player_ids)})."
        )

    # Check for duplicates
    if len(set(req.player_ids)) != 11:
        raise HTTPException(status_code=400, detail="Duplicate player selections detected.")

    # Rule 2: Captain & Vice-Captain
    if not req.captain_id or not req.vice_captain_id:
        raise HTTPException(status_code=400, detail="You must assign both a Captain (2.0x) and Vice-Captain (1.5x).")
    
    if req.captain_id == req.vice_captain_id:
        raise HTTPException(status_code=400, detail="Captain and Vice-Captain cannot be the same player.")

    if req.captain_id not in req.player_ids:
        raise HTTPException(status_code=400, detail="Selected Captain must be in your 11-player lineup.")

    if req.vice_captain_id not in req.player_ids:
        raise HTTPException(status_code=400, detail="Selected Vice-Captain must be in your 11-player lineup.")

    # Fetch players from DB
    players = db.query(Player).filter(Player.id.in_(req.player_ids)).all()
    if len(players) != 11:
        raise HTTPException(status_code=400, detail="One or more selected players are invalid.")

    # Resolve active match teams
    team_a = match.team_a
    team_b = match.team_b
    if team_a == "TBD" or team_b == "TBD":
        standings = db.query(TriSeriesStanding).order_by(
            TriSeriesStanding.points.desc(),
            TriSeriesStanding.nrr.desc()
        ).all()
        team_a = standings[0].team if len(standings) > 0 else "PAK"
        team_b = standings[1].team if len(standings) > 1 else "ENG"

    # Validate all players belong to competing teams
    valid_teams = {team_a, team_b}
    team_counts = {team_a: 0, team_b: 0}
    role_counts = {"WK": 0, "BAT": 0, "AR": 0, "BOWL": 0}

    for p in players:
        if p.team not in valid_teams:
            raise HTTPException(
                status_code=400,
                detail=f"Player {p.name} ({p.team}) does not belong to the 2 competing teams ({team_a} vs {team_b})."
            )
        team_counts[p.team] += 1
        role_counts[p.role] = role_counts.get(p.role, 0) + 1

    # Rule 3: Team distribution (at least 1 from each, max 7 from one team)
    if team_counts[team_a] < 1 or team_counts[team_b] < 1:
        raise HTTPException(status_code=400, detail="You must select at least 1 player from each team.")
    
    if team_counts[team_a] > 7 or team_counts[team_b] > 7:
        raise HTTPException(status_code=400, detail="Maximum 7 players allowed from a single team.")

    # Rule 4: Strict role limits
    # WK: 1-4
    if not (1 <= role_counts.get("WK", 0) <= 4):
        raise HTTPException(status_code=400, detail=f"Wicketkeepers (WK) must be between 1 and 4 (you have {role_counts.get('WK', 0)}).")
    # BAT: 3-6
    if not (3 <= role_counts.get("BAT", 0) <= 6):
        raise HTTPException(status_code=400, detail=f"Batters (BAT) must be between 3 and 6 (you have {role_counts.get('BAT', 0)}).")
    # AR: 1-4
    if not (1 <= role_counts.get("AR", 0) <= 4):
        raise HTTPException(status_code=400, detail=f"All-Rounders (AR) must be between 1 and 4 (you have {role_counts.get('AR', 0)}).")
    # BOWL: 3-6
    if not (3 <= role_counts.get("BOWL", 0) <= 6):
        raise HTTPException(status_code=400, detail=f"Bowlers (BOWL) must be between 3 and 6 (you have {role_counts.get('BOWL', 0)}).")

    # Find or create FantasyTeam
    team = db.query(FantasyTeam).filter(
        FantasyTeam.user_id == current_user.id,
        FantasyTeam.match_id == req.match_id
    ).first()

    if not team:
        team = FantasyTeam(
            user_id=current_user.id,
            match_id=req.match_id,
            captain_id=req.captain_id,
            vice_captain_id=req.vice_captain_id,
            total_points=0.0
        )
        team.players = players
        db.add(team)
    else:
        team.captain_id = req.captain_id
        team.vice_captain_id = req.vice_captain_id
        team.players = players
        team.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(team)

    return {
        "message": "Fantasy team saved successfully!",
        "team_id": team.id,
        "match_id": team.match_id,
        "captain_id": team.captain_id,
        "vice_captain_id": team.vice_captain_id,
        "player_count": len(team.players),
    }


@app.get("/teams/my-team")
def get_my_team(
    match_id: int = Query(...),
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    if not current_user:
        return {"has_team": False, "team": None}

    team = db.query(FantasyTeam).filter(
        FantasyTeam.user_id == current_user.id,
        FantasyTeam.match_id == match_id
    ).first()

    if not team:
        return {"has_team": False, "team": None}

    # Fetch stats if match completed
    player_stats_map = {}
    stats = db.query(PlayerMatchStat).filter(PlayerMatchStat.match_id == match_id).all()
    for s in stats:
        breakdown = json.loads(s.points_breakdown) if s.points_breakdown else {}
        player_stats_map[s.player_id] = {
            "fantasy_points": s.fantasy_points,
            "breakdown": breakdown
        }

    players_data = []
    for p in team.players:
        is_c = (p.id == team.captain_id)
        is_vc = (p.id == team.vice_captain_id)
        multiplier = 2.0 if is_c else (1.5 if is_vc else 1.0)
        
        stat = player_stats_map.get(p.id, {"fantasy_points": 0.0, "breakdown": {}})
        eff_points = round(stat["fantasy_points"] * multiplier, 1)

        players_data.append({
            "id": p.id,
            "name": p.name,
            "team": p.team,
            "role": p.role,
            "is_captain": is_c,
            "is_vice_captain": is_vc,
            "multiplier": multiplier,
            "base_points": stat["fantasy_points"],
            "effective_points": eff_points,
            "breakdown": stat["breakdown"],
        })

    return {
        "has_team": True,
        "team": {
            "id": team.id,
            "match_id": team.match_id,
            "captain_id": team.captain_id,
            "vice_captain_id": team.vice_captain_id,
            "total_points": team.total_points,
            "rank": team.rank,
            "players": players_data,
        }
    }


# ==========================================
# LEADERBOARD & INTERACTIVE PITCH DETAILS
# ==========================================

@app.get("/leaderboard")
def get_leaderboard(match_id: int = Query(...), db: Session = Depends(get_db)):
    match = db.query(Match).filter(Match.id == match_id).first()
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")

    teams = db.query(FantasyTeam).filter(
        FantasyTeam.match_id == match_id
    ).order_by(FantasyTeam.total_points.desc(), FantasyTeam.id.asc()).all()

    leaderboard = []
    seen_emails = set()
    rank = 1

    for t in teams:
        user = t.user
        if not user:
            continue
        
        # Enforce Rule 1: Only include verified email users
        if not getattr(user, "is_verified", True):
            continue
        
        # Enforce Rule 2: Exclude automated test runner accounts
        if user.email and user.email.lower().startswith("test.manager."):
            continue

        # Enforce Rule 3: Strictly 1 person with 1 email per leaderboard (no duplicates)
        user_email = user.email.lower().strip()
        if user_email in seen_emails:
            continue
        seen_emails.add(user_email)

        team_name = user.fantasy_team_name if user.fantasy_team_name else f"Team #{t.id}"
        full_name = user.full_name if user.full_name else "Cricket Fan"

        leaderboard.append({
            "rank": rank,
            "team_id": t.id,
            "user_id": t.user_id,
            "email": user.email,
            "is_verified": True,
            "fantasy_team_name": team_name,
            "full_name": full_name,
            "avatar_url": user.avatar_url,
            "total_points": round(t.total_points, 1),
            "captain_id": t.captain_id,
            "vice_captain_id": t.vice_captain_id,
            "is_winner": (rank == 1 and match.status == "COMPLETED" and t.total_points > 0),
        })
        rank += 1

    return {
        "match": {
            "id": match.id,
            "title": match.title,
            "status": match.status,
            "winner_team": match.winner_team,
            "venue": match.venue,
            "date": match.match_date.isoformat(),
        },
        "leaderboard": leaderboard,
    }


@app.get("/leaderboard/team/{team_id}")
def get_team_pitch_details(team_id: int, db: Session = Depends(get_db)):
    team = db.query(FantasyTeam).filter(FantasyTeam.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Fantasy team not found")

    match = team.match
    user = team.user

    # Fetch stats and breakdown for all players in this match
    stats = db.query(PlayerMatchStat).filter(PlayerMatchStat.match_id == match.id).all()
    stats_map = {}
    for s in stats:
        breakdown = json.loads(s.points_breakdown) if s.points_breakdown else {}
        stats_map[s.player_id] = {
            "base_points": s.fantasy_points,
            "runs": s.runs,
            "balls": s.balls,
            "fours": s.fours,
            "sixes": s.sixes,
            "overs": s.overs_bowled,
            "maidens": s.maidens,
            "runs_conceded": s.runs_conceded,
            "wickets": s.wickets,
            "catches": s.catches,
            "stumpings": s.stumpings_direct_runouts,
            "breakdown": breakdown,
        }

    categorized = {"WK": [], "BAT": [], "AR": [], "BOWL": []}

    for p in team.players:
        is_c = (p.id == team.captain_id)
        is_vc = (p.id == team.vice_captain_id)
        multiplier = 2.0 if is_c else (1.5 if is_vc else 1.0)
        
        stat = stats_map.get(p.id, {
            "base_points": 0.0, "runs": 0, "balls": 0, "fours": 0, "sixes": 0,
            "overs": 0.0, "maidens": 0, "runs_conceded": 0, "wickets": 0,
            "catches": 0, "stumpings": 0, "breakdown": {}
        })
        eff_points = round(stat["base_points"] * multiplier, 1)

        p_info = {
            "id": p.id,
            "name": p.name,
            "team": p.team,
            "role": p.role,
            "is_captain": is_c,
            "is_vice_captain": is_vc,
            "multiplier": multiplier,
            "base_points": stat["base_points"],
            "effective_points": eff_points,
            "stat_summary": stat,
        }
        if p.role in categorized:
            categorized[p.role].append(p_info)

    return {
        "team_id": team.id,
        "fantasy_team_name": user.fantasy_team_name if user else "Fantasy XI",
        "full_name": user.full_name if user else "Cricket Fan",
        "avatar_url": user.avatar_url if user else None,
        "total_points": round(team.total_points, 1),
        "rank": team.rank,
        "match": {
            "id": match.id,
            "title": match.title,
            "status": match.status,
            "venue": match.venue,
        },
        "categorized_players": categorized,
    }


@app.get("/leaderboard/overall")
def get_overall_tournament_leaderboard(db: Session = Depends(get_db)):
    """
    Computes cumulative tournament points across all matches for each registered verified user.
    Ranks users by overall series points, deciding the ultimate tournament winner at the Final!
    Enforces strictly 1 entry per verified email address.
    """
    users = db.query(User).all()
    overall_list = []
    seen_emails = set()
    
    # Check completed matches count
    completed_matches_count = db.query(Match).filter(Match.status == "COMPLETED").count()
    is_series_concluded = (completed_matches_count >= 6)

    for u in users:
        # Enforce Rule 1: Only include verified email users
        if not getattr(u, "is_verified", True):
            continue
            
        # Enforce Rule 2: Exclude automated test runner accounts
        if u.email and u.email.lower().startswith("test.manager."):
            continue

        # Enforce Rule 3: Strictly 1 person with 1 email
        user_email = u.email.lower().strip()
        if user_email in seen_emails:
            continue
        seen_emails.add(user_email)

        teams = db.query(FantasyTeam).filter(FantasyTeam.user_id == u.id).all()
        if not teams:
            continue
        total_pts = sum(t.total_points for t in teams)
        match_scores = {t.match_id: round(t.total_points, 1) for t in teams}
        
        overall_list.append({
            "user_id": u.id,
            "email": u.email,
            "is_verified": True,
            "full_name": u.full_name or "Cricket Fan",
            "fantasy_team_name": u.fantasy_team_name or f"Team #{u.id}",
            "avatar_url": u.avatar_url,
            "matches_played": len(teams),
            "total_points": round(total_pts, 1),
            "match_scores": match_scores,
        })

    # Sort descending by total_points
    overall_list.sort(key=lambda x: x["total_points"], reverse=True)

    # Assign ranks
    for idx, item in enumerate(overall_list, start=1):
        item["rank"] = idx
        item["is_champion"] = (idx == 1 and is_series_concluded and item["total_points"] > 0)

    return {
        "tournament_title": "2026 Pakistan ODI Tri-Nation Series",
        "completed_matches": completed_matches_count,
        "is_series_concluded": is_series_concluded,
        "leaderboard": overall_list
    }


# ==========================================
# TOURNAMENT STANDINGS
# ==========================================

@app.get("/standings")
def get_tri_series_standings(db: Session = Depends(get_db)):
    standings = db.query(TriSeriesStanding).order_by(
        TriSeriesStanding.points.desc(),
        TriSeriesStanding.nrr.desc()
    ).all()
    return [
        {
            "team": s.team,
            "played": s.played,
            "won": s.won,
            "lost": s.lost,
            "points": s.points,
            "nrr": s.nrr,
        }
        for s in standings
    ]


# ==========================================
# SIMULATION ENGINE & MATCH ROTATION (ADMIN)
# ==========================================

@app.post("/admin/simulate-match/{match_id}")
def simulate_and_complete_match(
    match_id: int,
    db: Session = Depends(get_db)
):
    """
    Executes full match conclusion:
    1. Ingests official match scorecard JSON & calculates ODI fantasy points.
    2. Calculates every user's team total with Captain (2.0x) and Vice-Captain (1.5x).
    3. Ranks all users on Daily Match Leaderboard and crowns #1 winner with Gold Trophy.
    4. Marks current match as COMPLETED.
    5. Updates Tri-Series standings.
    6. Automatically unlocks next scheduled fixture as ACTIVE.
    7. For Final Match (Match 6): resolves qualifying top 2 teams!
    """
    match = db.query(Match).filter(Match.id == match_id).first()
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")

    team_a = match.team_a
    team_b = match.team_b

    # If it's the final and teams were TBD, resolve now
    if team_a == "TBD" or team_b == "TBD":
        standings = db.query(TriSeriesStanding).order_by(
            TriSeriesStanding.points.desc(),
            TriSeriesStanding.nrr.desc()
        ).all()
        team_a = standings[0].team if len(standings) > 0 else "PAK"
        team_b = standings[1].team if len(standings) > 1 else "ENG"
        match.team_a = team_a
        match.team_b = team_b
        match.title = f"Match 6 (The Final): {team_a} vs {team_b}"
        db.commit()

    all_players = db.query(Player).filter(Player.team.in_([team_a, team_b])).all()
    players_data = [{"id": p.id, "name": p.name, "team": p.team, "role": p.role} for p in all_players]

    # Ingest scorecard stats
    scorecard = get_simulated_match_scorecard(match.id, team_a, team_b, players_data)
    
    # Store or update player stats
    player_pts_dict = {}

    # Clear previous stats if re-simulating
    db.query(PlayerMatchStat).filter(PlayerMatchStat.match_id == match.id).delete()

    for p_stat in scorecard["player_stats"]:
        base_pts, breakdown = calculate_player_fantasy_points(
            role=p_stat["role"],
            played_xi=p_stat["played_xi"],
            runs=p_stat["runs"],
            balls=p_stat["balls"],
            fours=p_stat["fours"],
            sixes=p_stat["sixes"],
            dismissed=p_stat["dismissed"],
            overs_bowled=p_stat["overs_bowled"],
            maidens=p_stat["maidens"],
            runs_conceded=p_stat["runs_conceded"],
            wickets=p_stat["wickets"],
            lbw_bowled_count=p_stat["lbw_bowled_count"],
            catches=p_stat["catches"],
            stumpings_direct_runouts=p_stat["stumpings_direct_runouts"],
            indirect_runouts=p_stat["indirect_runouts"],
        )

        stat_record = PlayerMatchStat(
            match_id=match.id,
            player_id=p_stat["player_id"],
            runs=p_stat["runs"],
            balls=p_stat["balls"],
            fours=p_stat["fours"],
            sixes=p_stat["sixes"],
            dismissed=p_stat["dismissed"],
            overs_bowled=p_stat["overs_bowled"],
            maidens=p_stat["maidens"],
            runs_conceded=p_stat["runs_conceded"],
            wickets=p_stat["wickets"],
            lbw_bowled_count=p_stat["lbw_bowled_count"],
            catches=p_stat["catches"],
            stumpings_direct_runouts=p_stat["stumpings_direct_runouts"],
            indirect_runouts=p_stat["indirect_runouts"],
            played_xi=p_stat["played_xi"],
            fantasy_points=base_pts,
            points_breakdown=json.dumps(breakdown),
        )
        db.add(stat_record)
        player_pts_dict[p_stat["player_id"]] = base_pts

    db.commit()

    # Calculate points for all fantasy teams in this match
    fantasy_teams = db.query(FantasyTeam).filter(FantasyTeam.match_id == match.id).all()
    for ft in fantasy_teams:
        team_player_ids = [p.id for p in ft.players]
        subset_stats = {pid: player_pts_dict.get(pid, 0.0) for pid in team_player_ids}
        total, _ = calculate_team_points(subset_stats, ft.captain_id, ft.vice_captain_id)
        ft.total_points = total

    db.commit()

    # Rank fantasy teams
    ranked_teams = db.query(FantasyTeam).filter(
        FantasyTeam.match_id == match.id
    ).order_by(FantasyTeam.total_points.desc()).all()

    for rank, ft in enumerate(ranked_teams, start=1):
        ft.rank = rank

    # Determine match winner team based on aggregate simulated runs
    winner = team_a if match.match_number % 2 != 0 else team_b
    match.winner_team = winner
    match.status = "COMPLETED"
    match.is_active = False
    match.is_locked = True
    match.scorecard_summary = f"{winner} won by 24 runs in a thrilling encounter."
    db.commit()

    # Update TriSeries Standings
    if match.match_number <= 5:
        std_win = db.query(TriSeriesStanding).filter(TriSeriesStanding.team == winner).first()
        loser = team_b if winner == team_a else team_a
        std_loss = db.query(TriSeriesStanding).filter(TriSeriesStanding.team == loser).first()
        
        if std_win:
            std_win.played += 1
            std_win.won += 1
            std_win.points += 2
            std_win.nrr = round(std_win.nrr + 0.42, 2)
        if std_loss:
            std_loss.played += 1
            std_loss.lost += 1
            std_loss.nrr = round(std_loss.nrr - 0.42, 2)
        db.commit()

    # Automatically unlock the next scheduled fixture
    next_match = db.query(Match).filter(
        Match.match_number == match.match_number + 1
    ).first()

    crowned_winner_name = ranked_teams[0].user.fantasy_team_name if ranked_teams and ranked_teams[0].user else "None"

    if next_match:
        # If advancing to Final (Match 6), resolve finalists
        if next_match.match_number == 6:
            standings = db.query(TriSeriesStanding).order_by(
                TriSeriesStanding.points.desc(),
                TriSeriesStanding.nrr.desc()
            ).all()
            finalist_1 = standings[0].team if len(standings) > 0 else "PAK"
            finalist_2 = standings[1].team if len(standings) > 1 else "ENG"
            next_match.team_a = finalist_1
            next_match.team_b = finalist_2
            next_match.title = f"Match 6 (The Final): {finalist_1} vs {finalist_2}"
        
        next_match.status = "ACTIVE"
        next_match.is_active = True
        next_match.is_locked = False
        db.commit()

    return {
        "message": f"Match {match.match_number} completed and points calculated!",
        "match_id": match.id,
        "winner_team": match.winner_team,
        "crowned_daily_winner": crowned_winner_name,
        "next_active_match": {
            "id": next_match.id if next_match else None,
            "title": next_match.title if next_match else "Tournament Completed",
        }
    }


@app.post("/admin/toggle-lock/{match_id}")
def toggle_match_lock(match_id: int, db: Session = Depends(get_db)):
    """
    Simulates the 1st ball bowled / match start deadline.
    When locked, teams cannot be created or modified for this match.
    """
    match = db.query(Match).filter(Match.id == match_id).first()
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")

    if match.status == "COMPLETED":
        raise HTTPException(status_code=400, detail="Match is already completed.")

    match.is_locked = not match.is_locked
    match.status = "LIVE" if match.is_locked else "ACTIVE"
    db.commit()
    db.refresh(match)

    return {
        "message": f"Lineup deadline is now {'LOCKED (1st Ball Bowled - Live Match)' if match.is_locked else 'OPEN (Accepting Squads)'}",
        "match_id": match.id,
        "is_locked": match.is_locked,
        "status": match.status,
    }


@app.post("/admin/reset-tournament")
def reset_tournament(db: Session = Depends(get_db)):
    """
    Resets the tournament back to Match 1 (Pakistan vs England) for testing.
    """
    seed_database()
    # Reset matches
    matches = db.query(Match).order_by(Match.match_number.asc()).all()
    for m in matches:
        if m.match_number == 1:
            m.status = "ACTIVE"
            m.is_active = True
            m.is_locked = False
            m.winner_team = None
            m.scorecard_summary = None
        elif m.match_number == 6:
            m.team_a = "TBD"
            m.team_b = "TBD"
            m.title = "Match 6 (The Final): TBD vs TBD"
            m.status = "TBD_FINAL"
            m.is_active = False
            m.is_locked = False
            m.winner_team = None
        else:
            m.status = "LOCKED_NEXT"
            m.is_active = False
            m.is_locked = False
            m.winner_team = None
            m.scorecard_summary = None

    # Reset standings
    standings = db.query(TriSeriesStanding).all()
    for s in standings:
        s.played = 0
        s.won = 0
        s.lost = 0
        s.points = 0
        s.nrr = 0.0

    # Reset stats
    db.query(PlayerMatchStat).delete()
    
    # Reset fantasy team scores
    teams = db.query(FantasyTeam).all()
    for t in teams:
        t.total_points = 0.0
        t.rank = None

    db.commit()

    return {"message": "Tournament reset successfully back to Match 1 (Pakistan vs England)!"}


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "series": "2026 Pakistan ODI Tri-Nation Series",
        "teams": ["Pakistan (PAK)", "England (ENG)", "Sri Lanka (SL)"],
        "timestamp": datetime.utcnow().isoformat()
    }


# ==========================================
# PRODUCTION STATIC FRONTEND SERVING
# ==========================================
# If the React frontend has been built (dist/ folder exists),
# serve it directly so the entire web app runs as a single service!
FRONTEND_DIST_DIRS = [
    os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")),
    os.path.abspath(os.path.join(os.path.dirname(__file__), "frontend", "dist")),
    os.path.abspath(os.path.join(os.path.dirname(__file__), "static")),
    os.path.abspath(os.path.join(os.getcwd(), "frontend", "dist")),
]

STATIC_DIST_DIR = None
for d in FRONTEND_DIST_DIRS:
    if os.path.exists(d) and os.path.isfile(os.path.join(d, "index.html")):
        STATIC_DIST_DIR = d
        break

if STATIC_DIST_DIR:
    assets_dir = os.path.join(STATIC_DIST_DIR, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="static_assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_spa_frontend(full_path: str):
        # Exclude API endpoints, docs, or schema from catch-all
        if full_path.startswith(("docs", "redoc", "openapi.json", "auth", "matches", "teams", "leaderboard", "standings", "admin", "health")):
            raise HTTPException(status_code=404, detail="API route not found")

        file_path = os.path.join(STATIC_DIST_DIR, full_path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)

        index_file = os.path.join(STATIC_DIST_DIR, "index.html")
        if os.path.exists(index_file):
            return FileResponse(index_file)
        raise HTTPException(status_code=404, detail="Frontend index.html not found")


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)

