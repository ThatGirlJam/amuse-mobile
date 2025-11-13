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

MAX_RESULTS_PER_QUERY = 10
WAIT_BETWEEN_CALLS = 0.3  # seconds


