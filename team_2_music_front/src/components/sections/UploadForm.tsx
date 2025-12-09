import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { parseBlob } from "music-metadata-browser";
import { Buffer } from "buffer";

import apiClient from "../../lib/api/client";

type Mode = "create" | "edit";

interface UploadFormProps {
  mode?: Mode;
  trackId?: string;
  initial?: {
    title?: string;
    description?: string | null;
    genre?: string | null;
    tags?: string | null;
    ai_provider?: string | null;
    ai_model?: string | null;
    cover_url?: string | null;
  };
}

const MAX_SIZE_MB = 50;
const MAX_COVER_MB = 10;
const ALLOWED_TYPES = ["audio/mpeg", "audio/mp3", "audio/wav", "audio/flac"];
const ALLOWED_COVER_TYPES = ["image/jpeg", "image/png", "image/webp"];
const AI_PROVIDERS = ["suno", "mureka", "soundraw", "other"] as const;

// music-metadata-browser needs Buffer even in the browser
if (typeof (globalThis as any).Buffer === "undefined") {
  (globalThis as any).Buffer = Buffer;
}

function UploadForm({ mode = "create", trackId, initial }: UploadFormProps) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [genre, setGenre] = useState(initial?.genre ?? "");
  const [tags, setTags] = useState(initial?.tags ?? "");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioName, setAudioName] = useState("");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverName, setCoverName] = useState("");
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [aiProvider, setAiProvider] = useState<string>(initial?.ai_provider ?? "");
  const [aiModel, setAiModel] = useState<string>(initial?.ai_model ?? "");
  const [aiProviderCustom, setAiProviderCustom] = useState("");

  const devUserId = import.meta.env.VITE_DEV_USER_ID as string | undefined;
  const navigate = useNavigate();

  // edit mode: preload server cover
  useEffect(() => {
    setTitle(initial?.title ?? "");
    setDescription(initial?.description ?? "");
    setGenre(initial?.genre ?? "");
    setTags(initial?.tags ?? "");
    setAiProvider(initial?.ai_provider ?? "");
    setAiModel(initial?.ai_model ?? "");
    setCoverFile(null);
    setCoverName("");
    if (initial?.cover_url && trackId) {
      const apiBase = import.meta.env.VITE_API_BASE_URL ?? "";
      setCoverPreview(`${apiBase}/tracks/${trackId}/cover`);
    } else {
      setCoverPreview(null);
    }
  }, [initial, trackId]);

  // cleanup object URL
  useEffect(() => {
    return () => {
      if (coverPreview?.startsWith("blob:")) {
        URL.revokeObjectURL(coverPreview);
      }
    };
  }, [coverPreview]);

  const resolvedProvider = useMemo(() => {
    if (aiProvider === "other") return aiProviderCustom.trim();
    return aiProvider;
  }, [aiProvider, aiProviderCustom]);

  const setTitleFromFile = (file: File) => {
    if (!title.trim()) {
      const name = file.name.replace(/\.[^/.]+$/, "");
      setTitle(name);
    }
  };

  const handleAudioChange = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) {
      setAudioFile(null);
      setAudioName("");
      setCoverPreview(null);
      setCoverName("");
      return;
    }
    const file = fileList[0];
    setAudioFile(file);
    setAudioName(file.name);
    setTitleFromFile(file);

    // auto extract embedded cover if user did not upload a custom one yet
    if (!coverFile) {
      try {
        const metadata = await parseBlob(file);
        const pic = metadata.common.picture?.[0];
        if (pic?.data?.length) {
          const mime = pic.type || pic.format || "image/jpeg";
          const blob = new Blob([pic.data], { type: mime });
          const url = URL.createObjectURL(blob);
          setCoverPreview(url);
          setCoverName("embedded cover");
        } else {
          setCoverPreview(null);
          setCoverName("");
        }
      } catch (e) {
        console.warn("embedded cover parse failed", e);
        setCoverPreview(null);
        setCoverName("");
      }
    }
  };

  const handleCoverChange = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) {
      setCoverFile(null);
      setCoverName("");
      setCoverPreview(null);
      return;
    }
    const file = fileList[0];
    setCoverFile(file);
    setCoverName(file.name);
    const url = URL.createObjectURL(file);
    setCoverPreview(url);
  };

  const validateForm = (): boolean => {
    if (!title.trim()) {
      setError("Please enter a title.");
      return false;
    }
    if (!resolvedProvider) {
      setError("Select or enter which AI provider you used.");
      return false;
    }
    if (!aiModel.trim()) {
      setError("Enter the model name you used.");
      return false;
    }
    if (mode === "create" || audioFile) {
      if (!audioFile) {
        setError("Upload an audio file.");
        return false;
      }
      if (audioFile.size > MAX_SIZE_MB * 1024 * 1024) {
        setError(`Audio must be ${MAX_SIZE_MB}MB or less.`);
        return false;
      }
      if (audioFile.type && !ALLOWED_TYPES.includes(audioFile.type)) {
        setError("Only mp3 / wav / flac are supported.");
        return false;
      }
    }
    if (coverFile) {
      if (coverFile.size > MAX_COVER_MB * 1024 * 1024) {
        setError(`Cover image must be ${MAX_COVER_MB}MB or less.`);
        return false;
      }
      if (coverFile.type && !ALLOWED_COVER_TYPES.includes(coverFile.type)) {
        setError("Cover image supports jpg / png / webp only.");
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
        if (coverFile) formData.append("cover_file", coverFile);

        await apiClient.post("/tracks/upload/direct", formData, {
          headers: { ...headers, "Content-Type": "multipart/form-data" },
        });
        setMessage("Upload completed. Redirecting to library.");
        navigate("/library");
      } else if (mode === "edit" && trackId) {
        await apiClient.patch(`/tracks/${trackId}`, {
          title,
          description,
          genre,
          tags,
          ai_provider: resolvedProvider,
          ai_model: aiModel,
          cover_url: coverPreview && !coverFile ? coverPreview : undefined,
        });
        if (audioFile) {
          const audioForm = new FormData();
          audioForm.append("file", audioFile);
          await apiClient.post(`/tracks/${trackId}/upload/replace`, audioForm, {
            headers: { ...headers, "Content-Type": "multipart/form-data" },
          });
        }
        if (coverFile) {
          const coverForm = new FormData();
          coverForm.append("cover_file", coverFile);
          await apiClient.post(`/tracks/${trackId}/upload/cover`, coverForm, {
            headers: { ...headers, "Content-Type": "multipart/form-data" },
          });
        }
        setMessage("Saved.");
      }
      navigate("/library");
    } catch (err: any) {
      const detail = err?.response?.data?.message ?? "There was a problem while uploading.";
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
        <p className="text-lg font-semibold">Drag & drop your audio file</p>
        <p className="mt-1 text-xs text-white/60">Supported: MP3, WAV, FLAC · Max {MAX_SIZE_MB}MB</p>
        <div className="mt-4">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow hover:bg-primary/90">
            Select file
            <input type="file" accept="audio/*" className="hidden" onChange={(event) => handleAudioChange(event.target.files)} />
          </label>
          {audioName && <p className="mt-2 text-sm text-white/70">Selected: {audioName}</p>}
        </div>
      </div>

      <div className="grid gap-8 rounded-2xl border border-white/10 bg-white/5 p-8 lg:grid-cols-[320px_1fr]">
        <div className="flex flex-col items-center gap-4">
          <p className="text-lg font-semibold">Album Art</p>
          <label className="flex aspect-square w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-white/20 text-center text-white/70">
            {coverPreview ? (
              <div className="relative h-full w-full">
                <div className="h-full w-full rounded-xl bg-cover bg-center" style={{ backgroundImage: `url(${coverPreview})` }} />
                <span className="absolute bottom-2 left-2 rounded-md bg-black/50 px-2 py-1 text-xs text-white">{coverName || "Preview"}</span>
              </div>
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center gap-2">
                <span className="material-symbols-outlined text-4xl text-primary">add_photo_alternate</span>
                <span className="text-sm">Upload an image (jpg / png / webp, up to {MAX_COVER_MB}MB)</span>
              </div>
            )}
            <input type="file" className="hidden" accept="image/*" onChange={(e) => handleCoverChange(e.target.files)} />
          </label>
          {coverName && coverPreview?.startsWith("blob:") && (
            <p className="text-xs text-white/60">Selected cover: {coverName}</p>
          )}
        </div>

        <form className="grid gap-6 text-sm text-white/80" onSubmit={(e) => e.preventDefault()}>
          <label className="grid gap-2">
            <span className="text-sm font-medium text-white">
              Title <span className="text-primary">*</span>
            </span>
            <input
              className="rounded-lg border border-white/20 bg-white/5 p-3 placeholder-white/40 focus:border-primary focus:outline-none"
              placeholder="Enter a title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-medium text-white">Description</span>
            <textarea
              className="rounded-lg border border-white/20 bg-white/5 p-3 placeholder-white/40 focus:border-primary focus:outline-none"
              rows={4}
              placeholder="Add a description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </label>

          <div className="grid gap-6 md:grid-cols-2">
            <label className="grid gap-2">
              <span className="text-sm font-medium text-white">Genre</span>
              <input
                className="rounded-lg border border-white/20 bg-white/5 p-3 placeholder-white/40 focus:border-primary focus:outline-none"
                placeholder="e.g., Electronic, Lo-fi"
                value={genre}
                onChange={(event) => setGenre(event.target.value)}
              />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-medium text-white">Mood / Tags</span>
              <input
                className="rounded-lg border border-white/20 bg-white/5 p-3 placeholder-white/40 focus:border-primary focus:outline-none"
                placeholder="e.g., chill, focus, relaxing"
                value={tags}
                onChange={(event) => setTags(event.target.value)}
              />
            </label>
          </div>

          <div className="grid gap-4 rounded-lg border border-white/10 bg-white/5 p-4">
            <span className="text-sm font-semibold text-white">AI Info (required)</span>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="flex flex-col gap-2">
                <span className="text-xs text-white/60">Which AI did you use?</span>
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
                      {provider === "other" ? "OTHER" : provider.toUpperCase()}
                    </button>
                  ))}
                </div>
                {aiProvider === "other" && (
                  <input
                    className="rounded-lg border border-white/20 bg-white/5 p-3 placeholder-white/40 focus:border-primary focus:outline-none"
                    placeholder="Type provider"
                    value={aiProviderCustom}
                    onChange={(e) => setAiProviderCustom(e.target.value)}
                  />
                )}
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-xs text-white/60">Enter the model you used.</span>
                <input
                  className="rounded-lg border border-white/20 bg-white/5 p-3 placeholder-white/40 focus:border-primary focus:outline-none"
                  placeholder="e.g., Suno v3, Custom-XL"
                  value={aiModel}
                  onChange={(e) => setAiModel(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-2">
            <button
              type="button"
              className="rounded-lg border border-white/30 px-6 py-2 font-semibold text-white"
              onClick={() => navigate(-1)}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="rounded-lg bg-primary px-6 py-2 font-semibold text-white shadow-lg disabled:opacity-60"
            >
              {isSubmitting ? "Working..." : mode === "create" ? "Upload" : "Save"}
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
