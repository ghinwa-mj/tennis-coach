'use client';

import { useState } from 'react';
import { UserProfile, defaultUserProfile, skillLevelLabels, playingStyleLabels, goalLabels } from '@/types/user';
import { storage } from '@/lib/storage';

interface OnboardingModalProps {
  onComplete: (profile: UserProfile) => void;
  onSkip: () => void;
}

export default function OnboardingModal({ onComplete, onSkip }: OnboardingModalProps) {
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState<Partial<UserProfile>>({
    skillLevel: 'beginner',
    goals: [],
    focusAreas: [],
  });

  const updateProfile = (updates: Partial<UserProfile>) => {
    setProfile((prev) => ({ ...prev, ...updates }));
  };

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      const finalProfile: UserProfile = {
        ...defaultUserProfile,
        ...profile,
        skillLevel: profile.skillLevel || 'beginner',
        goals: profile.goals || [],
        focusAreas: profile.focusAreas || [],
        hasCompletedOnboarding: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      storage.saveUserProfile(finalProfile);
      onComplete(finalProfile);
    }
  };

  const skipOnboarding = () => {
    const finalProfile: UserProfile = {
      ...defaultUserProfile,
      hasCompletedOnboarding: false, // Skipped = no personalization
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    storage.saveUserProfile(finalProfile);
    onSkip();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Welcome to TennisCoach AI! 🎾
          </h2>
          <p className="text-gray-600">
            Step {step} of 3: Tell us a bit about yourself
          </p>
        </div>

        {/* Step 1: Basic Info */}
        {step === 1 && (
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                What's your name?
              </label>
              <input
                type="text"
                value={profile.name || ''}
                onChange={(e) => updateProfile({ name: e.target.value })}
                placeholder="Enter your name (optional)"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-wimbledon-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                What's your skill level?
              </label>
              <div className="space-y-2">
                {(Object.keys(skillLevelLabels) as Array<keyof typeof skillLevelLabels>).map((level) => (
                  <button
                    key={level}
                    onClick={() => updateProfile({ skillLevel: level })}
                    className={`w-full p-4 rounded-lg border-2 text-left transition-colors ${
                      profile.skillLevel === level
                        ? 'border-wimbledon-500 bg-wimbledon-50'
                        : 'border-gray-200 hover:border-wimbledon-100'
                    }`}
                  >
                    <div className="font-medium">{skillLevelLabels[level]}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                How many years have you been playing?
              </label>
              <input
                type="number"
                value={profile.yearsPlaying || ''}
                onChange={(e) => updateProfile({ yearsPlaying: parseInt(e.target.value) || 0 })}
                placeholder="Number of years"
                min="0"
                max="50"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-wimbledon-500"
              />
            </div>
          </div>
        )}

        {/* Step 2: Playing Style & Goals */}
        {step === 2 && (
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                What's your playing style? (optional)
              </label>
              <select
                value={profile.playingStyle || ''}
                onChange={(e) => updateProfile({ playingStyle: e.target.value as any })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-wimbledon-500"
              >
                <option value="">Select your style...</option>
                {(Object.keys(playingStyleLabels) as Array<keyof typeof playingStyleLabels>).map((style) => (
                  <option key={style} value={style}>
                    {playingStyleLabels[style]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                What are your goals? (select all that apply)
              </label>
              <div className="space-y-2">
                {(Object.keys(goalLabels) as Array<keyof typeof goalLabels>).map((goal) => (
                  <label
                    key={goal}
                    className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                      profile.goals?.includes(goal)
                        ? 'border-wimbledon-500 bg-wimbledon-50'
                        : 'border-gray-200 hover:border-wimbledon-100'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={profile.goals?.includes(goal) || false}
                      onChange={(e) => {
                        const currentGoals = profile.goals || [];
                        updateProfile({
                          goals: e.target.checked
                            ? [...currentGoals, goal]
                            : currentGoals.filter((g) => g !== goal),
                        });
                      }}
                      className="mr-3"
                    />
                    <span className="font-medium">{goalLabels[goal]}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Additional Details */}
        {step === 3 && (
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                What do you want to focus on? (select all that apply)
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  'Forehand',
                  'Backhand',
                  'Serve',
                  'Volley',
                  'Footwork',
                  'Mental Game',
                  'Fitness',
                  'Strategy',
                ].map((area) => (
                  <label
                    key={area}
                    className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                      profile.focusAreas?.includes(area)
                        ? 'border-wimbledon-500 bg-wimbledon-50'
                        : 'border-gray-200 hover:border-wimbledon-100'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={profile.focusAreas?.includes(area) || false}
                      onChange={(e) => {
                        const currentAreas = profile.focusAreas || [];
                        updateProfile({
                          focusAreas: e.target.checked
                            ? [...currentAreas, area]
                            : currentAreas.filter((a) => a !== area),
                        });
                      }}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium">{area}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Any injuries or physical limitations? (optional)
              </label>
              <textarea
                value={profile.injuries?.join(', ') || ''}
                onChange={(e) =>
                  updateProfile({ injuries: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })
                }
                placeholder="e.g., Tennis elbow, knee problems"
                rows={2}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-wimbledon-500"
              />
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex justify-between">
          <button
            onClick={skipOnboarding}
            className="px-6 py-2 text-gray-600 hover:text-gray-800 font-medium"
          >
            Skip
          </button>
          <div className="flex gap-3">
            {step > 1 && (
              <button
                onClick={() => setStep(step - 1)}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
              >
                Back
              </button>
            )}
            <button
              onClick={handleNext}
              className="px-6 py-2 bg-wimbledon-500 text-white rounded-lg hover:bg-wimbledon-600 font-medium"
            >
              {step === 3 ? 'Get Started' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
