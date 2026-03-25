"""
ClipAI Worker — AI Video Processing Pipeline

This worker polls the MongoDB database for projects with status='processing',
runs the AI pipeline (transcribe → analyze → cut → crop → subtitles → upload),
and updates the project and clip records.
"""

import os
import time
import requests
import cloudinary
import cloudinary.uploader
from pymongo import MongoClient
from bson.objectid import ObjectId
from dotenv import load_dotenv

load_dotenv()

import static_ffmpeg
static_ffmpeg.add_paths()

from pipeline.transcriber import extract_audio, transcribe
from pipeline.analyzer import find_best_clips
from pipeline.cutter import cut_clip, crop_vertical
from pipeline.subtitles import generate_srt, burn_subtitles

# Configuration
POLL_INTERVAL = int(os.getenv("POLL_INTERVAL", "10"))
MONGO_URI = os.getenv("MONGO_URI")

# Initialize Cloudinary
cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET"),
)

# Connect to MongoDB
if not MONGO_URI:
    print("❌ MONGO_URI not found in environment variables.")
    exit(1)
    
client = MongoClient(MONGO_URI)
db = client.get_default_database()
projects_col = db['projects']
clips_col = db['clips']
transcripts_col = db['transcripts']

# Create temporary processing directory
TMP_DIR = os.path.join(os.getcwd(), "tmp")
os.makedirs(TMP_DIR, exist_ok=True)


def download_video(url: str, filename: str) -> str:
    """Download a video file from a URL to local storage."""
    print(f"📥 Downloading video from {url}...")
    local_path = os.path.join(TMP_DIR, filename)
    response = requests.get(url, stream=True)
    response.raise_for_status()
    with open(local_path, "wb") as f:
        for chunk in response.iter_content(chunk_size=8192):
            f.write(chunk)
    return local_path


def cleanup_temp_files(*files):
    """Delete temporary files to free up disk space."""
    for file in files:
        if file and os.path.exists(file):
            try:
                os.remove(file)
            except OSError:
                pass


def process_project(project):
    """Run the complete AI pipeline on a single project."""
    project_id = project['_id']
    video_url = project.get('originalVideoUrl')
    clip_duration = project.get('clipDuration', 60)
    
    if not video_url:
        print(f"⚠️ Project {project_id} has no video URL, failing.")
        projects_col.update_one({'_id': project_id}, {'$set': {'status': 'failed'}})
        return
        
    print(f"\n======================================")
    print(f"🎬 Processing Project {project_id}")
    print(f"======================================")

    base_name = str(project_id)
    raw_video = os.path.join(TMP_DIR, f"{base_name}_raw.mp4")
    audio_file = os.path.join(TMP_DIR, f"{base_name}_audio.mp3")
    
    try:
        # 1. Download Video
        projects_col.update_one({'_id': project_id}, {'$set': {'progress': 10}})
        download_video(video_url, f"{base_name}_raw.mp4")
        
        # 2. Extract Audio
        projects_col.update_one({'_id': project_id}, {'$set': {'progress': 30}})
        extract_audio(raw_video, audio_file)
        
        # 3. Transcribe with Whisper
        projects_col.update_one({'_id': project_id}, {'$set': {'progress': 50}})
        transcript_data = transcribe(audio_file)
        full_text = transcript_data["text"]
        words = transcript_data["words"]
        
        # Save transcript to DB
        transcripts_col.insert_one({
            "projectId": project_id,
            "fullText": full_text,
            "words": words,
            "createdAt": int(time.time()),
            "updatedAt": int(time.time())
        })
        
        # 4. Analyze with LLM to find clips
        projects_col.update_one({'_id': project_id}, {'$set': {'progress': 75}})
        clip_segments = find_best_clips(full_text, clip_duration=clip_duration, num_clips=3)
        
        if not clip_segments:
            print("⚠️ No clips found by LLM.")
            projects_col.update_one({'_id': project_id}, {'$set': {'status': 'done'}})
            cleanup_temp_files(raw_video, audio_file)
            return

        # 5. Process Each Clip
        projects_col.update_one({'_id': project_id}, {'$set': {'progress': 85}})
        print(f"📊 Found {len(clip_segments)} segments to process.")
        
        for idx, seg in enumerate(clip_segments):
            print(f"\n▶️ Processing Clip {idx+1}/{len(clip_segments)}")
            
            # Files (defined early for cleanup)
            cut_file = os.path.join(TMP_DIR, f"{base_name}_clip{idx}_cut.mp4")
            crop_file = os.path.join(TMP_DIR, f"{base_name}_clip{idx}_916.mp4")
            srt_file = os.path.join(TMP_DIR, f"{base_name}_clip{idx}.srt")
            final_file = os.path.join(TMP_DIR, f"{base_name}_clip{idx}_final.mp4")

            try:
                # Robust mapping: Find the best timestamp window
                target_start_text = seg.get('start_text', '').lower().strip()
                target_end_text = seg.get('end_text', '').lower().strip()
                
                c_start = -1.0
                c_end = -1.0
                
                # Helper: find best matching index for a phrase
                def find_text_index(target_phrase, word_list, reverse=False):
                    target_words = [w.lower().strip('.,!?') for w in target_phrase.split()]
                    if not target_words: return -1
                    
                    # Search range
                    search_range = range(len(word_list) - len(target_words) + 1)
                    if reverse: search_range = reversed(search_range)
                    
                    for i in search_range:
                        match = True
                        for j in range(len(target_words)):
                            curr_word = word_list[i+j].get('word', '').lower().strip('.,!?')
                            if curr_word != target_words[j]:
                                match = False
                                break
                        if match:
                            # If reverse, we likely want the end of the phrase for mapping end_text
                            return i + len(target_words) - 1 if reverse else i
                    return -1

                start_idx = find_text_index(target_start_text, words)
                end_idx = find_text_index(target_end_text, words, reverse=True)

                if start_idx != -1:
                    c_start = words[start_idx]['start']
                else:
                    c_start = idx * clip_duration
                    print(f"⚠️ Could not find exact start text, falling back to {c_start}s")

                if end_idx != -1:
                    c_end = words[end_idx]['end']
                else:
                    c_end = c_start + clip_duration
                    print(f"⚠️ Could not find exact end text, falling back to {c_end}s")

                # Final safety bounds
                if c_start < 0: c_start = 0.0
                
                # --- Sentence-Completion Guard ---
                # Ensure the clip ends at a sentence boundary (., !, ?)
                # Scan forward up to 10 words to find the next punctuation
                scan_limit = min(end_idx + 10, len(words))
                found_boundary = False
                for s_idx in range(end_idx, scan_limit):
                    word_val = words[s_idx].get('word', '')
                    if any(p in word_val for p in ('.', '!', '?')):
                        c_end = words[s_idx]['end']
                        end_idx = s_idx # update for clip_words filtering
                        found_boundary = True
                        print(f"🎯 Sentence-completion guard: Extended clip to sentence end at {c_end:.2f}s ('{word_val}')")
                        break
                
                if not found_boundary:
                    print(f"⚠️ Sentence-completion guard: No punctuation found within 10 words of end_text.")

                if c_end - c_start > clip_duration + 15:
                    print(f"📏 Clip too long ({c_end - c_start:.2f}s), truncating to {clip_duration}s.")
                    c_end = c_start + clip_duration
                if c_end <= c_start: c_end = c_start + 30.0 
                
                print(f"📍 Clip window determined: {c_start:.2f}s to {c_end:.2f}s")
                    
                clip_words = [w for w in words if w['start'] >= c_start and w['end'] <= c_end]
                
                # Video operations
                cut_clip(raw_video, c_start, c_end, cut_file)
                crop_vertical(cut_file, crop_file)
                
                # Subtitles
                generate_srt(clip_words, srt_file)
                burn_subtitles(crop_file, srt_file, final_file)
                
                # Upload to Cloudinary
                print("☁️ Uploading final clip to Cloudinary...")
                upload_res = cloudinary.uploader.upload(
                    final_file, 
                    resource_type="video", 
                    folder="clipai/clips"
                )
                
                # Save clip to DB
                clips_col.insert_one({
                    "projectId": project_id,
                    "startTime": c_start,
                    "endTime": c_end,
                    "duration": c_end - c_start,
                    "textSnippet": seg.get('reason', f"Auto-generated clip {idx+1}"),
                    "score": seg.get('score', 80),
                    "metrics": seg.get('metrics', {}),
                    "status": "generated",
                    "cloudinaryClipId": upload_res["public_id"],
                    "cloudinaryThumbnailUrl": upload_res["secure_url"].replace('.mp4', '.jpg'),
                    "format": "9:16",
                    "createdAt": int(time.time()),
                    "updatedAt": int(time.time())
                })
                print(f"✅ Clip {idx+1} finalized and saved.")
                
            except Exception as e:
                print(f"❌ Failed to process clip {idx+1}: {e}")
            finally:
                cleanup_temp_files(cut_file, crop_file, srt_file, final_file)

        
        # 6. Mark project as done
        projects_col.update_one({'_id': project_id}, {'$set': {'status': 'done', 'progress': 100}})
        print(f"🎉 Project {project_id} complete!")
        
    except Exception as e:
        print(f"❌ Project {project_id} failed: {e}")
        projects_col.update_one({'_id': project_id}, {'$set': {'status': 'failed'}})
    finally:
        cleanup_temp_files(raw_video, audio_file)


def main():
    """Main loop — polls MongoDB for projects with status='processing'."""
    print("🚀 ClipAI Worker started")
    print(f"   Poll interval: {POLL_INTERVAL}s")
    print("   Waiting for jobs...\n")

    while True:
        try:
            # Check how many jobs are pending
            pending_count = projects_col.count_documents({'status': 'processing'})
            if pending_count > 0:
                print(f"📦 Found {pending_count} pending jobs. Attempting to fetch one...")
            
            # Find and lock a project
            project = projects_col.find_one_and_update(
                {'status': 'processing'},
                {'$set': {'status': 'analyzing', 'progress': 5}},
                sort=[('createdAt', 1)] # Oldest first
            )
            
            if project:
                process_project(project)
            else:
                time.sleep(POLL_INTERVAL)
                
        except Exception as e:
            print(f"❌ Critical error in poll loop: {e}")
            import traceback
            traceback.print_exc()
            time.sleep(POLL_INTERVAL)


if __name__ == "__main__":
    main()
