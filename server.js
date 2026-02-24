/**
 * MentorBridge MVP - Express Backend
 * Fully working with AI roadmap, login, dummy data
 * Now includes OpenAI GPT-4.1 AI roadmap integration
 */

try { require('dotenv').config(); } catch (e) {}
const express = require('express');
const cors = require('cors');
const path = require('path');
const { DUMMY_MENTORS, DUMMY_MENTEES, DEFAULT_ROADMAP } = require('./data/dummyData');

const app = express();
const PORT = 3000;

// OpenAI client (optional - server works without it)
let openai = null;
try {
  const OpenAI = require('openai');
  if (process.env.OPENAI_API_KEY) {
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
} catch (e) {
  console.log('OpenAI not configured - AI roadmap will use fallback');
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// In-memory stores for demo
let users = [...DUMMY_MENTORS, ...DUMMY_MENTEES];
// e1->Sarah, e2->Elena, e3->Marcus so each mentor has 1 mentee
let assignments = { e1: 'm1', e2: 'm3', e3: 'm2' };
let roadmaps = {};      // { userId: roadmap }
let chatHistory = {};   // { 'menteeId-mentorId': [messages] }
// Feedback system: in-memory store for mentee/mentor ratings and comments
let feedbackStore = [];

// Helper functions
function getUserById(id) {
  return users.find(u => u.id === id);
}
function getOrCreateRoadmap(userId) {
  if (!roadmaps[userId]) {
    roadmaps[userId] = JSON.parse(JSON.stringify(DEFAULT_ROADMAP));
  }
  return roadmaps[userId];
}
function chatKey(id1, id2) {
  return [id1, id2].sort().join('-');
}

// -------------------- CORE API ROUTES --------------------

// Health check - verify server is running
app.get('/api/health', (req, res) => res.json({ ok: true }));

/**
 * GET /api/users - Fetch mentors or mentees
 */
app.get('/api/users', (req, res) => {
  const role = req.query.role;
  const list = role ? users.filter(u => u.role === role) : users;
  const safe = list.map(u => ({ ...u, password: undefined }));
  if (role) return res.json(safe);
  res.json({
    mentors: users.filter(u => u.role === 'mentor').map(u => ({ ...u, password: undefined })),
    mentees: users.filter(u => u.role === 'mentee').map(u => ({ ...u, password: undefined }))
  });
});

/**
 * POST /api/login - Authenticate user
 */
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email && u.password === password);
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  const { password: _, ...safeUser } = user;
  res.json({ user: safeUser });
});

/**
 * POST /api/signup - Create new user
 */
app.post('/api/signup', (req, res) => {
  const { email, password, role, name, ...rest } = req.body;
  if (!email || !password || !role) {
    return res.status(400).json({ error: 'Email, password, and role are required' });
  }
  if (users.some(u => u.email === email)) {
    return res.status(400).json({ error: 'Email already registered' });
  }
  const prefix = role === 'mentor' ? 'm' : 'e';
  const id = prefix + (users.filter(u => u.role === role).length + 4);
  const user = { id, email, password, name: name || 'User', role, ...rest };
  users.push(user);
  const { password: pwd, ...safeUser } = user;
  res.status(201).json({ user: safeUser });
});

/**
 * POST /api/assign-mentor - Assign mentor to mentee
 */
app.post('/api/assign-mentor', (req, res) => {
  const { menteeId, mentorId } = req.body;
  if (!menteeId || !mentorId) return res.status(400).json({ error: 'menteeId and mentorId required' });
  assignments[menteeId] = mentorId;
  res.json({ success: true, assignments });
});

/**
 * GET /api/assignments/:menteeId - Get assigned mentor
 */
app.get('/api/assignments/:menteeId', (req, res) => {
  const mentorId = assignments[req.params.menteeId];
  if (!mentorId) return res.json({ mentorId: null, mentor: null });
  const mentor = getUserById(mentorId);
  res.json({ mentorId, mentor: mentor ? { ...mentor, password: undefined } : null });
});

/**
 * GET /api/mentees/:mentorId - Get mentor's mentees with roadmap progress
 */
app.get('/api/mentees/:mentorId', (req, res) => {
  const mentorId = req.params.mentorId;
  const menteeIds = Object.keys(assignments).filter(mid => assignments[mid] === mentorId);
  const mentees = menteeIds.map(id => {
    const m = getUserById(id);
    if (!m) return null;
    const r = getOrCreateRoadmap(id);
    let total = 0, completed = 0;
    if (r.weeks) r.weeks.forEach(w => w.tasks.forEach(t => { total++; if (t.completed) completed++; }));
    const pct = total ? Math.round((completed / total) * 100) : 0;
    return { ...m, password: undefined, roadmapCompletion: pct + '%' };
  }).filter(Boolean);
  res.json(mentees);
});

/**
 * GET /api/roadmap/:userId - Get roadmap
 */
app.get('/api/roadmap/:userId', (req, res) => {
  res.json(getOrCreateRoadmap(req.params.userId));
});

/**
 * PUT /api/roadmap/:userId/task - Update task completion
 */
app.put('/api/roadmap/:userId/task', (req, res) => {
  const { taskId, completed } = req.body;
  const roadmap = getOrCreateRoadmap(req.params.userId);
  for (const week of roadmap.weeks) {
    const task = week.tasks.find(t => t.id === taskId);
    if (task) {
      task.completed = completed;
      return res.json(roadmap);
    }
  }
  res.status(404).json({ error: 'Task not found' });
});

/**
 * GET /api/chat - Get chat messages
 */
app.get('/api/chat', (req, res) => {
  const { userId, partnerId } = req.query;
  const key = chatKey(userId, partnerId);
  res.json(chatHistory[key] || []);
});

/**
 * POST /api/chat - Send message
 */
app.post('/api/chat', (req, res) => {
  const { senderId, receiverId, text } = req.body;
  if (!senderId || !receiverId || !text) return res.status(400).json({ error: 'senderId, receiverId, text required' });
  const key = chatKey(senderId, receiverId);
  if (!chatHistory[key]) chatHistory[key] = [];
  const msg = { id: Date.now().toString(), senderId, receiverId, text, timestamp: new Date().toISOString() };
  chatHistory[key].push(msg);
  res.status(201).json(msg);
});

/**
 * PUT /api/users/:id - Update user profile
 */
app.put('/api/users/:id', (req, res) => {
  const idx = users.findIndex(u => u.id === req.params.id);
  if (idx < 0) return res.status(404).json({ error: 'User not found' });
  const { password, ...updates } = req.body;
  users[idx] = { ...users[idx], ...updates };
  if (req.body.password) users[idx].password = req.body.password;
  const { password: p, ...safeUser } = users[idx];
  res.json(safeUser);
});

// -------------------- FEEDBACK SYSTEM --------------------
/**
 * POST /api/feedback - Submit feedback (mentee-to-mentor or mentor-to-mentee)
 * Body: { fromUserId, toUserId, type: 'mentee-to-mentor'|'mentor-to-mentee', rating (1-5), comment }
 */
app.post('/api/feedback', (req, res) => {
  const { fromUserId, toUserId, type, rating, comment } = req.body;
  if (!fromUserId || !toUserId || !type || rating == null) {
    return res.status(400).json({ error: 'fromUserId, toUserId, type, and rating are required' });
  }
  if (!['mentee-to-mentor', 'mentor-to-mentee'].includes(type)) {
    return res.status(400).json({ error: 'type must be mentee-to-mentor or mentor-to-mentee' });
  }
  const r = Math.min(5, Math.max(1, parseInt(rating) || 0));
  const entry = {
    id: 'fb_' + Date.now(),
    fromUserId,
    toUserId,
    type,
    rating: r,
    comment: (comment || '').trim(),
    trigger: req.body.trigger || null,
    createdAt: new Date().toISOString()
  };
  feedbackStore.push(entry);
  res.status(201).json(entry);
});

/**
 * GET /api/feedback/received/:userId - Get all feedback received by a user
 */
app.get('/api/feedback/received/:userId', (req, res) => {
  const list = feedbackStore.filter(f => f.toUserId === req.params.userId);
  res.json(list);
});

/**
 * GET /api/feedback/check - Check if feedback already given (query: fromUserId, toUserId, type)
 */
app.get('/api/feedback/check', (req, res) => {
  const { fromUserId, toUserId, type } = req.query;
  const exists = feedbackStore.some(f =>
    f.fromUserId === fromUserId && f.toUserId === toUserId && f.type === type
  );
  res.json({ exists });
});

// -------------------- AI ROADMAP ENDPOINT (OpenAI GPT-4.1) --------------------
app.get('/api/ai-roadmap/:userId', async (req, res) => {
  const user = users.find(u => u.id === req.params.userId);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });

  if (!openai) {
    return res.json({ success: true, roadmap: getOrCreateRoadmap(req.params.userId) });
  }

  try {
    const prompt = `
You are an expert mentorship assistant. Generate a 4-week personalized learning roadmap for the following mentee:

Mentee profile:
${JSON.stringify(user, null, 2)}

Output format (JSON only):
{
  "weeks": [
    {
      "weekId": "w1",
      "title": "Week Title",
      "tasks": [
        { "id": "w1t1", "title": "Task Title", "completed": false }
      ]
    }
  ]
}
`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4.1-mini', // GPT-4.1-mini is faster; you can use 'gpt-4.1' too
      messages: [
        { role: 'system', content: 'You are an expert mentorship assistant.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7
    });

    const aiText = response.choices[0].message.content;

    // Parse JSON from the AI response
    let roadmapJSON;
    try {
      roadmapJSON = JSON.parse(aiText);
    } catch {
      roadmapJSON = {
        weeks: [
          { weekId: 'w1', title: 'Foundation', tasks: [{ id: 'w1t1', title: 'Set up environment', completed: false }] }
        ]
      };
    }

    res.json({ success: true, roadmap: roadmapJSON });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'AI roadmap generation failed' });
  }
});

// Serve index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// -------------------- NEW FEATURE ROUTES --------------------

// Skill Gap Heatmap for a mentee
app.get('/api/skill-gap/:menteeId', (req, res) => {
  // You can replace this JSON with dynamic Cursor AI call later
  const skillGapJSON = {
    "skills": [
      { "name": "JavaScript", "menteeLevel": 3, "mentorLevel": 4, "gap": 1 },
      { "name": "React", "menteeLevel": 2, "mentorLevel": 5, "gap": 3 },
      { "name": "TypeScript", "menteeLevel": 1, "mentorLevel": 5, "gap": 4 },
      { "name": "System Design", "menteeLevel": 1, "mentorLevel": 5, "gap": 4 },
      { "name": "Career Growth", "menteeLevel": 2, "mentorLevel": 5, "gap": 3 }
    ]
  };
  res.json(skillGapJSON);
});

// Mentor feedback to mentee
app.get('/api/mentor-feedback/:menteeId', (req, res) => {
  const feedbackJSON = [
    { "weekId": "w1", "taskId": "w1t1", "message": "Skills assessment complete. Focus on bridging gaps in TypeScript and System Design." },
    { "weekId": "w1", "taskId": "w1t2", "message": "Environment setup looks good. Ensure TypeScript is configured." },
    { "weekId": "w1", "taskId": "w1t3", "message": "Fundamentals reviewed. Continue practicing problem-solving." },
    { "weekId": "w2", "taskId": "w2t1", "message": "Core concepts progressing. Apply theory in small projects." },
    { "weekId": "w2", "taskId": "w2t2", "message": "Hands-on work is strong. Increase complexity gradually." },
    { "weekId": "w2", "taskId": "w2t3", "message": "Peer study helps. Join more collaborative sessions." }
  ];
  res.json(feedbackJSON);
});

// List of mentees per mentor
app.get('/api/mentor-mentees/:mentorId', (req, res) => {
  const menteesJSON = {
    "mentorId": "m1",
    "mentorName": "Sarah Chen",
    "mentees": [
      { "id": "e1", "name": "Alex Johnson", "roadmapCompletion": "25%" }
    ]
  };
  res.json(menteesJSON);
});

//core logic of recomendations
const { recommendMentorsForMentee } = require('./mentorLogic');

// Demo route for judges
app.get('/api/demo-recommend/:menteeId', (req, res) => {
    const mentee = DUMMY_MENTEES.find(m => m.id == req.params.menteeId);
    if (!mentee) return res.status(404).send("Mentee not found");

    const recommended = recommendMentorsForMentee(mentee, DUMMY_MENTORS);
    res.json({ mentee, recommendedMentors: recommended });
});

// Start server
app.listen(PORT, () => console.log(`MentorBridge server running at http://localhost:${PORT}`));