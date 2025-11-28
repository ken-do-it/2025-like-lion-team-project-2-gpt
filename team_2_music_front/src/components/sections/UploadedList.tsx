import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import apiClient from "../../lib/api/client";

interface TrackItem {
  id: number;
  title: string;
  description?: string | null;
  status: string;
  created_at: string;
}

const apiBase = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8001/api";

function UploadedList() {
  const [tracks, setTracks] = useState<TrackItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await apiClient.get<TrackItem[]>("/tracks");
        setTracks(res.data);
      } catch (err: any) {
        const msg = err?.response?.data?.message ?? "업로드 목록을 불러오지 못했습니다.";
        setError(msg);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return <p className="text-sm text-white/70">업로드된 트랙을 불러오는 중...</p>;
  }

  if (error) {
    return <p className="text-sm text-red-400">{error}</p>;
  }

  if (tracks.length === 0) {
    return <p className="text-sm text-white/60">아직 업로드된 트랙이 없습니다.</p>;
  }

  return (
    <div className="space-y-3">
      {tracks.map((track) => {
        const streamUrl = `${apiBase}/tracks/${track.id}/stream`;
        return (
          <div
            key={track.id}
            className="flex flex-col gap-2 rounded-xl border border-white/10 bg-white/5 p-4 md:flex-row md:items-center md:justify-between"
          >
            <div>
              <Link to={`/tracks/${track.id}`} className="text-base font-semibold hover:text-primary">
                {track.title}
              </Link>
              <p className="text-xs text-white/50">
                상태: {track.status} · 업로드: {new Date(track.created_at).toLocaleString()}
              </p>
            </div>
            <audio controls className="w-full md:w-64">
              <source src={streamUrl} />
              지원되지 않는 브라우저입니다.
            </audio>
          </div>
        );
      })}
    </div>
  );
}

export default UploadedList;
