# ⚡ LEETPULSE

> **Enterprise LeetCode Monitoring & Institutional Analytics Platform**

LeetPulse is a real-time, multi-tenant academic and enterprise monitoring platform designed to track, analyze, and boost student problem-solving progress on LeetCode across hierarchical academic structures. 

Built with modern web technologies, LeetPulse features automated background synchronization, real-time WebSocket notifications, comprehensive role-based access control (RBAC), at-risk student detection, weekly problem assignments, and interactive analytics dashboards.

---

## 🌟 Key Features

### ⚡ Automated Real-Time Synchronization Engine
- **Node-Cron Background Scheduler**: Automatically syncs student LeetCode statistics every 5 minutes.
- **Adaptive Sync Queue**: Prioritizes actively online users and staggers request intervals to avoid rate limits.
- **WebSocket Live Updates**: Pushes instant updates to connected front-end clients via Socket.IO without page reloads.

### 🏢 Multi-Tenant Academic Hierarchy
- Full organizational mapping down to 5 granular levels:
  $$\text{Institution} \longrightarrow \text{Department} \longrightarrow \text{Academic Year} \longrightarrow \text{Batch} \longrightarrow \text{Section}$$
- Dynamic hierarchy management allowing institution admins and HODs to organize students and faculty seamlessly.

### 🛡️ Fine-Grained Role-Based Access Control (RBAC)
Supports 6 distinct operational privilege levels:
- **Level 1 — Student**: View personal dashboard, track problem solved counts (Easy/Medium/Hard), contest rankings, set goals, submit weekly problem solutions, and check leaderboards.
- **Level 2 — Student Representative (CR)**: Assist faculty with section-level oversight and peer monitoring.
- **Level 3 — Faculty Mentor**: Monitor assigned batch/section performance, identify struggling students, and assign weekly coding challenges.
- **Level 4 — Head of Department (HOD)**: Manage department-wide academic structures, faculty assignments, and department analytics.
- **Level 5 — Institutional Administrator**: Full institution-level configuration, student onboarding, billing, branding, and cross-department metrics.
- **Level 6 — DevAdmin / Platform Engineer**: System health diagnostics, live database console, real-time log stream viewer, feature flags management, and user impersonation for support debugging.

### 📊 Real-Time Analytics & At-Risk Tracking
- **Interactive Visualizations**: Powered by Recharts, featuring problem difficulty breakdowns, submission heatmaps, and ranking progress.
- **At-Risk Student Intervention**: Automated detection logic flags inactive or stagnant students falling behind benchmark goals.
- **Goal Setting & Weekly Challenges**: Track daily/weekly problem targets and participate in group coding sprints.
- **Global & Institutional Leaderboards**: Dynamic rankings calculated by solved counts, contest rating, and earned XP badges.

---

## 🏗️ Architecture & Tech Stack

### Monorepo Structure

```text
Leetpulse/
├── Client/                     # React 18 + Vite Frontend Application
│   ├── public/                 # Static assets
│   ├── src/
│   │   ├── components/         # Reusable UI components (Navbar, Sidebar, ImpersonationBar, etc.)
│   │   ├── context/            # React Context providers (AuthContext, SocketContext)
│   │   ├── pages/              # Role-partitioned page components
│   │   │   ├── admin/          # Hierarchy, Student Management & At-Risk Pages
│   │   │   ├── auth/           # Login, Register, Password Reset Pages
│   │   │   ├── devadmin/       # Logs, Feature Flags, DB Console & Impersonation
│   │   │   ├── faculty/        # Faculty Dashboard & Metrics
│   │   │   ├── shared/         # Leaderboard, Reports, Progress & Weekly Problems
│   │   │   ├── superadmin/     # Platform Analytics & Admin Management
│   │   │   └── user/           # Student Dashboard, Profile & Goals
│   │   └── services/           # Axios API client & socket configuration
│   ├── index.html
│   ├── tailwind.config.js      # Tailwind CSS configuration
│   └── vite.config.js          # Vite build configuration
│
└── Server/                     # Node.js + Express Backend Engine
    ├── src/
    │   ├── config/             # MongoDB database connections
    │   ├── controllers/        # Business logic controllers
    │   ├── middleware/         # Auth, Scope, RBAC & Error handling middlewares
    │   ├── models/             # Mongoose Schemas (User, Institution, Goal, WeeklyProblem, etc.)
    │   ├── routes/             # Express API route modules
    │   ├── scripts/            # Database migration utilities
    │   ├── services/           # LeetCode GraphQL service, Socket.IO, Sync Engine & Emailer
    │   └── utils/              # Database seed scripts & system cleanups
    └── server.js               # Express application server entrypoint
```

### Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend Framework** | React 18 (Vite) |
| **Styling & UI** | Tailwind CSS, Lucide React Icons |
| **Data Visualization** | Recharts |
| **Backend Runtime** | Node.js, Express.js |
| **Database & ODM** | MongoDB, Mongoose |
| **Real-time WebSockets** | Socket.IO (Client & Server) |
| **Background Jobs** | Node-Cron |
| **Email Delivery** | Nodemailer |
| **Authentication** | JSON Web Tokens (JWT), Bcrypt.js |
| **External Integration** | LeetCode GraphQL API |

---

## 🛠️ Getting Started & Installation

### Prerequisites

Ensure you have the following installed on your machine:
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **MongoDB**: Local MongoDB instance or a MongoDB Atlas connection string

---

### Setup Instructions

#### 1. Clone the Repository

```bash
git clone https://github.com/AustinJ04Developer/Leetpulse.git
cd Leetpulse
```

#### 2. Backend (Server) Setup

1. Navigate to the `Server` directory:
   ```bash
   cd Server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create environment configuration:
   Duplicate `.env.example` to `.env` in the `Server` directory:
   ```bash
   cp .env.example .env
   ```

4. Edit `.env` with your MongoDB URI, JWT Secret, and SMTP settings (see [Environment Variables](#-environment-variables-reference)).

5. Start the backend server:
   - **Development Mode** (with auto-reload via Nodemon):
     ```bash
     npm run server
     ```
   - **Production Mode**:
     ```bash
     npm start
     ```
   The backend engine will start at `http://localhost:5000`.

---

#### 3. Frontend (Client) Setup

1. In a new terminal window, navigate to the `Client` directory:
   ```bash
   cd Client
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create environment configuration:
   Duplicate `.env.example` to `.env` in the `Client` directory:
   ```bash
   cp .env.example .env
   ```

4. Verify `VITE_API_URL` points to `http://localhost:5000/api` and `VITE_SOCKET_URL` points to `http://localhost:5000`.

5. Start the Vite development server:
   ```bash
   npm run dev
   ```
   The application will launch automatically in your web browser at `http://localhost:5173`.

---

## 🗄️ Database Utility Commands

The backend includes pre-configured utility scripts for populating test data and running maintenance tasks:

- **Seed Database** (Populates demo institutions, academic hierarchies, and sample user profiles):
  ```bash
  cd Server
  npm run seed
  ```

- **Clean Database** (Clears existing documents from database collections):
  ```bash
  cd Server
  npm run clean
  ```

- **Manual Full Sync** (Triggers immediate LeetCode synchronization for all registered accounts):
  ```bash
  cd Server
  node src/utils/sync_all.js
  ```

- **Multi-Tenant Data Migration** (Upgrades legacy flat user structures to multi-tenant institutional hierarchy):
  ```bash
  cd Server
  node src/utils/migrateToMultiTenant.js
  ```

---

## ⚙️ Environment Variables Reference

### Backend (`Server/.env`)

| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `PORT` | Backend server port | `5000` |
| `MONGODB_URI` | Connection URI for MongoDB cluster or local instance | `mongodb://localhost:27017/leetpulse` |
| `JWT_SECRET` | Secret key used for signing JWT access tokens | `your_super_secret_jwt_key` |
| `NODE_ENV` | Application environment (`development` / `production`) | `development` |
| `CLIENT_URL` | Allowed CORS origin URL for frontend client | `http://localhost:5173` |
| `SMTP_HOST` | Mail server host address | `smtp.gmail.com` |
| `SMTP_PORT` | Mail server port | `587` |
| `SMTP_USER` | SMTP authentication username / email | `noreply@yourdomain.com` |
| `SMTP_PASS` | SMTP app password or secret | `your_smtp_password` |
| `EMAIL_FROM` | Default sender display name & address | `"LEETPULSE <noreply@leetpulse.com>"` |

### Frontend (`Client/.env`)

| Variable | Description | Local Example |
| :--- | :--- | :--- |
| `VITE_API_URL` | Base URL for REST API endpoints | `http://localhost:5000/api` |
| `VITE_SOCKET_URL` | WebSocket server endpoint URL | `http://localhost:5000` |

---

## 🔌 Core API Endpoints

| Route Group | Base Endpoint | Description |
| :--- | :--- | :--- |
| **Authentication** | `/api/auth` | Login, Register, Token Refresh, Password Reset Request & Verify |
| **Users** | `/api/users` | User profile updates, avatar upload, password change, stats summary |
| **LeetCode** | `/api/leetcode` | Manual sync, public profile lookup, recent submissions & contest stats |
| **Institutions** | `/api/institutions` | CRUD operations for Departments, Academic Years, Batches, & Sections |
| **Students** | `/api/students` | Batch student imports, individual student management, at-risk flags |
| **Faculty** | `/api/faculty` | Faculty assignment, section monitoring, mentor dashboards |
| **Goals** | `/api/goals` | Personal goal creation, status tracking, milestone history |
| **Weekly Problems** | `/api/weekly-problems` | Assigned weekly challenge problems and student completion logs |
| **Reports** | `/api/reports` | Exportable analytics, CSV data downloads, institutional summaries |
| **DevAdmin** | `/api/devadmin` | Live log streaming, database queries, feature flags, user impersonation |
| **SuperAdmin** | `/api/superadmin` | Platform analytics, institution management, global settings |

---

## 🚀 Deployment Guide

### Frontend Deployment (Vercel / Netlify)
1. Set the Root Directory to `Client`.
2. Build Command: `npm run build`
3. Output Directory: `dist`
4. Set Environment Variables:
   - `VITE_API_URL`: `https://your-backend-domain.com/api`
   - `VITE_SOCKET_URL`: `https://your-backend-domain.com`

### Backend Deployment (Render / Railway / Docker)
1. Set the Root Directory to `Server`.
2. Build Command: `npm install`
3. Start Command: `npm start`
4. Set Environment Variables according to the [Backend Reference](#backend-serverenv).

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

<p center="text-center">
  Crafted with ❤️ by the <b>LeetPulse Team</b>
</p>
