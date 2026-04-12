export type SkillLevel = 'beginner' | 'intermediate' | 'advanced';

export type PlayingStyle = 'baseline' | 'serve-and-volley' | 'all-court' | 'defensive' | 'aggressive';

export type GoalType =
  | 'improve-technique'
  | 'competitive-play'
  | 'fitness-fun'
  | 'learn-basics'
  | 'specific-shot';

export interface UserProfile {
  // Basic Info
  name?: string;
  skillLevel?: SkillLevel; // Now optional - only set when user completes onboarding
  yearsPlaying?: number;

  // Playing Style
  playingStyle?: PlayingStyle;
  dominantHand?: 'left' | 'right';

  // Goals & Focus
  goals?: GoalType[];
  focusAreas?: string[];

  // Physical & Constraints
  fitnessLevel?: 'low' | 'moderate' | 'high';
  injuries?: string[];
  age?: number;

  // Preferences
  learningStyle?: 'visual' | 'auditory' | 'kinesthetic' | 'mixed';
  preferredDrillType?: 'solo' | 'partner' | 'both';

  // Metadata
  hasCompletedOnboarding?: boolean; // Track if user actually filled out profile
  createdAt?: number;
  updatedAt?: number;
}

export const defaultUserProfile: UserProfile = {
  // No defaults - user must complete onboarding
  hasCompletedOnboarding: false,
};

export const skillLevelLabels: Record<SkillLevel, string> = {
  beginner: 'Beginner (0-2 years)',
  intermediate: 'Intermediate (2-5 years)',
  advanced: 'Advanced (5+ years)',
};

export const playingStyleLabels: Record<PlayingStyle, string> = {
  baseline: 'Baseline Player',
  'serve-and-volley': 'Serve & Volley',
  'all-court': 'All-Court Player',
  defensive: 'Defensive/Counter-puncher',
  aggressive: 'Aggressive Baseliner',
};

export const goalLabels: Record<GoalType, string> = {
  'improve-technique': 'Improve Technique',
  'competitive-play': 'Competitive Play',
  'fitness-fun': 'Fitness & Fun',
  'learn-basics': 'Learn Basics',
  'specific-shot': 'Fix Specific Shot',
};
