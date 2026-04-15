import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { searchVideos } from '@/lib/youtube/search';
import {
  RecommendationRequest,
  RecommendationResponse,
  RecommendationError,
} from '@/lib/youtube/types';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * Build prompt for Claude to analyze user profile and generate YouTube search queries
 */
function buildRecommendationsPrompt(userProfile: RecommendationRequest['userProfile']): string {
  let prompt = `You are a tennis coaching expert analyzing a player's profile to recommend YouTube videos.

Player Profile:
- Skill Level: ${userProfile.skillLevel || 'Not specified'}
`;

  if (userProfile.yearsPlaying) {
    prompt += `- Years Playing: ${userProfile.yearsPlaying}\n`;
  }

  if (userProfile.playingStyle) {
    prompt += `- Playing Style: ${userProfile.playingStyle}\n`;
  }

  if (userProfile.goals && userProfile.goals.length > 0) {
    prompt += `- Goals: ${userProfile.goals.join(', ')}\n`;
  }

  if (userProfile.focusAreas && userProfile.focusAreas.length > 0) {
    prompt += `- Focus Areas: ${userProfile.focusAreas.join(', ')}\n`;
  }

  if (userProfile.injuries && userProfile.injuries.length > 0) {
    prompt += `- Injuries/Physical Considerations: ${userProfile.injuries.join(', ')}\n`;
  }

  prompt += `
Based on this profile:
1. Identify their current skill level and what they should focus on
2. Consider their goals and focus areas
3. Be mindful of any injuries and suggest appropriate content
4. Generate exactly 2 specific YouTube search queries that would help them improve

Each search query should:
- Be specific to tennis technique, tactics, or training
- Match their skill level (use terms like "beginner", "intermediate", "advanced" appropriately)
- Address their goals and focus areas
- Account for injuries if present (avoid content that might aggravate injuries)

Return ONLY a JSON array of search query strings (no other text):
["query 1", "query 2"]

Examples:
- Beginner wanting to learn forehand: ["beginner tennis forehand basics", "how to hit forehand tennis beginner"]
- Intermediate focused on serve: ["improve tennis serve consistency intermediate", "tennis serve toss drills"]
- Advanced working on volley: ["advanced tennis volley technique", "net game transition tennis"]`;

  return prompt;
}

/**
 * Parse Claude's response to extract search query array
 */
function parseSearchQueries(response: string): string[] {
  try {
    // Try to parse as JSON directly
    const parsed = JSON.parse(response.trim());
    if (Array.isArray(parsed) && parsed.length === 2) {
      return parsed;
    }
  } catch (e) {
    // If JSON parsing fails, try to extract array from text
    const arrayMatch = response.match(/\[[\s\S]*\]/);
    if (arrayMatch) {
      try {
        const parsed = JSON.parse(arrayMatch[0]);
        if (Array.isArray(parsed)) {
          return parsed.slice(0, 2);
        }
      } catch (e) {
        // Ignore
      }
    }
  }

  // Fallback: split by common delimiters
  const lines = response
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith('//') && !line.startsWith('#'))
    .slice(0, 2);

  return lines;
}

export async function POST(request: NextRequest) {
  try {
    const reqBody: RecommendationRequest & { customQuery?: string } = await request.json();
    const { userProfile, customQuery } = reqBody;

    console.log('Received profile:', userProfile);
    console.log('Skill level:', userProfile?.skillLevel);
    console.log('Has completed onboarding:', userProfile?.hasCompletedOnboarding);
    console.log('Custom query:', customQuery);

    // Check if user has a skill level (this means they've completed onboarding)
    if (!userProfile?.skillLevel) {
      console.log('Profile validation failed - no skill level');
      const errorResponse: RecommendationError = {
        error: 'PERSONA_REQUIRED',
        message:
          'Please complete your profile first to get personalized video recommendations. Click on "Profile" in the top right to set up your tennis profile.',
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    let searchQueries: string[];

    // If custom query is provided, use it directly
    if (customQuery && customQuery.trim()) {
      console.log('Using custom query:', customQuery);
      searchQueries = [customQuery.trim()];
    } else {
      // Otherwise, use Claude to generate search queries based on profile
      // Build prompt for Claude
      const prompt = buildRecommendationsPrompt(userProfile);

      // Call Claude to generate search queries
      let claudeResponse: string = '';
      try {
        const response = await anthropic.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 500,
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
        });

        claudeResponse =
          response.content[0]?.type === 'text' ? response.content[0].text : '';
      } catch (claudeError) {
        console.error('Error calling Claude API:', claudeError);
        // Fallback to generic queries based on skill level
        const skillLevel = userProfile.skillLevel.toLowerCase();
        if (skillLevel.includes('beginner') || skillLevel.includes('1.0') || skillLevel.includes('2.0')) {
          claudeResponse = '["beginner tennis basics", "tennis fundamentals for beginners"]';
        } else if (skillLevel.includes('intermediate') || skillLevel.includes('3.0') || skillLevel.includes('4.0')) {
          claudeResponse = '["intermediate tennis technique", "improve tennis strokes intermediate"]';
        } else {
          claudeResponse = '["advanced tennis technique", "professional tennis training"]';
        }
      }

      // Parse search queries
      searchQueries = parseSearchQueries(claudeResponse);
    }

    console.log('=== YOUTUBE SEARCH ===');
    if (typeof claudeResponse !== 'undefined') {
      console.log('Claude response:', claudeResponse);
    }
    console.log('Custom query:', customQuery);
    console.log('Parsed search queries:', searchQueries);
    console.log('Number of queries:', searchQueries.length);
    console.log('=====================');

    if (searchQueries.length === 0) {
      throw new Error('Failed to generate search queries');
    }

    // Search YouTube for each query
    const allVideos: any[] = [];
    const seenVideoIds = new Set<string>();
    const maxVideos = 6; // Always show max 6 videos
    const videosPerQuery = 6; // Fetch 6 videos per query

    for (const query of searchQueries) {
      console.log(`Searching for: "${query}"`);
      try {
        const videos = await searchVideos(query, videosPerQuery);
        console.log(`Found ${videos.length} videos for query: "${query}"`);

        // Deduplicate by video ID
        for (const video of videos) {
          if (!seenVideoIds.has(video.videoId) && allVideos.length < maxVideos) {
            seenVideoIds.add(video.videoId);
            allVideos.push(video);
          }

          if (allVideos.length >= maxVideos) {
            break;
          }
        }

        if (allVideos.length >= maxVideos) {
          break;
        }
      } catch (searchError) {
        console.error(`Error searching for "${query}":`, searchError);
        // Continue with next query
      }
    }

    console.log(`Total unique videos found: ${allVideos.length}`);

    // Generate reasoning text
    let reasoning: string;

    if (customQuery) {
      reasoning = `Based on your request for "${customQuery}", I found these videos to help you improve.`;
    } else {
      const firstGoal = userProfile.goals && userProfile.goals.length > 0 ? userProfile.goals[0] : null;
      const firstFocusArea = userProfile.focusAreas && userProfile.focusAreas.length > 0 ? userProfile.focusAreas[0] : null;

      reasoning = `Based on your ${userProfile.skillLevel} skill level`;

      if (firstGoal) {
        reasoning += ` and goal to ${firstGoal}`;
      }

      if (firstFocusArea) {
        reasoning += `, focusing on ${firstFocusArea}`;
      }

      reasoning += ', I found these videos to help you improve.';
    }

    const responseBody: RecommendationResponse = {
      recommendations: allVideos,
      reasoning,
    };

    return NextResponse.json(responseBody);
  } catch (error) {
    console.error('Error generating recommendations:', error);

    const errorResponse: RecommendationError = {
      error: 'RECOMMENDATION_ERROR',
      message:
        error instanceof Error
          ? error.message
          : 'Failed to generate video recommendations. Please try again.',
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}
