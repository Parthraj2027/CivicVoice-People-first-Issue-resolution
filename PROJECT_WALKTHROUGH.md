# CivicVoice Project Walkthrough (Start to End)

This document explains the complete CivicVoice project flow, from local setup to runtime behavior across frontend, backend, data, AI-assisted features, and role-based operations.

## 1. What This Project Is

CivicVoice is a full-stack civic issue platform where:
- Citizens report civic and social issues.
- Admins manage departments, users, and structured complaint intake.
- Department officers process civic issues and publish updates.
- NGOs handle social issues, resolve cases, or escalate to government departments.
- Public users can view impact metrics, nearby issues, and use the Jagruk assistant.

The system is split into:
- React + Vite frontend in frontend.
- Express + MongoDB backend in backend.

## 2. High-Level Architecture

## 2.1 Frontend Layer
- React app with route-based pages and role-protected navigation.
- Redux store for auth and feature state.
- Axios API client for backend calls.
- Leaflet-based mapping for location selection and nearby issue visibility.

Main app entry:
- frontend/src/main.jsx
- frontend/src/App.jsx

## 2.2 Backend Layer
- Express app with modular routes and controllers.
- JWT cookie and bearer-token auth.
- Role guards for admin, department, NGO, volunteer, and citizen flows.
- Multer upload endpoints for image/pdf/video evidence.

Main backend entry:
- backend/src/server.js
- backend/src/app.js

## 2.3 Data Layer
- MongoDB via Mongoose models:
  - User
  - Issue
  - Department
  - NGO
  - Alert
  - Volunteer

DB connection behavior is resilient:
- Tries configured Mongo URI.
- Falls back to local MongoDB URI.
- Falls back to in-memory MongoDB if persistent DB is unreachable (unless strict mode is enabled).

File:
- backend/src/config/db.js

## 2.4 AI/Intelligence Layer
- Social issue analysis and categorization through services.
- Jagruk conversational assistant endpoint.
- Admin text-to-structured-complaint flow.

Key files:
- backend/src/services/issueIntelligence.js
- backend/src/services/jagrukAssistant.js
- backend/src/controllers/adminController.js
- backend/src/controllers/publicController.js

## 3. Repository Structure

Top-level project folder: civic-voice-project

- backend
  - src
    - app.js, server.js
    - config/db.js
    - controllers/*
    - middleware/*
    - models/*
    - routes/*
    - seed/seed.js, seedData.js
    - services/*
    - jobs/socialIssueEscalationJob.js
    - utils/*
  - uploads (runtime evidence storage)
  - package.json
- frontend
  - src
    - App.jsx, main.jsx, store.js
    - pages/*
    - features/*
    - components/*
    - styles/*
    - lib/apiClient.js
  - package.json

## 4. Complete Runtime Flow (Start to End)

## 4.1 Backend Startup Flow

1. server.js loads environment variables with dotenv.
2. connectDB() attempts Mongo connection.
3. If persistent DB is unavailable and strict mode is off, app boots with in-memory MongoDB.
4. ensureDefaultAdmin() guarantees admin availability.
5. Optional auto-seeding runs when:
   - using memory DB, or
   - AUTO_SEED=true
6. Social issue escalation job starts.
7. Express server listens on PORT (default 4000).

Files:
- backend/src/server.js
- backend/src/config/db.js

## 4.2 Express App Initialization

The backend app configures:
- CORS middleware
- JSON/form parsing
- Cookie parser
- Request logging via morgan (except test)
- Static /uploads serving
- Route mounts under /api/*
- notFound and error handler middleware

File:
- backend/src/app.js

## 4.3 Frontend Startup Flow

1. main.jsx mounts the React app.
2. App.jsx dispatches fetchMe() on load to restore session.
3. ProtectedRoute checks user and role access.
4. Public and role-based pages render accordingly.

File:
- frontend/src/App.jsx

## 4.4 Authentication Lifecycle

Registration:
- POST /api/auth/register
- Validates name, email, and strong password.
- Creates citizen user.
- Issues JWT in httpOnly cookie.

Login:
- POST /api/auth/login
- Supports expectedRole checks to prevent wrong-portal login.
- Tracks failed attempts.
- Locks account for 15 minutes after threshold.
- Issues JWT cookie on success.

Session restore:
- GET /api/auth/me (protected)

Logout:
- POST /api/auth/logout (protected)
- Clears JWT cookie.

Password update:
- POST /api/auth/change-password (protected + rate-limited)

Files:
- backend/src/routes/authRoutes.js
- backend/src/controllers/authController.js
- backend/src/middleware/authMiddleware.js

## 4.5 Civic Issue Reporting Flow

Citizen submits issue via protected endpoint:
- POST /api/issues

Required core fields:
- issueType
- location
- severity
- description

Backend processing:
- Normalizes severity and recurrence.
- Parses evidence URL array.
- Captures optional geolocation.
- Builds human-readable summary.
- Stores issue with status pending and createdBy/reportedBy.
- Returns generated publicId like CV-XXXXXX.

Follow-up flows:
- Citizen views own issues: GET /api/issues/mine
- Admin reviews all: GET /api/issues/admin
- Department sees assigned/forwarded: GET /api/issues/department
- Admin forwards/updates status: PATCH /api/issues/:id
- Department adds updates: PATCH /api/issues/:id/department-update
- Citizen/Admin reopen completed/resolved: PATCH /api/issues/:id/reopen
- Citizen/Admin rate completed/resolved: PATCH /api/issues/:id/rate

Files:
- backend/src/routes/issueRoutes.js
- backend/src/controllers/issueController.js
- backend/src/models/Issue.js

## 4.6 Social Issue Flow (AI-Assisted)

Submission:
- POST /api/social-issues (protected)

Processing steps:
1. Merges title + description text.
2. Calls analyzeIssueText() (with safe fallback if AI is unavailable).
3. Derives category, severity, urgency, and location normalization.
4. Triggers emergency helpline suggestions when needed.
5. Tries preferred NGO assignment or best NGO matching.
6. If no NGO match, derives fallback government department.
7. Creates issue under issueTrack=social.
8. Creates critical alert for emergency social issues.

Community engagement:
- List issues: GET /api/social-issues
- Issue details: GET /api/social-issues/:id
- Upvote: PUT /api/social-issues/:id/upvote
- Witness statement: POST /api/social-issues/:id/witness

Operational updates:
- Admin/NGO/Department can update social issue status with role checks.

Files:
- backend/src/routes/socialIssueRoutes.js
- backend/src/controllers/socialIssueController.js
- backend/src/services/issueIntelligence.js

## 4.7 NGO Operations Flow

Public discovery:
- GET /api/ngos
- GET /api/ngos/:id

Admin creates NGO:
- POST /api/ngos

NGO/Admin managed operations:
- PUT /api/ngos/:id
- GET /api/ngos/:id/issues
- PUT /api/ngos/:id/accept/:issueId
- PUT /api/ngos/:id/resolve/:issueId
- POST /api/ngos/:id/escalate/:issueId
- GET /api/ngos/:id/analytics

Behavior highlights:
- Ownership checks ensure only admin or managing NGO user can operate.
- Resolution and escalation append escalation history and alerts.

Files:
- backend/src/routes/ngoRoutes.js
- backend/src/controllers/ngoController.js

## 4.8 Public Features Flow

Public/non-admin facing endpoints:
- GET /api/public/impact
- GET /api/public/nearby?lat=&lng=&radiusKm=&limit=
- POST /api/public/chatbot
- GET /api/community/feed
- GET /api/alerts/active

Use cases:
- Landing and impact dashboards use aggregate metrics.
- Nearby endpoint computes geographic distance from map or device coordinates.
- Jagruk chatbot provides assistant responses with optional source references.

Files:
- backend/src/routes/publicRoutes.js
- backend/src/routes/communityRoutes.js
- backend/src/routes/alertRoutes.js
- backend/src/controllers/publicController.js

## 4.9 File Upload Flow

Protected upload endpoints:
- POST /api/uploads (single file field: file)
- POST /api/uploads/multiple (multi field: files, max 3)

Rules:
- Allowed types: jpg, jpeg, png, pdf, mp4
- Size limit: 50 MB
- Stored under backend/uploads
- Returned URL served by static /uploads route

File:
- backend/src/routes/uploadRoutes.js

## 4.10 Frontend Route Map

App route highlights from App.jsx:
- Public: /, /login, /login/*, /jagruk
- Protected shared: /dashboard, /report, /track/:id, /impact, /ngos, /ngos/:id, /community, /account
- Citizen-only: /citizen, /citizen/dashboard, /quick-report
- Admin-only: /admin
- Department-only: /department
- NGO-only: /ngo

The app shell renders global header/footer except on landing and dashboard routes.

File:
- frontend/src/App.jsx

## 5. Data Model Deep Dive

## 5.1 User Model
- Roles: citizen, department, ngo, volunteer, admin
- Password hashing via pre-save bcrypt hook
- Department relation for department users
- Login lock tracking fields

File:
- backend/src/models/User.js

## 5.2 Issue Model

Single Issue model stores both civic and social tracks.

Important fields:
- issueTrack: civic or social
- civicCategory / socialCategory
- location and geoLocation
- severity and urgencyLevel
- status (supports both civic and social lifecycle states)
- assignments: assignedDepartment, assignedNGO, forwardedTo
- community behavior: upvotes, witnesses
- resolution data: evidence URLs, resolvedAt, rating/review
- generated virtual publicId: CV-<last 6 chars>

File:
- backend/src/models/Issue.js

## 5.3 Department and NGO Models

Department:
- Name, description, category, contact, assigned issue refs

NGO:
- Specializations and service areas
- Verification and performance indicators
- managedBy relation to a user account

Files:
- backend/src/models/Department.js
- backend/src/models/NGO.js

## 6. Admin Workbench Flow

Admin portal capabilities include:
- Create admin users.
- Create/list departments.
- Create/list/update/delete department users.
- Process free text into structured complaint data.
- Create complaint from structured payload.

Text processing path:
1. Admin submits plain text.
2. AI analysis extracts issue type, category, severity, and location info.
3. Admin receives editable structured output.
4. Admin confirms creation.
5. Backend creates civic or social issue and performs assignment logic.

Files:
- backend/src/routes/adminRoutes.js
- backend/src/controllers/adminController.js

## 7. Scheduled/Background Processing

The backend starts a social issue escalation job at startup.

Purpose:
- Continuously monitor social issues for escalation conditions and ensure unattended cases move forward.

File:
- backend/src/jobs/socialIssueEscalationJob.js

## 8. Local Setup Guide (Fresh Machine)

## 8.1 Prerequisites
- Node.js 18+
- npm
- MongoDB local or Atlas URI

## 8.2 Install Backend

From project root:

- cd backend
- npm install

## 8.3 Configure Backend Environment

Create backend/.env with at least:

- PORT=4000
- JWT_SECRET=<strong_secret>
- MONGO_URI=<atlas_or_local_uri>
- CLIENT_ORIGINS=http://localhost:5173
- OPENAI_API_KEY=<optional_for_ai_features>

Optional flags:
- AUTO_SEED=true
- FORCE_SEED=true
- REQUIRE_PERSISTENT_DB=true

## 8.4 Install Frontend

From project root:

- cd frontend
- npm install

## 8.5 Run in Development

Backend terminal:
- cd backend
- npm run dev

Frontend terminal:
- cd frontend
- npm run dev

Default local URLs:
- Frontend: http://localhost:5173
- Backend API: http://localhost:4000

## 8.6 Seed Data

From backend:
- npm run seed

Seed creates sample citizens, admin, departments, NGO/volunteer accounts, and sample issues.

## 9. Default Seeded Accounts

Common credentials from seed data:
- Admin: admin@civicvoice.local / Admin@123
- Citizen: citizen1@civicvoice.local / Citizen@123
- Department: roads@civicvoice.local / Dept@123
- NGO: ngo@civicvoice.local / Ngo@123
- Volunteer: volunteer@civicvoice.local / Volunteer@123

## 10. Error Handling and Security Basics

Current protections include:
- JWT auth in cookie/bearer.
- Role-based authorization middleware.
- Auth rate limiting in auth routes.
- Account lock after repeated login failure.
- Centralized notFound + error handlers.
- Upload type and size restrictions.

Core files:
- backend/src/middleware/authMiddleware.js
- backend/src/middleware/authRateLimit.js
- backend/src/middleware/errorMiddleware.js

## 11. Build and Production Commands

Backend:
- npm start (from backend)

Frontend:
- npm run build (from frontend)
- npm run preview (from frontend)

## 12. Practical End-to-End User Journeys

## 12.1 Citizen Civic Complaint Journey
1. User logs in as citizen.
2. Opens report page and submits civic complaint with location and evidence.
3. Backend stores issue as pending.
4. Admin forwards to department.
5. Department posts status updates and completion evidence.
6. Citizen tracks issue and can rate resolution.

## 12.2 Social Issue with NGO Journey
1. Citizen reports a social issue.
2. AI analysis categorizes urgency and category.
3. Best NGO is auto-assigned when available.
4. NGO accepts and resolves, or escalates to government.
5. Alerts and analytics update.

## 12.3 Public Insight Journey
1. Visitor opens impact page.
2. Fetches totals, resolution rate, and recent issues.
3. Uses nearby endpoint to view local issues on map.
4. Interacts with Jagruk assistant for guidance.

## 13. Current Gaps You May Want to Improve

Based on current structure:
- No full automated test suite is visible in package scripts.
- CI pipeline and deployment manifests are not included in this repo snapshot.
- Environment template file should be validated against current required variables.
- Background job behavior should be documented with concrete SLA/timeout values.

## 14. Where to Start as a New Contributor

Recommended order:
1. Read backend/src/app.js and backend/src/server.js.
2. Read frontend/src/App.jsx for route and role flow.
3. Read backend/src/routes/*.js to understand API surface.
4. Read backend/src/controllers/issueController.js and socialIssueController.js.
5. Run seed and test one user journey per role.

With that path, you can understand the complete system from boot to business logic to UI behavior quickly.
