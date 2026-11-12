'use client';

import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import ChatInterface from '@/components/ChatInterface';
import VideoRecommendations from '@/components/VideoRecommendations';
import FindACourt from '@/components/FindACourt';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'chat' | 'videos' | 'courts'>('chat');
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleCollapseChange = (collapsed: boolean) => {
    setIsCollapsed(collapsed);
  };

  return (
    <div className="flex h-screen bg-clay-50 relative">
      {/* Court-line background motif */}
      <div className="background-motif" />

      {/* Left Rail Navigation */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onCollapseChange={handleCollapseChange}
      />

      {/* Main Content Area - offset by left rail */}
      <main
        className={`
          flex-1 flex flex-col overflow-hidden transition-all duration-300 relative z-10
          ${isCollapsed ? 'ml-16' : 'ml-60'}
        `}
      >
        {activeTab === 'chat' ? <ChatInterface /> :
         activeTab === 'videos' ? <VideoRecommendations /> :
         <FindACourt />}
      </main>
    </div>
  );
}
