/* ============================================================
   QuizMaster — auth.js
   Handles signup, login, session management, and page guard
   ============================================================ */

const AUTH_USERS_KEY   = 'qm_users';
const AUTH_SESSION_KEY = 'qm_session';

/* ---- Private Helpers ---- */

function _getAllUsers() {
  try { return JSON.parse(localStorage.getItem(AUTH_USERS_KEY)) || []; }
  catch { return []; }
}

function _saveUsers(users) {
  localStorage.setItem(AUTH_USERS_KEY, JSON.stringify(users));
}

/* ---- Public Auth API ---- */

/**
 * Register a new user.
 * @returns {{ success: boolean, message?: string }}
 */
function signup(username, email, password) {
  if (!username || !email || !password) return { success: false, message: 'All fields are required.' };
  if (username.trim().length < 3)         return { success: false, message: 'Username must be at least 3 characters.' };
  if (password.length < 6)                return { success: false, message: 'Password must be at least 6 characters.' };

  // Simple email check
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { success: false, message: 'Please enter a valid email address.' };
  }

  const users = _getAllUsers();

  if (users.find(u => u.username.toLowerCase() === username.trim().toLowerCase())) {
    return { success: false, message: 'Username already taken. Please choose another.' };
  }
  if (users.find(u => u.email.toLowerCase() === email.trim().toLowerCase())) {
    return { success: false, message: 'This email is already registered.' };
  }

  const newUser = {
    username: username.trim(),
    email:    email.trim().toLowerCase(),
    password,
    createdAt: Date.now(),
    history:   []
  };

  users.push(newUser);
  _saveUsers(users);
  return { success: true };
}

/**
 * Log in an existing user and persist the session.
 * @returns {{ success: boolean, message?: string }}
 */
function login(username, password) {
  if (!username || !password) return { success: false, message: 'Please fill in all fields.' };

  const users = _getAllUsers();
  const user  = users.find(
    u => u.username.toLowerCase() === username.trim().toLowerCase() && u.password === password
  );

  if (!user) return { success: false, message: 'Invalid username or password.' };

  const session = { username: user.username, email: user.email, loginAt: Date.now() };
  localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
  return { success: true };
}

/**
 * Destroy the current session and redirect to the login page.
 */
function logout() {
  localStorage.removeItem(AUTH_SESSION_KEY);
  window.location.href = 'index.html';
}

/**
 * Return the active session object, or null if not logged in.
 */
function getSession() {
  try { return JSON.parse(localStorage.getItem(AUTH_SESSION_KEY)); }
  catch { return null; }
}

/**
 * Redirect unauthenticated visitors to the login page.
 * @returns {object|null} session if authenticated
 */
function guardPage() {
  const session = getSession();
  if (!session) { window.location.href = 'index.html'; return null; }
  return session;
}

/**
 * Fetch the full user object (including history) for a given username.
 */
function getUserData(username) {
  return _getAllUsers().find(u => u.username.toLowerCase() === username.toLowerCase()) || null;
}

/**
 * Prepend a new quiz attempt to the user's history (max 50 entries).
 */
function saveAttempt(username, attempt) {
  const users = _getAllUsers();
  const idx   = users.findIndex(u => u.username.toLowerCase() === username.toLowerCase());
  if (idx === -1) return;
  if (!Array.isArray(users[idx].history)) users[idx].history = [];
  users[idx].history.unshift(attempt);
  if (users[idx].history.length > 50) users[idx].history.length = 50;
  _saveUsers(users);
}

/**
 * Return all registered users (used for the leaderboard).
 */
function getAllUsers() {
  return _getAllUsers();
}
