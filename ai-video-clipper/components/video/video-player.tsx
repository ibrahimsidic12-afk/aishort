"use client";

import { useRef, useState } from "react";

interface VideoPlayerProps {
  src: string;
  poster?: string;
  startTime?: number;
  endTime?: number;
  onTimeUpdate?: (currentTime: number) => void;
}

export function VideoPlayer({
  src,
  poster,
  startTime,
  endTime,
  onTimeUpdate,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const time = videoRef.current.currentTime;
    setCurrentTime(time);
    onTimeUpdate?.(time);

    if (endTime && time >= endTime) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      if (startTime) videoRef.current.currentTime = startTime;
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="relative overflow-hidden rounded-lg bg-black">
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => setIsPlaying(false)}
        className="aspect-video w-full"
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <button
          onClick={togglePlay}
          className="rounded-full bg-black/50 p-4 text-white backdrop-blur-sm hover:bg-black/70"
        >
          {isPlaying ? "⏸" : "▶"}
        </button>
      </div>
    </div>
  );
}
