/**
 * MentorBridge - Mentor Dashboard
 * Assigned mentees, chat, roadmap progress, completion notifications
 */

const user = requireAuth('mentor');
if (!user) throw new Error('Not authenticated');

document.getElementById('userName').textContent = user.name || user.email;
document.getElementById('welcomeName').textContent = user.name || 'User';
document.getElementById('btnLogout').addEventListener('click', (e) => {
  e.preventDefault();
  clearSession();
  window.location.href = '/';
});

// Profile metrics
document.getElementById('metricSkills').textContent = (user.skills || []).length || '0';
document.getElementById('metricDomains').textContent = (user.domains || []).length || '0';
document.getElementById('metricAvailability').textContent = (user.availability || '-').substring(0, 10);

let mentees = [];
let selectedMenteeId = null;

async function init() {
  try {
    mentees = await api.getMentees(user.id);
    renderMentees();

    // Roadmap template (same structure as mentee roadmap)
    const template = await api.getRoadmap('e1'); // Use default structure
    renderRoadmapTemplate(template);
  } catch (err) {
    console.error(err);
    renderMentees();
  }
}

function renderMentees() {
  const empty = document.getElementById('menteesEmpty');
  const list = document.getElementById('menteesList');
  if (!mentees || mentees.length === 0) {
    empty.style.display = 'block';
    list.style.display = 'none';
    return;
  }
  empty.style.display = 'none';
  list.style.display = 'grid';
  list.innerHTML = mentees.map(m => `
    <div class="mentor-card" data-mentee-id="${m.id}">
      <h4>${m.name}</h4>
      <p class="title">${m.learningGoals || 'Mentee'}</p>
      <div class="tags">
        ${(m.skills || []).slice(0, 3).map(s => `<span class="tag teal">${s}</span>`).join('')}
      </div>
      <p class="availability">📊 Roadmap: <strong>${m.roadmapCompletion || '0%'}</strong></p>
      <div class="actions">
        <button class="btn btn-primary btn-sm msg-btn" data-id="${m.id}" data-name="${m.name}">Message</button>
        <button class="btn btn-secondary btn-sm view-roadmap-btn" data-id="${m.id}" data-name="${m.name}">View Roadmap</button>
      </div>
    </div>
  `);

  list.querySelectorAll('.msg-btn').forEach(btn => {
    btn.addEventListener('click', () => openChat(btn.dataset.id, btn.dataset.name));
  });
  list.querySelectorAll('.view-roadmap-btn').forEach(btn => {
    btn.addEventListener('click', () => viewMenteeRoadmap(btn.dataset.id, btn.dataset.name));
  });
}

function renderRoadmapTemplate(roadmap) {
  const container = document.getElementById('roadmapTemplate');
  if (!roadmap || !roadmap.weeks) return;
  container.innerHTML = roadmap.weeks.map((week, wi) => {
    const completedCount = week.tasks.filter(t => t.completed).length;
    const total = week.tasks.length;
    const status = completedCount === total ? 'completed' : completedCount > 0 ? 'in-progress' : 'upcoming';
    return `
      <div class="roadmap-week expanded">
        <div class="roadmap-week-header">
          <h4>WEEK ${wi + 1} - ${week.title}</h4>
          <span class="status-badge status-${status}">${status === 'completed' ? '✓ Completed' : status === 'in-progress' ? '⟳ In Progress' : '○ Upcoming'}</span>
        </div>
        <div class="roadmap-week-tasks">
          ${week.tasks.map(t => `
            <div class="roadmap-task ${t.completed ? 'completed' : ''}">
              <input type="checkbox" disabled ${t.completed ? 'checked' : ''}>
              <span class="task-title">${t.title}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }).join('');
}

async function viewMenteeRoadmap(menteeId, menteeName) {
  selectedMenteeId = menteeId;
  document.getElementById('selectedMenteeName').textContent = menteeName;
  document.getElementById('menteeRoadmapCard').style.display = 'block';
  try {
    const roadmap = await api.getRoadmap(menteeId);
    renderMenteeRoadmap(roadmap);
    // Check if all tasks complete -> show notification
    const allDone = roadmap.weeks && roadmap.weeks.every(w => w.tasks.every(t => t.completed));
    if (allDone) {
      const toast = document.getElementById('completionToast');
      toast.textContent = `🎉 ${menteeName} completed all roadmap tasks!`;
      toast.classList.add('show');
      setTimeout(() => toast.classList.remove('show'), 4000);
      if (typeof showFeedbackModal === 'function') {
        showFeedbackModal({ fromUserId: user.id, toUserId: menteeId, type: 'mentor-to-mentee', partnerName: menteeName, trigger: 'roadmap-complete' });
      }
    }
  } catch (err) {
    document.getElementById('menteeRoadmapContainer').innerHTML = '<p class="empty-state">Could not load roadmap.</p>';
  }
}

function renderMenteeRoadmap(roadmap) {
  const container = document.getElementById('menteeRoadmapContainer');
  if (!roadmap || !roadmap.weeks) {
    container.innerHTML = '<p class="empty-state">No roadmap data.</p>';
    return;
  }
  container.innerHTML = roadmap.weeks.map((week, wi) => {
    const completedCount = week.tasks.filter(t => t.completed).length;
    const total = week.tasks.length;
    const status = completedCount === total ? 'completed' : completedCount > 0 ? 'in-progress' : 'upcoming';
    return `
      <div class="roadmap-week expanded">
        <div class="roadmap-week-header">
          <div>
            <h4>WEEK ${wi + 1} - ${week.title}</h4>
            <p style="font-size: 0.85rem; color: var(--gray-600); margin-top: 0.25rem;">${week.description}</p>
          </div>
          <span class="status-badge status-${status}">${completedCount}/${total} tasks</span>
        </div>
        <div class="roadmap-week-tasks">
          ${week.tasks.map(t => `
            <div class="roadmap-task ${t.completed ? 'completed' : ''}">
              <input type="checkbox" disabled ${t.completed ? 'checked' : ''}>
              <span class="task-title">${t.title}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }).join('');
}

function openChat(partnerId, partnerName) {
  const panel = document.getElementById('chatPanel');
  document.getElementById('chatPartnerId').value = partnerId;
  document.getElementById('chatPartnerName').textContent = 'Chat with ' + partnerName;
  panel.classList.remove('hidden');
  loadChat(partnerId);
}

function closeChat() {
  document.getElementById('chatPanel').classList.add('hidden');
}

document.getElementById('chatClose').addEventListener('click', closeChat);

document.getElementById('btnRefreshMentees').addEventListener('click', async () => {
  try {
    mentees = await api.getMentees(user.id);
    renderMentees();
  } catch (err) {
    console.error(err);
  }
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
    const msg = { id: Date.now(), senderId: user.id, receiverId: partnerId, text, timestamp: new Date().toISOString() };
    if (typeof storeChatMessage !== 'undefined') storeChatMessage(user.id, partnerId, msg);
    await api.sendChat(user.id, partnerId, text);
    input.value = '';
    loadChat(partnerId);
  } catch (err) {
    alert('Failed to send message');
  }
});

init();
