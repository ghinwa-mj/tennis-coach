'use client';

import { useState } from 'react';
import {
  UserProfile,
  defaultUserProfile,
  skillLevelLabels,
  playingStyleLabels,
  goalLabels,
} from '@/types/user';
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
      hasCompletedOnboarding: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    storage.saveUserProfile(finalProfile);
    onSkip();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        className="
          bg-white w-full sm:max-w-lg
          rounded-t-2xl sm:rounded-2xl
          h-[85dvh] max-h-[85dvh]
          flex flex-col
          overflow-hidden shadow-xl
        "
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-modal-title"
      >
        {/* Header */}
        <div className="shrink-0 px-4 py-4 sm:p-6 border-b border-clay-200">
          <h2
            id="onboarding-modal-title"
            className="text-xl sm:text-2xl font-heading font-bold text-navy-900 mb-1"
          >
            Welcome to TennisCoach AI
          </h2>
          <p className="text-navy-50 text-sm sm:text-base">
            Step {step} of 3: Tell us a bit about yourself
          </p>
        </div>

        {/* Body — scrolls; footer stays pinned */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 py-4 sm:p-6 space-y-4">
          {step === 1 && (
            <>
              <div>
                <label className="block text-sm font-medium text-navy-900 mb-2">
                  What&apos;s your name?
                </label>
                <input
                  type="text"
                  value={profile.name || ''}
                  onChange={(e) => updateProfile({ name: e.target.value })}
                  placeholder="Enter your name (optional)"
                  className="w-full px-4 py-3 border border-clay-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-wimbledon-500 bg-clay-50 text-base"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-navy-900 mb-2">
                  What&apos;s your skill level?
                </label>
                <div className="space-y-2">
                  {(Object.keys(skillLevelLabels) as Array<keyof typeof skillLevelLabels>).map(
                    (level) => (
                      <button
                        key={level}
                        type="button"
                        onClick={() => updateProfile({ skillLevel: level })}
                        className={`w-full p-4 rounded-lg border-2 text-left transition-colors ${
                          profile.skillLevel === level
                            ? 'border-wimbledon-500 bg-wimbledon-50'
                            : 'border-clay-200'
                        }`}
                      >
                        <div className="font-medium">{skillLevelLabels[level]}</div>
                      </button>
                    )
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-navy-900 mb-2">
                  How many years have you been playing?
                </label>
                <input
                  type="number"
                  value={profile.yearsPlaying || ''}
                  onChange={(e) =>
                    updateProfile({ yearsPlaying: parseInt(e.target.value) || 0 })
                  }
                  placeholder="Number of years"
                  min="0"
                  max="50"
                  className="w-full px-4 py-3 border border-clay-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-wimbledon-500 bg-clay-50 text-base"
                />
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div>
                <label className="block text-sm font-medium text-navy-900 mb-2">
                  What&apos;s your playing style? (optional)
                </label>
                <select
                  value={profile.playingStyle || ''}
                  onChange={(e) => updateProfile({ playingStyle: e.target.value as any })}
                  className="w-full px-4 py-3 border border-clay-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-wimbledon-500 bg-clay-50 text-base"
                >
                  <option value="">Select your style...</option>
                  {(Object.keys(playingStyleLabels) as Array<keyof typeof playingStyleLabels>).map(
                    (style) => (
                      <option key={style} value={style}>
                        {playingStyleLabels[style]}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-navy-900 mb-2">
                  What are your goals? (select all that apply)
                </label>
                <div className="space-y-2">
                  {(Object.keys(goalLabels) as Array<keyof typeof goalLabels>).map((goal) => (
                    <label
                      key={goal}
                      className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                        profile.goals?.includes(goal)
                          ? 'border-wimbledon-500 bg-wimbledon-50'
                          : 'border-clay-200'
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
            </>
          )}

          {step === 3 && (
            <>
              <div>
                <label className="block text-sm font-medium text-navy-900 mb-2">
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
                          : 'border-clay-200'
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
                <label className="block text-sm font-medium text-navy-900 mb-2">
                  Any injuries or physical limitations? (optional)
                </label>
                <textarea
                  value={profile.injuries?.join(', ') || ''}
                  onChange={(e) =>
                    updateProfile({
                      injuries: e.target.value
                        .split(',')
                        .map((s) => s.trim())
                        .filter(Boolean),
                    })
                  }
                  placeholder="e.g., Tennis elbow, knee problems"
                  rows={2}
                  className="w-full px-4 py-3 border border-clay-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-wimbledon-500 bg-clay-50 text-base"
                />
              </div>
            </>
          )}
        </div>

        {/* Footer — pinned */}
        <div
          className="
            shrink-0 border-t border-clay-200 bg-white
            px-4 pt-3 sm:px-6
            pb-[max(0.75rem,env(safe-area-inset-bottom))]
            space-y-2
          "
        >
          <button
            type="button"
            onClick={handleNext}
            className="w-full px-4 py-3 bg-wimbledon-500 text-white rounded-lg hover:bg-wimbledon-600 font-medium text-base shadow-sm"
          >
            {step === 3 ? 'Get Started' : 'Next'}
          </button>
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={skipOnboarding}
              className="px-3 py-2.5 text-navy-50 hover:text-navy-900 font-medium text-sm"
            >
              Skip
            </button>
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="px-4 py-2.5 border border-clay-200 rounded-lg hover:bg-clay-50 font-medium text-sm"
              >
                Back
              </button>
            ) : (
              <span />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
