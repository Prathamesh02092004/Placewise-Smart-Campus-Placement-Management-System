# PlaceWise — Smart Campus Placement System

<div align="center">

![PlaceWise Banner](https://img.shields.io/badge/PlaceWise-Smart%20Campus%20Placement-1E40AF?style=for-the-badge&logo=graduation-cap&logoColor=white)

[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![Node.js](https://img.shields.io/badge/Node.js-20-339933?style=flat-square&logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?style=flat-square&logo=mysql&logoColor=white)](https://mysql.com)
[![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=flat-square&logo=python&logoColor=white)](https://python.org)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

**A full-stack, AI-powered campus placement management platform that connects students, recruiters, and placement officers on a single real-time system.**

[Features](#-features) · [Architecture](#-architecture) · [Tech Stack](#-tech-stack) · [Getting Started](#-getting-started) · [API Reference](#-api-reference) · [Screenshots](#-screenshots)

</div>

---

## 📌 Overview

PlaceWise eliminates the chaos of traditional campus placements — no more Excel sheets, scattered emails, or manual shortlisting. It provides a structured, intelligent workflow where:

- **Students** browse jobs, get AI-powered skill gap analysis, and track every application in real time
- **Recruiters** post jobs, review AI-ranked candidates, schedule interviews, and release offer letters
- **Placement Officers (TPO)** verify students, approve company registrations, review job postings, and monitor live placement analytics
- **Administrators** manage all users, view audit logs, and oversee the entire system

Every action is logged, every status change triggers a real-time notification, and every job-student match is scored by an AI microservice — creating a transparent, data-driven placement process.

---

## ✨ Features

### 🎓 Student Module
- Register and build a complete academic profile (branch, CGPA, skills, projects, internships)
- Upload PDF resume — AI extracts skills automatically using NLP
- Browse active job listings with search, filters, and pagination
- Get a detailed **AI Skill Gap Report** for every job: match score (0–100%), missing skills tagged CRITICAL/IMPORTANT/NICE-TO-HAVE, weak skills, market demand chart, and a personalised ordered learning path with course links
- Track application status through a visual timeline: Applied → Under Review → Shortlisted → Interview Scheduled → Offer Received → Placed
- Real-time notifications for every status change

### 🏢 Recruiter Module
- Register company account (pending TPO approval before posting)
- Post jobs with skill requirements, CGPA gates, branch eligibility, package, and deadline
- All job postings go through TPO review before going live to students
- View AI-ranked candidate list with match scores, full student profiles, and resume access — even after shortlisting
- Shortlist, reject, or schedule interviews directly from the platform
- Track live applicant counts and shortlisted counts per job

### 🏛️ Placement Officer (TPO) Module
- Verify student profiles before they can apply for jobs
- Approve company registrations
- Review and approve/reject recruiter job postings
- Monitor placement statistics: branch-wise placements, top hiring companies, average package, placement rate
- Confirm final placements and upload offer letters

### 🔧 Admin Module
- Manage all users across all roles (activate/suspend accounts)
- View complete audit logs for every write action in the system
- Full placement statistics overview

### 🤖 AI Microservice
- **Resume Parsing**: Extracts name, email, skills (with proficiency scores), education, experience, projects, certifications from any PDF
- **Skill Gap Analysis**: 6-step pipeline — role profile merge → normalisation → set difference → proficiency estimation → market enrichment → severity classification
- **Job Matching**: TF-IDF cosine similarity + semantic embeddings for experience relevance
- **Placement Prediction**: Rule-based probability model (CGPA, skills, projects, internships) with feature importance breakdown
- **Market Signals**: Weekly aggregation of skill demand scores from external APIs

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    React 18 + Vite                       │
│              Frontend SPA  (Port 3000)                   │
│   Redux Toolkit · Tailwind CSS · Socket.io-client        │
└────────────────────┬────────────────────────────────────┘
                     │  REST API + WebSocket
┌────────────────────▼────────────────────────────────────┐
│              Node.js + Express API                       │
│                (Port 5000)                               │
│   JWT Auth · RBAC · Sequelize ORM · Socket.io Server     │
│   node-cron · Nodemailer · Multer · Winston              │
└──────────┬──────────────────────────┬───────────────────┘
           │  SQL Queries             │  HTTP (x-api-secret)
┌──────────▼──────────┐   ┌──────────▼───────────────────┐
│     MySQL 8.0       │   │   FastAPI + Python AI Service │
│    (Port 3306)      │   │        (Port 8000)            │
│   13 Tables         │   │  spaCy · scikit-learn         │
│   UUID Primary Keys │   │  sentence-transformers        │
│   Foreign Keys      │   │  pdfminer.six · Pydantic v2   │
└─────────────────────┘   └──────────────────────────────┘
```

### Request Flow
1. React component dispatches a Redux Thunk
2. Thunk calls Axios → request interceptor injects Bearer token
3. Express API authenticates JWT → checks RBAC → processes request
4. For AI workloads: backend calls FastAPI over HTTP with shared secret
5. Response returns → Redux state updates → React re-renders
6. Side effects (emails, notifications) fire asynchronously via Socket.io

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| React 18 + Vite | Component-based SPA with fast HMR |
| Redux Toolkit | Global state management with Immer |
| React Router v6 | Client-side routing with protected routes |
| Tailwind CSS | Utility-first styling with design tokens |
| Axios | HTTP client with token injection interceptors |
| Socket.io-client | Real-time notifications |
| Chart.js | Placement analytics bar charts |
| react-dropzone | PDF resume upload with drag-and-drop |
| react-hot-toast | Non-blocking status notifications |

### Backend
| Technology | Purpose |
|---|---|
| Node.js 20 + Express 4 | REST API server |
| Sequelize v6 + MySQL 8 | ORM and relational database |
| jsonwebtoken + bcrypt | JWT auth and password hashing (cost 12) |
| Socket.io | Real-time WebSocket server |
| Multer | PDF upload handling (memory storage) |
| Joi | Request schema validation |
| node-cron | Weekly market signal refresh |
| Nodemailer | Transactional email delivery |
| Winston | Structured logging |
| express-rate-limit | Auth endpoint rate limiting |

### AI Microservice (Python)
| Technology | Purpose |
|---|---|
| FastAPI 0.111 | Async API framework with auto OpenAPI docs |
| spaCy en_core_web_sm | NER for resume name extraction |
| pdfminer.six | PDF text extraction (pure Python) |
| scikit-learn | TF-IDF vectorisation, cosine similarity |
| sentence-transformers | Semantic embedding for experience matching |
| pydantic-settings | Typed environment configuration |
| httpx | Async HTTP for external market APIs |

---

## 🗄️ Database Schema

13 tables with UUID primary keys, full referential integrity, and composite UNIQUE constraints:

```
users ──────────┬── students          (1:1, UNIQUE user_id)
                ├── recruiters         (1:1, UNIQUE user_id)
                ├── placement_officers (1:1, UNIQUE user_id)
                ├── notifications      (1:M)
                └── audit_logs         (1:M)

recruiters ─────── jobs               (1:M)

students ──────┬── applications        (1:M)
               └── skill_gap_reports   (1:M, UNIQUE student_id+job_id)

jobs ──────────── applications         (1:M)

applications ──┬── interviews          (1:1, UNIQUE application_id)
               └── placement_records   (1:1, UNIQUE application_id)

skill_taxonomy ── (referenced by AI microservice for enrichment)
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- Python 3.11+
- MySQL 8.0+
- npm or yarn

### 1. Clone the repository
```bash
git clone https://github.com/your-username/placewise.git
cd placewise
```

### 2. Database Setup
```sql
mysql -u root -p
CREATE DATABASE placewise_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 3. Backend Setup
```bash
cd placewise-backend
npm install

# Configure environment
cp .env.example .env
# Edit .env with your DB credentials, JWT secret, SMTP config

# Run migrations and seed
npm run migrate
npm run seed

# Start development server
npm run dev
```

**Backend `.env` essentials:**
```env
NODE_ENV=development
PORT=5000
DB_HOST=localhost
DB_NAME=placewise_db
DB_USER=root
DB_PASSWORD=your_password
JWT_SECRET=your_32_char_secret_here
FRONTEND_URL=http://localhost:3000
AI_SERVICE_URL=http://localhost:8000
AI_SERVICE_SECRET=your_shared_secret_here
SMTP_HOST=smtp.gmail.com
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
LOCAL_UPLOAD_DIR=uploads/
```

### 4. AI Microservice Setup
```bash
cd placewise-ai

# Create virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
source venv/bin/activate     # macOS / Linux

# Install dependencies
pip install -r requirements.txt

# Download spaCy model (12 MB)
python -m spacy download en_core_web_sm

# Configure environment
cp .env.example .env
# Set AI_SECRET_KEY to match AI_SERVICE_SECRET in backend .env

# Start the AI service
uvicorn app.main:app --reload --port 8000
```

**AI `.env` essentials:**
```env
AI_SECRET_KEY=your_shared_secret_here
SPACY_MODEL=en_core_web_sm
SENTENCE_MODEL=all-MiniLM-L6-v2
PORT=8000
LOG_LEVEL=info
```

### 5. Frontend Setup
```bash
cd placewise-frontend
npm install

# Configure environment
cp .env.example .env
# Set VITE_API_BASE_URL

# Start development server
npm run dev
```

**Frontend `.env`:**
```env
VITE_API_BASE_URL=http://localhost:5000/api
```

### 6. Run All Services
Open four terminals:

```bash
# Terminal 1 — MySQL (Windows)
net start MySQL80

# Terminal 2 — Backend API
cd placewise-backend && npm run dev

# Terminal 3 — AI Microservice
cd placewise-ai && venv\Scripts\activate && uvicorn app.main:app --reload --port 8000

# Terminal 4 — Frontend
cd placewise-frontend && npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Default Seed Accounts
| Role | Email | Password |
|---|---|---|
| Admin | admin@placewise.com | Admin@12345 |
| Placement Officer | placement@placewise.com | Placement@12345 |

> Recruiter and student accounts are created through the registration flow.

---

## 📡 API Reference

### Authentication
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register student or recruiter |
| POST | `/api/auth/login` | Login (returns access token + sets refresh cookie) |
| POST | `/api/auth/logout` | Logout (clears refresh cookie) |
| GET | `/api/auth/me` | Get current user profile |
| POST | `/api/auth/refresh` | Refresh access token using cookie |

### Students
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/students` | TPO/Admin | List all students (filterable by is_verified) |
| GET | `/api/students/:id` | Any | Get student profile |
| PUT | `/api/students/:id` | Student | Update own profile |
| POST | `/api/students/:id/resume` | Student | Upload PDF resume |
| PATCH | `/api/students/:id/verify` | TPO | Verify student profile |

### Jobs
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/jobs` | Any | List jobs (students: active only; TPO/admin: all) |
| POST | `/api/jobs` | Recruiter | Create job (always starts as draft) |
| GET | `/api/jobs/my-jobs` | Recruiter | Get own job postings with counts |
| GET | `/api/jobs/:id` | Any | Get single job |
| PUT | `/api/jobs/:id` | Recruiter | Update job |
| GET | `/api/jobs/:id/applicants` | Recruiter | Get ranked applicant list |

### Applications
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/applications/my` | Student | Get own applications |
| POST | `/api/applications` | Student | Submit application |
| PUT | `/api/applications/:id/status` | Recruiter | Update application status |

### Skill Gap
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/skill-gap/:jobId` | Student | Get/generate skill gap report |
| GET | `/api/skill-gap/:jobId/learning-path` | Student | Get ordered learning path |
| GET | `/api/skill-gap/trends/:roleCategory` | Student | Get market demand trends |

### Placement (TPO)
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/placement/stats` | TPO/Admin | Live placement statistics |
| GET | `/api/placement/companies/pending` | TPO | Pending company approvals |
| PATCH | `/api/placement/companies/:id/approve` | TPO | Approve recruiter company |
| PATCH | `/api/placement/jobs/:id/approve` | TPO | Approve draft job → active |
| GET | `/api/placement/records` | TPO | All placement records |

### Interviews
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/interviews` | Recruiter | Schedule interview |

### AI Microservice (Internal — requires `x-api-secret` header)
| Method | Endpoint | Description |
|---|---|---|
| POST | `/ai/resume/parse` | Parse PDF resume → structured data |
| POST | `/ai/resume/score` | Score student vs job requirements |
| POST | `/ai/skill-gap/analyze` | Full 6-step gap analysis |
| GET | `/ai/skill-gap/market-signals` | Current market demand scores |
| POST | `/ai/skill-gap/learning-path` | Build ordered learning path |
| POST | `/ai/skill-gap/batch-analyze` | Batch gap analysis for all candidates |
| POST | `/ai/match/jobs` | Rank jobs for a student |
| POST | `/ai/match/candidates` | Rank candidates for a job |
| POST | `/ai/analytics/predict` | Placement probability prediction |

> AI service docs available at [http://localhost:8000/docs](http://localhost:8000/docs) (Swagger UI auto-generated by FastAPI)

---

## 🔐 Security

- **JWT Access Tokens** stored in Redux memory (never localStorage) — immune to XSS token theft
- **HttpOnly Refresh Token Cookie** rotated on every refresh — immune to JavaScript access
- **bcrypt cost 12** for all password hashes
- **RBAC middleware** on every protected route — role verified server-side, not just client-side
- **Inter-service secret** (`x-api-secret` header) isolates the AI microservice — never directly accessible from the browser
- **Rate limiting** on auth endpoints — prevents brute force attacks
- **Audit log** for every write action — full accountability trail

---

## 📁 Project Structure

```
placewise/
├── placewise-frontend/          # React 18 + Vite SPA
│   └── src/
│       ├── features/            # Redux slices (auth, jobs, applications, skillGap, notifications)
│       ├── pages/               # Page components (student/, recruiter/, placement/, admin/, auth/)
│       ├── components/          # Shared UI components
│       ├── routes/              # ProtectedRoute guard
│       ├── services/            # Axios API instance
│       └── hooks/               # useSocket, useDebounce
│
├── placewise-backend/           # Node.js + Express REST API
│   └── src/
│       ├── config/              # DB, env validation, JWT config
│       ├── models/              # Sequelize models (13 tables)
│       ├── services/            # Business logic layer
│       ├── controllers/         # Request/response handlers
│       ├── routes/              # Express routers
│       ├── middleware/          # auth, rbac, validate, auditLog, upload
│       ├── sockets/             # Socket.io server + notification emitter
│       └── utils/               # paginate, response, mailer, cron, logger
│
└── placewise-ai/                # Python FastAPI AI Microservice
    ├── app/
    │   ├── routers/             # resume, skill_gap, matching, analytics
    │   ├── services/            # resume_parser, scorer, gap_analyzer, etc.
    │   ├── schemas/             # Pydantic v2 request/response models
    │   └── utils/               # skill_taxonomy cache, text_processing
    ├── data/
    │   ├── skill_taxonomy.json  # 43+ skills with metadata
    │   └── role_profiles/       # Per-role required skill weights
    └── tests/                   # pytest test suite
```

---

## 🧪 Running Tests

```bash
# Backend tests
cd placewise-backend
npm test

# AI microservice tests
cd placewise-ai
pytest tests/ -v
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m 'feat: add your feature'`
4. Push to the branch: `git push origin feature/your-feature-name`
5. Open a Pull Request

Please follow the existing code style — ESLint for JavaScript, Black for Python.

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

Built as a comprehensive full-stack project demonstrating:
- Three-tier + microservice architecture
- AI/ML integration in a production-like workflow
- Real-time features with Socket.io
- Role-based access control across four user types
- Clean separation of concerns across frontend, backend, and AI layers

---

<div align="center">

**PlaceWise** — *Connecting Students, Recruiters, and Placement Officers*

⭐ Star this repository if you found it helpful!

</div>
