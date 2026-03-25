# AI-Powered Video Clip Generator - System Architecture

This document answers the core requirements for an AI-powered SaaS that ingests long-form video content and generates short-form clips optimized for social media platforms.

> [!NOTE]
> **Free Portfolio Stack**: This setup relies on free tiers perfectly suited for student portfolio projects: Vercel (Frontend), Render (API & Workers), MongoDB Atlas (Database), and Cloudinary (Storage & Media APIs).

## 1. Complete System Architecture

The architecture relies on loosely coupled services. Video processing is compute-heavy, so the web API hands off the heavy lifting to a background worker, which can run locally or on Render's free/starter tier.

*   **Frontend (UI/UX):** React.js + Tailwind CSS. Hosted on Vercel for fast edge delivery.
*   **Backend API (Core Logic):** Node.js + Express.js. Manages users, projects, and database operations. Hosted on Render.
*   **AI/Video Processing Worker:** Python (locally for development, Render Background Worker for deployment). Uses local FFmpeg installations.
*   **Database:** MongoDB Atlas (Free Tier) for flexible schema design.
*   **File Storage & Delivery:** Cloudinary (Free Tier gives 25GB storage/bandwidth) for raw videos, clipped files, and thumbnails. Cloudinary automatically provides an integrated CDN.

## 2. Database Schema Design (MongoDB)

**Collections:**

*   **`Users`**: `{ _id, email, password_hash, subscription_tier, credits_remaining, created_at }`
*   **`Projects`**: `{ _id, user_id, original_video_url, cloudinary_raw_id, status (uploading, processing, done, failed), duration, metadata }`
*   **`Transcripts`**: `{ _id, project_id, words: [{ word, start_time, end_time, speaker_id }], segments: [...] }`
*   **`Clips`**: `{ _id, project_id, start_time, end_time, duration, text_snippet, score, metrics: { hook, payoff, pace, completeness }, status, cloudinary_clip_id, cloudinary_thumbnail_url, format (9:16) }`

## 3. Backend API Structure (Node.js/Express)

*   **Auth:** `POST /api/auth/register`, `POST /api/auth/login`
*   **Uploads:**
    *   `POST /api/projects/upload-signature` (Returns Cloudinary upload signature for secure browser-to-Cloudinary direct upload, saving server bandwidth).
*   **Projects:**
    *   `GET /api/projects` (List user's projects)
    *   `GET /api/projects/:id` (Get project status and overall info)
*   **Clips:**
    *   `GET /api/projects/:id/clips` (Get generated clips for review)
    *   `PUT /api/clips/:id/status` (Approve, reject, or regenerate)
*   **Webhooks:** `POST /api/webhooks/worker-update` (Python worker calls this to update status)

## 4. Work Breakdown

1.  **Node.js API Service:** Handles CRUD, Auth, UI interactions, and issuing secure signatures to upload to Cloudinary directly from the React frontend.
2.  **Worker Manager (Python / AI Pipeline):** Polls the database or a simple Redis queue. Responsible for downloading the video from Cloudinary, running Whisper to transcribe, querying an LLM, slicing video with FFmpeg, and uploading clips back to Cloudinary.

## 5. AI Pipeline Workflow

1.  **Ingestion & Audio Extraction:** Python worker receives the Cloudinary URL. It runs local `ffmpeg` to extract a lightweight `.mp3` or `.wav` file.
2.  **Transcription & Diarization:** Passes the audio through an LLM/Whisper API (OpenAI or Deepgram) to get word-level timestamps.
3.  **Semantic Chunking:** A script groups words logically.
4.  **LLM Analysis:** Transcript chunks are sent to a free/affordable LLM API (e.g., OpenAI `gpt-4o-mini`) to find engaging 30-60 second clips.
5.  **Clip Coordinate Mapping:** Python maps chosen quotes back to exact `start_time` and `end_time`.

## 6. Video Processing Pipeline

For each chosen clip segment:
1.  **Cut:** Use local `ffmpeg` to slice the original downloaded video.
2.  **Auto-Crop (Vertical 9:16):** Use a basic FFmpeg crop filter to isolate the center of the video (9:16).
3.  **Subtitles:** Generate an `.srt` subtitle file. Burn via `ffmpeg` or let Cloudinary overlay the `.srt` via its URL transformation API dynamically.
4.  **Upload:** Send the customized `.mp4` to Cloudinary. Notify Node.js API.

## 7. Clip Scoring Algorithm Idea

The LLM returns a score based on specific instructions:
*   **Hook Strength (30%):** Does the first 3 seconds contain a strong opening?
*   **Payoff/Value (25%):** Does the clip resolve the premise?
*   **Audio Energy (15%):** Calculate length and tone dynamics.
*   **Completeness (20%):** Does the snippet form a standalone thought?
*   **Pace (10%):** Words per minute.

## 8. Folder Structure

```text
clip-generator-platform/
├── backend/                  # Node.js + Express API
│   ├── src/
│   │   ├── controllers/
│   │   ├── models/           # Mongoose schemas
│   │   ├── routes/
│   │   ├── services/         # Cloudinary config
│   │   └── index.js
├── frontend/                 # React.js UI (Vercel)
│   ├── src/
│   │   ├── components/       # VideoPlayer, ClipCard
│   │   ├── pages/            # Dashboard, ProjectView
│   │   ├── services/         # Axios API calls
│   │   └── App.js
└── worker/                   # Python Processing Pipeline (Render/Local)
    ├── pipeline/
    │   ├── transcriber.py    # Whisper wrapper
    │   ├── analyzer.py       # LLM prompt logic
    │   ├── cutter.py         # FFmpeg video slicing
    │   └── subtitles.py      # SRT generator
    ├── requirements.txt
    └── main.py               # Background loop/queue consumer
```

## 9. Step-by-Step Development Roadmap

*   **Phase 1: Foundation (1 week):** Setup React UI (Vercel), Node API (Render), MongoDB Atlas. Implement direct browser to Cloudinary uploads.
*   **Phase 2: MVP Processing Worker (1-2 weeks):** Write Python script. The script downloads from Cloudinary, runs local `ffmpeg` to extract audio, and gets timestamps.
*   **Phase 3: The "Brain" (1 week):** Add OpenAI prompt logic to identify engaging timestamps.
*   **Phase 4: Cutting & Bounding (1-2 weeks):** Implement local FFmpeg cuts and simple center-crop. Use Cloudinary for overlaying text or FFmpeg to burn subtitles.
*   **Phase 5: UI Integration (1 week):** Build the Dashboard where users review and play Cloudinary-hosted clips securely.
*   **Phase 6: Deployment Polish (1 week):** Push Node to Render, run Python worker locally for the portfolio demo, or host on Render's background worker if limits allow.

## 10. Scalability & Limits

*   **Storage / Bandwidth:** Cloudinary offers 25 credits. 1 credit = 1GB of storage, 1GB of bandwidth, or 1000 video transformations. This is huge for a student project.
*   **Compute:** Video encoding is CPU intensive. Running the Python worker on your local machine during portfolio demonstrations keeps it free, fast, and impressive without battling Render's free-tier CPU limits.

## 11. Deployment Architecture Details

*   **Frontend:** Vercel (Free tier).
*   **Backend Node.js API:** Render.com Web Service (Free tier).
*   **Database:** MongoDB Atlas M0 cluster (Free).
*   **Processing Workers:** Local PC (Free and fastest for a demo/portfolio) or Render Background Worker.
*   **Storage & CDN:** Cloudinary (Free tier) acts as your S3 + CloudFront replacement out of the box.
