// Mock YouTube API
export function generateSearchQueries(features) {
  return ['makeup tutorial for almond eyes', 'makeup tutorial for medium nose']
}

export async function searchYouTube(query, options = {}) {
  return {
    items: [
      {
        id: { videoId: 'test-video-id-1' },
        snippet: {
          title: 'Makeup Tutorial for Almond Eyes',
          description: 'Learn how to do makeup for almond eyes',
          channelTitle: 'Test Channel'
        }
      }
    ]
  }
}

export function scoreAndProcessResults(items, features, query) {
  return items.map(item => ({
    title: item.snippet.title,
    url: `https://youtube.com/watch?v=${item.id.videoId}`,
    channel: item.snippet.channelTitle,
    matched_features: ['almond eyes'],
    score: 2,
    query: query
  }))
}

