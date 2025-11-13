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
    Improved version: natural language queries + flexible scoring
    """

    feature_keywords = {}
    for k, v in features.items():
        if "eye" in k:
            feature_keywords[k] = [f"{v} eyes", f"makeup for {v} eyes"]
        elif "nose" in k:
            feature_keywords[k] = [f"{v} nose", f"contouring for {v} nose"]
        elif "lip" in k:
            feature_keywords[k] = [f"{v} lips", f"lip makeup for {v} lips"]
        else:
            feature_keywords[k] = [v]

    # Build concise natural queries
    search_queries = []
    for k, vals in feature_keywords.items():
        for val in vals:
            search_queries.append(f"makeup tutorial for {val}")
    # Add one personalized combo query
    combo_query = "makeup tutorial for " + " ".join(
        [f"{v[0]}" for v in feature_keywords.values()]
    )
    search_queries.append(combo_query)

    random.shuffle(search_queries)  # randomize to diversify API responses

    results = {}

    for query in search_queries:
        print(f"  🔍 Searching: {query}")
        try:
            response = youtube.search().list(
                q=query,
                part="snippet",
                type="video",
                videoCategoryId="26",
                maxResults=MAX_RESULTS_PER_QUERY
            ).execute()

            for item in response.get("items", []):
                vid = item["id"]["videoId"]
                title = item["snippet"]["title"].lower()
                desc = item["snippet"]["description"].lower()
                text = title + " " + desc

                score = 0
                matched = []

                for k, vals in feature_keywords.items():
                    for v in vals:
                        pattern = re.sub(r"[^a-z0-9 ]", "", v.lower())
                        if re.search(pattern, text):
                            # Weighted scoring
                            if "eyes" in v:
                                score += 2
                            elif "lips" in v:
                                score += 1.5
                            else:
                                score += 1
                            matched.append(v)

                if vid not in results or score > results[vid]["score"]:
                    results[vid] = {
                        "title": item["snippet"]["title"],
                        "url": f"https://youtube.com/watch?v={vid}",
                        "channel": item["snippet"]["channelTitle"],
                        "matched_features": matched,
                        "score": score,
                        "query": query,
                    }

            time.sleep(WAIT_BETWEEN_CALLS)

        except Exception as e:
            print(f"  ⚠️ Error on query '{query}': {e}")
            continue

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
