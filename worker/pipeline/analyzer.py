"""Analyzer — Use an LLM to find the most engaging clip segments from a transcript."""
import json
from openai import OpenAI

client = OpenAI()

def find_best_clips(transcript_text: str, clip_duration: int = 60, num_clips: int = 3) -> list:
    """
    Send the transcript to an LLM and ask it to identify the best viral moments.
    """
    print(f"🧠 Analyzing transcript for top {num_clips} viral moments...")
    
    prompt = f"""
    You are an expert short-form video editor and social media manager (TikTok, Reels, Shorts).
    Analyze the following transcript and find the top {num_clips} most engaging, viral segments.
    Each segment should be approximately {clip_duration} seconds long when spoken (roughly 130-150 words).

    CRITICAL REQUIREMENTS FOR A GOOD CLIP:
    1. Hook: Must start with a powerful hook.
    2. Duration: Each segment MUST be approximately {clip_duration} seconds. DO NOT pick segments significantly longer than {clip_duration + 15} seconds.
    3. Complete Thought: Must stand alone and make sense.
    4. Sentence Boundary: end_text MUST be the end of a sentence and MUST include a punctuation mark (., !, or ?). Avoid cutting in the middle of a thought.
    5. Payoff: Must deliver a satisfying conclusion.

    Return the result strictly as a JSON array of objects, with NO markdown formatting, NO backticks.
    Format exactly like this example:
    [
      {{
        "start_text": "The exact first 5-8 words of the clip",
        "end_text": "The exact last 5-8 words of the clip",
        "reason": "Why this clip will go viral",
        "score": 95,
        "metrics": {{ "hook": 90, "payoff": 95, "pace": 80, "completeness": 100 }}
      }}
    ]

    Here is the transcript:
    \"\"\"{transcript_text}\"\"\"
    """

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",  # Best cost/performance for this task
            messages=[
                {"role": "system", "content": "You are a JSON-only API. You output raw valid JSON arrays exclusively."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7
        )
        
        content = response.choices[0].message.content.strip()
        
        # Robust JSON extraction: Find the first '[' and last ']'
        start_idx = content.find('[')
        end_idx = content.rfind(']')
        
        if start_idx != -1 and end_idx != -1:
            content = content[start_idx:end_idx+1]
        else:
            print(f"⚠️ Could not find JSON array in LLM response: {content[:100]}...")
            return []
            
        clips = json.loads(content)
        print(f"✅ LLM analysis complete. Found {len(clips)} clips.")
        return clips
        
    except Exception as e:
        print(f"❌ LLM Analysis failed: {e}")
        return []
