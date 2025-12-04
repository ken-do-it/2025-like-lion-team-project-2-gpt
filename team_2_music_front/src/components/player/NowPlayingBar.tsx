import { useMemo, useState } from "react";

import { usePlayer } from "../../contexts/PlayerContext";

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
}

function NowPlayingBar() {
  const {
    current,
    isPlaying,
    progress,
    duration,
    toggle,
    seek,
    download,
    liked,
    toggleLike,
    volume,
    setVolume,
    muted,
    toggleMute,
    prev,
    next,
    hasPrev,
    hasNext,
  } = usePlayer();
  const [showMobileActions, setShowMobileActions] = useState(false);

  const progressPercent = useMemo(() => {
    if (!duration || duration <= 0) return 0;
    return Math.min(100, Math.max(0, (progress / duration) * 100));
  }, [progress, duration]);

  const handleShare = async () => {
    if (!current?.streamUrl) return;
    try {
      await navigator.clipboard.writeText(current.streamUrl);
      alert("공유 링크를 복사했어요.");
    } catch {
      const reason =
        window.isSecureContext === false
          ? "HTTPS 환경이 아니어서 클립보드 복사가 차단됐습니다."
          : "클립보드 복사에 실패했습니다.";
      alert(`${reason}\n${current.streamUrl}`);
    }
  };

  if (!current) return null;

  return (
    <div className="sticky bottom-0 w-full border-t border-white/10 bg-background-dark/90 backdrop-blur-lg">
      <div className="relative mx-auto flex max-w-6xl items-center gap-4 px-4 py-3 text-sm text-white/80">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className="h-12 w-12 flex-shrink-0 rounded-md bg-cover bg-center"
            style={{
              backgroundImage: current.coverUrl
                ? `url(${current.coverUrl})`
                : "linear-gradient(135deg, #5b21b6, #a855f7)",
            }}
          />
          <div className="min-w-0">
            <p className="truncate text-base font-semibold text-white">{current.title}</p>
            <p className="text-xs text-white/60">지금 재생 중</p>
          </div>
        </div>

        <div className="flex flex-1 flex-col items-center gap-2">
          <div className="flex items-center gap-6 text-white">
            <button
              type="button"
              className="rounded-full bg-white/10 px-2 py-1 text-lg text-white/70 hover:text-white disabled:opacity-40"
              onClick={prev}
              disabled={!hasPrev}
              title="이전 곡"
            >
              ⏮
            </button>
            <button
              type="button"
              onClick={toggle}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-base font-bold text-white shadow-lg hover:bg-primary/90"
              title={isPlaying ? "일시 정지" : "재생"}
            >
              {isPlaying ? "❚❚" : "▶"}
            </button>
            <button
              type="button"
              className="rounded-full bg-white/10 px-2 py-1 text-lg text-white/70 hover:text-white disabled:opacity-40"
              onClick={next}
              disabled={!hasNext}
              title="다음 곡"
            >
              ⏭
            </button>
          </div>
          <div className="flex w-full items-center gap-2">
            <span className="w-10 text-right text-[11px] text-white/60">{formatTime(progress)}</span>
            <input
              type="range"
              min={0}
              max={duration || 0}
              step={0.5}
              value={progress}
              onChange={(e) => seek(Number(e.target.value))}
              className="w-full accent-primary"
            />
            <span className="w-10 text-[11px] text-white/60">{formatTime(duration)}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* 모바일 케밥 */}
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 md:hidden"
            aria-label="재생 메뉴"
            onClick={() => setShowMobileActions((v) => !v)}
          >
            <span className="material-symbols-outlined">{showMobileActions ? "close" : "more_vert"}</span>
          </button>

          {/* 모바일 볼륨 (항상 노출) */}
          <div className="flex items-center gap-2 text-xs text-white/70 md:hidden">
            <button
              type="button"
              onClick={toggleMute}
              className="rounded-full bg-white/10 p-2 hover:bg-white/20"
              title={muted ? "음소거 해제" : "음소거"}
            >
              <span className="material-symbols-outlined text-base">{muted ? "volume_off" : "volume_up"}</span>
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="w-20 accent-primary"
            />
          </div>

          {/* 데스크톱 액션 */}
          <div className="hidden items-center gap-3 md:flex">
            <button
              type="button"
              onClick={toggleLike}
              className={`rounded-full border px-3 py-2 text-xs font-semibold ${
                liked ? "border-primary text-primary" : "border-white/20 text-white"
              } hover:bg-white/10`}
              aria-pressed={liked}
            >
              {liked ? "좋아요 취소" : "좋아요"}
            </button>
            <button
              type="button"
              onClick={handleShare}
              className="rounded-md border border-white/20 px-3 py-2 text-xs font-semibold text-white hover:bg-white/10"
            >
              공유하기
            </button>
            <button
              type="button"
              onClick={() => download()}
              className="rounded-md border border-white/20 px-3 py-2 text-xs font-semibold text-white hover:bg-white/10"
            >
              다운로드
            </button>
            <div className="flex items-center gap-2 text-xs text-white/70">
              <button
                type="button"
                onClick={toggleMute}
                className="rounded-full bg-white/10 px-2 py-1 hover:bg-white/20"
                title={muted ? "음소거 해제" : "음소거"}
              >
                <span className="material-symbols-outlined text-base">{muted ? "volume_off" : "volume_up"}</span>
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="w-24 accent-primary"
              />
            </div>
          </div>
        </div>

        {/* 모바일 드롭다운 액션 */}
        {showMobileActions && (
          <div className="absolute bottom-24 right-4 z-30 w-44 rounded-lg border border-white/15 bg-background-dark/95 p-3 shadow-lg md:hidden">
            <div className="flex flex-col gap-2 text-xs text-white">
              <button
                type="button"
                onClick={() => {
                  toggleLike();
                  setShowMobileActions(false);
                }}
                className="rounded-md border border-white/20 px-3 py-2 text-left hover:bg-white/10"
              >
                {liked ? "좋아요 취소" : "좋아요"}
              </button>
              <button
                type="button"
                onClick={() => {
                  handleShare();
                  setShowMobileActions(false);
                }}
                className="rounded-md border border-white/20 px-3 py-2 text-left hover:bg-white/10"
              >
                공유하기
              </button>
              <button
                type="button"
                onClick={() => {
                  download();
                  setShowMobileActions(false);
                }}
                className="rounded-md border border-white/20 px-3 py-2 text-left hover:bg-white/10"
              >
                다운로드
              </button>
              {/* 모바일 드롭다운에서 볼륨 제거 */}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default NowPlayingBar;
