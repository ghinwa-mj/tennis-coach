'use client';

import { useState, useCallback } from 'react';
import Sidebar from '@/components/Sidebar';
import MobileBottomNav from '@/components/MobileBottomNav';
import ChatInterface from '@/components/ChatInterface';
import VideoRecommendations from '@/components/VideoRecommendations';
import FindACourt from '@/components/FindACourt';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'chat' | 'videos' | 'courts'>('chat');
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleCollapseChange = useCallback((collapsed: boolean) => {
    setIsCollapsed(collapsed);
  }, []);

  const handleTabChange = useCallback((tab: 'chat' | 'videos' | 'courts') => {
    setActiveTab(tab);
  }, []);

  return (
    <div className="flex h-dvh bg-clay-50 relative isolate">
      {/* Court-line background motif */}
      <div className="background-motif" aria-hidden="true" />

      {/* Left rail — desktop only */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onCollapseChange={handleCollapseChange}
      />

      {/* Main content — full width on mobile, offset by sidebar on desktop */}
      <main
        className={`
          flex-1 flex flex-col overflow-hidden transition-all duration-300 relative z-10
          ml-0
          ${isCollapsed ? 'md:ml-16' : 'md:ml-60'}
          pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0
        `}
      >
        {activeTab === 'chat' ? <ChatInterface /> :
         activeTab === 'videos' ? <VideoRecommendations /> :
         <FindACourt />}
      </main>

      <MobileBottomNav activeTab={activeTab} onTabChange={handleTabChange} />
    </div>
  );
}
