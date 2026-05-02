# 📚 Digital Essentials Platform — Backend API

A RESTful API backend for a community digital literacy learning platform serving Bosa Addis Kebele, Jimma, Ethiopia.

[![Node.js](https://img.shields.io/badge/Node.js-v20%2B-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-v6.0.3-blue.svg)](https://www.typescriptlang.org/)
[![Express.js](https://img.shields.io/badge/Express.js-v5.2.1-lightgrey.svg)](https://expressjs.com/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-blue.svg)](https://www.mysql.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)

---

## Table of Contents

- [About the Project](#about-the-project)
- [Architecture](#architecture)
- [Database Schema](#database-schema)
- [Getting Started](#getting-started)
- [API Reference](#api-reference)
- [Key Flows](#key-flows)
- [NPM Scripts](#npm-scripts)
- [Common Errors & Solutions](#common-errors--solutions)
- [Contributing](#contributing)
- [License](#license)
- [Acknowledgements](#acknowledgements)

---

## About the Project

The platform closes the digital literacy gap in communities with limited technology exposure. It supports both online and offline learning modes with automatic sync, built as part of CBTP (Community Based Training Program) Phase II at Jimma Institute of Technology.

Three user roles are supported: learner, mentor, and administrator.

Key features:
- Role-based access control (learner / mentor / administrator)
- JWT stateless authentication
- Course and lesson management
- Offline progress tracking with sync endpoint
- File uploads (PDF, audio, video) via Cloudinary
- Auto-generated certificates on course completion
- AI-powered study assistant via Groq (LLaMA 3)
- Discussion forum with threaded posts
- Exercise submission and scoring
- Course feedback and ratings

---

## Architecture

The backend follows a 3-layer architecture: Routes → Controllers → Services → Models.

```tree
digital-essentials-backend/
├── src/
│   ├── app.ts
│   ├── server.ts
│   ├── config/
│   │   ├── database.ts
│   │   ├── db.ts
│   │   ├── env.ts
│   │   ├── cloudinary.ts
│   │   ├── multer.ts
│   │   └── groq.ts
│   ├── controllers/
│   ├── services/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   │   ├── auth.middleware.ts
│   │   └── validate.middleware.ts
│   ├── types/
│   └── utils/
│       ├── response.ts
│       └── errors.ts
├── database/
│   └── migrations/        (14 migration files)
├── .env
├── tsconfig.json
└── package.json
```

---

## Database Schema

The database uses MySQL 8.0 with utf8mb4 charset (supporting Amharic), normalized to 3NF, consisting of 14 tables.

| Table Name | Purpose |
|------------|---------|
| `users` | Stores core authentication and role data for all users |
| `learner_profiles` | Additional profile data for learners |
| `mentor_profiles` | Additional profile data for mentors |
| `courses` | Main course information |
| `lessons` | Individual lessons within a course |
| `offline_materials` | Downloadable content for offline study |
| `enrollments` | Tracks which learners are enrolled in which courses |
| `progress` | Tracks lesson completion status for enrolled learners |
| `exercises` | Assessments linked to lessons or courses |
| `exercise_submissions` | Learner answers and scores for exercises |
| `feedback` | Course reviews and ratings from learners |
| `certificates` | Auto-generated certificates of completion |
| `forum_posts` | Discussion threads for courses |
| `chat_messages` | AI assistant conversation history |

---

## Getting Started

### Prerequisites

- Node.js v20+
- MySQL 8.0+
- Git
- Free Cloudinary account (cloudinary.com)
- Free Groq API key (console.groq.com — no credit card)

### Installation

Step 1 — Clone and install:
```bash
git clone https://github.com/Moges741/digital-essentials-backend.git
cd digital-essentials-backend
npm install
```

Step 2 — Create MySQL database:
```sql
CREATE DATABASE digital_essentials_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

CREATE USER 'dep_user'@'localhost' IDENTIFIED BY 'YourPassword';
GRANT ALL PRIVILEGES ON digital_essentials_db.* TO 'dep_user'@'localhost';
FLUSH PRIVILEGES;
```

Step 3 — Create `.env` file in project root:
```env
# Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=digital_essentials_db
DB_USER=dep_user
DB_PASSWORD=YourPassword

# JWT
JWT_SECRET=your_very_long_random_secret_key_here

# Server
PORT=3000
NODE_ENV=development

# Cloudinary (from cloudinary.com dashboard)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Groq AI (free from console.groq.com)
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=llama-3.1-8b-instant
DAILY_MESSAGE_LIMIT=100
```

Step 4 — Run migrations:
```bash
npm run migrate
# Expected: Batch 1 run: 14 migrations
```

Step 5 — Start server:
```bash
npm run dev
# Expected:
# ✅ Database connected successfully
# 🚀 Server running on port 3000
```

Step 6 — Verify:
```bash
curl http://localhost:3000/health
# { "success": true, "message": "Digital Essentials API is running" }
```

---

## API Reference

- Base URL: `http://localhost:3000`
- Auth header format: `Authorization: Bearer <jwt_token>`

**Standard Success Response**
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

**Standard Error Response**
```json
{
  "success": false,
  "error": "Error description",
  "details": [ ... ]
}
```

### Auth
| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| POST | `/api/auth/register` | No | Any | Register a new user |
| POST | `/api/auth/login` | No | Any | Login and receive JWT |

### Courses
| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/api/courses` | No | Any | List published courses |
| GET | `/api/courses/:id` | No | Any | Get course details |
| POST | `/api/courses` | Yes | Mentor/Admin | Create a new course |
| PATCH | `/api/courses/:id` | Yes | Mentor/Admin | Update course details |
| PATCH | `/api/courses/:id/publish` | Yes | Mentor/Admin | Publish/unpublish a course |
| DELETE | `/api/courses/:id` | Yes | Admin | Delete a course |

### Lessons
| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/api/courses/:id/lessons` | Yes | Enrolled | List lessons for a course |
| GET | `/api/courses/:id/lessons/:lesson_id` | Yes | Enrolled | Get lesson details |
| POST | `/api/courses/:id/lessons` | Yes | Mentor/Admin | Add lesson to course |
| PATCH | `/api/lessons/:id` | Yes | Mentor/Admin | Update lesson |
| DELETE | `/api/lessons/:id` | Yes | Mentor/Admin | Delete lesson |

### Enrollments
| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| POST | `/api/enrollments` | Yes | Learner | Enroll in a course |
| GET | `/api/enrollments/my` | Yes | Learner | List my enrollments |
| GET | `/api/enrollments/course/:id` | Yes | Mentor/Admin | List enrolled learners |
| PATCH | `/api/enrollments/:id/drop` | Yes | Learner | Drop a course |

### Progress
| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| PATCH | `/api/progress/:lesson_id/complete` | Yes | Learner | Mark lesson complete |
| POST | `/api/progress/sync` | Yes | Learner | Sync offline progress |
| GET | `/api/progress/course/:id` | Yes | Learner | Get course progress |

### Materials
| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/api/courses/:id/materials` | Yes | Enrolled | List offline materials |
| POST | `/api/courses/:id/materials` | Yes | Mentor/Admin | Upload material |
| DELETE | `/api/materials/:id` | Yes | Mentor/Admin | Delete material |

### Exercises
| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/api/courses/:id/exercises` | Yes | Enrolled | List course exercises |
| POST | `/api/courses/:id/exercises` | Yes | Mentor/Admin | Create an exercise |
| DELETE | `/api/exercises/:id` | Yes | Mentor/Admin | Delete an exercise |
| POST | `/api/exercises/:id/submit` | Yes | Learner | Submit exercise |
| GET | `/api/exercises/:id/submissions` | Yes | Mentor/Admin | View submissions |

### Feedback
| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| POST | `/api/feedback` | Yes | Learner | Submit course feedback |
| GET | `/api/feedback/course/:id` | No | Any | View course feedback |
| GET | `/api/feedback/my` | Yes | Learner | View my feedback |
| PATCH | `/api/feedback/:id` | Yes | Learner | Update feedback |

### Certificates
| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/api/certificates/my` | Yes | Learner | List my certificates |
| GET | `/api/certificates/:id` | No | Any | View certificate details |
| POST | `/api/certificates/issue` | Yes | System | Auto-issue certificate |

### AI Chat
| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| POST | `/api/chat/send` | Yes | Learner | Send message to AI |
| GET | `/api/chat/history` | Yes | Learner | Get chat history |
| DELETE | `/api/chat/history` | Yes | Learner | Clear chat history |

---

## Key Flows

1. **Learner Journey**
   - Register account
   - Login to receive JWT
   - Browse published courses
   - Enroll in a course
   - Complete lessons sequentially
   - Receive auto-generated certificate upon completion
   - Submit course feedback
   - Use AI chat for study assistance

2. **Offline Sync Flow**
   - Learner completes lessons offline on a local device
   - Device stores progress locally
   - When internet becomes available, app sends `POST /api/progress/sync`
   - Server processes and marks lessons complete
   - Auto-generates certificate if all course requirements are met

3. **Certificate Auto-Generation**
   - Learner marks final lesson complete
   - Service checks if all course lessons are completed
   - Updates enrollment status to completed
   - Generates certificate automatically in an idempotent manner (no duplicates)

---

## NPM Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with nodemon |
| `npm run build` | Compile TypeScript to /dist |
| `npm run start` | Run compiled production build |
| `npm run migrate` | Run pending migrations |
| `npm run migrate:rollback` | Undo last migration batch |

---

## Common Errors & Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| Missing required environment variable | `.env` missing | Check `.env` in project root |
| ER_ACCESS_DENIED_ERROR | Wrong DB credentials | Check `DB_USER` and `DB_PASSWORD` |
| Property 'user' does not exist on Request | TS declaration not loaded | Add `"ts-node": { "files": true }` to `tsconfig.json` |
| No token provided (401) | Missing auth header | Add `Authorization: Bearer <token>` |
| Course not found on public route | Course is unpublished | `PATCH /api/courses/:id/publish` |
| No file uploaded (400) | Wrong field name | File field must be named exactly "file" |
| Already enrolled (409) | Duplicate enrollment | Re-enrolling a dropped course reactivates it |
| Model decommissioned (Groq) | Deprecated model name | Update `GROQ_MODEL` in `.env` to `llama-3.1-8b-instant` |

---

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/your-feature-name`)
3. Commit your changes using conventional commits (`feat:`, `fix:`, `docs:`, etc.)
4. Push to the branch (`git push origin feature/your-feature-name`)
5. Open a Pull Request

---


## Acknowledgements

- Jimma University & Jimma Institute of Technology
- Bosa Addis Kebele community
- CBTP (Community Based Training Program) coordinators
- Project Advisor: Mr. Yonas G
- Team members: MOGES(ME) Ayida Aman, Lina Seid, Liya Tamerat, Maedot Wondesen, Marara Obsi
