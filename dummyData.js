/**
 * Dummy data for MentorBridge MVP demo
 * 3 mentors and 3 mentees for demonstration
 */

const DUMMY_MENTORS = [
  {
    id: 'm1',
    email: 'sarah@mentorbridge.com',
    password: 'mentor123',
    name: 'Sarah Chen',
    role: 'mentor',
    title: 'Senior Software Engineer @ Google',
    skills: ['React', 'System Design', 'Career Growth', 'TypeScript'],
    experience: 8,
    motto: 'Climb step by step—mastery comes from consistency.',
    availability: 'Tue, Thu after 6 PM',
    domains: ['Web Development', 'UI/UX Design']
  },
  {
    id: 'm2',
    email: 'marcus@mentorbridge.com',
    password: 'mentor123',
    name: 'Marcus Thorne',
    role: 'mentor',
    title: 'Product Design Lead @ Airbnb',
    skills: ['UI/UX', 'Figma', 'Design System', 'Product Management'],
    experience: 6,
    motto: 'Great design is invisible.',
    availability: 'Mondays & Weekends',
    domains: ['UI/UX Design', 'Product Management']
  },
  {
    id: 'm3',
    email: 'elena@mentorbridge.com',
    password: 'mentor123',
    name: 'Dr. Elena Rodriguez',
    role: 'mentor',
    title: 'AI Research Scientist',
    skills: ['Python', 'Machine Learning', 'Data Ethics', 'Data Science'],
    experience: 10,
    motto: 'AI with ethics builds trust.',
    availability: 'Flexible mornings',
    domains: ['Machine Learning', 'Data Science']
  }
];

const DUMMY_MENTEES = [
  {
    id: 'e1',
    email: 'alex@mentorbridge.com',
    password: 'mentee123',
    name: 'Alex Johnson',
    role: 'mentee',
    skills: ['JavaScript', 'React'],
    learningGoals: 'Become a Senior Frontend Engineer',
    preferredDomains: ['Web Development', 'TypeScript', 'Design Systems'],
    availability: 'Weekday evenings'
  },
  {
    id: 'e2',
    email: 'jordan@mentorbridge.com',
    password: 'mentee123',
    name: 'Jordan Lee',
    role: 'mentee',
    skills: ['Python', 'Basic ML'],
    learningGoals: 'Transition into ML Engineering',
    preferredDomains: ['Machine Learning', 'Data Science'],
    availability: 'Weekends'
  },
  {
    id: 'e3',
    email: 'sam@mentorbridge.com',
    password: 'mentee123',
    name: 'Sam Wilson',
    role: 'mentee',
    skills: ['Figma', 'Design Basics'],
    learningGoals: 'Become a Product Designer',
    preferredDomains: ['UI/UX Design', 'Product Management'],
    availability: 'Flexible'
  }
];

/**
 * Default 4-week roadmap template (placeholder for AI integration)
 * Each week has 3-4 tasks
 */
const DEFAULT_ROADMAP = {
  weeks: [
    {
      weekId: 'w1',
      title: 'Foundation & Assessment',
      description: 'Master environment configuration and fundamental concepts.',
      tasks: [
        { id: 'w1t1', title: 'Complete skills assessment quiz', completed: false },
        { id: 'w1t2', title: 'Set up development environment', completed: false },
        { id: 'w1t3', title: 'Review fundamentals & prerequisites', completed: false }
      ]
    },
    {
      weekId: 'w2',
      title: 'Core Concepts Deep Dive',
      description: 'Explore complex concepts and hands-on exercises.',
      tasks: [
        { id: 'w2t1', title: 'Study core theory & principles', completed: false },
        { id: 'w2t2', title: 'Complete 3 hands-on exercises', completed: false },
        { id: 'w2t3', title: 'Join peer study group session', completed: false }
      ]
    },
    {
      weekId: 'w3',
      title: 'Practical Application',
      description: 'Build real projects and get code review.',
      tasks: [
        { id: 'w3t1', title: 'Build a mini-project', completed: false },
        { id: 'w3t2', title: 'Code review with mentor', completed: false },
        { id: 'w3t3', title: 'Document learnings & patterns', completed: false }
      ]
    },
    {
      weekId: 'w4',
      title: 'Capstone & Reflection',
      description: 'Complete capstone and plan next phase.',
      tasks: [
        { id: 'w4t1', title: 'Complete capstone project', completed: false },
        { id: 'w4t2', title: 'Present to mentor for feedback', completed: false },
        { id: 'w4t3', title: 'Plan next learning phase', completed: false }
      ]
    }
  ]
};

module.exports = { DUMMY_MENTORS, DUMMY_MENTEES, DEFAULT_ROADMAP };
