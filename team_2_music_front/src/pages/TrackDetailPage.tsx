import { useMemo } from "react";
import { useParams } from "react-router-dom";

import { trendingTracks } from "../data/mockTracks";

function TrackDetailPage() {
  const { trackId } = useParams();

  const track = useMemo(() => trendingTracks.find((item) => item.id === trackId) ?? trendingTracks[0], [trackId]);

  return (
    <div className="grid gap-10 lg:grid-cols-[360px_1fr]">
      <div className="space-y-6 rounded-2xl border border-white/10 bg-white/5 p-8">
        <div
          className="aspect-square w-full rounded-xl bg-cover bg-center"
          style={{ backgroundImage: `url(${track.coverUrl})` }}
        />
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-white/60">Featured Track</p>
          <h1 className="text-3xl font-black">{track.title}</h1>
          <p className="text-lg text-white/70">{track.artist}</p>
        </div>
        <div className="flex gap-4">
          <button className="flex-1 rounded-full bg-primary px-4 py-2 font-semibold">재생</button>
          <button className="flex-1 rounded-full border border-white/20 px-4 py-2 font-semibold text-white">저장</button>
        </div>
      </div>
      <div className="space-y-8">
        <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-xl font-semibold">트랙 정보</h2>
          <ul className="mt-4 space-y-2 text-sm text-white/70">
            <li>Duration: {track.duration}</li>
            <li>Mood: {track.mood}</li>
            <li>Plays: {track.plays.toLocaleString()}</li>
          </ul>
          {track.description && <p className="mt-4 text-white/80">{track.description}</p>}
        </section>
        <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-xl font-semibold">댓글</h2>
          <p className="mt-2 text-sm text-white/60">아직 댓글이 없습니다. 첫 번째로 감상을 남겨보세요.</p>
        </section>
      </div>
    </div>
  );
}

export default TrackDetailPage;
