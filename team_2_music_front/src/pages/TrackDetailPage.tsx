import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { usePlayer } from "../contexts/PlayerContext";
import apiClient from "../lib/api/client";

type TrackDetail = {
  id: number;
  title: string;
  description?: string | null;
  status: string;
  created_at: string;
  audio_url?: string | null;
  cover_url?: string | null;
  genre?: string | null;
  tags?: string | null;
  ai_provider?: string | null;
  ai_model?: string | null;
};

const apiBase = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8001/api";

function TrackDetailPage() {
  const { trackId } = useParams();
  const navigate = useNavigate();
  const player = usePlayer();
  const [track, setTrack] = useState<TrackDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchTrack = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get<TrackDetail>(`/tracks/${id}`);
      setTrack(res.data);
      setTitle(res.data.title);
      setDescription(res.data.description ?? "");
      setCoverUrl(res.data.cover_url ?? "");
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? "트랙을 불러오지 못했습니다.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (trackId) fetchTrack(trackId);
  }, [trackId]);

  const streamUrl = track?.audio_url ? `${apiBase}/tracks/${track.id}/stream` : null;
  const coverStyle = track?.cover_url
    ? { backgroundImage: `url(${track.cover_url})` }
    : { backgroundImage: "linear-gradient(135deg, #2d1b4b, #6b3fa0)" };

  const handleSave = async () => {
    if (!trackId) return;
    setSaving(true);
    setSaveError(null);
    setSaveMessage(null);
    try {
      await apiClient.patch(`/tracks/${trackId}`, {
        title,
        description,
        cover_url: coverUrl,
      });
      setSaveMessage("수정이 완료되었습니다.");
      await fetchTrack(trackId);
      setEditing(false);
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? "수정에 실패했습니다.";
      setSaveError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!trackId) return;
    if (!confirm("정말 삭제하시겠습니까?")) return;
    try {
      await apiClient.delete(`/tracks/${trackId}`);
      navigate("/library");
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? "삭제에 실패했습니다.";
      alert(msg);
    }
  };

  if (loading) return <p className="text-sm text-white/70">불러오는 중...</p>;

  if (error) {
    return (
      <div className="space-y-3 rounded-2xl border border-red-500/40 bg-red-500/10 p-6 text-white">
        <p className="text-lg font-semibold">오류</p>
        <p className="text-sm">{error}</p>
        <button className="rounded-md bg-white/10 px-3 py-2 text-sm hover:bg-white/20" onClick={() => navigate(-1)}>
          돌아가기
        </button>
      </div>
    );
  }

  if (!track) return <p className="text-sm text-white/60">트랙 정보를 찾을 수 없습니다.</p>;

  return (
    <div className="grid gap-10 lg:grid-cols-[360px_1fr]">
      <div className="space-y-6 rounded-2xl border border-white/10 bg-white/5 p-8">
        <div className="aspect-square w-full rounded-xl bg-cover bg-center" style={coverStyle} />
        <div className="space-y-1">
          <p className="text-sm uppercase tracking-[0.3em] text-white/60">Track</p>
          <h1 className="text-3xl font-black">{track.title}</h1>
          <p className="text-xs text-white/60">업로드: {new Date(track.created_at).toLocaleString()}</p>
          <p className="text-xs text-white/60">상태: {track.status}</p>
        </div>
        <div className="flex flex-col gap-3">
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
              className="rounded-full bg-primary px-4 py-3 text-sm font-semibold text-white shadow hover:bg-primary/90"
            >
              재생
            </button>
          ) : (
            <p className="text-sm text-white/60">오디오가 없습니다.</p>
          )}
        </div>
        <div className="flex gap-3">
          <Link
            to={`/tracks/${track.id}/edit`}
            className="flex-1 rounded-lg bg-white/10 px-4 py-2 text-sm font-semibold text-center hover:bg-white/20"
          >
            수정
          </Link>
          <button
            className="flex-1 rounded-lg bg-red-500/80 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500"
            onClick={handleDelete}
          >
            삭제
          </button>
        </div>
      </div>

      <div className="space-y-8">
        <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-xl font-semibold">설명</h2>
          {track.description ? (
            <p className="mt-2 text-sm text-white/80">{track.description}</p>
          ) : (
            <p className="mt-2 text-sm text-white/60">설명이 없습니다.</p>
          )}
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-3">
          <h2 className="text-xl font-semibold">AI 정보</h2>
          <p className="text-sm text-white/70">
            AI 제공자: {track.ai_provider ?? "미입력"} · 모델: {track.ai_model ?? "미입력"}
          </p>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-3">
          <h2 className="text-xl font-semibold">재생/공유</h2>
          {streamUrl ? (
            <div className="mt-2 break-all text-sm text-primary">
              <a href={streamUrl} target="_blank" rel="noreferrer" className="hover:underline">
                {streamUrl}
              </a>
            </div>
          ) : (
            <p className="text-sm text-white/60">재생 URL이 없습니다.</p>
          )}
        </section>

        {editing && (
          <section className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-3">
            <h2 className="text-xl font-semibold">수정</h2>
            <label className="grid gap-2">
              <span className="text-sm font-medium text-white">제목</span>
              <input
                className="rounded-lg border border-white/20 bg-white/5 p-3 placeholder-white/40 focus:border-primary focus:outline-none"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-medium text-white">설명</span>
              <textarea
                className="rounded-lg border border-white/20 bg-white/5 p-3 placeholder-white/40 focus:border-primary focus:outline-none"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-medium text-white">커버 이미지 URL</span>
              <input
                className="rounded-lg border border-white/20 bg-white/5 p-3 placeholder-white/40 focus:border-primary focus:outline-none"
                value={coverUrl}
                onChange={(e) => setCoverUrl(e.target.value)}
              />
            </label>
            <div className="flex gap-3">
              <button
                className="flex-1 rounded-lg border border-white/20 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
                onClick={() => setEditing(false)}
                type="button"
              >
                취소
              </button>
              <button
                className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-60"
                onClick={handleSave}
                disabled={saving}
                type="button"
              >
                {saving ? "저장 중..." : "저장"}
              </button>
            </div>
            {saveError && <p className="text-sm text-red-400">{saveError}</p>}
            {saveMessage && <p className="text-sm text-green-400">{saveMessage}</p>}
          </section>
        )}
      </div>
    </div>
  );
}

export default TrackDetailPage;
