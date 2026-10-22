from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, Table
)
from sqlalchemy.orm import relationship
from database import Base

# Association table between FantasyTeam and Player
fantasy_team_players = Table(
    "fantasy_team_players",
    Base.metadata,
    Column("id", Integer, primary_key=True),
    Column("fantasy_team_id", Integer, ForeignKey("fantasy_teams.id", ondelete="CASCADE")),
    Column("player_id", Integer, ForeignKey("players.id", ondelete="CASCADE")),
    Column("points_scored", Float, default=0.0),
)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=True)
    full_name = Column(String(255), nullable=True)
    fantasy_team_name = Column(String(255), unique=True, nullable=True)
    is_admin = Column(Boolean, default=False)
    is_verified = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    reset_token = Column(String(255), nullable=True)
    reset_token_expiry = Column(DateTime, nullable=True)
    oauth_provider = Column(String(50), nullable=True)
    oauth_id = Column(String(255), nullable=True)
    avatar_url = Column(Text, nullable=True)

    fantasy_teams = relationship("FantasyTeam", back_populates="user", cascade="all, delete-orphan")


class Match(Base):
    __tablename__ = "matches"

    id = Column(Integer, primary_key=True, index=True)
    match_number = Column(Integer, nullable=False)
    title = Column(String(255), nullable=False)
    team_a = Column(String(50), nullable=False)
    team_b = Column(String(50), nullable=False)
    venue = Column(String(255), nullable=False)
    match_date = Column(DateTime, nullable=False)
    status = Column(String(50), default="UPCOMING")  # UPCOMING, ACTIVE, LOCKED_NEXT, LIVE, COMPLETED, TBD_FINAL
    is_active = Column(Boolean, default=False)
    is_locked = Column(Boolean, default=False)
    winner_team = Column(String(50), nullable=True)
    scorecard_summary = Column(Text, nullable=True)

    fantasy_teams = relationship("FantasyTeam", back_populates="match", cascade="all, delete-orphan")
    player_stats = relationship("PlayerMatchStat", back_populates="match", cascade="all, delete-orphan")


class Player(Base):
    __tablename__ = "players"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    team = Column(String(50), nullable=False)  # PAK, ENG, SL
    role = Column(String(50), nullable=False)  # WK, BAT, AR, BOWL
    is_captain = Column(Boolean, default=False)
    image_url = Column(String(500), nullable=True)

    stats = relationship("PlayerMatchStat", back_populates="player", cascade="all, delete-orphan")


class FantasyTeam(Base):
    __tablename__ = "fantasy_teams"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    match_id = Column(Integer, ForeignKey("matches.id", ondelete="CASCADE"), nullable=False)
    captain_id = Column(Integer, ForeignKey("players.id"), nullable=False)
    vice_captain_id = Column(Integer, ForeignKey("players.id"), nullable=False)
    total_points = Column(Float, default=0.0)
    rank = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="fantasy_teams")
    match = relationship("Match", back_populates="fantasy_teams")
    captain = relationship("Player", foreign_keys=[captain_id])
    vice_captain = relationship("Player", foreign_keys=[vice_captain_id])
    players = relationship("Player", secondary=fantasy_team_players)


class PlayerMatchStat(Base):
    __tablename__ = "player_match_stats"

    id = Column(Integer, primary_key=True, index=True)
    match_id = Column(Integer, ForeignKey("matches.id", ondelete="CASCADE"), nullable=False)
    player_id = Column(Integer, ForeignKey("players.id", ondelete="CASCADE"), nullable=False)
    
    # Batting
    runs = Column(Integer, default=0)
    balls = Column(Integer, default=0)
    fours = Column(Integer, default=0)
    sixes = Column(Integer, default=0)
    dismissed = Column(Boolean, default=False)
    
    # Bowling
    overs_bowled = Column(Float, default=0.0)
    maidens = Column(Integer, default=0)
    runs_conceded = Column(Integer, default=0)
    wickets = Column(Integer, default=0)
    lbw_bowled_count = Column(Integer, default=0)
    
    # Fielding
    catches = Column(Integer, default=0)
    stumpings_direct_runouts = Column(Integer, default=0)
    indirect_runouts = Column(Integer, default=0)
    
    # Playing XI
    played_xi = Column(Boolean, default=True)
    
    # Computed points
    fantasy_points = Column(Float, default=0.0)
    points_breakdown = Column(Text, nullable=True)

    match = relationship("Match", back_populates="player_stats")
    player = relationship("Player", back_populates="stats")


class TriSeriesStanding(Base):
    __tablename__ = "tri_series_standings"

    id = Column(Integer, primary_key=True, index=True)
    team = Column(String(50), unique=True, nullable=False)
    played = Column(Integer, default=0)
    won = Column(Integer, default=0)
    lost = Column(Integer, default=0)
    points = Column(Integer, default=0)
    nrr = Column(Float, default=0.0)
