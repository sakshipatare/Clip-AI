"""Transcriber — Extract audio and generate word-level transcript using Whisper."""
import os
import subprocess
from openai import OpenAI

# Initialize the OpenAI client (ensure OPENAI_API_KEY is in .env)
# Note: You can easily swap this to use Groq's free tier by passing base_url="https://api.groq.com/openai/v1"
client = OpenAI()

def extract_audio(video_path: str, output_path: str) -> str:
    """Use local FFmpeg to extract a lightweight audio file from the video."""
    print(f"🎵 Extracting audio from {video_path}...")
    
    # -y overwrites output, -vn disables video, -acodec libmp3lame encodes to mp3
    cmd = [
        "ffmpeg", "-y", "-i", video_path, 
        "-vn", "-acodec", "libmp3lame", "-q:a", "2", 
        output_path
    ]
    
    try:
        subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        print(f"✅ Audio extracted to {output_path}")
        return output_path
    except subprocess.CalledProcessError as e:
        print(f"❌ FFmpeg audio extraction failed: {e}")
        raise e

def transcribe(audio_path: str) -> dict:
    """
    Transcribe audio using OpenAI Whisper API to get word-level timestamps.
    Returns: { "text": "full text", "words": [{ "word": "hello", "start": 0.0, "end": 0.5 }] }
    """
    print(f"📝 Transcribing audio with Whisper API...")
    if not os.path.exists(audio_path):
        raise FileNotFoundError(f"Audio file not found: {audio_path}")

    with open(audio_path, "rb") as audio_file:
        # Request verbose_json to get word-level timestamps
        response = client.audio.transcriptions.create(
            model="whisper-1",
            file=audio_file,
            response_format="verbose_json",
            timestamp_granularities=["word"]
        )
    
    # Process OpenAI's response format (Transcription object or dict)
    result = {
        "text": getattr(response, "text", ""),
        "words": [],
        "segments": []
    }
    
    # Extract segments list safely
    segments_data = []
    if hasattr(response, 'segments'):
        segments_data = response.segments
    elif isinstance(response, dict) and 'segments' in response:
        segments_data = response['segments']
        
    if segments_data:
        for s in segments_data:
            if hasattr(s, 'text'):
                result["segments"].append({
                    "text": s.text,
                    "start": s.start,
                    "end": s.end
                })
            else:
                result["segments"].append({
                    "text": s.get('text', ''),
                    "start": s.get('start', 0.0),
                    "end": s.get('end', 0.0)
                })

    # Extract words list safely from response object or dict
    words_data = []
    if hasattr(response, 'words'):
        words_data = response.words
    elif isinstance(response, dict) and 'words' in response:
        words_data = response['words']
    
    # Ensure words_data is iterable
    if not words_data:
        words_data = []
    
    if words_data:
        for w in words_data:
            # Handle both object (w.word) and dict (w['word']) access
            if hasattr(w, 'word'):
                result["words"].append({
                    "word": w.word,
                    "start": w.start,
                    "end": w.end
                })
            else:
                result["words"].append({
                    "word": w.get('word', ''),
                    "start": w.get('start', 0.0),
                    "end": w.get('end', 0.0)
                })
    else:
        print("⚠️ No word-level timestamps found in Whisper response.")
            
    print(f"✅ Transcription complete. Word count: {len(result['words'])}")
            
    print("✅ Transcription complete")
    return result
