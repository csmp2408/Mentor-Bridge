/**
 * MentorBridge MVP - API client
 * Backend must run on port 3000: npm start
 */

// Use same origin when page is served by Express; otherwise localhost:3000
const API_BASE = (typeof window !== 'undefined' && window.location.port === '3000')
  ? '/api'
  : 'http://localhost:3000/api';

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  let res;
  try {
    res = await fetch(url, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...options.headers },
      mode: 'cors'
    });
  } catch (err) {
    throw new Error('Cannot connect to server. Make sure to run: npm start (then open http://localhost:3000)');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || data.message || 'Request failed');
  return data;
}

const api = {
  getUsers: (role) => request(`/users${role ? '?role=' + role : ''}`),
  login: (email, password) => request('/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  }),
  signup: (data) => request('/signup', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  assignMentor: (menteeId, mentorId) => request('/assign-mentor', {
    method: 'POST',
    body: JSON.stringify({ menteeId, mentorId })
  }),
  getAssignment: (menteeId) => request(`/assignments/${menteeId}`),
  getMentees: (mentorId) => request(`/mentees/${mentorId}`),
  getRoadmap: (userId) => request(`/roadmap/${userId}`),
  updateTask: (userId, taskId, completed) => request(`/roadmap/${userId}/task`, {
    method: 'PUT',
    body: JSON.stringify({ taskId, completed })
  }),
  getChat: (userId, partnerId) => request(`/chat?userId=${userId}&partnerId=${partnerId}`),
  sendChat: (senderId, receiverId, text) => request('/chat', {
    method: 'POST',
    body: JSON.stringify({ senderId, receiverId, text })
  }),
  updateUser: (id, data) => request(`/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  // ✅ New function for AI-generated roadmap
  getAIRoadmap: (userId) => request(`/ai-roadmap/${userId}`),
  // Feedback system
  submitFeedback: (fromUserId, toUserId, type, rating, comment, trigger) => request('/feedback', {
    method: 'POST',
    body: JSON.stringify({ fromUserId, toUserId, type, rating, comment, trigger })
  }),
  getFeedbackReceived: (userId) => request(`/feedback/received/${userId}`),
  checkFeedbackGiven: (fromUserId, toUserId, type) => request(`/feedback/check?fromUserId=${fromUserId}&toUserId=${toUserId}&type=${type}`)
};