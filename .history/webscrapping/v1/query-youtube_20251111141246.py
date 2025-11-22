# Use YouTube's Data API
# This script requests videos from YouTube using the
# Google Cloud Console API key. The response is then
# parsed to find
#  * Title
#  * Video ID
#  * Description
#  * Channel Name

from googleapiclient.discovery import build
from itertools import combinations
import time

USER_FEATURES_FILE = "user-features.json"
MAX_RESULTS_PER_QUERY = 10
WAIT_BETWEEN_CALLS = 0.3  # seconds

def find_makeup_videos(features):
    """
    Find makeup tutorials matching the given facial features.

    features: dict
        Example: {"eye_shape": "almond", "nose": "medium", "lips": "full"}

    Returns: list of dicts
    """
    youtube = build("youtube", "v3", developerKey=API_KEY)
    feature_values = list(features.values())

    # Create search queries (single features up to all combinations)
    search_queries = []
    for r in range(1, len(feature_values) + 1):
        for combo in combinations(feature_values, r):
            q = "makeup tutorial " + " ".join(combo)
            search_queries.append(q)

    results = {}

    for query in search_queries:
        print(f"Searching: {query}")
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

                # Compute feature match score
                score = sum(1 for f in feature_values if f in title or f in desc)

                if vid not in results or score > results[vid]["score"]:
                    results[vid] = {
                        "title": item["snippet"]["title"],
                        "url": f"https://youtube.com/watch?v={vid}",
                        "channel": item["snippet"]["channelTitle"],
                        "matched_features": [f for f in feature_values if f in title or f in desc],
                        "score": score,
                        "query": query,
                    }

            time.sleep(WAIT_BETWEEN_CALLS)  # avoid quota spikes

        except Exception as e:
            print(f"Error on query '{query}': {e}")
            continue

    # Sort by descending score
    sorted_results = sorted(results.values(), key=lambda x: x["score"], reverse=True)
    return sorted_results
