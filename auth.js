/**
 * MentorBridge MVP - Auth & session management
 * Uses localStorage for demo; redirects if not logged in
 */

const STORAGE_KEY = 'mentorbridge_user';

function getSession() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

function setSession(user) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
}

function clearSession() {
  localStorage.removeItem(STORAGE_KEY);
}

function requireAuth(role) {
  const user = getSession();
  if (!user) {
    window.location.href = '/';
    return null;
  }
  if (role && user.role !== role) {
    // Redirect to correct dashboard
    window.location.href = user.role === 'mentor' ? '/mentor-dashboard.html' : '/mentee-dashboard.html';
    return null;
  }
  return user;
}
