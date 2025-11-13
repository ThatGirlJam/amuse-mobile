# Use YouTube's Data API
# This script requests videos from YouTube using the
# Google Cloud Console API key. The response is then
# parsed to find
#  * Title
#  * Video ID
#  * Description
#  * Channel Name
# It now uses feature-specific keywords and weighted scoring.

import json
import os
import time
from itertools import combinations
from googleapiclient.discovery import build
from dotenv import load_dotenv
import re
import random


# Load environment variables from parent .env file
load_dotenv("../.env")

API_KEY = os.getenv("YOUTUBE_DATA_API_KEY")
USER_FEATURES_FILE = "user-features.json"
RESULTS_FILE = "results.json"
MAX_RESULTS_PER_QUERY = 10
WAIT_BETWEEN_CALLS = 0.3  # seconds

def find_makeup_videos(features, youtube):
    """
    Find makeup tutorials matching the given facial features.
    Uses feature-specific keywords for queries and weighted scoring.

    features: dict
        Example: {"eye_shape": "almond", "nose": "medium", "lips": "full"}

    Returns: list of dicts
    """
    # Map each feature value to a more specific keyword
    feature_keywords = {}
    for k, v in features.items():
        if k == "eye_shape":
            feature_keywords[v] = f"eyes {v}"
        elif k == "nose":
            feature_keywords[v] = f"nose {v}"
        elif k == "lips":
            feature_keywords[v] = f"lips {v}"
        else:
            feature_keywords[v] = v  # fallback

    # Use keywords for generating search queries
    keyword_values = list(feature_keywords.values())

    # Create search queries (single features up to all combinations)
    search_queries = []
    for r in range(1, len(keyword_values) + 1):
        for combo in combinations(keyword_values, r):
            q = "makeup tutorial " + " ".join(combo)
            search_queries.append(q)

    results = {}

    for query in search_queries:
        print(f"  🔍 Searching: {query}")
        try:
            response = youtube.search().list(
                q=query,
                part="snippet",
                type="video",
                videoCategoryId="26",  # Howto & Style
                maxResults=MAX_RESULTS_PER_QUERY
            ).execute()

            for item in response.get("items", []):
                vid = item["id"]["videoId"]
                title = item["snippet"]["title"].lower()
                desc = item["snippet"]["description"].lower()

                # Weighted scoring: title match = 2, description = 1
                score = 0
                matched_features = []
                for feature_value, keyword in feature_keywords.items():
                    if keyword in title:
                        score += 2
                        matched_features.append(feature_value)
                    elif keyword in desc:
                        score += 1
                        matched_features.append(feature_value)

                if vid not in results or score > results[vid]["score"]:
                    results[vid] = {
                        "title": item["snippet"]["title"],
                        "url": f"https://youtube.com/watch?v={vid}",
                        "channel": item["snippet"]["channelTitle"],
                        "matched_features": matched_features,
                        "score": score,
                        "query": query,
                    }

            time.sleep(WAIT_BETWEEN_CALLS)

        except Exception as e:
            print(f"  ⚠️ Error on query '{query}': {e}")
            continue

    # Sort by descending score
    return sorted(results.values(), key=lambda x: x["score"], reverse=True)



def load_user_features(path):
    """Load user feature sets from a JSON file."""
    with open(path, "r") as f:
        data = json.load(f)
    return data.get("features", [])


if __name__ == "__main__":
    if not API_KEY:
        raise ValueError("❌ Missing YOUTUBE_DATA_API_KEY in .env file")

    youtube = build("youtube", "v3", developerKey=API_KEY)
    users = load_user_features(USER_FEATURES_FILE)
    all_results = []

    for idx, feature_set in enumerate(users, start=1):
        print(f"\n==============================")
        print(f"🎨 User {idx} features: {feature_set}")
        print(f"==============================")

        videos = find_makeup_videos(feature_set, youtube)

        if not videos:
            print("No videos found for this feature set.")
            continue

        print("\nTop Matching Makeup Tutorials:")
        for v in videos[:10]:
            matched_str = ", ".join(v['matched_features'])
            print(f"- {v['title']} ({v['url']}) | Score: {v['score']} | Features matched: {matched_str}")

        all_results.append({
            "user_index": idx,
            "features": feature_set,
            "results": videos[:10]  # save top 10
        })

    # Save results to a JSON file
    with open(RESULTS_FILE, "w", encoding="utf-8") as f:
        json.dump(all_results, f, indent=2, ensure_ascii=False)

    print(f"\n✅ Results saved to {RESULTS_FILE}")
