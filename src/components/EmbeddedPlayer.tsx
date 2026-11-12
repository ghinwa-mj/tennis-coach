'use client';

import { X } from 'lucide-react';

interface EmbeddedPlayerProps {
  videoId: string;
  title: string;
  onClose: () => void;
}

export default function EmbeddedPlayer({ videoId, title, onClose }: EmbeddedPlayerProps) {
  return (
    <div
      className="
        fixed inset-0 z-[110] bg-black/80
        flex items-end sm:items-center justify-center
        p-0 sm:p-4
      "
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
    >
      <div
        className="
          bg-white w-full sm:max-w-4xl sm:rounded-lg
          max-h-[92dvh] overflow-hidden shadow-xl
          rounded-t-2xl sm:rounded-lg
        "
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-clay-200">
          <h3 className="font-heading font-semibold text-navy-900 text-sm sm:text-base line-clamp-2 flex-1">
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 p-2 rounded-lg text-navy-50 hover:bg-clay-100 hover:text-navy-900 transition-colors"
            aria-label="Close player"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="aspect-video bg-black">
          <iframe
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full"
          />
        </div>
      </div>
    </div>
  );
}
