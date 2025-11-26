export type TrackMood = "chill" | "focus" | "energetic" | "dream";

export interface Track {
  id: string;
  title: string;
  artist: string;
  coverUrl: string;
  duration: string;
  mood: TrackMood;
  plays: number;
  liked?: boolean;
  description?: string;
}

export interface PlaylistSummary {
  id: string;
  title: string;
  coverUrl: string;
  trackCount: number;
}
