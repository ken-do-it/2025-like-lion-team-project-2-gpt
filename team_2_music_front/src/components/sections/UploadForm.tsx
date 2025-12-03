import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import apiClient from "@/lib/api/client";

type Mode = "create" | "edit";

interface UploadFormProps {
  mode?: Mode;
  trackId?: string;
  initial?: {
    title?: string;
    description?: string | null;
    cover_url?: string | null;
    genre?: string | null;
    tags?: string | null;
    ai_provider?: string | null;
    ai_model?: string | null;
  };
}

const MAX_SIZE_MB = 50;
const ALLOWED_TYPES = ["audio/mpeg", "audio/mp3", "audio/wav", "audio/flac"];
const AI_PROVIDERS = ["suno", "mureka", "soundraw", "기타"] as const;

function UploadForm({ mode = "create", trackId, initial }: UploadFormProps) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [genre, setGenre] = useState(initial?.genre ?? "");
  const [tags, setTags] = useState(initial?.tags ?? "");
  const [coverUrl, setCoverUrl] = useState(initial?.cover_url ?? "");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioName, setAudioName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [aiProvider, setAiProvider] = useState<string>(initial?.ai_provider ?? "");
  const [aiModel, setAiModel] = useState<string>(initial?.ai_model ?? "");
  const [aiProviderCustom, setAiProviderCustom] = useState("");

  const devUserId = import.meta.env.VITE_DEV_USER_ID as string | undefined;
  const navigate = useNavigate();

  useEffect(() => {
    setTitle(initial?.title ?? "");
    setDescription(initial?.description ?? "");
    setGenre(initial?.genre ?? "");
    setTags(initial?.tags ?? "");
    setCoverUrl(initial?.cover_url ?? "");
    setAiProvider(initial?.ai_provider ?? "");
    setAiModel(initial?.ai_model ?? "");
  }, [initial]);

  const resolvedProvider = useMemo(() => {
    if (aiProvider === "기타") return aiProviderCustom.trim();
    return aiProvider;
  }, [aiProvider, aiProviderCustom]);

  const setTitleFromFile = (file: File) => {
    if (!title.trim()) {
      const name = file.name.replace(/\.[^/.]+$/, "");
      setTitle(name);
    }
  };

  const handleAudioChange = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) {
      setAudioFile(null);
      setAudioName("");
      return;
    }
    const file = fileList[0];
    setAudioFile(file);
    setAudioName(file.name);
    setTitleFromFile(file);
  };

  const validateForm = (): boolean => {
    if (!title.trim()) {
      setError("제목을 입력해주세요.");
      return false;
    }
    if (!resolvedProvider) {
      setError("AI 제공자를 선택하거나 입력해주세요.");
      return false;
    }
    if (!aiModel.trim()) {
      setError("사용한 모델명을 입력해주세요.");
      return false;
    }
    if (mode === "create" || audioFile) {
      if (!audioFile) {
        setError("음악 파일을 업로드해주세요.");
        return false;
      }
      if (audioFile.size > MAX_SIZE_MB * 1024 * 1024) {
        setError(`파일 크기는 ${MAX_SIZE_MB}MB 이하여야 합니다.`);
        return false;
      }
      if (audioFile.type && !ALLOWED_TYPES.includes(audioFile.type)) {
        setError("지원하지 않는 파일 형식입니다. mp3 / wav / flac 형식만 허용됩니다.");
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async () => {
    setError(null);
    setMessage(null);
    if (!validateForm()) return;

    const headers: Record<string, string> = {};
    if (devUserId) headers["X-User-Id"] = devUserId;

    setIsSubmitting(true);
    try {
      if (mode === "create") {
        const formData = new FormData();
        formData.append("file", audioFile as File);
        formData.append("title", title.trim());
        formData.append("ai_provider", resolvedProvider);
        formData.append("ai_model", aiModel.trim());
        if (description) formData.append("description", description);
        if (genre) formData.append("genre", genre);
        if (tags) formData.append("tags", tags);
        if (coverUrl) formData.append("cover_url", coverUrl);

        await apiClient.post("/tracks/upload/direct", formData, {
          headers: { ...headers, "Content-Type": "multipart/form-data" },
        });
        setMessage("업로드가 완료되었습니다. 라이브러리로 이동합니다.");
        navigate("/library");
      } else if (mode === "edit" && trackId) {
        await apiClient.patch(`/tracks/${trackId}`, {
          title,
          description,
          cover_url: coverUrl,
          genre,
          tags,
          ai_provider: resolvedProvider,
          ai_model: aiModel,
        });
        if (audioFile) {
          const audioForm = new FormData();
          audioForm.append("file", audioFile);
          await apiClient.post(`/tracks/${trackId}/upload/replace`, audioForm, {
            headers: { ...headers, "Content-Type": "multipart/form-data" },
          });
        }
        setMessage("수정이 완료되었습니다.");
      }
    } catch (err: any) {
      const detail = err?.response?.data?.message ?? "업로드 중 문제가 발생했습니다.";
      setError(detail);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(false);
    if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
      handleAudioChange(event.dataTransfer.files);
    }
  };

  return (
    <div className="space-y-6">
      <div
        className={`rounded-2xl border-2 border-dashed ${
          isDragOver ? "border-primary bg-primary/10" : "border-white/20 bg-white/5"
        } p-6 text-center text-white`}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setIsDragOver(false);
        }}
        onDrop={onDrop}
      >
        <p className="text-lg font-semibold">여기에 음악 파일을 드래그 앤 드롭하세요</p>
        <p className="text-xs text-white/60 mt-1">지원 형식: MP3, WAV, FLAC · 최대 크기: {MAX_SIZE_MB}MB</p>
        <div className="mt-4">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow hover:bg-primary/90">
            파일 선택
            <input
              type="file"
              accept="audio/*"
              className="hidden"
              onChange={(event) => handleAudioChange(event.target.files)}
            />
          </label>
          {audioName && <p className="mt-2 text-sm text-white/70">선택된 파일: {audioName}</p>}
        </div>
      </div>

      <div className="grid gap-8 rounded-2xl border border-white/10 bg-white/5 p-8 lg:grid-cols-[320px_1fr]">
        <div className="flex flex-col items-center gap-4">
          <p className="text-lg font-semibold">앨범 아트</p>
          <label className="flex aspect-square w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-white/20 text-center text-white/70">
            <span className="material-symbols-outlined text-4xl text-primary">add_photo_alternate</span>
            <span className="text-sm">이미지를 업로드하세요</span>
            <input type="file" className="hidden" accept="image/*" />
          </label>
        </div>

        <form className="grid gap-6 text-sm text-white/80" onSubmit={(e) => e.preventDefault()}>
          <label className="grid gap-2">
            <span className="text-sm font-medium text-white">
              제목 <span className="text-primary">*</span>
            </span>
            <input
              className="rounded-lg border border-white/20 bg-white/5 p-3 placeholder-white/40 focus:border-primary focus:outline-none"
              placeholder="음악의 제목을 입력해주세요"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-medium text-white">음악에 대한 설명</span>
            <textarea
              className="rounded-lg border border-white/20 bg-white/5 p-3 placeholder-white/40 focus:border-primary focus:outline-none"
              rows={4}
              placeholder="음악에 대한 설명을 입력해주세요"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </label>

          <div className="grid gap-6 md:grid-cols-2">
            <label className="grid gap-2">
              <span className="text-sm font-medium text-white">장르</span>
              <input
                className="rounded-lg border border-white/20 bg-white/5 p-3 placeholder-white/40 focus:border-primary focus:outline-none"
                placeholder="예: Electronic, Lo-fi"
                value={genre}
                onChange={(event) => setGenre(event.target.value)}
              />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-medium text-white">분위기 / 태그</span>
              <input
                className="rounded-lg border border-white/20 bg-white/5 p-3 placeholder-white/40 focus:border-primary focus:outline-none"
                placeholder="예: chill, focus, relaxing"
                value={tags}
                onChange={(event) => setTags(event.target.value)}
              />
            </label>
          </div>

          <div className="grid gap-4 rounded-lg border border-white/10 bg-white/5 p-4">
            <span className="text-sm font-semibold text-white">AI 정보 (필수)</span>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="flex flex-col gap-2">
                <span className="text-xs text-white/60">어떤 AI를 사용했나요?</span>
                <div className="flex flex-wrap gap-2">
                  {AI_PROVIDERS.map((provider) => (
                    <button
                      key={provider}
                      type="button"
                      className={`rounded-full px-3 py-1 text-sm ${
                        aiProvider === provider
                          ? "bg-primary text-white"
                          : "bg-white/10 text-white/80 hover:bg-white/20"
                      }`}
                      onClick={() => setAiProvider(provider)}
                    >
                      {provider === "기타" ? "기타" : provider.toUpperCase()}
                    </button>
                  ))}
                </div>
                {aiProvider === "기타" && (
                  <input
                    className="rounded-lg border border-white/20 bg-white/5 p-3 placeholder-white/40 focus:border-primary focus:outline-none"
                    placeholder="직접 입력"
                    value={aiProviderCustom}
                    onChange={(e) => setAiProviderCustom(e.target.value)}
                  />
                )}
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-xs text-white/60">사용한 모델명을 입력해주세요.</span>
                <input
                  className="rounded-lg border border-white/20 bg-white/5 p-3 placeholder-white/40 focus:border-primary focus:outline-none"
                  placeholder="예: Suno v3, Custom-XL 등"
                  value={aiModel}
                  onChange={(e) => setAiModel(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          <label className="grid gap-2">
            <span className="text-sm font-medium text-white">커버 이미지 URL</span>
            <input
              className="rounded-lg border border-white/20 bg-white/5 p-3 placeholder-white/40 focus:border-primary focus:outline-none"
              placeholder="https://example.com/cover.jpg"
              value={coverUrl}
              onChange={(event) => setCoverUrl(event.target.value)}
            />
          </label>

          <div className="flex justify-end gap-4 pt-2">
            <button type="button" className="rounded-lg border border-white/30 px-6 py-2 font-semibold text-white" onClick={() => navigate(-1)}>
              취소
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="rounded-lg bg-primary px-6 py-2 font-semibold text-white shadow-lg disabled:opacity-60"
            >
              {isSubmitting ? "처리 중..." : mode === "create" ? "업로드" : "수정"}
            </button>
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          {message && <p className="text-sm text-green-400">{message}</p>}
        </form>
      </div>
    </div>
  );
}

export default UploadForm;
