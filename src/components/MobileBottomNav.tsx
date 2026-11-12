'use client';

import { MessageSquare, Video, Map } from 'lucide-react';

interface MobileBottomNavProps {
  activeTab: 'chat' | 'videos' | 'courts';
  onTabChange: (tab: 'chat' | 'videos' | 'courts') => void;
}

const navItems = [
  { id: 'chat' as const, icon: MessageSquare, label: 'Chat' },
  { id: 'videos' as const, icon: Video, label: 'Videos' },
  { id: 'courts' as const, icon: Map, label: 'Courts' },
];

export default function MobileBottomNav({
  activeTab,
  onTabChange,
}: MobileBottomNavProps) {
  return (
    <nav
      className="
        md:hidden fixed bottom-0 inset-x-0 z-[60]
        bg-white border-t border-clay-200
        pb-[env(safe-area-inset-bottom)]
        pointer-events-auto
      "
      aria-label="Primary"
    >
      <div className="grid grid-cols-3 h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onTabChange(item.id)}
              className={`
                flex flex-col items-center justify-center gap-0.5
                text-[11px] font-medium transition-colors
                ${isActive ? 'text-wimbledon-600' : 'text-navy-50'}
              `}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon
                className={`w-5 h-5 ${isActive ? 'text-wimbledon-600' : 'text-navy-50'}`}
              />
              {item.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
