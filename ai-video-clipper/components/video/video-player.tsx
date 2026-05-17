"use client";

import { useRef, useState, useCallback, useEffect } from "react";

interface VideoPlayerProps {
  src: string;
  poster?: string;
  startTime?: number;
  endTime?: number;
  onTimeUpdate?: (currentTime: number) => void;
  onDurationLoaded?: (duration: number) => void;
  autoLoop?: boolean;
  className?: string;
}

export function VideoPlayer({
  src,
  poster,
  startTime = 0,
  endTime,
  onTimeUpdate,
  onDurationLoaded,
  autoLoop = false,
  className = "",
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(startTime);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);

  const effectiveEnd = endTime ?? duration;

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (isPlaying) {
      timeout = setTimeout(() => setShowControls(false), 3000);
    } else {
      setShowControls(true);
    }
    return () => clearTimeout(timeout);
  }, [isPlaying]);

  const handleTimeUpdate = useCallback(() => {
    if (!videoRef.current) return;
    const time = videoRef.current.currentTime;
    setCurrentTime(time);
    onTimeUpdate?.(time);

    // Loop or pause at endTime
    if (effectiveEnd && time >= effectiveEnd) {
      if (autoLoop) {
        videoRef.current.currentTime = startTime;
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  }, [effectiveEnd, startTime, autoLoop, onTimeUpdate]);

  const handleLoadedMetadata = useCallback(() => {
    if (!videoRef.current) return;
    const dur = videoRef.current.duration;
    setDuration(dur);
    onDurationLoaded?.(dur);
    if (startTime > 0) {
      videoRef.current.currentTime = startTime;
    }
  }, [startTime, onDurationLoaded]);

  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      if (currentTime >= effectiveEnd) {
        videoRef.current.currentTime = startTime;
      }
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying, currentTime, effectiveEnd, startTime]);

  const handleProgressClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!videoRef.current || !progressRef.current) return;
      const rect = progressRef.current.getBoundingClientRect();
      const ratio = (e.clientX - rect.left) / rect.width;
      const newTime = startTime + ratio * (effectiveEnd - startTime);
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    },
    [startTime, effectiveEnd],
  );

  const toggleMute = useCallback(() => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  }, [isMuted]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const progress =
    effectiveEnd > startTime
      ? ((currentTime - startTime) / (effectiveEnd - startTime)) * 100
      : 0;

  return (
    <div
      className={`relative overflow-hidden rounded-lg bg-black ${className}`}
      onMouseMove={() => setShowControls(true)}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
        onClick={togglePlay}
        className="aspect-video w-full cursor-pointer"
      />

      {/* Controls overlay */}
      <div
        className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 transition-opacity ${
          showControls ? "opacity-100" : "opacity-0"
        }`}
      >
        {/* Progress bar */}
        <div
          ref={progressRef}
          onClick={handleProgressClick}
          className="group mb-2 h-1 cursor-pointer rounded-full bg-white/30 transition hover:h-2"
        >
          {/* Clip range indicator */}
          {startTime > 0 && (
            <div
              className="absolute h-full bg-white/10"
              style={{
                left: `${(startTime / duration) * 100}%`,
                width: `${((effectiveEnd - startTime) / duration) * 100}%`,
              }}
            />
          )}
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>

        {/* Controls row */}
        <div className="flex items-center gap-3 text-white">
          <button
            onClick={togglePlay}
            className="text-lg hover:text-primary transition"
          >
            {isPlaying ? "⏸" : "▶️"}
          </button>

          <button onClick={toggleMute} className="text-sm hover:text-primary transition">
            {isMuted ? "🔇" : "🔊"}
          </button>

          <span className="text-xs font-mono">
            {formatTime(currentTime - startTime)} / {formatTime(effectiveEnd - startTime)}
          </span>

          <div className="flex-1" />

          {/* Time range info */}
          {(startTime > 0 || endTime) && (
            <span className="text-[10px] text-white/60">
              [{formatTime(startTime)} – {formatTime(effectiveEnd)}]
            </span>
          )}
        </div>
      </div>

      {/* Big play button when paused */}
      {!isPlaying && showControls && (
        <button
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center"
        >
          <div className="rounded-full bg-black/60 p-5 text-3xl text-white backdrop-blur-sm transition hover:bg-black/80">
            ▶️
          </div>
        </button>
      )}
    </div>
  );
}
