'use client';

import { useState } from 'react';
import { Map } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import ChatInterface from '@/components/ChatInterface';
import VideoRecommendations from '@/components/VideoRecommendations';

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
         <div className="flex items-center justify-center h-full">
           <div className="text-center">
             <div className="w-20 h-20 bg-clay-200 rounded-full flex items-center justify-center mx-auto mb-4">
               <Map className="w-10 h-10 text-clay-400" />
             </div>
             <h2 className="text-2xl font-heading font-bold text-navy-900 mb-2">Find a Court</h2>
             <p className="text-navy-50">Coming soon! Find tennis courts near you.</p>
           </div>
         </div>
        }
      </main>
    </div>
  );
}
