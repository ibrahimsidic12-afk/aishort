"use client";

import { useRef, useState, useCallback, useEffect } from "react";

interface ClipVideoPlayerProps {
  videoUrl: string | null;
  startTime: number;
  endTime: number;
  thumbnailUrl: string | null;
}

export function ClipVideoPlayer({
  videoUrl,
  startTime,
  endTime,
  thumbnailUrl,
}: ClipVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration] = useState(endTime - startTime);
  const [isLoaded, setIsLoaded] = useState(false);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.round(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const handleLoadedMetadata = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.currentTime = startTime;
      setIsLoaded(true);
    }
  }, [startTime]);

  const handleTimeUpdate = useCallback(() => {
    if (!videoRef.current) return;
    const time = videoRef.current.currentTime;

    // Keep within clip bounds
    if (time >= endTime) {
      videoRef.current.pause();
      videoRef.current.currentTime = startTime;
      setIsPlaying(false);
      setCurrentTime(0);
      return;
    }

    setCurrentTime(time - startTime);
  }, [startTime, endTime]);

  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;

    if (isPlaying) {
      videoRef.current.pause();
    } else {
      if (videoRef.current.currentTime >= endTime || videoRef.current.currentTime < startTime) {
        videoRef.current.currentTime = startTime;
      }
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying, startTime, endTime]);

  const handleSeek = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!videoRef.current) return;
      const time = parseFloat(e.target.value);
      videoRef.current.currentTime = startTime + time;
      setCurrentTime(time);
    },
    [startTime]
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.code === "Space") {
        e.preventDefault();
        togglePlay();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [togglePlay]);

  if (!videoUrl) {
    return (
      <div className="relative aspect-video overflow-hidden rounded-lg border bg-muted">
        {thumbnailUrl ? (
          <img src={thumbnailUrl} alt="Clip thumbnail" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <p className="text-sm">Video not yet rendered</p>
            <p className="text-xs">Clip will show here once rendering is complete</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Video */}
      <div className="relative aspect-video overflow-hidden rounded-lg border bg-black">
        <video
          ref={videoRef}
          src={videoUrl}
          onLoadedMetadata={handleLoadedMetadata}
          onTimeUpdate={handleTimeUpdate}
          onEnded={() => setIsPlaying(false)}
          className="h-full w-full object-contain"
          preload="metadata"
        />

        {/* Play overlay when paused */}
        {!isPlaying && isLoaded && (
          <button
            onClick={togglePlay}
            className="absolute inset-0 flex items-center justify-center bg-black/20 transition hover:bg-black/30"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 shadow-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-black ml-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
            </div>
          </button>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3 rounded-md border px-3 py-2">
        {/* Play/Pause */}
        <button onClick={togglePlay} className="shrink-0 text-foreground hover:text-primary">
          {isPlaying ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
          )}
        </button>

        {/* Time */}
        <span className="shrink-0 text-xs font-mono text-muted-foreground">
          {formatTime(currentTime)}
        </span>

        {/* Seek bar */}
        <input
          type="range"
          min={0}
          max={duration}
          step={0.1}
          value={currentTime}
          onChange={handleSeek}
          className="flex-1 h-1.5 appearance-none rounded-full bg-secondary accent-primary cursor-pointer"
        />

        {/* Duration */}
        <span className="shrink-0 text-xs font-mono text-muted-foreground">
          {formatTime(duration)}
        </span>
      </div>
    </div>
  );
}
