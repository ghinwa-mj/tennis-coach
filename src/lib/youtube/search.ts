/**
 * YouTube Data API v3 Client
 */

import {
  YouTubeSearchResponse,
  YouTubeVideoDetails,
  YouTubeVideo,
} from './types';

const API_KEY = process.env.YOUTUBE_v3_API;
const BASE_URL = 'https://www.googleapis.com/youtube/v3';

if (!API_KEY) {
  console.warn('Warning: YOUTUBE_v3_API environment variable is not set');
}

/**
 * Search for videos on YouTube
 * @param query - Search query string
 * @param maxResults - Maximum number of results to return (default: 5)
 * @returns Array of YouTube videos
 */
export async function searchVideos(
  query: string,
  maxResults: number = 5
): Promise<YouTubeVideo[]> {
  if (!API_KEY) {
    throw new Error('YouTube API key is not configured');
  }

  console.log(`[YouTube Search] Query: "${query}", MaxResults: ${maxResults}`);
  console.log(`[YouTube Search] API Key configured: ${!!API_KEY}`);
  console.log(`[YouTube Search] API Key length: ${API_KEY.length}`);

  try {
    // Step 1: Search for videos
    const searchUrl = new URL(`${BASE_URL}/search`);
    searchUrl.searchParams.append('part', 'snippet');
    searchUrl.searchParams.append('q', query);
    searchUrl.searchParams.append('type', 'video');
    searchUrl.searchParams.append('maxResults', maxResults.toString());
    searchUrl.searchParams.append('key', API_KEY);

    console.log(`[YouTube Search] Fetching URL: ${searchUrl.toString().replace(API_KEY, 'API_KEY_HIDDEN')}`);

    const searchResponse = await fetch(searchUrl.toString());
    console.log(`[YouTube Search] Response status: ${searchResponse.status}, OK: ${searchResponse.ok}`);

    if (!searchResponse.ok) {
      const errorText = await searchResponse.text();
      console.error(`[YouTube Search] Error response: ${errorText}`);
      throw new Error(`YouTube search API error: ${searchResponse.statusText} - ${errorText}`);
    }

    const searchData: YouTubeSearchResponse = await searchResponse.json();
    console.log(`[YouTube Search] Found ${searchData.items?.length || 0} items`);

    if (!searchData.items || searchData.items.length === 0) {
      return [];
    }

    // Extract video IDs
    const videoIds = searchData.items
      .map((item) => item.id.videoId)
      .filter((id): id is string => id !== undefined)
      .join(',');

    // Step 2: Get video details (duration, view count)
    const detailsUrl = new URL(`${BASE_URL}/videos`);
    detailsUrl.searchParams.append('part', 'contentDetails,statistics');
    detailsUrl.searchParams.append('id', videoIds);
    detailsUrl.searchParams.append('key', API_KEY);

    const detailsResponse = await fetch(detailsUrl.toString());
    console.log(`[YouTube Search] Details response status: ${detailsResponse.status}, OK: ${detailsResponse.ok}`);

    if (!detailsResponse.ok) {
      const errorText = await detailsResponse.text();
      console.error(`[YouTube Search] Details error response: ${errorText}`);
      throw new Error(`YouTube details API error: ${detailsResponse.statusText} - ${errorText}`);
    }

    const detailsData: YouTubeVideoDetails = await detailsResponse.json();
    console.log(`[YouTube Search] Got details for ${detailsData.items?.length || 0} videos`);

    // Create a map of video details for quick lookup
    const detailsMap = new Map(
      detailsData.items.map((item) => [item.id, item])
    );

    // Combine search results with details
    const videos: YouTubeVideo[] = searchData.items
      .filter((item) => item.id.videoId !== undefined)
      .map((item) => {
        const details = detailsMap.get(item.id.videoId!);
        return {
          videoId: item.id.videoId!,
          title: item.snippet.title,
          channel: item.snippet.channelTitle,
          thumbnail:
            item.snippet.thumbnails.high?.url ||
            item.snippet.thumbnails.medium?.url ||
            item.snippet.thumbnails.default?.url ||
            '',
          duration: details
            ? formatDuration(details.contentDetails.duration)
            : '',
          views: details
            ? formatViewCount(details.statistics.viewCount)
            : '',
          publishDate: formatDate(item.snippet.publishedAt),
        };
      });

    console.log(`[YouTube Search] Returning ${videos.length} videos`);
    if (videos.length > 0) {
      console.log(`[YouTube Search] First video:`, videos[0]);
    }

    return videos;
  } catch (error) {
    console.error('Error searching YouTube videos:', error);
    throw error;
  }
}

/**
 * Convert ISO 8601 duration to human-readable format
 * Example: PT1H2M3S -> 1:02:03
 */
function formatDuration(isoDuration: string): string {
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return '';

  const hours = match[1] ? parseInt(match[1]) : 0;
  const minutes = match[2] ? parseInt(match[2]) : 0;
  const seconds = match[3] ? parseInt(match[3]) : 0;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Format view count to human-readable format
 * Example: 1250000 -> 1.25M
 */
function formatViewCount(viewCount: string): string {
  const views = parseInt(viewCount);
  if (isNaN(views)) return '0';

  if (views >= 1000000) {
    return `${(views / 1000000).toFixed(1)}M views`;
  } else if (views >= 1000) {
    return `${(views / 1000).toFixed(1)}K views`;
  }
  return `${views} views`;
}

/**
 * Format ISO date to human-readable format
 * Example: 2023-01-15T00:00:00Z -> Jan 15, 2023
 */
function formatDate(isoDate: string): string {
  const date = new Date(isoDate);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
