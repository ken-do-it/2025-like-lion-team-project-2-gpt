import { libraryTracks } from "../data/mockTracks";

function LibraryPage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/5 p-8 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-white/60">My Library</p>
          <h1 className="text-3xl font-black">내 음악 라이브러리</h1>
          <p className="text-white/70">업로드한 트랙과 즐겨찾는 곡을 한곳에서 관리하세요.</p>
        </div>
        <button className="rounded-full bg-primary px-6 py-2 text-sm font-semibold text-white">새로운 트랙 업로드</button>
      </div>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">최근 업로드</h2>
        <div className="space-y-3">
          {libraryTracks.map((track) => (
            <div key={track.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center gap-4">
                <div
                  className="h-16 w-16 rounded-lg bg-cover bg-center"
                  style={{ backgroundImage: `url(${track.coverUrl})` }}
                />
                <div>
                  <p className="text-lg font-semibold">{track.title}</p>
                  <p className="text-sm text-white/60">{track.duration}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm text-white/60">
                <span>{track.mood}</span>
                <span>{track.plays.toLocaleString()} plays</span>
                <button className="text-white">···</button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default LibraryPage;
