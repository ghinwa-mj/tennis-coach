'use client';

import React, { useState, useEffect } from 'react';
import { MessageSquare, Video, Map, Trophy, ChevronLeft, ChevronRight } from 'lucide-react';

interface SidebarProps {
  activeTab: 'chat' | 'videos' | 'courts';
  onTabChange: (tab: 'chat' | 'videos' | 'courts') => void;
  onCollapseChange?: (isCollapsed: boolean) => void;
}

export default function Sidebar({ activeTab, onTabChange, onCollapseChange }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    // Load collapse state from localStorage
    const saved = localStorage.getItem('sidebar-collapsed');
    if (saved) {
      const collapsed = saved === 'true';
      setIsCollapsed(collapsed);
      onCollapseChange?.(collapsed);
    }
  }, [onCollapseChange]);

  const handleCollapseToggle = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem('sidebar-collapsed', String(newState));
    onCollapseChange?.(newState);
  };

  const navItems = [
    { id: 'chat' as const, icon: MessageSquare, label: 'Chat' },
    { id: 'videos' as const, icon: Video, label: 'Video Recs' },
    { id: 'courts' as const, icon: Map, label: 'Find a Court' },
  ];

  return (
    <nav
      className={`
        fixed left-0 top-0 h-full
        ${isCollapsed ? 'w-16' : 'w-60'}
        bg-clay-100 border-r border-clay-200
        transition-all duration-300
        flex flex-col
        shadow-sm
        z-50
      `}
    >
      {/* Header with collapse toggle */}
      <div className="p-4 border-b border-clay-200">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-clay-300 rounded-lg flex items-center justify-center">
                <Trophy className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="font-heading font-bold text-lg text-navy-900">TennisCoach AI</span>
                <span className="text-xs text-navy-50">Your Personal Coach</span>
              </div>
            </div>
          )}
          {isCollapsed && (
            <div className="flex justify-center w-full">
              <div className="w-8 h-8 bg-clay-300 rounded-lg flex items-center justify-center">
                <Trophy className="w-5 h-5 text-white" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Items */}
      <div className="flex-1 p-3 space-y-2 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`
                w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all duration-200
                ${isCollapsed ? 'justify-center px-3' : ''}
                ${
                  activeTab === item.id
                    ? 'bg-wimbledon-500 text-white shadow-md'
                    : 'text-navy-900 hover:bg-clay-200'
                }
              `}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!isCollapsed && (
                <span className="font-medium">{item.label}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Collapse Toggle */}
      <div className="p-3 border-t border-clay-200">
        <button
          onClick={handleCollapseToggle}
          className="
            w-full flex items-center justify-center gap-2
            px-4 py-2 rounded-lg
            text-navy-900 hover:bg-clay-200
            transition-all duration-200
            text-sm
          "
          title={isCollapsed ? 'Expand navigation' : 'Collapse navigation'}
        >
          {isCollapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4" />
              <span className="font-medium">Collapse</span>
            </>
          )}
        </button>
      </div>
    </nav>
  );
}
