import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";

import apiClient from "../lib/api/client";

type TrackInfo = {
  id: number;
  title: string;
  streamUrl: string;
  coverUrl?: string | null;
  filename?: string;
};

type PlayerContextType = {
  current: TrackInfo | null;
  isPlaying: boolean;
  progress: number;
  duration: number;
  play: (track: TrackInfo, queue?: TrackInfo[]) => void;
  toggle: () => void;
  seek: (value: number) => void;
  download: () => void;
  liked: boolean;
  toggleLike: () => Promise<void>;
  volume: number;
  setVolume: (value: number) => void;
  muted: boolean;
  toggleMute: () => void;
  prev: () => void;
  next: () => void;
  hasPrev: boolean;
  hasNext: boolean;
};

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export function PlayerProvider({ children }: React.PropsWithChildren) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [current, setCurrent] = useState<TrackInfo | null>(null);
  const [queue, setQueue] = useState<TrackInfo[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [liked, setLiked] = useState(false);
  const [volume, setVolumeState] = useState(1);
  const [lastVolume, setLastVolume] = useState(1);
  const [muted, setMuted] = useState(false);

  const hasPrev = useMemo(() => currentIndex > 0, [currentIndex]);
  const hasNext = useMemo(() => currentIndex >= 0 && currentIndex < queue.length - 1, [currentIndex, queue.length]);

  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;

    const onTimeUpdate = () => {
      setProgress(audio.currentTime);
      setDuration(audio.duration || 0);
    };
    const onEnded = () => {
      if (hasNext) {
        next();
      } else {
        setIsPlaying(false);
      }
    };
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.pause();
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("ended", onEnded);
    };
  }, [hasNext]);

  const startTrack = (track: TrackInfo, queueList: TrackInfo[], index: number) => {
    if (!audioRef.current) return;
    setQueue(queueList);
    setCurrentIndex(index);
    setCurrent(track);
    setLiked(false);
    audioRef.current.src = track.streamUrl;
    audioRef.current.currentTime = 0;
    audioRef.current.load();
    audioRef.current.volume = muted ? 0 : volume;
    audioRef.current
      .play()
      .then(() => setIsPlaying(true))
      .catch((err) => {
        // play()가 pause() 등으로 바로 끊기면 AbortError가 뜨는데, 이는 무시해도 됩니다.
        if (err?.name === "AbortError") return;
        setIsPlaying(false);
        console.error("재생 실패:", err);
      });
  };

  const play = (track: TrackInfo, queueList?: TrackInfo[]) => {
    if (!audioRef.current) return;
    const list = queueList ?? queue;
    const idx = list.findIndex((t) => t.id === track.id);
    if (idx >= 0) {
      startTrack(list[idx], list, idx);
    } else {
      // fallback: single track queue
      startTrack(track, [track], 0);
    }
  };

  const toggle = () => {
    if (!audioRef.current || !current) return;
    // 초기 재생 시 src가 비어 있으면 강제로 설정/로드
    if (!audioRef.current.src) {
      audioRef.current.src = current.streamUrl;
      audioRef.current.currentTime = 0;
      audioRef.current.load();
    }
    if (audioRef.current.paused) {
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((err) => {
          if (err?.name === "AbortError") return;
          setIsPlaying(false);
          console.error("재생 실패:", err);
        });
    } else {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const seek = (value: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = value;
    setProgress(value);
  };

  const download = () => {
    if (!current?.streamUrl) return;
    const link = document.createElement("a");
    link.href = current.streamUrl;
    link.download = `${current.filename ?? current.title}.mp3`;
    link.click();
  };

  const toggleLike = async () => {
    if (!current) return;
    const nextLiked = !liked;
    setLiked(nextLiked);
    try {
      if (nextLiked) {
        await apiClient.post(`/interactions/tracks/${current.id}/like`);
      } else {
        await apiClient.delete(`/interactions/tracks/${current.id}/like`);
      }
    } catch (err) {
      setLiked(!nextLiked);
      console.error("좋아요 토글 중 오류", err);
      alert("좋아요 요청에 실패했습니다.");
    }
  };

  const setVolume = (value: number) => {
    const next = Math.min(1, Math.max(0, value));
    setVolumeState(next);
    setMuted(next === 0);
    if (audioRef.current) audioRef.current.volume = next;
  };

  const toggleMute = () => {
    if (muted) {
      const restore = lastVolume > 0 ? lastVolume : 1;
      setMuted(false);
      setVolume(restore);
    } else {
      setLastVolume(volume || 1);
      setMuted(true);
      setVolume(0);
    }
  };

  const prev = () => {
    if (!hasPrev) return;
    const nextIndex = currentIndex - 1;
    const nextTrack = queue[nextIndex];
    startTrack(nextTrack, queue, nextIndex);
  };

  const next = () => {
    if (!hasNext) return;
    const nextIndex = currentIndex + 1;
    const nextTrack = queue[nextIndex];
    startTrack(nextTrack, queue, nextIndex);
  };

  return (
    <PlayerContext.Provider
      value={{
        current,
        isPlaying,
        progress,
        duration,
        play,
        toggle,
        seek,
        download,
        liked,
        toggleLike,
        volume,
        setVolume,
        muted,
        toggleMute,
        prev,
        next,
        hasPrev,
        hasNext,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer must be used within PlayerProvider");
  return ctx;
}
