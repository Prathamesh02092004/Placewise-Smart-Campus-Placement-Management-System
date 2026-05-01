// ─────────────────────────────────────────────────────────────────────────────
// PlaceWise Mock Data  — single source of truth for the mock API
// All mutable state lives in api.js; this file only exports read-only seeds.
// ─────────────────────────────────────────────────────────────────────────────

// ─── Seed users ───────────────────────────────────────────────────────────────
export const MOCK_USERS = {
  student: {
    id: 'stu-001', profileId: 'sp-001',
    name: 'Prathamesh Mahadik',
    email: 'prathamesh@college.edu',
    role: 'student',
    branch: 'Electronics and Telecommunication',
    cgpa: 8.4, backlogs: 0,
    resume_url: '/uploads/resume-prathamesh.pdf',
    skills: [
      { skill_name: 'Python',           proficiency_signal: 85 },
      { skill_name: 'React.js',         proficiency_signal: 75 },
      { skill_name: 'Node.js',          proficiency_signal: 70 },
      { skill_name: 'SQL',              proficiency_signal: 65 },
      { skill_name: 'Machine Learning', proficiency_signal: 60 },
      { skill_name: 'Git',              proficiency_signal: 80 },
      { skill_name: 'Docker',           proficiency_signal: 55 },
    ],
    is_verified: true,
    is_active: true,
    email_verified: true,
  },
  recruiter: {
    id: 'rec-001', profileId: 'rp-001',
    name: 'Anika Sharma',
    email: 'anika.hr@google.com',
    role: 'recruiter',
    company_name: 'Google India',
    approved: true,
    is_active: true,
  },
  recruiter2: {
    id: 'rec-002', profileId: 'rp-002',
    name: 'Rahul Mehta',
    email: 'rahul@microsoft.com',
    role: 'recruiter',
    company_name: 'Microsoft India',
    approved: true,
    is_active: true,
  },
  placement: {
    id: 'tpo-001', profileId: 'po-001',
    name: 'Prof. Snehal Lopes',
    email: 'tpo@college.edu',
    role: 'placement',
    is_active: true,
  },
  admin: {
    id: 'adm-001', profileId: null,
    name: 'System Admin',
    email: 'admin@college.edu',
    role: 'admin',
    is_active: true,
  },
}

// ─── Seed student profiles ────────────────────────────────────────────────────
export const MOCK_STUDENT_PROFILES = {
  'sp-001': {
    id: 'sp-001', user_id: 'stu-001',
    name: 'Prathamesh Mahadik',
    branch: 'Electronics and Telecommunication',
    cgpa: 8.4, backlogs: 0, year_of_study: 3,
    skills: [
      { skill_name: 'Python',           proficiency_signal: 85 },
      { skill_name: 'React.js',         proficiency_signal: 75 },
      { skill_name: 'Node.js',          proficiency_signal: 70 },
      { skill_name: 'SQL',              proficiency_signal: 65 },
      { skill_name: 'Machine Learning', proficiency_signal: 60 },
      { skill_name: 'Git',              proficiency_signal: 80 },
      { skill_name: 'Docker',           proficiency_signal: 55 },
    ],
    resume_url: '/uploads/resume-prathamesh.pdf',
    is_verified: true,
    internships: [
      { company: 'TechStartup Pvt Ltd', role: 'Backend Intern', duration: 'Jun–Aug 2024' },
    ],
    projects: [
      { name: 'PlaceWise',  description: 'Smart campus placement system with AI features' },
      { name: 'MediTrack',  description: 'Healthcare appointment management system' },
    ],
    certifications: [
      { name: 'AWS Cloud Practitioner' },
      { name: 'Google Data Analytics Certificate' },
    ],
    user: { email: 'prathamesh@college.edu' },
  },
}

// ─── Seed recruiter profiles ──────────────────────────────────────────────────
export const MOCK_RECRUITER_PROFILES = {
  'rp-001': {
    id: 'rp-001', user_id: 'rec-001',
    name: 'Anika Sharma', company_name: 'Google India',
    designation: 'HR Manager', approved: true,
    user: { email: 'anika.hr@google.com' },
  },
  'rp-002': {
    id: 'rp-002', user_id: 'rec-002',
    name: 'Rahul Mehta', company_name: 'Microsoft India',
    designation: 'Talent Recruiter', approved: true,
    user: { email: 'rahul@microsoft.com' },
  },
}

// ─── Seed jobs ────────────────────────────────────────────────────────────────
export const MOCK_JOBS = [
  {
    id: 'job-001', recruiter_id: 'rp-001', status: 'active',
    title: 'Software Engineer – Backend', role_category: 'software_engineer',
    description: 'Work on scalable backend systems serving billions of users.\n\nResponsibilities:\n- Design and build backend services in Python/Go/Java\n- Own the full development lifecycle\n- Collaborate with cross-functional teams\n- Write clean, testable, well-documented code',
    required_skills: ['Python', 'System Design', 'Data Structures & Algorithms', 'SQL', 'REST API', 'Git'],
    eligible_branches: ['Computer Engineering', 'Information Technology', 'Electronics and Telecommunication'],
    min_cgpa: 7.5, package_lpa: 18, slots: 5,
    deadline: '2026-06-30', location: 'Bangalore',
    recruiter: { company_name: 'Google India', industry: 'Technology' },
  },
  {
    id: 'job-002', recruiter_id: 'rp-001', status: 'active',
    title: 'ML Engineer', role_category: 'ml_engineer',
    description: 'Build machine learning models for Google Search and Ads.\n\nResponsibilities:\n- Train and deploy large-scale ML models\n- Build feature pipelines using TensorFlow\n- A/B test model improvements',
    required_skills: ['Python', 'Machine Learning', 'TensorFlow', 'SQL', 'Statistics'],
    eligible_branches: ['Computer Engineering', 'Information Technology', 'Electronics and Telecommunication'],
    min_cgpa: 8.0, package_lpa: 22, slots: 3,
    deadline: '2026-07-15', location: 'Hyderabad',
    recruiter: { company_name: 'Google India', industry: 'Technology' },
  },
  {
    id: 'job-003', recruiter_id: 'rp-002', status: 'active',
    title: 'Product Manager – Azure', role_category: 'product_manager',
    description: 'Drive product strategy and execution for Azure cloud services.\n\nResponsibilities:\n- Define product vision and roadmap\n- Work closely with engineering and design teams\n- Analyse customer feedback and market trends',
    required_skills: ['Product Strategy', 'Data Analysis', 'SQL', 'Communication', 'Agile'],
    eligible_branches: ['Computer Engineering', 'Information Technology', 'Mechanical Engineering'],
    min_cgpa: 7.0, package_lpa: 24, slots: 2,
    deadline: '2026-07-01', location: 'Hyderabad',
    recruiter: { company_name: 'Microsoft India', industry: 'Technology' },
  },
  {
    id: 'job-004', recruiter_id: 'rp-002', status: 'active',
    title: 'DevOps Engineer', role_category: 'devops_engineer',
    description: 'Build and maintain CI/CD pipelines and cloud infrastructure.\n\nResponsibilities:\n- Manage Azure Kubernetes clusters\n- Automate infrastructure with Terraform\n- Monitor and improve system reliability',
    required_skills: ['Docker', 'Kubernetes', 'Azure', 'Jenkins', 'Linux', 'Terraform'],
    eligible_branches: ['Computer Engineering', 'Information Technology'],
    min_cgpa: 7.0, package_lpa: 16, slots: 4,
    deadline: '2026-06-20', location: 'Bangalore',
    recruiter: { company_name: 'Microsoft India', industry: 'Technology' },
  },
  {
    id: 'job-005', recruiter_id: 'rp-001', status: 'active',
    title: 'Data Analyst', role_category: 'data_scientist',
    description: 'Analyse large datasets to drive business decisions for Google Ads.\n\nResponsibilities:\n- Build dashboards using Looker and Tableau\n- Write complex SQL queries for business insights\n- Collaborate with product managers on metrics',
    required_skills: ['Python', 'SQL', 'Tableau', 'Statistics', 'Excel'],
    eligible_branches: ['Computer Engineering', 'Information Technology', 'Electronics and Telecommunication'],
    min_cgpa: 6.5, package_lpa: 14, slots: 6,
    deadline: '2026-05-31', location: 'Mumbai',
    recruiter: { company_name: 'Google India', industry: 'Technology' },
  },
]

// ─── Seed applications (student view) ────────────────────────────────────────
export const MOCK_APPLICATIONS = [
  {
    id: 'app-001', job_id: 'job-001', student_id: 'sp-001',
    status: 'shortlisted', ai_score: 82,
    applied_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    job: {
      id: 'job-001', title: 'Software Engineer – Backend',
      recruiter: { company_name: 'Google India' },
      package_lpa: 18,
    },
    interview: null,
  },
  {
    id: 'app-002', job_id: 'job-005', student_id: 'sp-001',
    status: 'interview_scheduled', ai_score: 74,
    applied_at: new Date(Date.now() - 86400000 * 7).toISOString(),
    job: {
      id: 'job-005', title: 'Data Analyst',
      recruiter: { company_name: 'Google India' },
      package_lpa: 14,
    },
    interview: {
      id: 'iv-001',
      scheduled_at: new Date(Date.now() + 86400000 * 2).toISOString(),
      mode: 'online', video_link: 'https://meet.google.com/abc-defg-hij',
      duration_minutes: 60, result: 'pending',
    },
  },
  {
    id: 'app-003', job_id: 'job-002', student_id: 'sp-001',
    status: 'applied', ai_score: 68,
    applied_at: new Date(Date.now() - 86400000).toISOString(),
    job: {
      id: 'job-002', title: 'ML Engineer',
      recruiter: { company_name: 'Google India' },
      package_lpa: 22,
    },
    interview: null,
  },
]

// ─── Seed applicants (recruiter candidate view) ───────────────────────────────
export const MOCK_APPLICANTS = [
  {
    id: 'app-r01', job_id: 'job-001', student_id: 'sp-001',
    status: 'shortlisted', ai_score: 82,
    applied_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    student: {
      id: 'sp-001', name: 'Prathamesh Mahadik',
      branch: 'Electronics and Telecommunication', cgpa: 8.4, year_of_study: 3,
      skills: [
        { skill_name: 'Python' }, { skill_name: 'React.js' },
        { skill_name: 'Docker' }, { skill_name: 'SQL' },
        { skill_name: 'Git' },   { skill_name: 'Machine Learning' },
      ],
      resume_url: '/uploads/resume-prathamesh.pdf',
      internships: [{ company: 'TechStartup', role: 'Backend Intern', duration: 'Jun–Aug 2024' }],
      projects:    [{ name: 'PlaceWise', description: 'Smart campus placement system' }],
      certifications: [{ name: 'AWS Cloud Practitioner' }],
      user: { email: 'prathamesh@college.edu' },
    },
    interview: null,
  },
  {
    id: 'app-r02', job_id: 'job-001', student_id: 'sp-002',
    status: 'applied', ai_score: 76,
    applied_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    student: {
      id: 'sp-002', name: 'Akhilesh Badiger',
      branch: 'Computer Engineering', cgpa: 7.9, year_of_study: 4,
      skills: [{ skill_name: 'Python' }, { skill_name: 'Machine Learning' }, { skill_name: 'SQL' }],
      resume_url: '/uploads/resume-akhilesh.pdf',
      internships: [], projects: [], certifications: [],
      user: { email: 'akhilesh@college.edu' },
    },
    interview: null,
  },
  {
    id: 'app-r03', job_id: 'job-001', student_id: 'sp-003',
    status: 'under_review', ai_score: 71,
    applied_at: new Date(Date.now() - 86400000 * 4).toISOString(),
    student: {
      id: 'sp-003', name: 'Kunal Jadhav',
      branch: 'Information Technology', cgpa: 7.5, year_of_study: 4,
      skills: [{ skill_name: 'JavaScript' }, { skill_name: 'React.js' }, { skill_name: 'Node.js' }],
      resume_url: '/uploads/resume-kunal.pdf',
      internships: [], projects: [], certifications: [],
      user: { email: 'kunal@college.edu' },
    },
    interview: null,
  },
  {
    id: 'app-r04', job_id: 'job-001', student_id: 'sp-004',
    status: 'rejected', ai_score: 45,
    applied_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    student: {
      id: 'sp-004', name: 'Sahil Khanvilkar',
      branch: 'Electronics and Telecommunication', cgpa: 6.8, year_of_study: 3,
      skills: [{ skill_name: 'HTML' }, { skill_name: 'CSS' }],
      resume_url: null,
      internships: [], projects: [], certifications: [],
      user: { email: 'sahil@college.edu' },
    },
    interview: null,
  },
  {
    id: 'app-r05', job_id: 'job-001', student_id: 'sp-005',
    status: 'interview_scheduled', ai_score: 89,
    applied_at: new Date(Date.now() - 86400000 * 6).toISOString(),
    student: {
      id: 'sp-005', name: 'Riya Patil',
      branch: 'Computer Engineering', cgpa: 9.1, year_of_study: 4,
      skills: [
        { skill_name: 'Python' }, { skill_name: 'System Design' },
        { skill_name: 'SQL' },    { skill_name: 'Docker' },
        { skill_name: 'Kubernetes' },
      ],
      resume_url: '/uploads/resume-riya.pdf',
      internships: [{ company: 'Infosys', role: 'Software Intern', duration: 'May–Jul 2024' }],
      projects:    [{ name: 'CloudSync', description: 'Multi-cloud file synchronization tool' }],
      certifications: [{ name: 'CKA – Certified Kubernetes Administrator' }],
      user: { email: 'riya@college.edu' },
    },
    interview: {
      id: 'iv-r01',
      scheduled_at: new Date(Date.now() + 86400000).toISOString(),
      mode: 'online', video_link: 'https://meet.google.com/xyz-1234',
      duration_minutes: 60, result: 'pending',
    },
  },
]

// ─── Seed skill gap reports ───────────────────────────────────────────────────
export const MOCK_SKILL_GAP = {
  'job-001': {
    severity: 'moderate', overall_match: 82,
    missing_skills: [
      { skill_name: 'System Design',               tag: 'CRITICAL',     demand_score: 91, demand_trend: 'rising',  composite_score: 86.45, learning_urls: [{ platform: 'Educative', title: 'Grokking System Design', url: 'https://www.educative.io/courses/grokking-the-system-design-interview', is_free: false }] },
      { skill_name: 'Data Structures & Algorithms', tag: 'CRITICAL',    demand_score: 95, demand_trend: 'stable',  composite_score: 90.25, learning_urls: [{ platform: 'LeetCode', title: 'LeetCode Top 150', url: 'https://leetcode.com/studyplan/top-interview-150/', is_free: true }] },
      { skill_name: 'Kubernetes',                  tag: 'NICE_TO_HAVE', demand_score: 72, demand_trend: 'rising',  composite_score: 28.80, learning_urls: [{ platform: 'Kubernetes Docs', title: 'Kubernetes Basics', url: 'https://kubernetes.io/docs/tutorials/kubernetes-basics/', is_free: true }] },
    ],
    weak_skills: [
      { skill_name: 'SQL',      student_score: 65, required_score: 80, gap_delta: 15 },
      { skill_name: 'REST API', student_score: 60, required_score: 80, gap_delta: 20 },
    ],
    extra_skills: ['React.js', 'Node.js', 'Docker'],
    market_demand: [
      { skill_name: 'Python',                      demand_score: 95, demand_trend: 'rising',  in_student_profile: true  },
      { skill_name: 'System Design',               demand_score: 91, demand_trend: 'rising',  in_student_profile: false },
      { skill_name: 'Data Structures & Algorithms',demand_score: 95, demand_trend: 'stable',  in_student_profile: false },
      { skill_name: 'SQL',                         demand_score: 88, demand_trend: 'stable',  in_student_profile: true  },
      { skill_name: 'Docker',                      demand_score: 80, demand_trend: 'rising',  in_student_profile: true  },
      { skill_name: 'Kubernetes',                  demand_score: 72, demand_trend: 'rising',  in_student_profile: false },
      { skill_name: 'React.js',                    demand_score: 85, demand_trend: 'stable',  in_student_profile: true  },
      { skill_name: 'TypeScript',                  demand_score: 78, demand_trend: 'rising',  in_student_profile: false },
    ],
    learning_path: [
      { order: 1, skill_name: 'System Design',               priority: 'urgent', platform: 'Educative',     course_title: 'Grokking the System Design Interview',    url: 'https://www.educative.io/courses/grokking-the-system-design-interview', duration_hrs: 40, is_free: false },
      { order: 2, skill_name: 'Data Structures & Algorithms',priority: 'urgent', platform: 'LeetCode',      course_title: 'LeetCode Top 150 Interview Questions',     url: 'https://leetcode.com/studyplan/top-interview-150/', duration_hrs: 60, is_free: true  },
      { order: 3, skill_name: 'REST API',                    priority: 'high',   platform: 'MDN Web Docs',  course_title: 'HTTP & REST API Guide',                   url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP',  duration_hrs: 4,  is_free: true  },
      { order: 4, skill_name: 'SQL',                         priority: 'high',   platform: 'SQLZoo',        course_title: 'SQL Tutorial',                            url: 'https://sqlzoo.net/',                                duration_hrs: 5,  is_free: true  },
      { order: 5, skill_name: 'Kubernetes',                  priority: 'medium', platform: 'K8s Docs',      course_title: 'Kubernetes Basics Tutorial',              url: 'https://kubernetes.io/docs/tutorials/kubernetes-basics/', duration_hrs: 8, is_free: true },
    ],
  },
  'job-002': {
    severity: 'ready', overall_match: 88,
    missing_skills: [
      { skill_name: 'TensorFlow', tag: 'IMPORTANT', demand_score: 80, demand_trend: 'stable', composite_score: 64, learning_urls: [{ platform: 'TensorFlow', title: 'TF Tutorials', url: 'https://www.tensorflow.org/tutorials', is_free: true }] },
    ],
    weak_skills: [],
    extra_skills: ['React.js', 'Node.js'],
    market_demand: [
      { skill_name: 'Python',          demand_score: 95, demand_trend: 'rising', in_student_profile: true  },
      { skill_name: 'Machine Learning',demand_score: 89, demand_trend: 'rising', in_student_profile: true  },
      { skill_name: 'TensorFlow',      demand_score: 80, demand_trend: 'stable', in_student_profile: false },
    ],
    learning_path: [
      { order: 1, skill_name: 'TensorFlow', priority: 'high', platform: 'TensorFlow.org', course_title: 'TensorFlow 2.0 Tutorials', url: 'https://www.tensorflow.org/tutorials', duration_hrs: 20, is_free: true },
    ],
  },
  'job-003': {
    severity: 'critical', overall_match: 38,
    missing_skills: [
      { skill_name: 'Product Strategy', tag: 'CRITICAL',   demand_score: 88, demand_trend: 'rising', composite_score: 83.6, learning_urls: [{ platform: 'Coursera', title: 'Digital Product Management', url: 'https://www.coursera.org/learn/uva-darden-digital-product-management', is_free: false }] },
      { skill_name: 'Agile',            tag: 'CRITICAL',   demand_score: 82, demand_trend: 'stable', composite_score: 77.9, learning_urls: [] },
      { skill_name: 'Roadmap Planning', tag: 'IMPORTANT',  demand_score: 75, demand_trend: 'rising', composite_score: 52.5, learning_urls: [] },
    ],
    weak_skills: [{ skill_name: 'Data Analysis', student_score: 40, required_score: 75, gap_delta: 35 }],
    extra_skills: ['Python', 'SQL'],
    market_demand: [
      { skill_name: 'Product Strategy', demand_score: 88, demand_trend: 'rising', in_student_profile: false },
      { skill_name: 'SQL',              demand_score: 80, demand_trend: 'stable', in_student_profile: true  },
      { skill_name: 'Python',           demand_score: 85, demand_trend: 'rising', in_student_profile: true  },
    ],
    learning_path: [
      { order: 1, skill_name: 'Product Strategy', priority: 'urgent', platform: 'Coursera', course_title: 'Digital Product Management Specialization', url: 'https://www.coursera.org/specializations/product-management', duration_hrs: 30, is_free: false },
      { order: 2, skill_name: 'Agile',            priority: 'urgent', platform: 'Scrum.org', course_title: 'Scrum Guide', url: 'https://www.scrum.org/resources/scrum-guide', duration_hrs: 5, is_free: true },
    ],
  },
}

export const MOCK_LEARNING_PATH = MOCK_SKILL_GAP['job-001'].learning_path

// ─── Seed notifications ───────────────────────────────────────────────────────
export const MOCK_NOTIFICATIONS = [
  { id: 'n-001', type: 'application_status',  title: 'Shortlisted!',       message: 'You have been shortlisted for Software Engineer – Backend at Google India!', read: false, created_at: new Date(Date.now() - 3600000 * 3).toISOString() },
  { id: 'n-002', type: 'interview_scheduled', title: 'Interview Scheduled', message: 'Interview scheduled for Data Analyst at Google India — 2 days from now (Online)', read: false, created_at: new Date(Date.now() - 3600000 * 2).toISOString() },
  { id: 'n-003', type: 'skill_gap_ready',     title: 'Skill Gap Ready',     message: 'Skill gap report ready for Software Engineer – Backend (82% match)', read: true,  created_at: new Date(Date.now() - 86400000).toISOString() },
  { id: 'n-004', type: 'profile_verified',    title: 'Profile Verified',    message: 'Your profile has been verified by the Placement Officer. You can now apply for jobs.', read: true, created_at: new Date(Date.now() - 86400000 * 2).toISOString() },
]

// ─── Seed placement stats ─────────────────────────────────────────────────────
export const MOCK_PLACEMENT_STATS = {
  totalStudents:     247,
  verifiedStudents:  231,
  activeJobs:          5,
  totalApplications: 163,
  totalPlaced:        89,
  placementRate:    36.1,
  avgPackage:      '16.40',
  branchBreakdown: [
    { branch: 'Computer Engineering',              count: 42 },
    { branch: 'Information Technology',            count: 28 },
    { branch: 'Electronics and Telecommunication', count: 15 },
    { branch: 'Mechanical Engineering',            count:  4 },
  ],
  companyBreakdown: [
    { company: 'Google India',    count: 18, avg_package: '20.00' },
    { company: 'Microsoft India', count: 14, avg_package: '22.00' },
    { company: 'Amazon',          count: 12, avg_package: '17.00' },
    { company: 'Flipkart',        count: 11, avg_package: '14.50' },
    { company: 'Swiggy',          count:  8, avg_package: '15.00' },
  ],
}

// ─── Seed admin user list ─────────────────────────────────────────────────────
export const MOCK_ALL_USERS = [
  { id: 'stu-001', email: 'prathamesh@college.edu', role: 'student',   is_active: true,  email_verified: true,  created_at: new Date(Date.now() - 86400000 * 10).toISOString() },
  { id: 'stu-002', email: 'akhilesh@college.edu',   role: 'student',   is_active: true,  email_verified: true,  created_at: new Date(Date.now() - 86400000 *  8).toISOString() },
  { id: 'stu-003', email: 'kunal@college.edu',       role: 'student',   is_active: false, email_verified: true,  created_at: new Date(Date.now() - 86400000 *  5).toISOString() },
  { id: 'stu-004', email: 'sahil@college.edu',       role: 'student',   is_active: true,  email_verified: true,  created_at: new Date(Date.now() - 86400000 *  3).toISOString() },
  { id: 'rec-001', email: 'anika.hr@google.com',    role: 'recruiter', is_active: true,  email_verified: true,  created_at: new Date(Date.now() - 86400000 * 30).toISOString() },
  { id: 'rec-002', email: 'rahul@microsoft.com',    role: 'recruiter', is_active: true,  email_verified: true,  created_at: new Date(Date.now() - 86400000 * 20).toISOString() },
  { id: 'tpo-001', email: 'tpo@college.edu',         role: 'placement', is_active: true,  email_verified: true,  created_at: new Date(Date.now() - 86400000 * 90).toISOString() },
  { id: 'adm-001', email: 'admin@college.edu',       role: 'admin',     is_active: true,  email_verified: true,  created_at: new Date(Date.now() - 86400000 * 180).toISOString() },
]

// ─── Seed audit logs ──────────────────────────────────────────────────────────
export const MOCK_AUDIT_LOGS = [
  { id: 'al-001', action: 'CREATE',  entity: 'Job',                 entity_id: 'job-001', user: { email: 'anika.hr@google.com',  role: 'recruiter' }, ip_address: '192.168.1.10', created_at: new Date(Date.now() - 3600000).toISOString(),      old_value: null,                          new_value: { title: 'Software Engineer – Backend', status: 'draft' } },
  { id: 'al-002', action: 'APPROVE', entity: 'Job',                 entity_id: 'job-001', user: { email: 'tpo@college.edu',       role: 'placement' }, ip_address: '10.0.0.5',     created_at: new Date(Date.now() - 3600000 * 2).toISOString(),   old_value: { status: 'draft' },           new_value: { status: 'active' } },
  { id: 'al-003', action: 'UPDATE',  entity: 'Application',         entity_id: 'app-001', user: { email: 'anika.hr@google.com',  role: 'recruiter' }, ip_address: '192.168.1.10', created_at: new Date(Date.now() - 7200000).toISOString(),       old_value: { status: 'applied' },         new_value: { status: 'shortlisted' } },
  { id: 'al-004', action: 'APPROVE', entity: 'StudentVerification', entity_id: 'sp-001',  user: { email: 'tpo@college.edu',       role: 'placement' }, ip_address: '10.0.0.5',     created_at: new Date(Date.now() - 86400000).toISOString(),      old_value: { is_verified: false },        new_value: { is_verified: true } },
  { id: 'al-005', action: 'CREATE',  entity: 'Interview',           entity_id: 'iv-001',  user: { email: 'anika.hr@google.com',  role: 'recruiter' }, ip_address: '192.168.1.10', created_at: new Date(Date.now() - 86400000 * 2).toISOString(),  old_value: null,                          new_value: { mode: 'online' } },
  { id: 'al-006', action: 'APPROVE', entity: 'CompanyApproval',     entity_id: 'rp-001',  user: { email: 'tpo@college.edu',       role: 'placement' }, ip_address: '10.0.0.5',     created_at: new Date(Date.now() - 86400000 * 5).toISOString(),  old_value: { approved: false },           new_value: { approved: true } },
]

// ─── Seed pending students awaiting verification ──────────────────────────────
export const MOCK_PENDING_STUDENTS = [
  { id: 'sp-010', name: 'Aryan Kulkarni', branch: 'Computer Engineering',   cgpa: 8.1, is_verified: false, user: { email: 'aryan@college.edu' } },
  { id: 'sp-011', name: 'Pooja Nair',     branch: 'Information Technology',  cgpa: 7.6, is_verified: false, user: { email: 'pooja@college.edu' } },
  { id: 'sp-012', name: 'Vikram Raut',    branch: 'Computer Engineering',   cgpa: 7.2, is_verified: false, user: { email: 'vikram@college.edu' } },
]

// ─── Seed pending companies awaiting TPO approval ─────────────────────────────
export const MOCK_PENDING_COMPANIES = []