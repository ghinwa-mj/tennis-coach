'use client';

import React from 'react';

interface SidebarProps {
  activeTab: 'chat' | 'videos';
  onTabChange: (tab: 'chat' | 'videos') => void;
}

export default function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
      {/* Tabs */}
      <div className="flex flex-col p-4 space-y-2">
        <button
          onClick={() => onTabChange('chat')}
          className={`flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
            activeTab === 'chat'
              ? 'bg-green-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <span className="text-xl">💬</span>
          <span className="font-medium">Chat</span>
        </button>

        <button
          onClick={() => onTabChange('videos')}
          className={`flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
            activeTab === 'videos'
              ? 'bg-green-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <span className="text-xl">📹</span>
          <span className="font-medium">Video Recommendations</span>
        </button>
      </div>

      {/* Future: Chat History Section */}
      <div className="flex-1 border-t border-gray-200 mt-4 pt-4 px-4">
        <p className="text-xs text-gray-400 text-center">
          Chat history coming soon
        </p>
      </div>

      {/* Tennis Coach branding */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span className="text-lg">🎾</span>
          <span className="font-medium">TennisCoach AI</span>
        </div>
      </div>
    </div>
  );
}
