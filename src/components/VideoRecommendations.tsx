'use client';

import React, { useState, useEffect } from 'react';
import { User, Search, RefreshCw, AlertTriangle } from 'lucide-react';
import { storage } from '@/lib/storage';
import { UserProfile, defaultUserProfile } from '@/types/user';
import { YouTubeVideo } from '@/lib/youtube/types';
import VideoCard from './VideoCard';
import EmbeddedPlayer from './EmbeddedPlayer';
import ProfileModal from './ProfileModal';
import OnboardingModal from './OnboardingModal';

type LoadingState = 'idle' | 'loading' | 'error' | 'no-persona' | 'success';

function VideoModals({
  showProfileModal,
  showOnboardingModal,
  userProfile,
  onCloseProfile,
  onUpdateProfile,
  onClearProfile,
  onCompleteOnboarding,
  onSkipOnboarding,
}: {
  showProfileModal: boolean;
  showOnboardingModal: boolean;
  userProfile: UserProfile | null;
  onCloseProfile: () => void;
  onUpdateProfile: (profile: UserProfile) => void;
  onClearProfile: () => void;
  onCompleteOnboarding: (profile: UserProfile) => void;
  onSkipOnboarding: () => void;
}) {
  return (
    <>
      {showProfileModal && (
        <div className="fixed inset-0 z-[110]">
          <ProfileModal
            profile={userProfile || defaultUserProfile}
            onClose={onCloseProfile}
            onUpdate={onUpdateProfile}
            onClear={onClearProfile}
            startInEditMode
          />
        </div>
      )}
      {showOnboardingModal && (
        <div className="fixed inset-0 z-[110]">
          <OnboardingModal onComplete={onCompleteOnboarding} onSkip={onSkipOnboarding} />
        </div>
      )}
    </>
  );
}

export default function VideoRecommendations() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loadingState, setLoadingState] = useState<LoadingState>('idle');
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [reasoning, setReasoning] = useState<string>('');
  const [selectedVideo, setSelectedVideo] = useState<YouTubeVideo | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [showCustomSearch, setShowCustomSearch] = useState(false);
  const [customQuery, setCustomQuery] = useState('');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);

  useEffect(() => {
    setUserProfile(storage.getUserProfile());
  }, []);

  useEffect(() => {
    if (!userProfile) return;

    if (!userProfile.skillLevel) {
      setLoadingState('no-persona');
      setErrorMessage(
        'Please complete your profile first to get personalized video recommendations.'
      );
      return;
    }

    loadRecommendations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userProfile]);

  const loadRecommendations = async (customSearchQuery?: string) => {
    setLoadingState('loading');
    setErrorMessage('');

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
    const needsOnboarding =
      !userProfile?.skillLevel || userProfile?.hasCompletedOnboarding === false;

    if (needsOnboarding) {
      setShowOnboardingModal(true);
    } else {
      setShowProfileModal(true);
    }
  };

  const handleOnboardingComplete = (profile: UserProfile) => {
    storage.saveUserProfile(profile);
    setShowOnboardingModal(false);
    setUserProfile(profile); // triggers recommendations via effect
  };

  const handleOnboardingSkip = () => {
    setShowOnboardingModal(false);
  };

  const handleProfileUpdate = (updatedProfile: UserProfile) => {
    setShowProfileModal(false);
    setUserProfile(updatedProfile); // triggers recommendations via effect when skillLevel present
  };

  const handleProfileClear = () => {
    setUserProfile(defaultUserProfile);
    setShowProfileModal(false);
    setLoadingState('no-persona');
  };

  const modalProps = {
    showProfileModal,
    showOnboardingModal,
    userProfile,
    onCloseProfile: () => setShowProfileModal(false),
    onUpdateProfile: handleProfileUpdate,
    onClearProfile: handleProfileClear,
    onCompleteOnboarding: handleOnboardingComplete,
    onSkipOnboarding: handleOnboardingSkip,
  };

  if (loadingState === 'loading' || loadingState === 'idle') {
    return (
      <>
        <div className="flex items-center justify-center h-full px-4">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-clay-400 mb-4" />
            <p className="text-navy-50 text-sm sm:text-base">Finding the best videos for you...</p>
          </div>
        </div>
        <VideoModals {...modalProps} />
      </>
    );
  }

  if (loadingState === 'no-persona') {
    return (
      <>
        <div className="flex items-center justify-center h-full p-6 sm:p-8">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-clay-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 sm:w-10 sm:h-10 text-clay-400" />
            </div>
            <h2 className="text-xl sm:text-2xl font-heading font-bold text-navy-900 mb-3 sm:mb-4">
              Complete Your Profile
            </h2>
            <p className="text-navy-50 text-sm sm:text-base mb-5 sm:mb-6">{errorMessage}</p>
            <button
              type="button"
              onClick={handleOpenProfile}
              className="px-6 py-3 bg-clay-300 text-white rounded-lg font-medium hover:bg-clay-400 transition-colors mb-3 shadow-sm"
            >
              Set Up My Profile
            </button>
            <p className="text-sm text-navy-50">
              Tell us about your tennis game so we can recommend the best videos for you!
            </p>
          </div>
        </div>
        <VideoModals {...modalProps} />
      </>
    );
  }

  if (loadingState === 'error') {
    return (
      <div className="flex items-center justify-center h-full p-6 sm:p-8">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 sm:w-10 sm:h-10 text-red-500" />
          </div>
          <h2 className="text-xl sm:text-2xl font-heading font-bold text-navy-900 mb-3 sm:mb-4">
            Oops! Something went wrong
          </h2>
          <p className="text-navy-50 text-sm sm:text-base mb-5 sm:mb-6">{errorMessage}</p>
          <button
            type="button"
            onClick={handleRefresh}
            className="px-6 py-3 bg-clay-300 text-white rounded-lg font-medium hover:bg-clay-400 transition-colors shadow-sm"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full min-h-0 overflow-y-auto overscroll-contain">
      {/* Sticky compact header on mobile */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-clay-200 px-3 py-3 sm:px-6 sm:py-4">
        <div className="flex items-start sm:items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h2 className="text-lg sm:text-2xl font-heading font-bold text-navy-900">
              <span className="sm:hidden">Videos for you</span>
              <span className="hidden sm:inline">Personalized Video Recommendations</span>
            </h2>
            {reasoning && (
              <p className="text-navy-50 text-xs sm:text-sm mt-1 line-clamp-2 sm:line-clamp-none">
                {reasoning}
              </p>
            )}
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              type="button"
              onClick={handleOpenProfile}
              className="p-2.5 sm:px-4 sm:py-2 bg-clay-300 hover:bg-clay-400 rounded-lg text-sm font-medium text-white transition-colors flex items-center gap-2 shadow-sm"
              aria-label="Update profile"
            >
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">Update Profile</span>
            </button>
            <button
              type="button"
              onClick={handleCustomSearch}
              className="p-2.5 sm:px-4 sm:py-2 bg-wimbledon-500 hover:bg-wimbledon-600 rounded-lg text-sm font-medium text-white transition-colors flex items-center gap-2 shadow-sm"
              aria-label="Custom search"
            >
              <Search className="w-4 h-4" />
              <span className="hidden sm:inline">Custom Search</span>
            </button>
            <button
              type="button"
              onClick={handleRefresh}
              className="p-2.5 sm:px-4 sm:py-2 bg-clay-100 hover:bg-clay-200 rounded-lg text-sm font-medium text-navy-900 transition-colors flex items-center gap-2"
              aria-label="Refresh recommendations"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>
      </div>

      <div className="p-3 sm:p-6">
        {videos.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
            {videos.map((video) => (
              <VideoCard
                key={video.videoId}
                video={video}
                onClick={() => handleVideoClick(video)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-10 sm:py-12 px-2">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-clay-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 sm:w-10 sm:h-10 text-clay-400" />
            </div>
            <h3 className="text-lg sm:text-xl font-heading font-semibold text-navy-900 mb-2">
              No videos found
            </h3>
            <p className="text-navy-50 text-sm sm:text-base mb-6 max-w-md mx-auto">
              We couldn&apos;t find any videos matching your profile. Try refreshing or a custom
              search.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
              <button
                type="button"
                onClick={handleCustomSearch}
                className="w-full sm:w-auto px-6 py-3 bg-wimbledon-500 text-white rounded-lg font-medium hover:bg-wimbledon-600 transition-colors shadow-sm"
              >
                Custom Search
              </button>
              <button
                type="button"
                onClick={handleRefresh}
                className="w-full sm:w-auto px-6 py-3 bg-clay-300 text-white rounded-lg font-medium hover:bg-clay-400 transition-colors shadow-sm"
              >
                Refresh
              </button>
            </div>
          </div>
        )}
      </div>

      {selectedVideo && (
        <EmbeddedPlayer
          videoId={selectedVideo.videoId}
          title={selectedVideo.title}
          onClose={handleClosePlayer}
        />
      )}

      {showCustomSearch && (
        <div
          className="
            fixed inset-0 z-[110] bg-black/50
            flex items-end sm:items-center justify-center
            p-0 sm:p-4
          "
          role="dialog"
          aria-modal="true"
          aria-labelledby="custom-search-title"
        >
          <div className="bg-white w-full sm:max-w-lg sm:rounded-lg rounded-t-2xl p-5 sm:p-6 shadow-xl pb-[max(1.25rem,env(safe-area-inset-bottom))]">
            <h3
              id="custom-search-title"
              className="text-lg sm:text-xl font-heading font-bold text-navy-900 mb-2 sm:mb-4"
            >
              What would you like to learn?
            </h3>
            <p className="text-navy-50 text-sm mb-4">
              Describe what you&apos;re looking for and I&apos;ll find tennis videos for you.
            </p>
            <textarea
              value={customQuery}
              onChange={(e) => setCustomQuery(e.target.value)}
              placeholder="e.g., Improve my backhand slice, serving tips for beginners..."
              className="w-full px-4 py-3 border border-clay-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-clay-400 focus:border-transparent resize-none bg-clay-50 text-navy-900 placeholder:text-navy-50 text-base"
              rows={4}
              autoFocus
            />
            <div className="flex justify-end gap-2 sm:gap-3 mt-4">
              <button
                type="button"
                onClick={handleCustomSearchCancel}
                className="px-4 py-2.5 bg-clay-100 hover:bg-clay-200 rounded-lg text-navy-900 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCustomSearchSubmit}
                disabled={!customQuery.trim()}
                className="px-4 py-2.5 bg-wimbledon-500 hover:bg-wimbledon-600 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-lg text-white font-medium transition-colors shadow-sm"
              >
                Search Videos
              </button>
            </div>
          </div>
        </div>
      )}

      <VideoModals {...modalProps} />
    </div>
  );
}
