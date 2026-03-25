"""Subtitles — Generate SRT subtitle files from word-level timestamps and burn them."""
import math
import subprocess
import os

def generate_srt(words: list, output_path: str) -> str:
    """
    Generate an SRT subtitle file from word-level timestamps.
    Groups 4-6 words into fast-paced lines for high retention metrics.
    """
    print("📝 Generating SRT subtitles...")
    
    def format_time(seconds):
        h = int(seconds // 3600)
        m = int((seconds % 3600) // 60)
        s = int(seconds % 60)
        ms = int(math.modf(seconds)[0] * 1000)
        return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"

    chunks = []
    current_line_words = []
    line_start = 0.0

    # Group every 5 words for fast-paced TikTok style captions
    for i, w in enumerate(words):
        if len(current_line_words) == 0:
            line_start = w['start']
        current_line_words.append(w['word'])
        
        if len(current_line_words) >= 5 or i == len(words) - 1:
            chunks.append({
                'start': line_start,
                'end': w['end'],
                'text': " ".join(current_line_words)
            })
            current_line_words = []

    with open(output_path, "w", encoding="utf-8") as f:
        for idx, chunk in enumerate(chunks, 1):
            f.write(f"{idx}\n")
            f.write(f"{format_time(chunk['start'])} --> {format_time(chunk['end'])}\n")
            f.write(f"{chunk['text']}\n\n")

    return output_path


def burn_subtitles(video_path: str, srt_path: str, output_path: str) -> str:
    """Use FFmpeg subtitle filter to hardcode the SRT onto the video."""
    print("🔥 Burning subtitles into video...")
    
    # On Windows, absolute paths in the 'subtitles' filter are a nightmare.
    # The safest way is to use a relative path by running FFmpeg from the same directory.
    video_dir = os.path.dirname(os.path.abspath(video_path))
    video_file = os.path.basename(video_path)
    srt_file = os.path.basename(srt_path)
    output_file = os.path.basename(output_path)
    
    # TikTok style yellow, bold, centered subtitles
    style = "FontName=Arial,FontSize=20,PrimaryColour=&H00FFFF,OutlineColour=&H40000000,BorderStyle=3,Outline=2,Alignment=2,MarginV=60,Bold=-1"
    
    cmd = [
        "ffmpeg", "-y",
        "-i", video_file,
        "-vf", f"subtitles={srt_file}:force_style='{style}'",
        "-c:v", "libx264", "-preset", "ultrafast",
        "-c:a", "aac", "-b:a", "128k",
        output_file
    ]
    
    current_cwd = os.getcwd()
    try:
        print(f"📂 Switching to CWD: {video_dir}")
        os.chdir(video_dir)
        print(f"🚀 Running FFmpeg: {' '.join(cmd)}")
        subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        return output_path
    except subprocess.CalledProcessError as e:
        print(f"❌ FFmpeg subtitle burn failed: {e}")
        raise e
    finally:
        os.chdir(current_cwd)
        
    return output_path
