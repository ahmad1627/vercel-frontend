const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./database');

const { text, avatar, fail } = require('./validation');
const router = express.Router();
const SECRET_KEY = process.env.JWT_SECRET || 'local-development-only-change-me';
const EMAIL_REGEX = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/;

// Helpers
function createAccessToken(user) {
  return jwt.sign(
    {
      sub: String(user.id),
      email: user.email,
      full_name: user.full_name,
      fantasy_team_name: user.fantasy_team_name,
      is_admin: Boolean(user.is_admin),
      version: user.token_version || 0
    },
    SECRET_KEY,
    { expiresIn: '7d' }
  );
}

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ detail: 'Authentication token is missing' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, SECRET_KEY);
    let user = db.getUserById(payload.sub);
    if (!user || (payload.version || 0) !== (user.token_version || 0)) {
      return res.status(401).json({ detail: 'Session expired. Please sign in again.' });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ detail: 'Invalid or expired token' });
  }
}

function adminMiddleware(req, res, next) {
  return authMiddleware(req, res, () => {
    const adminEmail = (process.env.ADMIN_EMAIL || 'admin@fantasy.local').toLowerCase().trim();
    const isAdmin = Boolean(req.user.is_admin || (req.user.email && req.user.email.toLowerCase().trim() === adminEmail));
    if (!isAdmin) {
      return res.status(403).json({ detail: 'Only the tournament administrator can do this.' });
    }
    req.user.is_admin = true;
    return next();
  });
}

function optionalAuthMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, SECRET_KEY);
    let user = db.getUserById(payload.sub);
    if (user && (payload.version || 0) !== (user.token_version || 0)) user = null;
    req.user = user;
  } catch (err) {
    req.user = null;
  }
  next();
}

function formatUserResponse(user) {
  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@fantasy.local').toLowerCase().trim();
  const isAdmin = Boolean(user.is_admin || (user.email && user.email.toLowerCase().trim() === adminEmail));
  const fName = user.full_name || (user.email ? user.email.split('@')[0] : 'Cricket Fan');
  const tName = user.fantasy_team_name || `${fName} XI`;
  return {
    id: user.id,
    email: user.email,
    full_name: fName,
    fantasy_team_name: tName,
    avatar_url: user.avatar_url,
    is_admin: isAdmin,
    is_verified: Boolean(user.is_verified || isAdmin),
    onboarding_required: false
  };
}

// 1. Signup
router.post('/signup', (req, res) => {
  const { email, password, full_name, fantasy_team_name, avatar_url } = req.body || {};

  if (typeof email !== 'string' || email.length > 254 || !EMAIL_REGEX.test(email.trim())) {
    return res.status(400).json({ detail: 'Invalid email format' });
  }
  if (typeof password !== 'string' || password.length < 6 || Buffer.byteLength(password) > 72) {
    return res.status(400).json({ detail: 'Password must be between 6 and 72 characters' });
  }

  const cleanEmail = email.toLowerCase().trim();
  const existingEmail = db.getUserByEmail(cleanEmail);
  if (existingEmail) {
    return res.status(400).json({ detail: 'Email already registered. Please sign in instead.' });
  }

  if (fantasy_team_name) {
    text(fantasy_team_name, 'Team name', 3, 60);
    const existingTeam = db.getUserByTeamName(fantasy_team_name);
    if (existingTeam) {
      return res.status(400).json({ detail: 'Fantasy team name is already taken. Please choose another name.' });
    }
  }

  const salt = bcrypt.genSaltSync(10);
  const hashedPassword = bcrypt.hashSync(password, salt);

  const newUser = db.createUser({
    email: cleanEmail,
    hashed_password: hashedPassword,
    full_name: full_name ? text(full_name, 'Full name', 1, 80) : null,
    fantasy_team_name: fantasy_team_name ? text(fantasy_team_name, 'Team name', 3, 60) : null,
    avatar_url: avatar(avatar_url),
    is_admin: false,
    is_verified: false
  });

  const token = createAccessToken(newUser);


  return res.json({
    access_token: token,
    token_type: 'bearer',
    user: formatUserResponse(newUser)
  });
});

// 2. Login
router.post('/login', (req, res) => {
  const { email, password } = req.body || {};

  if (typeof email !== 'string' || typeof password !== 'string' || email.length>254 || Buffer.byteLength(password)>72) {
    return res.status(400).json({ detail: 'Incorrect email or password' });
  }

  const cleanEmail = email.toLowerCase().trim();
  const user = db.getUserByEmail(cleanEmail);

  if (!user || !user.hashed_password || !bcrypt.compareSync(password, user.hashed_password)) {
    return res.status(400).json({ detail: 'Incorrect email or password' });
  }

  const token = createAccessToken(user);


  return res.json({
    access_token: token,
    token_type: 'bearer',
    user: formatUserResponse(user)
  });
});

// The previous social-login routes trusted any supplied email address.
// Disable them until genuine OAuth verification is implemented.
router.post(['/google', '/facebook'], (_req, res) => {
  return res.status(501).json({ detail: 'Social login is not configured. Use email and password.' });
});

// 5. Onboarding
router.post('/onboarding', authMiddleware, (req, res) => {
  const { full_name, fantasy_team_name, avatar_url } = req.body || {};
  const fullName = text(full_name, 'Full name', 1, 80);
  const teamName = text(fantasy_team_name, 'Team name', 3, 60);

  if (!fullName) {
    return res.status(400).json({ detail: 'Full name cannot be empty' });
  }
  if (!teamName || teamName.length < 3) {
    return res.status(400).json({ detail: 'Fantasy team name must be at least 3 characters' });
  }

  const existing = db.getUserByTeamName(teamName, req.user.id);
  if (existing) {
    return res.status(400).json({ detail: `Team name '${teamName}' is already taken. Please pick another.` });
  }

  const updates = {
    full_name: fullName,
    fantasy_team_name: teamName
  };
  if (avatar_url) {
    updates.avatar_url = avatar(avatar_url);
  }

  const updatedUser = db.updateUser(req.user.id, updates);
  return res.json({
    message: 'Onboarding completed successfully!',
    user: formatUserResponse(updatedUser)
  });
});

// 6. Avatar Update
router.post('/avatar', authMiddleware, (req, res) => {
  const { avatar_url } = req.body || {};
  if (!avatar_url) {
    return res.status(400).json({ detail: 'Avatar URL is required' });
  }

  const updatedUser = db.updateUser(req.user.id, { avatar_url: avatar(avatar_url) });
  return res.json({
    message: 'Profile picture updated successfully!',
    avatar_url: updatedUser.avatar_url,
    user: formatUserResponse(updatedUser)
  });
});

// The original reset endpoint returned a valid reset token to anyone who
// knew an email address. Require a real mail service before enabling it.
router.post('/forgot-password', (_req, res) => {
  return res.status(501).json({
    detail: 'Automatic password resets are not configured. Contact the tournament administrator.'
  });
});
router.post('/reset-password', (_req, res) => {
  return res.status(501).json({ detail: 'Password reset requires verified email delivery.' });
});

router.post('/verify-email', (_req, res) => res.status(501).json({detail:'Email verification is not configured.'}));

// 10. Get Me
router.get('/me', authMiddleware, (req, res) => {
  return res.json(formatUserResponse(req.user));
});

module.exports = {
  router,
  authMiddleware,
  adminMiddleware,
  optionalAuthMiddleware
};
