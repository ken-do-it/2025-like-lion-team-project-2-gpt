import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { usePlayer } from "../contexts/PlayerContext";
import apiClient from "../lib/api/client";

type ApiTrack = {
  id: number;
  title: string;
  description?: string | null;
  status: string;
  created_at: string;
  audio_url?: string | null;
  cover_url?: string | null;
};

const apiBase = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8001/api";

function LibraryPage() {
  const [tracks, setTracks] = useState<ApiTrack[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<number | null>(null);
  const navigate = useNavigate();
  const player = usePlayer();

  const loadTracks = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get<ApiTrack[]>("/tracks");
      setTracks(res.data);
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? "트랙을 불러오지 못했습니다.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTracks();
  }, []);

  const handleDelete = async (trackId: number) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    try {
      await apiClient.delete(`/tracks/${trackId}`);
      setTracks((prev) => prev.filter((t) => t.id !== trackId));
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? "삭제에 실패했습니다.";
      alert(msg);
    }
  };

  const handleShare = async (track: ApiTrack) => {
    if (!track.audio_url) {
      alert("재생 가능한 오디오가 없습니다.");
      return;
    }
    const url = `${apiBase}/tracks/${track.id}/stream`;
    try {
      await navigator.clipboard.writeText(url);
      alert("공유 링크가 클립보드에 복사되었습니다.");
    } catch {
      alert(`공유 링크: ${url}`);
    }
  };

  const handleDownload = (track: ApiTrack) => {
    if (!track.audio_url) {
      alert("다운로드할 오디오가 없습니다.");
      return;
    }
    const url = `${apiBase}/tracks/${track.id}/stream`;
    const link = document.createElement("a");
    link.href = url;
    link.download = `${track.title}.mp3`;
    link.click();
  };

  const cardBg = "bg-[#1c1329]";
  const cardBorder = "border border-white/10";

  return (
    <div className="space-y-8">
      <div className={`${cardBg} ${cardBorder} rounded-2xl p-6`}>
        <p className="text-sm uppercase tracking-[0.3em] text-white/60">My Library</p>
        <h1 className="mt-1 text-3xl font-black">내 음악 라이브러리</h1>
        <p className="mt-2 text-white/70">업로드한 트랙을 확인하고 재생하거나 관리할 수 있습니다.</p>
      </div>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">최근 업로드</h2>
        {loading && <p className="text-sm text-white/70">불러오는 중...</p>}
        {error && tracks.length > 0 && <p className="text-sm text-red-400">{error}</p>}
        {!loading && !error && tracks.length === 0 && <p className="text-sm text-white/60">업로드한 트랙이 없습니다.</p>}

        <div className="space-y-3">
          {tracks.map((track) => {
            const streamUrl = track.audio_url ? `${apiBase}/tracks/${track.id}/stream` : null;
            const isOpen = menuOpenId === track.id;
            return (
              <div key={track.id} className={`${cardBg} ${cardBorder} rounded-2xl p-4`}>
                <div className="flex items-center gap-4">
                  <div
                    className="h-16 w-16 flex-shrink-0 rounded-md bg-cover bg-center bg-white/10"
                    style={{
                      backgroundImage: track.cover_url
                        ? `url(${track.cover_url})`
                        : "linear-gradient(135deg, #2d1b4b, #6b3fa0)",
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <Link to={`/tracks/${track.id}`} className="truncate text-lg font-semibold hover:text-primary">
                          {track.title}
                        </Link>
                        <p className="text-xs text-white/60 mt-1">
                          상태: {track.status} · 업로드: {new Date(track.created_at).toLocaleString()}
                        </p>
                        {track.description && (
                          <p className="mt-1 truncate text-sm text-white/70">{track.description}</p>
                        )}
                      </div>
                      <div className="relative flex items-center gap-2">
                        {streamUrl ? (
                          <button
                            type="button"
                            onClick={() =>
                              player.play({
                                id: track.id,
                                title: track.title,
                                streamUrl,
                                coverUrl: track.cover_url,
                                filename: track.title,
                              })
                            }
                            className="flex h-10 items-center rounded-full bg-primary px-4 text-sm font-semibold text-white shadow hover:bg-primary/90"
                          >
                            재생
                          </button>
                        ) : (
                          <span className="text-xs text-white/50">오디오 없음</span>
                        )}
                        <button
                          className="h-9 w-9 rounded-full bg-white/10 text-white hover:bg-white/20"
                          onClick={() => setMenuOpenId(isOpen ? null : track.id)}
                        >
                          ⋮
                        </button>
                        {isOpen && (
                          <div className="absolute right-0 top-10 z-10 w-40 rounded-lg border border-white/10 bg-[#1f1a2e] shadow-lg">
                            <button
                              className="block w-full px-3 py-2 text-left text-sm text-white hover:bg-white/10"
                              onClick={() => {
                                setMenuOpenId(null);
                                navigate(`/tracks/${track.id}/edit`);
                              }}
                            >
                              수정
                            </button>
                            <button
                              className="block w-full px-3 py-2 text-left text-sm text-white hover:bg-white/10"
                              onClick={() => {
                                setMenuOpenId(null);
                                handleShare(track);
                              }}
                            >
                              공유하기
                            </button>
                            <button
                              className="block w-full px-3 py-2 text-left text-sm text-white hover:bg-white/10"
                              onClick={() => {
                                setMenuOpenId(null);
                                handleDownload(track);
                              }}
                            >
                              다운로드
                            </button>
                            <button
                              className="block w-full px-3 py-2 text-left text-sm text-red-300 hover:bg-red-500/20"
                              onClick={() => {
                                setMenuOpenId(null);
                                handleDelete(track.id);
                              }}
                            >
                              삭제
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

export default LibraryPage;
