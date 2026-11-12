'use client';

import { Eye, Calendar, Play } from 'lucide-react';
import { YouTubeVideo } from '@/lib/youtube/types';

interface VideoCardProps {
  video: YouTubeVideo;
  onClick: () => void;
}

export default function VideoCard({ video, onClick }: VideoCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="
        w-full text-left bg-white rounded-lg shadow-md overflow-hidden
        transition-all duration-300 border border-clay-200
        hover:scale-[1.02] hover:shadow-xl
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay-400
      "
    >
      {/* Thumbnail */}
      <div className="relative group">
        <img
          src={video.thumbnail}
          alt=""
          className="w-full aspect-video object-cover transition-transform duration-300 group-hover:scale-105"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />

        {/* Always-visible play cue (hover alone fails on touch) */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-11 h-11 sm:w-12 sm:h-12 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
            <Play className="w-5 h-5 text-clay-400 fill-clay-400 ml-0.5" aria-hidden="true" />
          </div>
        </div>

        {video.duration && (
          <div className="absolute bottom-2 right-2 bg-clay-400 text-white text-xs px-2 py-1 rounded font-medium shadow-md">
            {video.duration}
          </div>
        )}
      </div>

      {/* Video Info */}
      <div className="p-3 sm:p-4">
        <h3 className="font-heading font-semibold text-sm sm:text-base text-navy-900 line-clamp-2 mb-2 sm:mb-3">
          {video.title}
        </h3>

        <div className="space-y-1.5">
          <p className="text-xs sm:text-sm text-navy-50 truncate">{video.channel}</p>

          <div className="flex items-center gap-3 text-xs sm:text-sm text-navy-50">
            <span className="inline-flex items-center gap-1 min-w-0">
              <Eye className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span className="truncate">{video.views}</span>
            </span>
            <span className="inline-flex items-center gap-1 min-w-0">
              <Calendar className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span className="truncate">{video.publishDate}</span>
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}
