function NowPlayingBar() {
  return (
    <div className="sticky bottom-0 w-full border-t border-white/10 bg-background-dark/80 backdrop-blur-lg">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 text-sm text-white/80">
        <div>
          <p className="font-semibold">Neon Echoes</p>
          <p className="text-xs text-white/60">AI Voyager</p>
        </div>
        <div className="flex items-center gap-3 text-white">
          <button className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest">
            Play
          </button>
          <div className="w-48">
            <div className="h-1 rounded-full bg-white/10">
              <div className="h-1 rounded-full bg-primary" style={{ width: "35%" }} />
            </div>
            <p className="mt-1 text-[10px] text-white/60">01:25 / 03:40</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NowPlayingBar;
