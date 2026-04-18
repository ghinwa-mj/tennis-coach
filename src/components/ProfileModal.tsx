'use client';

import { useState } from 'react';
import { UserProfile, skillLevelLabels, playingStyleLabels, goalLabels } from '@/types/user';
import { storage } from '@/lib/storage';

interface ProfileModalProps {
  profile: UserProfile;
  onClose: () => void;
  onUpdate: (profile: UserProfile) => void;
  onClear: () => void;
}

export default function ProfileModal({ profile, onClose, onUpdate, onClear }: ProfileModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState(profile);

  const handleSave = () => {
    storage.saveUserProfile(editedProfile);
    onUpdate(editedProfile);
    setIsEditing(false);
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">
            {isEditing ? 'Edit Profile' : 'Your Profile'} 👤
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {isEditing ? (
            <>
              {/* Edit Mode */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  value={editedProfile.name || ''}
                  onChange={(e) => updateField('name', e.target.value)}
                  placeholder="Your name"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-wimbledon-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Skill Level
                </label>
                <select
                  value={editedProfile.skillLevel}
                  onChange={(e) => updateField('skillLevel', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-wimbledon-500"
                >
                  {(Object.keys(skillLevelLabels) as Array<keyof typeof skillLevelLabels>).map((level) => (
                    <option key={level} value={level}>
                      {skillLevelLabels[level]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Years Playing
                </label>
                <input
                  type="number"
                  value={editedProfile.yearsPlaying || ''}
                  onChange={(e) => updateField('yearsPlaying', parseInt(e.target.value) || 0)}
                  placeholder="Number of years"
                  min="0"
                  max="50"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-wimbledon-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Playing Style
                </label>
                <select
                  value={editedProfile.playingStyle || ''}
                  onChange={(e) => updateField('playingStyle', e.target.value)}
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
                  Goals
                </label>
                <div className="space-y-2">
                  {(Object.keys(goalLabels) as Array<keyof typeof goalLabels>).map((goal) => (
                    <label
                      key={goal}
                      className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                        editedProfile.goals?.includes(goal)
                          ? 'border-wimbledon-500 bg-wimbledon-50'
                          : 'border-gray-200 hover:border-wimbledon-100'
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Focus Areas
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
                        editedProfile.focusAreas?.includes(area)
                          ? 'border-wimbledon-500 bg-wimbledon-50'
                          : 'border-gray-200 hover:border-wimbledon-100'
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
            <>
              {/* View Mode */}
              <div className="space-y-4">
                {profile.name && (
                  <div>
                    <div className="text-sm text-gray-500">Name</div>
                    <div className="text-lg font-medium text-gray-800">{profile.name}</div>
                  </div>
                )}

                <div>
                  <div className="text-sm text-gray-500">Skill Level</div>
                  <div className="text-lg font-medium text-gray-800">
                    {profile.skillLevel ? skillLevelLabels[profile.skillLevel] : 'Not set'}
                  </div>
                </div>

                {profile.yearsPlaying !== undefined && (
                  <div>
                    <div className="text-sm text-gray-500">Years Playing</div>
                    <div className="text-lg font-medium text-gray-800">{profile.yearsPlaying} years</div>
                  </div>
                )}

                {profile.playingStyle && (
                  <div>
                    <div className="text-sm text-gray-500">Playing Style</div>
                    <div className="text-lg font-medium text-gray-800">
                      {playingStyleLabels[profile.playingStyle]}
                    </div>
                  </div>
                )}

                {profile.goals && profile.goals.length > 0 && (
                  <div>
                    <div className="text-sm text-gray-500 mb-2">Goals</div>
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
                    <div className="text-sm text-gray-500 mb-2">Focus Areas</div>
                    <div className="flex flex-wrap gap-2">
                      {profile.focusAreas.map((area) => (
                        <span
                          key={area}
                          className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                        >
                          {area}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {profile.injuries && profile.injuries.length > 0 && (
                  <div>
                    <div className="text-sm text-gray-500">Physical Considerations</div>
                    <div className="text-lg font-medium text-gray-800">
                      {profile.injuries.join(', ')}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex justify-between">
          <button
            onClick={onClear}
            className="px-6 py-2 text-red-600 hover:text-red-800 font-medium"
          >
            Clear Profile
          </button>
          <div className="flex gap-3">
            {isEditing ? (
              <>
                <button
                  onClick={handleCancel}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-6 py-2 bg-wimbledon-500 text-white rounded-lg hover:bg-wimbledon-600 font-medium"
                >
                  Save Changes
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="px-6 py-2 bg-wimbledon-500 text-white rounded-lg hover:bg-wimbledon-600 font-medium"
              >
                Edit Profile
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
