# AI Video Clip Generator Task List

## 1. Project Setup
- [ ] Initialize Git repository
- [ ] Setup Node.js backend (Express)
- [ ] Setup React frontend (Vercel deployment ready)
- [ ] Setup Python environment for AI worker

## 2. Infrastructure & External Services
- [ ] Configure MongoDB Atlas (Free Tier)
- [ ] Configure Cloudinary for video storage & delivery
- [ ] Setup basic authentication (JWT)

## 3. Core Processing Pipeline (The AI Worker)
- [ ] Implement local FFmpeg for audio extraction
- [ ] Integrate local/free Whisper API for transcription
- [ ] Develop LLM prompt for timestamp/segment detection
- [ ] Implement local FFmpeg for video clipping and vertical crop

## 4. Backend API
- [ ] Create Video Upload endpoint (Cloudinary integration)
- [ ] Create Project/Clip status pooling endpoints
- [ ] Define Mongoose schemas for Projects and Clips

## 5. Frontend Dashboard
- [ ] Build Video Upload UI
- [ ] Build Clip Review Dashboard UI
- [ ] Implement Clip playback component (Cloudinary Video Player)

## 6. Integration & Polish
- [ ] Connect Frontend to Backend APIs
- [ ] Connect Backend to AI Worker pipeline
- [ ] End-to-end testing of video ingestion to clip generation
