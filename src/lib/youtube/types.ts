/**
 * YouTube Data API v3 Types
 */

export interface YouTubeVideo {
  videoId: string;
  title: string;
  channel: string;
  thumbnail: string;
  duration: string;
  views: string;
  publishDate: string;
}

export interface YouTubeSearchResponse {
  items: YouTubeSearchItem[];
  nextPageToken?: string;
  prevPageToken?: string;
  pageInfo: {
    totalResults: number;
    resultsPerPage: number;
  };
}

export interface YouTubeSearchItem {
  kind: string;
  etag: string;
  id: {
    kind: string;
    videoId?: string;
    channelId?: string;
    playlistId?: string;
  };
  snippet: {
    publishedAt: string;
    channelId: string;
    title: string;
    description: string;
    thumbnails: {
      default?: YouTubeThumbnail;
      medium?: YouTubeThumbnail;
      high?: YouTubeThumbnail;
      standard?: YouTubeThumbnail;
      maxres?: YouTubeThumbnail;
    };
    channelTitle: string;
    liveBroadcastContent: string;
  };
}

export interface YouTubeThumbnail {
  url: string;
  width: number;
  height: number;
}

export interface YouTubeVideoDetails {
  items: YouTubeVideoDetailItem[];
}

export interface YouTubeVideoDetailItem {
  kind: string;
  etag: string;
  id: string;
  contentDetails: {
    duration: string;
    dimension: string;
    definition: string;
    caption: string;
    licensedContent: boolean;
    contentRating: Record<string, unknown>;
    projection: string;
  };
  statistics: {
    viewCount: string;
    likeCount: string;
    favoriteCount: string;
    commentCount: string;
  };
}

/**
 * Recommendation types for the API response
 */

export interface RecommendationRequest {
  userProfile: {
    name?: string;
    skillLevel?: string;
    yearsPlaying?: string;
    playingStyle?: string;
    goals?: string[];
    focusAreas?: string[];
    injuries?: string[];
    dominantHand?: string;
    hasCompletedOnboarding?: boolean;
  };
  conversationSummary?: string;
  ragEnabled: boolean;
}

export interface RecommendationResponse {
  recommendations: YouTubeVideo[];
  reasoning: string;
}

export interface RecommendationError {
  error: string;
  message: string;
}
