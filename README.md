# MentorBridge MVP

A fully functional Mentor-Mentee web application for connecting mentors with mentees, featuring AI-generated roadmaps, chat, skill gap analysis, and progress tracking.

## Quick Start

```bash
# Install dependencies
npm install

# Start the server
npm start
```

**IMPORTANT:** Open **http://localhost:3000** in your browser. Do NOT open the HTML file directly (file://) - login/signup will fail. The app must be accessed through the server URL.

## Demo Credentials

### Mentees
| Email | Password |
|-------|----------|
| alex@mentorbridge.com | mentee123 |
| jordan@mentorbridge.com | mentee123 |
| sam@mentorbridge.com | mentee123 |

### Mentors
| Email | Password |
|-------|----------|
| sarah@mentorbridge.com | mentor123 |
| marcus@mentorbridge.com | mentor123 |
| elena@mentorbridge.com | mentor123 |

## Demo Workflow for Judges

1. **Landing Page** → Click "Get Started" or "Login"
2. **Sign Up / Login** → Use demo credentials above
3. **Profile** (new signups) → Complete skills, goals, availability
4. **Mentee Flow:**
   - See recommended mentors → Click "Select Mentor" to assign
   - Click "Message" to open chat
   - Expand roadmap weeks → Mark tasks complete
   - View Skill Gap Analysis (after selecting a mentor)
   - Completion toast when all tasks done
5. **Mentor Flow:**
   - See assigned mentees (pre-seeded)
   - Click "Message" to chat
   - Click "View Roadmap" to see mentee progress
   - Completion notification when mentee finishes all tasks

## Project Structure

```
├── server.js              # Express backend
├── data/
│   └── dummyData.js       # 3 mentors, 3 mentees, default roadmap
├── public/
│   ├── index.html         # Landing + Login/Signup
│   ├── profile.html       # Profile form (mentor/mentee)
│   ├── mentee-dashboard.html
│   ├── mentor-dashboard.html
│   ├── css/style.css      # Global styles
│   └── js/
│       ├── api.js         # Fetch API client
│       ├── auth.js        # Session (localStorage)
│       ├── chat-storage.js# Chat localStorage fallback
│       ├── mentee-dashboard.js
│       └── mentor-dashboard.js
└── README.md
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/users | Fetch mentors/mentees |
| POST | /api/login | Login |
| POST | /api/signup | Sign up |
| POST | /api/assign-mentor | Assign mentor to mentee |
| GET | /api/assignments/:menteeId | Get assignment |
| GET | /api/mentees/:mentorId | Get mentor's mentees |
| GET | /api/roadmap/:userId | Get roadmap |
| PUT | /api/roadmap/:userId/task | Update task completion |
| GET | /api/chat | Get messages |
| POST | /api/chat | Send message |
| PUT | /api/users/:id | Update profile |

## Tech Stack

- **Frontend:** HTML, CSS, Vanilla JavaScript
- **Backend:** Node.js, Express
- **Storage:** In-memory (backend) + localStorage (session, chat, roadmap)

## License

MIT
