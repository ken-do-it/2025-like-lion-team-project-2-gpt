import { useEffect, useState } from "react";

import TrackCard from "../components/cards/TrackCard";
import apiClient from "../lib/api/client";

type TrackApi = {
  id: number;
  title: string;
  cover_url?: string | null;
  description?: string | null;
  audio_url?: string | null;
  created_at: string;
  duration_seconds?: number | null;
  plays_count?: number;
  likes_count?: number;
  genre?: string | null;
  tags?: string | null;
};

// TODO: 향후 API로 대체
const featuredPlaylists = [
  {
    id: 1,
    title: "Chill & Focus",
    coverUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=60",
    trackCount: 12,
  },
  {
    id: 2,
    title: "Night Drive",
    coverUrl: "https://images.unsplash.com/photo-1520440229-646e8a2f3c46?auto=format&fit=crop&w=800&q=60",
    trackCount: 9,
  },
  {
    id: 3,
    title: "Synth Wave",
    coverUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=60",
    trackCount: 15,
  },
];

function ExplorePage() {
  const [tracks, setTracks] = useState<TrackApi[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [keyword, setKeyword] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await apiClient.get<TrackApi[]>("/tracks");
        setTracks(res.data);
      } catch (err: any) {
        const msg = err?.response?.data?.message ?? "트랙을 불러오지 못했습니다.";
        setError(msg);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = tracks.filter((t) => {
    if (!keyword.trim()) return true;
    const q = keyword.trim().toLowerCase();
    return (
      t.title.toLowerCase().includes(q) ||
      (t.description ?? "").toLowerCase().includes(q) ||
      (t.genre ?? "").toLowerCase().includes(q) ||
      (t.tags ?? "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-12">
      <section
        className="relative min-h-[320px] overflow-hidden rounded-2xl border border-white/10 bg-cover bg-center p-8"
        style={{
          backgroundImage:
            "linear-gradient(rgba(25,16,34,0.7), rgba(25,16,34,0.9)), url('https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=1200&q=60')",
        }}
      >
        <div className="max-w-2xl space-y-4">
          <p className="text-sm uppercase tracking-[0.3em] text-white/60">AI Collection</p>
          <h1 className="text-4xl font-black leading-tight tracking-tight">AI 음악의 세계를 탐험하세요</h1>
          <p className="text-white/70">AI가 만든 새로운 음악을 발견하고, 듣고, 공유해 보세요.</p>
          <div className="flex gap-4">
            <button className="rounded-full bg-primary px-6 py-2 font-semibold text-white">지금 듣기</button>
            <button className="rounded-full border border-white/40 px-6 py-2 font-semibold text-white">Trending</button>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold">오늘의 추천 트랙</h2>
          <div className="flex items-center gap-2">
            <input
              className="rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/50 focus:border-primary focus:outline-none"
              placeholder="제목, 설명, 장르, 태그 검색"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
            <button className="text-sm text-white/70" onClick={() => setKeyword("")}>
              초기화
            </button>
          </div>
        </div>
        {loading && <p className="text-sm text-white/70">불러오는 중...</p>}
        {error && <p className="text-sm text-red-400">{error}</p>}
        {!loading && !error && filtered.length === 0 && (
          <p className="text-sm text-white/60">아직 등록된 트랙이 없습니다.</p>
        )}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((track) => (
            <TrackCard
              key={track.id}
              track={{
                id: track.id,
                title: track.title,
                artist: "Unknown Artist",
                coverUrl: track.cover_url
                  ? `${import.meta.env.VITE_API_BASE_URL ?? ""}/tracks/${track.id}/cover`
                  : "https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=600&q=60",
                duration: track.duration_seconds
                  ? `${Math.floor(track.duration_seconds / 60)}:${String(track.duration_seconds % 60).padStart(2, "0")}`
                  : "",
                plays: track.plays_count ?? 0,
                likes: track.likes_count ?? 0,
              }}
            />
          ))}
        </div>
      </section>

      <section>
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold">분위기 / 테마 플레이리스트</h2>
          <span className="text-sm text-white/60">AI Mood Lens</span>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {featuredPlaylists.map((playlist) => (
            <div key={playlist.id} className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div
                className="aspect-[4/3] w-full rounded-lg bg-cover bg-center"
                style={{ backgroundImage: `url(${playlist.coverUrl})` }}
              />
              <p className="mt-4 text-lg font-semibold">{playlist.title}</p>
              <p className="text-sm text-white/60">{playlist.trackCount} Tracks</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default ExplorePage;
