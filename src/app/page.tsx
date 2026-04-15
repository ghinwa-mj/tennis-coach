'use client';

import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import ChatInterface from '@/components/ChatInterface';
import VideoRecommendations from '@/components/VideoRecommendations';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'chat' | 'videos'>('chat');

  return (
    <div className="flex h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Sidebar */}
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {activeTab === 'chat' ? <ChatInterface /> : <VideoRecommendations />}
      </div>
    </div>
  );
}
