import type { PlaylistSummary, Track } from "../types/music";

export const trendingTracks: Track[] = [
  {
    id: "neon-echoes",
    title: "Neon Echoes",
    artist: "AI Voyager",
    coverUrl: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=600&q=60",
    duration: "3:40",
    mood: "energetic",
    plays: 15240,
    description: "미래적인 신시사이저와 강렬한 베이스가 어우러진 시티팝 트랙",
  },
  {
    id: "midnight-wave",
    title: "Midnight Wave",
    artist: "Dream Seeker",
    coverUrl: "https://images.unsplash.com/photo-1470229538611-16ba8c7ffbd7?auto=format&fit=crop&w=600&q=60",
    duration: "4:10",
    mood: "dream",
    plays: 9821,
  },
  {
    id: "lofi-sunrise",
    title: "Lo-Fi Sunrise",
    artist: "Analog AI",
    coverUrl: "https://images.unsplash.com/photo-1485579149621-3123dd979885?auto=format&fit=crop&w=600&q=60",
    duration: "2:58",
    mood: "chill",
    plays: 6578,
  },
];

export const featuredPlaylists: PlaylistSummary[] = [
  {
    id: "deep-focus",
    title: "Deep Focus Coding",
    coverUrl: "https://images.unsplash.com/photo-1488229297570-58520851e868?auto=format&fit=crop&w=600&q=60",
    trackCount: 28,
  },
  {
    id: "neon-dreams",
    title: "Neon Dreams",
    coverUrl: "https://images.unsplash.com/photo-1485217988980-11786ced9454?auto=format&fit=crop&w=600&q=60",
    trackCount: 32,
  },
  {
    id: "lunar-wave",
    title: "Lunar Wave",
    coverUrl: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=600&q=60",
    trackCount: 18,
  },
];

export const libraryTracks: Track[] = [
  {
    id: "my-echoes",
    title: "My Echoes",
    artist: "Stitch Studio",
    coverUrl: "https://images.unsplash.com/photo-1461784180009-21121b2f2043?auto=format&fit=crop&w=600&q=60",
    duration: "3:12",
    mood: "focus",
    plays: 2345,
    liked: true,
  },
  {
    id: "aurora",
    title: "Aurora Drift",
    artist: "Stitch Studio",
    coverUrl: "https://images.unsplash.com/photo-1501612780327-45045538702b?auto=format&fit=crop&w=600&q=60",
    duration: "4:44",
    mood: "dream",
    plays: 1899,
  },
];
