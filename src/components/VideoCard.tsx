'use client';

import React from 'react';
import { YouTubeVideo } from '@/lib/youtube/types';

interface VideoCardProps {
  video: YouTubeVideo;
  onClick: () => void;
}

export default function VideoCard({ video, onClick }: VideoCardProps) {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-xl border border-clay-200"
    >
      {/* Thumbnail with artistic overlay */}
      <div className="relative group">
        <img
          src={video.thumbnail}
          alt={video.title}
          className="w-full h-52 object-cover transition-transform duration-300 group-hover:scale-105"
        />

        {/* Artistic gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Chapter markers */}
        <div className="absolute bottom-2 left-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="w-1.5 h-1.5 bg-white rounded-full shadow-md" />
          <div className="w-1.5 h-1.5 bg-white/70 rounded-full shadow-md" />
          <div className="w-1.5 h-1.5 bg-white/70 rounded-full shadow-md" />
          <div className="w-1.5 h-1.5 bg-white/70 rounded-full shadow-md" />
        </div>

        {/* Duration badge */}
        {video.duration && (
          <div className="absolute bottom-2 right-2 bg-clay-400 text-white text-xs px-2 py-1 rounded font-medium shadow-md">
            {video.duration}
          </div>
        )}

        {/* Play button overlay on hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
            <span className="text-clay-400 text-xl">▶</span>
          </div>
        </div>
      </div>

      {/* Video Info */}
      <div className="p-4">
        <h3 className="font-heading font-semibold text-base text-navy-900 line-clamp-2 mb-3">
          {video.title}
        </h3>

        <div className="space-y-2">
          <p className="text-sm text-navy-50 flex items-center gap-1">
            <span>📺</span>
            <span className="truncate">{video.channel}</span>
          </p>

          <div className="flex items-center gap-3 text-sm text-navy-50">
            <span className="flex items-center gap-1">
              <span>👁️</span>
              <span>{video.views}</span>
            </span>
            <span className="flex items-center gap-1">
              <span>📅</span>
              <span>{video.publishDate}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
