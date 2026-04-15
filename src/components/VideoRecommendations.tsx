'use client';

import React, { useState, useEffect } from 'react';
import { storage } from '@/lib/storage';
import { UserProfile, defaultUserProfile } from '@/types/user';
import { YouTubeVideo } from '@/lib/youtube/types';
import VideoCard from './VideoCard';
import EmbeddedPlayer from './EmbeddedPlayer';
import ProfileModal from './ProfileModal';
import OnboardingModal from './OnboardingModal';

type LoadingState = 'idle' | 'loading' | 'error' | 'no-persona' | 'success';

export default function VideoRecommendations() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loadingState, setLoadingState] = useState<LoadingState>('idle');
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [reasoning, setReasoning] = useState<string>('');
  const [selectedVideo, setSelectedVideo] = useState<YouTubeVideo | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [showCustomSearch, setShowCustomSearch] = useState(false);
  const [customQuery, setCustomQuery] = useState('');
  const [isCustomSearch, setIsCustomSearch] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);

  // Load user profile on mount
  useEffect(() => {
    const profile = storage.getUserProfile();
    console.log('=== PROFILE DEBUG ===');
    console.log('Full profile object:', profile);
    console.log('Skill level:', profile?.skillLevel);
    console.log('Has completed onboarding:', profile?.hasCompletedOnboarding);
    console.log('Type of skillLevel:', typeof profile?.skillLevel);
    console.log('Type of hasCompletedOnboarding:', typeof profile?.hasCompletedOnboarding);
    console.log('===================');
    setUserProfile(profile);
  }, []);

  // Load recommendations when component mounts
  useEffect(() => {
    if (userProfile) {
      // Check if user has a skill level (this means they've completed onboarding)
      const hasSkillLevel = !!userProfile.skillLevel;

      console.log('=== VALIDATION CHECK ===');
      console.log('hasSkillLevel:', hasSkillLevel);
      console.log('skillLevel value:', userProfile.skillLevel);
      console.log('hasCompletedOnboarding:', userProfile.hasCompletedOnboarding);
      console.log('======================');

      if (!hasSkillLevel) {
        console.log('❌ Profile validation failed - no skill level');
        setLoadingState('no-persona');
        setErrorMessage('Please complete your profile first to get personalized video recommendations.');
        return;
      }

      console.log('✅ Profile validation passed, loading recommendations...');
      loadRecommendations();
    }
  }, [userProfile]);

  const loadRecommendations = async (customSearchQuery?: string) => {
    setLoadingState('loading');
    setErrorMessage('');
    setIsCustomSearch(!!customSearchQuery);

    console.log('Loading recommendations with profile:', userProfile);
    console.log('Skill level:', userProfile?.skillLevel);
    console.log('Custom search query:', customSearchQuery);

    try {
      const response = await fetch('/api/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userProfile,
          ragEnabled: storage.isRAGEnabled(),
          customQuery: customSearchQuery,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.error === 'PERSONA_REQUIRED') {
          setLoadingState('no-persona');
          setErrorMessage(data.message);
        } else {
          setLoadingState('error');
          setErrorMessage(data.message || 'Failed to load recommendations');
        }
        return;
      }

      setVideos(data.recommendations);
      setReasoning(data.reasoning);
      setLoadingState('success');
    } catch (error) {
      console.error('Error loading recommendations:', error);
      setLoadingState('error');
      setErrorMessage('Failed to connect to the server. Please try again.');
    }
  };

  const handleRefresh = () => {
    loadRecommendations();
  };

  const handleVideoClick = (video: YouTubeVideo) => {
    setSelectedVideo(video);
  };

  const handleClosePlayer = () => {
    setSelectedVideo(null);
  };

  const handleCustomSearch = () => {
    setShowCustomSearch(true);
    setCustomQuery('');
  };

  const handleCustomSearchSubmit = () => {
    if (customQuery.trim()) {
      setShowCustomSearch(false);
      loadRecommendations(customQuery.trim());
    }
  };

  const handleCustomSearchCancel = () => {
    setShowCustomSearch(false);
    setCustomQuery('');
  };

  const handleOpenProfile = () => {
    console.log('Opening profile modal...');
    console.log('userProfile:', userProfile);
    console.log('skillLevel:', userProfile?.skillLevel);
    console.log('hasCompletedOnboarding:', userProfile?.hasCompletedOnboarding);

    // If user has no profile or hasn't completed onboarding, show onboarding
    const needsOnboarding = !userProfile?.skillLevel || userProfile?.hasCompletedOnboarding === false;
    console.log('needsOnboarding:', needsOnboarding);

    if (needsOnboarding) {
      console.log('Showing OnboardingModal');
      setShowOnboardingModal(true);
    } else {
      console.log('Showing ProfileModal');
      setShowProfileModal(true);
    }
  };

  const handleOnboardingComplete = (profile: UserProfile) => {
    console.log('Onboarding completed:', profile);
    setUserProfile(profile);
    setShowOnboardingModal(false);
    storage.saveUserProfile(profile);
    // Load recommendations after onboarding
    loadRecommendations();
  };

  const handleOnboardingSkip = () => {
    setShowOnboardingModal(false);
  };

  const handleProfileUpdate = (updatedProfile: UserProfile) => {
    setUserProfile(updatedProfile);
    setShowProfileModal(false);
    // Reload recommendations after profile update
    if (updatedProfile.skillLevel) {
      loadRecommendations();
    }
  };

  const handleProfileClear = () => {
    setUserProfile(defaultUserProfile);
    setShowProfileModal(false);
    setLoadingState('no-persona');
  };

  // Loading state
  if (loadingState === 'loading') {
    return (
      <>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mb-4"></div>
            <p className="text-gray-600">Finding the best videos for you...</p>
          </div>
        </div>
        {/* Modals */}
        {showProfileModal && (
          <div className="fixed inset-0 z-[100]">
            <ProfileModal
              profile={userProfile || defaultUserProfile}
              onClose={() => setShowProfileModal(false)}
              onUpdate={handleProfileUpdate}
              onClear={handleProfileClear}
            />
          </div>
        )}
        {showOnboardingModal && (
          <div className="fixed inset-0 z-[100]">
            <OnboardingModal
              onComplete={handleOnboardingComplete}
              onSkip={handleOnboardingSkip}
            />
          </div>
        )}
      </>
    );
  }

  // No persona state
  if (loadingState === 'no-persona') {
    return (
      <>
        <div className="flex items-center justify-center h-full p-8">
          <div className="text-center max-w-md">
            <div className="text-6xl mb-4">👤</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Complete Your Profile
            </h2>
            <p className="text-gray-600 mb-6">{errorMessage}</p>
            <button
              onClick={handleOpenProfile}
              className="px-6 py-3 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors mb-3"
            >
              Set Up My Profile
            </button>
            <p className="text-sm text-gray-500">
              Tell us about your tennis game so we can recommend the best videos for you!
            </p>
          </div>
        </div>
        {/* Modals */}
        {showProfileModal && (
          <div className="fixed inset-0 z-[100]">
            <ProfileModal
              profile={userProfile || defaultUserProfile}
              onClose={() => setShowProfileModal(false)}
              onUpdate={handleProfileUpdate}
              onClear={handleProfileClear}
            />
          </div>
        )}
        {showOnboardingModal && (
          <div className="fixed inset-0 z-[100]">
            <OnboardingModal
              onComplete={handleOnboardingComplete}
              onSkip={handleOnboardingSkip}
            />
          </div>
        )}
      </>
    );
  }

  // Error state
  if (loadingState === 'error') {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Oops! Something went wrong
          </h2>
          <p className="text-gray-600 mb-6">{errorMessage}</p>
          <button
            onClick={handleRefresh}
            className="px-6 py-3 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Success state
  return (
    <div className="h-full overflow-y-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Personalized Video Recommendations
            </h2>
            {reasoning && (
              <p className="text-gray-600 text-sm">{reasoning}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenProfile}
              className="px-4 py-2 bg-purple-500 hover:bg-purple-600 rounded-lg text-sm font-medium text-white transition-colors flex items-center gap-2"
            >
              <span>👤</span>
              <span>Update Profile</span>
            </button>
            <button
              onClick={handleCustomSearch}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-sm font-medium text-white transition-colors flex items-center gap-2"
            >
              <span>🔍</span>
              <span>Custom Search</span>
            </button>
            <button
              onClick={handleRefresh}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors flex items-center gap-2"
            >
              <span>🔄</span>
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* Videos Grid */}
      {videos.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.map((video) => (
            <VideoCard
              key={video.videoId}
              video={video}
              onClick={() => handleVideoClick(video)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            No videos found
          </h3>
          <p className="text-gray-600 mb-6">
            We couldn't find any videos matching your profile. Try refreshing to get different recommendations.
          </p>
          <button
            onClick={handleRefresh}
            className="px-6 py-3 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors"
          >
            Refresh Recommendations
          </button>
        </div>
      )}

      {/* Embedded Player */}
      {selectedVideo && (
        <EmbeddedPlayer
          videoId={selectedVideo.videoId}
          title={selectedVideo.title}
          onClose={handleClosePlayer}
        />
      )}

      {/* Custom Search Modal */}
      {showCustomSearch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              What would you like to learn?
            </h3>
            <p className="text-gray-600 mb-4">
              Describe what you're looking for and I'll find the perfect tennis videos for you!
            </p>
            <textarea
              value={customQuery}
              onChange={(e) => setCustomQuery(e.target.value)}
              placeholder="e.g., How to improve my backhand slice, Serving tips for beginners, Footwork drills for doubles..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={4}
              autoFocus
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={handleCustomSearchCancel}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-gray-800 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCustomSearchSubmit}
                disabled={!customQuery.trim()}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-lg text-white font-medium transition-colors"
              >
                Search Videos
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Profile Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 z-[100]">
          <ProfileModal
            profile={userProfile || defaultUserProfile}
            onClose={() => setShowProfileModal(false)}
            onUpdate={handleProfileUpdate}
            onClear={handleProfileClear}
          />
        </div>
      )}

      {/* Onboarding Modal */}
      {showOnboardingModal && (
        <div className="fixed inset-0 z-[100]">
          <OnboardingModal
            onComplete={handleOnboardingComplete}
            onSkip={handleOnboardingSkip}
          />
        </div>
      )}
    </div>
  );
}
