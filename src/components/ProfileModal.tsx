'use client';

import { useState } from 'react';
import { UserProfile, skillLevelLabels, playingStyleLabels, goalLabels } from '@/types/user';
import { storage } from '@/lib/storage';

interface ProfileModalProps {
  profile: UserProfile;
  onClose: () => void;
  onUpdate: (profile: UserProfile) => void;
  onClear: () => void;
  /** Open directly in the edit form (e.g. Videos → Update Profile). */
  startInEditMode?: boolean;
}

export default function ProfileModal({
  profile,
  onClose,
  onUpdate,
  onClear,
  startInEditMode = false,
}: ProfileModalProps) {
  const [isEditing, setIsEditing] = useState(startInEditMode);
  const [editedProfile, setEditedProfile] = useState(profile);

  const handleSave = () => {
    storage.saveUserProfile(editedProfile);
    onUpdate(editedProfile);
    setIsEditing(false);
    onClose();
  };

  const handleCancel = () => {
    setEditedProfile(profile);
    setIsEditing(false);
  };

  const updateField = (field: keyof UserProfile, value: any) => {
    setEditedProfile((prev) => ({ ...prev, [field]: value }));
  };

  const toggleGoal = (goal: string) => {
    const currentGoals = editedProfile.goals || [];
    updateField(
      'goals',
      currentGoals.includes(goal as any)
        ? currentGoals.filter((g) => g !== goal)
        : [...currentGoals, goal]
    );
  };

  const toggleFocusArea = (area: string) => {
    const currentAreas = editedProfile.focusAreas || [];
    updateField(
      'focusAreas',
      currentAreas.includes(area)
        ? currentAreas.filter((a) => a !== area)
        : [...currentAreas, area]
    );
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/*
        Always use a definite height so the middle grid row can scroll and the
        footer (Save) is never clipped by overflow:hidden + h-auto.
      */}
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
        aria-labelledby="profile-modal-title"
      >
        <div className="shrink-0 px-4 py-3 sm:px-6 sm:py-4 border-b border-clay-200 flex justify-between items-center gap-3">
          <h2 id="profile-modal-title" className="text-xl sm:text-2xl font-heading font-bold text-navy-900">
            {isEditing ? 'Edit Profile' : 'Your Profile'}
          </h2>
          <div className="flex items-center gap-2">
            {isEditing && (
              <button
                type="button"
                onClick={handleSave}
                className="px-3 py-2 bg-wimbledon-500 text-white rounded-lg hover:bg-wimbledon-600 font-medium text-sm shadow-sm"
              >
                Save
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 -mr-1 rounded-lg text-navy-50 hover:bg-clay-100 hover:text-navy-900 text-2xl leading-none"
              aria-label="Close"
            >
              ×
            </button>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 space-y-4">
          {isEditing ? (
            <>
              <div>
                <label className="block text-sm font-medium text-navy-900 mb-2">Name</label>
                <input
                  type="text"
                  value={editedProfile.name || ''}
                  onChange={(e) => updateField('name', e.target.value)}
                  placeholder="Your name"
                  className="w-full px-4 py-3 border border-clay-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-wimbledon-500 bg-clay-50 text-base"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-navy-900 mb-2">Skill Level</label>
                <select
                  value={editedProfile.skillLevel}
                  onChange={(e) => updateField('skillLevel', e.target.value)}
                  className="w-full px-4 py-3 border border-clay-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-wimbledon-500 bg-clay-50 text-base"
                >
                  {(Object.keys(skillLevelLabels) as Array<keyof typeof skillLevelLabels>).map(
                    (level) => (
                      <option key={level} value={level}>
                        {skillLevelLabels[level]}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-navy-900 mb-2">Playing Style</label>
                <select
                  value={editedProfile.playingStyle || ''}
                  onChange={(e) => updateField('playingStyle', e.target.value)}
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
                <label className="block text-sm font-medium text-navy-900 mb-2">Goals</label>
                <div className="space-y-2">
                  {(Object.keys(goalLabels) as Array<keyof typeof goalLabels>).map((goal) => (
                    <label
                      key={goal}
                      className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                        editedProfile.goals?.includes(goal)
                          ? 'border-wimbledon-500 bg-wimbledon-50'
                          : 'border-clay-200'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={editedProfile.goals?.includes(goal) || false}
                        onChange={() => toggleGoal(goal)}
                        className="mr-3"
                      />
                      <span className="text-sm font-medium">{goalLabels[goal]}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-navy-900 mb-2">Focus Areas</label>
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
                        editedProfile.focusAreas?.includes(area)
                          ? 'border-wimbledon-500 bg-wimbledon-50'
                          : 'border-clay-200'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={editedProfile.focusAreas?.includes(area) || false}
                        onChange={() => toggleFocusArea(area)}
                        className="mr-2"
                      />
                      <span className="text-sm font-medium">{area}</span>
                    </label>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              {profile.name && (
                <div>
                  <div className="text-sm text-navy-50">Name</div>
                  <div className="text-lg font-medium text-navy-900">{profile.name}</div>
                </div>
              )}

              <div>
                <div className="text-sm text-navy-50">Skill Level</div>
                <div className="text-lg font-medium text-navy-900">
                  {profile.skillLevel ? skillLevelLabels[profile.skillLevel] : 'Not set'}
                </div>
              </div>

              {profile.playingStyle && (
                <div>
                  <div className="text-sm text-navy-50">Playing Style</div>
                  <div className="text-lg font-medium text-navy-900">
                    {playingStyleLabels[profile.playingStyle]}
                  </div>
                </div>
              )}

              {profile.goals && profile.goals.length > 0 && (
                <div>
                  <div className="text-sm text-navy-50 mb-2">Goals</div>
                  <div className="flex flex-wrap gap-2">
                    {profile.goals.map((goal) => (
                      <span
                        key={goal}
                        className="px-3 py-1 bg-wimbledon-100 text-wimbledon-600 rounded-full text-sm font-medium"
                      >
                        {goalLabels[goal]}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {profile.focusAreas && profile.focusAreas.length > 0 && (
                <div>
                  <div className="text-sm text-navy-50 mb-2">Focus Areas</div>
                  <div className="flex flex-wrap gap-2">
                    {profile.focusAreas.map((area) => (
                      <span
                        key={area}
                        className="px-3 py-1 bg-ausopen-100 text-ausopen-600 rounded-full text-sm font-medium"
                      >
                        {area}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {profile.injuries && profile.injuries.length > 0 && (
                <div>
                  <div className="text-sm text-navy-50">Physical Considerations</div>
                  <div className="text-lg font-medium text-navy-900">
                    {profile.injuries.join(', ')}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div
          className="
            shrink-0 border-t border-clay-200 bg-white
            px-4 pt-3 sm:px-6
            pb-[max(0.75rem,env(safe-area-inset-bottom))]
            space-y-2
          "
        >
          {isEditing ? (
            <>
              <button
                type="button"
                onClick={handleSave}
                className="w-full px-4 py-3 bg-wimbledon-500 text-white rounded-lg hover:bg-wimbledon-600 font-medium text-base shadow-sm"
              >
                Save Changes
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="flex-1 px-4 py-2.5 border border-clay-200 rounded-lg hover:bg-clay-50 font-medium text-sm"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={onClear}
                  className="flex-1 px-4 py-2.5 text-red-600 hover:bg-red-50 rounded-lg font-medium text-sm"
                >
                  Clear Profile
                </button>
              </div>
            </>
          ) : (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClear}
                className="px-4 py-2.5 text-red-600 hover:bg-red-50 rounded-lg font-medium text-sm"
              >
                Clear Profile
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="flex-1 px-4 py-3 bg-wimbledon-500 text-white rounded-lg hover:bg-wimbledon-600 font-medium text-base shadow-sm"
              >
                Edit Profile
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
