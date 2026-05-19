"use client";

import { useState, useRef, useCallback } from "react";

export function useVideoPlayer() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const play = useCallback(() => {
    const el = videoRef.current;
    if (!el) return;
    const result = el.play();
    if (result && typeof result.then === "function") {
      result
        .then(() => setIsPlaying(true))
        .catch((err: unknown) => {
          // Swallow benign rejections so they don't surface as
          // "Uncaught (in promise) NotSupportedError" / "AbortError".
          // Callers can hook the element's `error` event for UI feedback.
          setIsPlaying(false);
          if (process.env.NODE_ENV !== "production") {
            console.warn("[useVideoPlayer] play() rejected:", err);
          }
        });
    } else {
      setIsPlaying(true);
    }
  }, []);

  const pause = useCallback(() => {
    videoRef.current?.pause();
    setIsPlaying(false);
  }, []);

  const seek = useCallback((time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  const onTimeUpdate = useCallback(() => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  }, []);

  const onLoadedMetadata = useCallback(() => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  }, []);

  return {
    videoRef,
    isPlaying,
    currentTime,
    duration,
    play,
    pause,
    seek,
    onTimeUpdate,
    onLoadedMetadata,
  };
}
