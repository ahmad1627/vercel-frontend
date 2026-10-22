from datetime import datetime
import json
from database import SessionLocal, engine, Base
from models import User, Match, Player, FantasyTeam, fantasy_team_players, PlayerMatchStat, TriSeriesStanding
import bcrypt

def hash_pw(pw: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pw.encode("utf-8"), salt).decode("utf-8")

PLAYERS_DATA = [
    # PAKISTAN (PAK) - 16 players
    {"name": "Saad Baig", "team": "PAK", "role": "WK", "is_captain": False},
    {"name": "Muhammad Ghazi Ghori", "team": "PAK", "role": "WK", "is_captain": False},
    {"name": "Babar Azam", "team": "PAK", "role": "BAT", "is_captain": False},
    {"name": "Fakhar Zaman", "team": "PAK", "role": "BAT", "is_captain": False},
    {"name": "Saim Ayub", "team": "PAK", "role": "BAT", "is_captain": False},
    {"name": "Hasan Nawaz", "team": "PAK", "role": "BAT", "is_captain": False},
    {"name": "Salman Ali Agha", "team": "PAK", "role": "AR", "is_captain": False},
    {"name": "Shadab Khan", "team": "PAK", "role": "AR", "is_captain": False},
    {"name": "Faheem Ashraf", "team": "PAK", "role": "AR", "is_captain": False},
    {"name": "Arafat Minhas", "team": "PAK", "role": "AR", "is_captain": False},
    {"name": "Shaheen Shah Afridi", "team": "PAK", "role": "BOWL", "is_captain": True},
    {"name": "Naseem Shah", "team": "PAK", "role": "BOWL", "is_captain": False},
    {"name": "Haris Rauf", "team": "PAK", "role": "BOWL", "is_captain": False},
    {"name": "Abrar Ahmed", "team": "PAK", "role": "BOWL", "is_captain": False},
    {"name": "Sufiyan Muqeem", "team": "PAK", "role": "BOWL", "is_captain": False},
    {"name": "Razaullah", "team": "PAK", "role": "BOWL", "is_captain": False},

    # ENGLAND (ENG) - 16 players
    {"name": "Jordan Cox", "team": "ENG", "role": "WK", "is_captain": False},
    {"name": "Tom Banton", "team": "ENG", "role": "WK", "is_captain": False},
    {"name": "Harry Brook", "team": "ENG", "role": "BAT", "is_captain": True},
    {"name": "Joe Root", "team": "ENG", "role": "BAT", "is_captain": False},
    {"name": "Ben Duckett", "team": "ENG", "role": "BAT", "is_captain": False},
    {"name": "Sam Curran", "team": "ENG", "role": "AR", "is_captain": False},
    {"name": "Will Jacks", "team": "ENG", "role": "AR", "is_captain": False},
    {"name": "Liam Dawson", "team": "ENG", "role": "AR", "is_captain": False},
    {"name": "Jamie Overton", "team": "ENG", "role": "AR", "is_captain": False},
    {"name": "James Coles", "team": "ENG", "role": "AR", "is_captain": False},
    {"name": "Adil Rashid", "team": "ENG", "role": "BOWL", "is_captain": False},
    {"name": "Gus Atkinson", "team": "ENG", "role": "BOWL", "is_captain": False},
    {"name": "Josh Tongue", "team": "ENG", "role": "BOWL", "is_captain": False},
    {"name": "Sonny Baker", "team": "ENG", "role": "BOWL", "is_captain": False},
    {"name": "Henry Crocombe", "team": "ENG", "role": "BOWL", "is_captain": False},
    {"name": "Mason Crane", "team": "ENG", "role": "BOWL", "is_captain": False},

    # SRI LANKA (SL) - 17 players
    {"name": "Kusal Mendis", "team": "SL", "role": "WK", "is_captain": True},
    {"name": "Kamil Mishara", "team": "SL", "role": "WK", "is_captain": False},
    {"name": "Lahiru Udara", "team": "SL", "role": "WK", "is_captain": False},
    {"name": "Pathum Nissanka", "team": "SL", "role": "BAT", "is_captain": False},
    {"name": "Avishka Fernando", "team": "SL", "role": "BAT", "is_captain": False},
    {"name": "Pavan Rathnayake", "team": "SL", "role": "BAT", "is_captain": False},
    {"name": "Kamindu Mendis", "team": "SL", "role": "AR", "is_captain": False},
    {"name": "Dasun Shanaka", "team": "SL", "role": "AR", "is_captain": False},
    {"name": "Dunith Wellalage", "team": "SL", "role": "AR", "is_captain": False},
    {"name": "Janith Liyanage", "team": "SL", "role": "AR", "is_captain": False},
    {"name": "Sahan Arachchige", "team": "SL", "role": "AR", "is_captain": False},
    {"name": "Dushmantha Chameera", "team": "SL", "role": "BOWL", "is_captain": False},
    {"name": "Maheesh Theekshana", "team": "SL", "role": "BOWL", "is_captain": False},
    {"name": "Dilshan Madushanka", "team": "SL", "role": "BOWL", "is_captain": False},
    {"name": "Asitha Fernando", "team": "SL", "role": "BOWL", "is_captain": False},
    {"name": "Eshan Malinga", "team": "SL", "role": "BOWL", "is_captain": False},
    {"name": "Sachindu Colombage", "team": "SL", "role": "BOWL", "is_captain": False},
]

MATCHES_DATA = [
    {
        "id": 1,
        "match_number": 1,
        "title": "Match 1: Pakistan vs England",
        "team_a": "PAK",
        "team_b": "ENG",
        "venue": "Rawalpindi Cricket Stadium, Rawalpindi",
        "match_date": datetime.fromisoformat("2026-10-20T13:00:00+05:00"),
        "status": "ACTIVE",
        "is_active": True,
    },
    {
        "id": 2,
        "match_number": 2,
        "title": "Match 2: Sri Lanka vs England",
        "team_a": "SL",
        "team_b": "ENG",
        "venue": "Rawalpindi Cricket Stadium, Rawalpindi",
        "match_date": datetime.fromisoformat("2026-10-22T13:00:00+05:00"),
        "status": "LOCKED_NEXT",
        "is_active": False,
    },
    {
        "id": 3,
        "match_number": 3,
        "title": "Match 3: Pakistan vs England",
        "team_a": "PAK",
        "team_b": "ENG",
        "venue": "Gaddafi Stadium, Lahore",
        "match_date": datetime.fromisoformat("2026-10-25T13:00:00+05:00"),
        "status": "LOCKED_NEXT",
        "is_active": False,
    },
    {
        "id": 4,
        "match_number": 4,
        "title": "Match 4: Pakistan vs Sri Lanka",
        "team_a": "PAK",
        "team_b": "SL",
        "venue": "Gaddafi Stadium, Lahore",
        "match_date": datetime.fromisoformat("2026-10-27T13:00:00+05:00"),
        "status": "LOCKED_NEXT",
        "is_active": False,
    },
    {
        "id": 5,
        "match_number": 5,
        "title": "Match 5: Sri Lanka vs England",
        "team_a": "SL",
        "team_b": "ENG",
        "venue": "Gaddafi Stadium, Lahore",
        "match_date": datetime.fromisoformat("2026-10-29T13:00:00+05:00"),
        "status": "LOCKED_NEXT",
        "is_active": False,
    },
    {
        "id": 6,
        "match_number": 6,
        "title": "Match 6 (The Final): TBD vs TBD",
        "team_a": "TBD",
        "team_b": "TBD",
        "venue": "Gaddafi Stadium, Lahore",
        "match_date": datetime.fromisoformat("2026-10-31T13:00:00+05:00"),
        "status": "TBD_FINAL",
        "is_active": False,
    },
]

DEMO_USERS = [
    {
        "email": "ahmad@tahseen.pk",
        "password": "Password123!",
        "full_name": "Ahmad Tahseen",
        "fantasy_team_name": "Lahore Royals XI",
        "is_admin": True,
    },
    {
        "email": "karachi.kings@fantasy.pk",
        "password": "Password123!",
        "full_name": "Zayd Farooq",
        "fantasy_team_name": "Karachi Strikers",
        "is_admin": False,
    },
    {
        "email": "rawalpindi.express@fantasy.pk",
        "password": "Password123!",
        "full_name": "Bilal Akhtar",
        "fantasy_team_name": "Pindi Express XI",
        "is_admin": False,
    },
    {
        "email": "london.lions@fantasy.uk",
        "password": "Password123!",
        "full_name": "Oliver Smith",
        "fantasy_team_name": "Thames Titans",
        "is_admin": False,
    },
    {
        "email": "colombo.chargers@fantasy.lk",
        "password": "Password123!",
        "full_name": "Sanath Jayawardene",
        "fantasy_team_name": "Lanka Lions XI",
        "is_admin": False,
    },
]

def seed_database():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # Check if already seeded
        player_count = db.query(Player).count()
        if player_count < 49:
            db.execute(fantasy_team_players.delete())
            db.query(FantasyTeam).delete()
            db.query(PlayerMatchStat).delete()
            db.query(Player).delete()
            db.query(Match).delete()
            db.query(TriSeriesStanding).delete()
            db.commit()

            print("Seeding Players (49 verified players across PAK, ENG, SL)...")
            for p in PLAYERS_DATA:
                player = Player(
                    name=p["name"],
                    team=p["team"],
                    role=p["role"],
                    is_captain=p["is_captain"],
                )
                db.add(player)
            db.commit()

            print("Seeding Oct 2026 Fixtures...")
            for m in MATCHES_DATA:
                match = Match(
                    id=m["id"],
                    match_number=m["match_number"],
                    title=m["title"],
                    team_a=m["team_a"],
                    team_b=m["team_b"],
                    venue=m["venue"],
                    match_date=m["match_date"],
                    status=m["status"],
                    is_active=m["is_active"],
                    is_locked=m.get("is_locked", False),
                )
                db.add(match)
            db.commit()

            print("Seeding Standings Table...")
            for team_code in ["PAK", "ENG", "SL"]:
                standing = TriSeriesStanding(
                    team=team_code,
                    played=0,
                    won=0,
                    lost=0,
                    points=0,
                    nrr=0.0
                )
                db.add(standing)
            db.commit()

        # Seed Demo Users
        for u in DEMO_USERS:
            existing = db.query(User).filter(User.email == u["email"]).first()
            if not existing:
                user = User(
                    email=u["email"],
                    hashed_password=hash_pw(u["password"]),
                    full_name=u["full_name"],
                    fantasy_team_name=u["fantasy_team_name"],
                    is_admin=u["is_admin"],
                    is_verified=True,
                )
                db.add(user)
        db.commit()

        # Clean initial state: No matches played yet, no fantasy teams pre-populated
        # Users will register/log in and build their own squad for Pakistan vs England (Oct 20, 2026)!
        print("Database initialized with 0 played matches, ready for real user team submissions!")

        print("Database initialized and verified successfully!")
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
