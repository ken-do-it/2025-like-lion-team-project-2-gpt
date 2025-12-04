import React, { createContext, useContext, useEffect, useRef, useState } from "react";

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
  play: (track: TrackInfo) => void;
  toggle: () => void;
  seek: (value: number) => void;
  download: () => void;
  liked: boolean;
  toggleLike: () => Promise<void>;
  volume: number;
  setVolume: (value: number) => void;
  muted: boolean;
  toggleMute: () => void;
};

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export function PlayerProvider({ children }: React.PropsWithChildren) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [current, setCurrent] = useState<TrackInfo | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [liked, setLiked] = useState(false);
  const [volume, setVolumeState] = useState(1);
  const [lastVolume, setLastVolume] = useState(1);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;

    const onTimeUpdate = () => {
      setProgress(audio.currentTime);
      setDuration(audio.duration || 0);
    };
    const onEnded = () => setIsPlaying(false);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.pause();
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("ended", onEnded);
    };
  }, []);

  const play = (track: TrackInfo) => {
    if (!audioRef.current) return;
    setCurrent(track);
    setLiked(false); // 기본값; 서버 값 가져오려면 추가 요청 필요
    audioRef.current.src = track.streamUrl;
    audioRef.current.volume = muted ? 0 : volume;
    audioRef.current
      .play()
      .then(() => setIsPlaying(true))
      .catch(() => setIsPlaying(false));
  };

  const toggle = () => {
    if (!audioRef.current) return;
    if (audioRef.current.paused) {
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
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
    const next = !liked;
    setLiked(next);
    try {
      if (next) {
        await apiClient.post(`/interactions/tracks/${current.id}/like`);
      } else {
        await apiClient.delete(`/interactions/tracks/${current.id}/like`);
      }
    } catch (err) {
      // 실패 시 상태 롤백
      setLiked(!next);
      console.error("좋아요 처리 실패", err);
      alert("좋아요 처리에 실패했습니다.");
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
