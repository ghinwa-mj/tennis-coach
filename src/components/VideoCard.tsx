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
      className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer transition-transform hover:scale-[1.02] hover:shadow-lg"
    >
      {/* Thumbnail */}
      <div className="relative">
        <img
          src={video.thumbnail}
          alt={video.title}
          className="w-full h-52 object-cover"
        />
        {/* Duration badge */}
        {video.duration && (
          <div className="absolute bottom-2 right-2 bg-black bg-opacity-80 text-white text-xs px-2 py-1 rounded">
            {video.duration}
          </div>
        )}
      </div>

      {/* Video Info */}
      <div className="p-4">
        <h3 className="font-semibold text-base text-gray-800 line-clamp-2 mb-3">
          {video.title}
        </h3>

        <div className="space-y-2">
          <p className="text-sm text-gray-600 flex items-center gap-1">
            <span>📺</span>
            <span className="truncate">{video.channel}</span>
          </p>

          <div className="flex items-center gap-3 text-sm text-gray-500">
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
