export type TrackMood = "chill" | "focus" | "energetic" | "dream";

export interface Track {
  id: number | string;
  title: string;
  artist: string;
  coverUrl: string;
  duration?: string;
  mood?: TrackMood;
  plays?: number;
  likes?: number;
  liked?: boolean;
  description?: string;
}

export interface PlaylistSummary {
  id: string;
  title: string;
  coverUrl: string;
  trackCount: number;
}
