import os
import subprocess

def cut_clip(video_path: str, start_time: float, end_time: float, output_path: str) -> str:
    """Cut a segment from the source video using FFmpeg."""
    print(f"✂️  Cutting video from {start_time}s to {end_time}s...")
    
    video_dir = os.path.dirname(os.path.abspath(video_path))
    video_file = os.path.basename(video_path)
    output_file = os.path.basename(output_path)
    
    cmd = [
        "ffmpeg", "-y", 
        "-ss", str(float(start_time)), 
        "-to", str(float(end_time)), 
        "-i", video_file, 
        "-c:v", "libx264", "-c:a", "aac",
        output_file
    ]
    
    current_cwd = os.getcwd()
    try:
        os.chdir(video_dir)
        subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        return output_path
    except subprocess.CalledProcessError as e:
        print(f"❌ FFmpeg cut failed: {e}")
        raise e
    finally:
        os.chdir(current_cwd)

def crop_vertical(input_path: str, output_path: str) -> str:
    """Crop to 9:16 aspect ratio (center crop) suitable for Shorts/Reels/TikTok."""
    print(f"📱 Cropping video to 9:16 vertical format...")
    
    video_dir = os.path.dirname(os.path.abspath(input_path))
    input_file = os.path.basename(input_path)
    output_file = os.path.basename(output_path)
    
    # Center crop: width = height * 9/16, height = ih (input height)
    cmd = [
        "ffmpeg", "-y",
        "-i", input_file,
        "-vf", "crop=ih*9/16:ih",
        "-c:a", "copy",
        output_file
    ]
    
    current_cwd = os.getcwd()
    try:
        os.chdir(video_dir)
        subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        return output_path
    except subprocess.CalledProcessError as e:
        print(f"❌ FFmpeg vertical crop failed: {e}")
        raise e
    finally:
        os.chdir(current_cwd)
