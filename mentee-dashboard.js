/**
 * MentorBridge - Mentee Dashboard
 * Recommended mentors, chat, AI roadmap, skill gap, task completion
 */

const user = requireAuth('mentee');
if (!user) throw new Error('Not authenticated');

document.getElementById('userName').textContent = user.name || user.email;
document.getElementById('welcomeName').textContent = user.name || 'there';
document.getElementById('btnLogout').addEventListener('click', (e) => {
  e.preventDefault();
  clearSession();
  window.location.href = '/';
});

let roadmap = null;
let assignedMentor = null;
const ROADMAP_STORAGE_KEY = 'mb_roadmap_';

function loadRoadmapFromStorage() {
  try {
    const raw = localStorage.getItem(ROADMAP_STORAGE_KEY + user.id);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveRoadmapToStorage(r) {
  if (r) localStorage.setItem(ROADMAP_STORAGE_KEY + user.id, JSON.stringify(r));
}

// ========================
// INIT: Load Roadmap + Mentors + Assignments
// ========================
async function init() {
  try {
    const [assignRes, mentorsRes, roadmapRes] = await Promise.all([
      api.getAssignment(user.id),
      api.getUsers('mentor'),
      api.getRoadmap(user.id)
    ]);
    assignedMentor = assignRes.mentor;
    const mentors = Array.isArray(mentorsRes) ? mentorsRes : (mentorsRes.mentors || []);
    roadmap = roadmapRes;

    renderMentors(mentors);
    if (assignedMentor) {
      document.getElementById('skillGapEmpty').style.display = 'none';
      document.getElementById('skillGapBars').style.display = 'block';
      renderSkillGap(assignedMentor);
    } else {
      document.getElementById('skillGapEmpty').style.display = 'block';
      document.getElementById('skillGapBars').style.display = 'none';
    }

    // Merge stored completion with backend roadmap
    const stored = loadRoadmapFromStorage();
    if (stored && stored.weeks && roadmap.weeks) {
      stored.weeks.forEach((sw, wi) => {
        if (roadmap.weeks[wi] && sw.tasks) {
          sw.tasks.forEach((st, ti) => {
            if (roadmap.weeks[wi].tasks[ti]) {
              roadmap.weeks[wi].tasks[ti].completed = st.completed;
            }
          });
        }
      });
    }

    renderRoadmap();
    updateMetrics();
    checkAllComplete();
  } catch (err) {
    console.error(err);
    roadmap = {
      weeks: [{
        weekId: 'w1',
        title: 'Foundation',
        description: 'Get started',
        tasks: [
          { id: 'w1t1', title: 'Set up environment', completed: false },
          { id: 'w1t2', title: 'Complete skills assessment', completed: false }
        ]
      }]
    };
    renderMentors([]);
    renderRoadmap();
  }
}

// ========================
// Metrics
// ========================
function updateMetrics() {
  const hours = parseInt(localStorage.getItem(`mentee_${user.id}_hours`) || '0');
  let total = 0, completed = 0;
  if (roadmap && roadmap.weeks) {
    roadmap.weeks.forEach(w => w.tasks.forEach(t => { total++; if(t.completed) completed++; }));
  }
  const pct = total ? Math.round((completed / total) * 100) : 0;
  const sessions = parseInt(localStorage.getItem(`mentee_${user.id}_sessions`) || '0');

  document.getElementById('metricHours').textContent = hours || '0';
  document.getElementById('metricRoadmap').textContent = pct + '%';
  document.getElementById('metricSessions').textContent = String(sessions).padStart(2, '0');
}

// ========================
// Render Roadmap
// ========================
function renderRoadmap() {
  const container = document.getElementById('roadmapContainer');
  if (!roadmap || !roadmap.weeks) {
    container.innerHTML = '<p class="empty-state">Loading roadmap...</p>';
    return;
  }

  let html = '';
  roadmap.weeks.forEach((week, wi) => {
    const completedCount = week.tasks.filter(t => t.completed).length;
    const totalTasks = week.tasks.length;
    let status = 'upcoming';
    if (completedCount === totalTasks) status = 'completed';
    else if (completedCount > 0 || wi === 0) status = 'in-progress';

    html += `
      <div class="roadmap-week" data-week="${week.weekId}">
        <div class="roadmap-week-header">
          <div>
            <h4>WEEK ${wi + 1} - ${week.title}</h4>
          </div>
          <span class="status-badge status-${status}">${status === 'completed' ? '✓ Completed' : status === 'in-progress' ? '⟳ In Progress' : '○ Upcoming'}</span>
        </div>
        <div class="roadmap-week-tasks">
          ${week.tasks.map(t => `
            <div class="roadmap-task ${t.completed ? 'completed' : ''}" data-task-id="${t.id}">
              <input type="checkbox" ${t.completed ? 'checked' : ''}>
              <span class="task-title">${t.title}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  });
  container.innerHTML = html;

  // Expand/collapse
  container.querySelectorAll('.roadmap-week-header').forEach(h => {
    h.addEventListener('click', () => h.closest('.roadmap-week').classList.toggle('expanded'));
  });
  const first = container.querySelector('.roadmap-week');
  if (first) first.classList.add('expanded');

  // Task checkbox handlers
  container.querySelectorAll('.roadmap-task input[type="checkbox"]').forEach(cb => {
    cb.addEventListener('change', async () => {
      const taskId = cb.closest('.roadmap-task').dataset.taskId;
      const completed = cb.checked;
      cb.closest('.roadmap-task').classList.toggle('completed', completed);
      try {
        roadmap = await api.updateTask(user.id, taskId, completed);
        saveRoadmapToStorage(roadmap);
        updateMetrics();
        checkAllComplete();
      } catch {
        cb.checked = !completed;
        cb.closest('.roadmap-task').classList.toggle('completed', false);
      }
    });
  });
}

// ========================
// Completion Toast
// ========================
function checkAllComplete() {
  if (!roadmap || !roadmap.weeks) return;
  const allDone = roadmap.weeks.every(w => w.tasks.every(t => t.completed));
  if (allDone) {
    const toast = document.getElementById('completionToast');
    toast.textContent = '🎉 All tasks completed! Great job!';
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 4000);
    if (assignedMentor && typeof showFeedbackModal === 'function') {
      showFeedbackModal({ fromUserId: user.id, toUserId: assignedMentor.id, type: 'mentee-to-mentor', partnerName: assignedMentor.name, trigger: 'roadmap-complete' });
    }
  }
}

// ========================
// Mentors & Skill Gap
// ========================
function renderMentors(mentors) {
  const grid = document.getElementById('mentorGrid');
  const list = mentors || [];
  if (list.length === 0) {
    grid.innerHTML = '<p class="empty-state">No mentors available. Contact support.</p>';
    return;
  }
  grid.innerHTML = list.map(m => `
    <div class="mentor-card" data-mentor-id="${m.id}">
      <h4>${m.name}</h4>
      <p class="title">${m.title || ''}</p>
      <div class="tags">${(m.skills || []).slice(0,3).map(s=>`<span class="tag teal">${s}</span>`).join('')}</div>
      <p class="availability">🗓️ ${m.availability || 'Flexible'}</p>
      <div class="actions">
        <button class="btn btn-primary btn-sm msg-btn" data-id="${m.id}" data-name="${m.name}">Message</button>
        <button class="btn btn-secondary btn-sm select-btn" data-id="${m.id}">Select Mentor</button>
      </div>
    </div>
  `).join('');

  grid.querySelectorAll('.msg-btn').forEach(btn => {
    btn.addEventListener('click', () => openChat(btn.dataset.id, btn.dataset.name));
  });
  grid.querySelectorAll('.select-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      try {
        await api.assignMentor(user.id, btn.dataset.id);
        assignedMentor = list.find(m => m.id === btn.dataset.id);
        document.getElementById('skillGapEmpty').style.display = 'none';
        document.getElementById('skillGapBars').style.display = 'block';
        renderSkillGap(assignedMentor);
        alert('Mentor assigned! They will now see you in their dashboard.');
        if (typeof showFeedbackModal === 'function') {
          showFeedbackModal({ fromUserId: user.id, toUserId: btn.dataset.id, type: 'mentee-to-mentor', partnerName: btn.dataset.name, trigger: 'match' });
        }
      } catch { alert('Failed to assign'); }
    });
  });
}

function renderSkillGap(mentor) {
  const bars = document.getElementById('skillGapBars');
  if (!mentor) { bars.innerHTML = ''; return; }
  const menteeSkills = user.skills || [];
  const mentorSkills = mentor.skills || [];
  const allSkills = [...new Set([...menteeSkills, ...mentorSkills])];

  bars.innerHTML = allSkills.map(skill => {
    const menteePct = menteeSkills.includes(skill) ? 50 : 0;
    const mentorPct = mentorSkills.includes(skill) ? 100 : 0;
    return `
      <div class="skill-bar-row">
        <span class="skill-name">${skill}</span>
        <div class="bar-wrap" style="flex:1; display:flex; gap:4px; height:20px; background:var(--gray-200); border-radius:999px; overflow:hidden;">
          <div class="bar-fill" style="width:${menteePct}%; min-width:0" title="Your level"></div>
          <div class="bar-fill mentor" style="width:${mentorPct}%; min-width:0" title="Mentor expertise"></div>
        </div>
      </div>
    `;
  }).join('');
}

// ========================
// Chat Functions
// ========================
function openChat(partnerId, partnerName) {
  document.getElementById('chatPartnerId').value = partnerId;
  document.getElementById('chatPartnerName').textContent = 'Chat with ' + partnerName;
  document.getElementById('chatPanel').classList.remove('hidden');
  loadChat(partnerId);
}

document.getElementById('chatClose').addEventListener('click', () => {
  document.getElementById('chatPanel').classList.add('hidden');
});

async function loadChat(partnerId) {
  const msgs = document.getElementById('chatMessages');
  try {
    let messages = await api.getChat(user.id, partnerId);
    if (typeof getStoredChat !== 'undefined') {
      const stored = getStoredChat(user.id, partnerId);
      if (stored.length > 0 && messages.length === 0) messages = stored;
    }
    msgs.innerHTML = messages.map(m => {
      const sent = m.senderId === user.id;
      const time = new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return `<div class="chat-msg ${sent ? 'sent' : 'received'}"><div>${m.text}</div><div class="time">${time}</div></div>`;
    }).join('');
    msgs.scrollTop = msgs.scrollHeight;
  } catch {
    msgs.innerHTML = '<p style="color: var(--gray-600);">No messages yet.</p>';
  }
}

document.getElementById('chatForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const partnerId = document.getElementById('chatPartnerId').value;
  const input = document.getElementById('chatInput');
  const text = input.value.trim();
  if (!text) return;
  try {
    if (typeof storeChatMessage !== 'undefined') {
      storeChatMessage(user.id, partnerId, { id: Date.now(), senderId: user.id, receiverId: partnerId, text, timestamp: new Date().toISOString() });
    }
    await api.sendChat(user.id, partnerId, text);
    input.value = '';
    loadChat(partnerId);
  } catch (err) {
    alert('Failed to send message');
  }
});

// ========================
// Demo Session Button
// ========================
document.getElementById('btnScheduleSync').addEventListener('click', () => {
  const sessions = parseInt(localStorage.getItem(`mentee_${user.id}_sessions`)||'0') + 1;
  localStorage.setItem(`mentee_${user.id}_sessions`, sessions);
  updateMetrics();
  alert('Session scheduled! (Demo)');
});

//core logic for recomendation


init();