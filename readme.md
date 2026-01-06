# 🎬 VideoStream – Upload, Sensitivity Analysis & Streaming

VideoStream is a full‑stack multi‑tenant video management platform.  
Users can upload videos, track real‑time processing, see sensitivity (safe/flagged) analysis, and manage their library with role‑based access control.

> Backend: Node.js, Express, MongoDB, Socket.IO, FFmpeg  
> Frontend: React, Vite

---

## ✨ Features

- **Authentication & RBAC**
  - JWT‑based login/register
  - Roles: Viewer, Editor, Admin
  - Multi‑tenant isolation (users only see their tenant’s videos)

- **Video upload & processing**
  - Upload with file validation (type, size, format)
  - Metadata extraction (duration, resolution, format, codecs, bitrate, FPS)
  - Thumbnail generation
  - Automated sensitivity analysis (Safe / Flagged + score & reason)
  - Background processing pipeline with status tracking

- **Real‑time updates**
  - Socket.IO used to push:
    - Processing started
    - Progress updates
    - Completion / error events
  - Dashboard updates live without manual refresh

- **Video library & management**
  - Paginated list of videos with:
    - Status badges: Pending, Processing, Completed, Failed
    - Sensitivity indicators: Safe / Flagged
  - Search and basic filtering
  - Per‑video detail page with rich metadata
  - Edit title/description (Editor/Admin)
  - Delete video (Editor/Admin) – removes DB record + files

- **Streaming**
  - HTTP Range‑based streaming endpoint for large video files
  - Integrated HTML5 `<video>` player on the detail page
  - Designed to support secure streaming in production

> Note: The streaming endpoint and player are implemented; minor edge‑case issues may still exist while debugging. All upload, processing, metadata, and management flows work end‑to‑end.

---

## 🗂 Project Structure

```text
video-streaming-app/
  backend/
    src/
      config/            # DB, JWT, multer, etc.
      controllers/       # auth, video, admin controllers
      middleware/        # auth, RBAC, tenant, validation, errors
      models/            # User, Video
      routes/            # auth.routes, video.routes, admin.routes
      services/          # video processing, streaming, socket, sensitivity
      server.js          # Express app + Socket.IO bootstrap
  frontend/
    src/
      api/               # Axios API helpers
      components/        # Reusable UI components
      context/           # Auth / socket context providers
      pages/             # Dashboard, Upload, VideoPlayer, Admin, etc.
      styles/            # CSS / styling
    vite.config.js
⚙️ Prerequisites
Node.js (LTS)

MongoDB (Atlas or local instance)

FFmpeg installed and available in PATH

Git

🔑 Environment Variables
Create .env files in backend and frontend.

backend/.env
text
PORT=5000
NODE_ENV=development

MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret

CLIENT_URL=http://localhost:5173

THUMBNAIL_PATH=./uploads/thumbnails
UPLOAD_PATH=./uploads/videos
frontend/.env
text
VITE_API_BASE_URL=http://localhost:5000/api
Make sure .env files are not committed (.gitignore).

🚀 Running Locally
1️⃣ Backend
bash
cd backend
npm install
npm run dev
Backend will start on http://localhost:5000.

2️⃣ Frontend
bash
cd frontend
npm install
npm run dev
Frontend will start on http://localhost:5173.

Log in / register from the frontend to start using the app.

🔌 Core API Endpoints (Overview)
Auth

POST /api/auth/register – Register a new user

POST /api/auth/login – Login, returns JWT

Videos

POST /api/videos/upload – Upload video (multipart/form‑data, protected)

GET /api/videos – List videos with filters & pagination (protected)

GET /api/videos/:id – Get single video details (protected)

GET /api/videos/:id/status – Get processing status (protected)

PUT /api/videos/:id – Update title/description/tags (Editor/Admin)

DELETE /api/videos/:id – Delete video (Editor/Admin)

GET /api/videos/stream/:id – Stream video via HTTP range (player)

All protected routes expect:

text
Authorization: Bearer <jwt-token>
🧱 High‑Level Architecture
Auth & tenants

Users register/login and receive a JWT.

Each user belongs to a tenant; RBAC + tenant middleware enforce isolation.

Upload & processing

User uploads video → file stored on disk using Multer.

Initial record created in MongoDB with pending status.

A background pipeline:

Extracts technical metadata using FFmpeg.

Generates thumbnail(s).

Runs sensitivity analysis service (mock/heuristic).

Updates processingStatus, processingProgress, sensitivityStatus/Score/Reason.

Emits Socket.IO events to the user.

Real‑time UX

Frontend subscribes to Socket.IO.

Dashboard cards update on:

processing_started

processing_progress

processing_complete

processing_error

Streaming

Once processingStatus === "completed", the player page can request GET /api/videos/stream/:id.

The backend uses HTTP range headers to stream parts of the file efficiently.

🧪 Testing (Suggested)
Basic tests you can run/add:

Auth controller tests (login/register).

Video upload validation tests (invalid file types / too large files).

Unit tests for:

SensitivityAnalysisService

VideoProcessorService (metadata extraction)

🌐 Deployment Guide (Example)
You can deploy backend and frontend separately.

Backend (Node/Express + MongoDB)
Use any Node hosting (Render, Railway, Fly.io, VPS):

Push this repo to GitHub.

Create a new Web Service from the backend folder.

Configure:

Build command: npm install

Start command: node src/server.js (or npm start if defined)

Add the environment variables from backend/.env.

Make sure the service port matches PORT (default 5000).

Update CLIENT_URL to your deployed frontend URL.

Frontend (React + Vite)
Good options: Vercel or Netlify.

Example: Vercel

Import the same GitHub repo.

Set Root Directory to frontend/.

Build command: npm run build

Output directory: dist

Add environment variable:

 
📌 Known Limitations
Sensitivity analysis is a simplified demonstration, not a production ML pipeline.

Streaming logic is implemented with HTTP range support; minor integration issues may exist and can be refined further for production.

📖 License
This project is built as an educational / assignment project.
Feel free to fork and adapt for learning purposes.

 
