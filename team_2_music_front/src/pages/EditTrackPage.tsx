import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import UploadForm from "../components/sections/UploadForm";
import apiClient from "../lib/api/client";

type TrackDetail = {
  id: number;
  title: string;
  description?: string | null;
  genre?: string | null;
  tags?: string | null;
  ai_provider?: string | null;
  ai_model?: string | null;
};

function EditTrackPage() {
  const { trackId } = useParams();
  const [track, setTrack] = useState<TrackDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!trackId) return;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await apiClient.get<TrackDetail>(`/tracks/${trackId}`);
        setTrack(res.data);
      } catch (err: any) {
        const msg = err?.response?.data?.message ?? "트랙 정보를 불러오지 못했습니다.";
        setError(msg);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [trackId]);

  if (loading) return <p className="text-white/70 text-sm">불러오는 중...</p>;
  if (error) return <p className="text-red-400 text-sm">{error}</p>;
  if (!track || !trackId) return <p className="text-white/60 text-sm">트랙을 찾을 수 없습니다.</p>;

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-sm uppercase tracking-[0.3em] text-white/60">AI Upload</p>
        <h1 className="text-3xl font-black">트랙 수정</h1>
        <p className="text-white/70">제목, 설명, AI 정보 등을 수정하고 필요하면 오디오 파일을 교체하세요.</p>
      </header>
      <UploadForm
        mode="edit"
        trackId={trackId}
        initial={{
          title: track.title,
          description: track.description,
          genre: track.genre,
          tags: track.tags,
          ai_provider: track.ai_provider,
          ai_model: track.ai_model,
        }}
      />
    </div>
  );
}

export default EditTrackPage;
