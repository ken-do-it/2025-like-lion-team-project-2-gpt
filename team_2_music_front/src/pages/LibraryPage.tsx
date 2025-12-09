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
      alert("재생 가능한 음원 URL이 없습니다.");
      return;
    }
    const url = `${apiBase}/tracks/${track.id}/stream`;
    try {
      await navigator.clipboard.writeText(url);
      alert("재생 링크가 클립보드에 복사되었습니다.");
    } catch (err: any) {
      const reason =
        window.isSecureContext === false
          ? "HTTPS 환경이 아니면 클립보드를 쓸 수 없습니다. 링크를 직접 복사하세요."
          : "클립보드 복사에 실패했습니다. 링크를 직접 복사하세요.";
      alert(`${reason}\n${url}`);
    }
  };

  const handleDownload = (track: ApiTrack) => {
    if (!track.audio_url) {
      alert("다운로드할 음원 URL이 없습니다.");
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
        <p className="mt-2 text-white/70">업로드한 트랙을 확인하거나 재생하고 관리할 수 있습니다.</p>
      </div>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">최근 업로드</h2>
        {loading && <p className="text-sm text-white/70">불러오는 중...</p>}
        {error && tracks.length > 0 && <p className="text-sm text-red-400">{error}</p>}
        {!loading && !error && tracks.length === 0 && <p className="text-sm text-white/60">업로드된 트랙이 없습니다.</p>}

        <div className="space-y-3">
          {tracks.map((track) => {
            const streamUrl = track.audio_url ? `${apiBase}/tracks/${track.id}/stream` : null;
            const coverUrl = track.cover_url ? `${apiBase}/tracks/${track.id}/cover` : undefined;
            const isOpen = menuOpenId === track.id;
            const queue = tracks
              .filter((t) => Boolean(t.audio_url))
              .map((t) => ({
                id: t.id,
                title: t.title,
                streamUrl: `${apiBase}/tracks/${t.id}/stream`,
                coverUrl: t.cover_url ? `${apiBase}/tracks/${t.id}/cover` : undefined,
                filename: t.title,
              }));
            return (
              <div key={track.id} className={`${cardBg} ${cardBorder} rounded-2xl p-4`}>
                <div className="flex items-center gap-4">
                  <div
                    className="h-16 w-16 flex-shrink-0 rounded-md bg-cover bg-center bg-white/10"
                    style={{
                      backgroundImage: coverUrl
                        ? `url(${coverUrl})`
                        : "linear-gradient(135deg, #2d1b4b, #6b3fa0)",
                    }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <Link to={`/tracks/${track.id}`} className="truncate text-lg font-semibold hover:text-primary">
                          {track.title}
                        </Link>
                        <p className="mt-1 text-xs text-white/60">
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
                              }, queue)
                            }
                            className="flex h-10 items-center rounded-full bg-primary px-4 text-sm font-semibold text-white shadow hover:bg-primary/90"
                          >
                            재생
                          </button>
                        ) : (
                          <span className="text-xs text-white/50">재생 불가</span>
                        )}
                        <button
                          className="h-9 w-9 rounded-full bg-white/10 text-white hover:bg-white/20"
                          onClick={() => setMenuOpenId(isOpen ? null : track.id)}
                        >
                          ⋯
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
