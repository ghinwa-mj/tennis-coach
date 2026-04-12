import Anthropic from '@anthropic-ai/sdk';
import { wrapAnthropic } from 'langsmith/wrappers/anthropic';
import { uuid7 } from 'langsmith';
import { NextRequest, NextResponse } from 'next/server';
import { UserProfile } from '@/types/user';

const anthropic = wrapAnthropic(
  new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  })
);

const BASE_SYSTEM_PROMPT = `You are TennisCoach AI, a friendly and knowledgeable tennis coach designed to help beginners and intermediate players improve their game.

You can answer questions about all aspects of tennis including technique (forehand, backhand, serve, volley), tactics and strategy, fitness and conditioning, equipment, rules, and the mental side of the game.

Your tone is encouraging, clear, and practical. You explain things simply — avoid overly technical jargon unless asked. When relevant, suggest simple drills or exercises the player can try on court.

If a question is not related to tennis, politely redirect the conversation back to tennis.

Keep responses concise but helpful. Use bullet points or short steps when explaining technique or drills.`;

function buildPersonalizedPrompt(userProfile: UserProfile): string {
  let prompt = BASE_SYSTEM_PROMPT;

  if (userProfile.name) {
    prompt += `\n\nThe player's name is ${userProfile.name}.`;
  }

  prompt += `\n\nPlayer Profile:
- Skill Level: ${userProfile.skillLevel}`;

  if (userProfile.yearsPlaying) {
    prompt += `\n- Years Playing: ${userProfile.yearsPlaying}`;
  }

  if (userProfile.playingStyle) {
    prompt += `\n- Playing Style: ${userProfile.playingStyle}`;
  }

  if (userProfile.goals && userProfile.goals.length > 0) {
    prompt += `\n- Goals: ${userProfile.goals.join(', ')}`;
  }

  if (userProfile.focusAreas && userProfile.focusAreas.length > 0) {
    prompt += `\n- Focus Areas: ${userProfile.focusAreas.join(', ')}`;
  }

  if (userProfile.injuries && userProfile.injuries.length > 0) {
    prompt += `\n- Physical Considerations: ${userProfile.injuries.join(', ')}`;
  }

  if (userProfile.dominantHand) {
    prompt += `\n- Dominant Hand: ${userProfile.dominantHand}`;
  }

  prompt += `

**IMPORTANT:** Tailor your advice to this player's skill level and goals. If they're a beginner, keep things simple and focus on fundamentals. If they have specific focus areas, prioritize those in your responses. If they have injuries, be mindful and suggest appropriate modifications.

When suggesting drills, consider their goals and focus areas. Make the coaching feel personalized to their situation.`;

  return prompt;
}

const USER_QUESTION_METADATA_MAX = 8000;
const RUN_NAME_QUESTION_MAX = 120;

function latestUserQuestionText(
  msgs: { role: string; content: string }[]
): string {
  for (let i = msgs.length - 1; i >= 0; i--) {
    if (msgs[i].role === 'user' && typeof msgs[i].content === 'string') {
      return msgs[i].content.trim();
    }
  }
  return '';
}

/** Collapse whitespace so trace names stay readable in the LangSmith table. */
function singleLinePreview(s: string): string {
  return s.replace(/\s+/g, ' ').trim();
}

export async function POST(request: NextRequest) {
  try {
    const { messages, userProfile, threadId: bodyThreadId } = await request.json();

    // Only use personalization if user has completed onboarding and has a skill level
    const hasValidProfile =
      userProfile &&
      userProfile.hasCompletedOnboarding &&
      userProfile.skillLevel;

    const systemPrompt = hasValidProfile
      ? buildPersonalizedPrompt(userProfile)
      : BASE_SYSTEM_PROMPT;

    const threadId =
      typeof bodyThreadId === 'string' && bodyThreadId.trim().length > 0
        ? bodyThreadId.trim()
        : uuid7();

    const langSmithApiKey =
      process.env.LANGSMITH_API_KEY ?? process.env.LANGCHAIN_API_KEY;

    const anthropicMessages = messages.map(
      (msg: { role: string; content: string }) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })
    );

    const latestQuestion = latestUserQuestionText(anthropicMessages);
    const questionForMetadata =
      latestQuestion.length > USER_QUESTION_METADATA_MAX
        ? `${latestQuestion.slice(0, USER_QUESTION_METADATA_MAX)}…`
        : latestQuestion;
    const questionLine = singleLinePreview(latestQuestion);
    const questionForRunName =
      questionLine.length > RUN_NAME_QUESTION_MAX
        ? `${questionLine.slice(0, RUN_NAME_QUESTION_MAX - 1)}…`
        : questionLine;
    const traceRunName =
      questionForRunName.length > 0
        ? `tennis-coach · ${questionForRunName}`
        : 'tennis-coach-chat';

    const requestOptions = langSmithApiKey
      ? {
          langsmithExtra: {
            name: traceRunName,
            metadata: {
              thread_id: threadId,
              user_question: questionForMetadata,
              model: 'claude-sonnet-4-20250514',
              messageCount: messages.length,
              hasProfile: hasValidProfile,
            },
          },
        }
      : undefined;

    const response = await anthropic.messages.create(
      {
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        system: systemPrompt,
        messages: anthropicMessages,
      },
      requestOptions
    );

    const assistantMessage =
      response.content[0]?.type === 'text' ? response.content[0].text : '';

    return NextResponse.json({
      role: 'assistant',
      content: assistantMessage,
    });
  } catch (error) {
    console.error('Error calling Anthropic API:', error);
    return NextResponse.json(
      { error: 'Failed to get response from TennisCoach AI' },
      { status: 500 }
    );
  }
}
