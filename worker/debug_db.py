from pymongo import MongoClient
import os
from dotenv import load_dotenv
from bson.objectid import ObjectId

load_dotenv()

def debug():
    client = MongoClient(os.getenv('MONGO_URI'))
    db = client.get_default_database()
    
    # Get latest project
    p = db.projects.find_one(sort=[('createdAt', -1)])
    if not p:
        print("No projects found.")
        return
        
    print(f"Latest Project ID: {p['_id']}")
    print(f"Status: {p.get('status')}")
    print(f"Progress: {p.get('progress')}")
    print(f"Original Video: {p.get('originalVideoUrl')}")
    
    # Check clips
    clips = list(db.clips.find({'projectId': p['_id']}))
    print(f"Number of clips in DB: {len(clips)}")
    for clip in clips:
        print(f"  - Clip: {clip.get('cloudinaryClipId')} Status: {clip.get('status')}")

    # Check transcripts
    t = db.transcripts.find_one({'projectId': p['_id']})
    print(f"Transcript exists: {t is not None}")
    if t and 'words' in t:
        print("Sample words from transcript:")
        for w in t['words'][:20]:
            print(f"  {w}")

if __name__ == '__main__':
    debug()
