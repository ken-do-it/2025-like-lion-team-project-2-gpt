import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import apiClient from "@/lib/api/client";

type Track = {
  id: number;
  title: string;
  status: string;
  created_at: string;
  cover_url?: string | null;
};

const apiBase = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8001/api";

function ProfilePage() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await apiClient.get<Track[]>("/tracks");
        setTracks(res.data);
      } catch (err: any) {
        const msg = err?.response?.data?.message ?? "트랙을 불러오지 못했습니다.";
        setError(msg);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return tracks;
    return tracks.filter((t) => t.title.toLowerCase().includes(term));
  }, [tracks, search]);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-10">
      <div className="flex flex-col gap-8 lg:flex-row">
        {/* Side profile */}
        <aside className="w-full lg:w-1/4 xl:w-1/5">
          <div className="sticky top-24 flex h-full min-h-[620px] flex-col gap-6 rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="relative">
                <div
                  className="size-24 rounded-full border-2 border-primary bg-cover bg-center"
                  style={{
                    backgroundImage:
                      "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBIv2vgnSMjdN9Sq5X8oAYdmrw3a25doDrUyFDskoG9CitxM7Dh1jk9gzaxd31GGjJWYHhZN6GjQKbbWwd3SvjPWJ3tWFXOlYvd6yzGYvqOVRQEoB5TyPejAZGWlqppTliZsMn8fUDvCFBNw_d_WDZkj4w-AhCwkkL8TNOTdrxjYlaMKvaHjngBeebmEaIepH5DNY0_whIiSqaWE2mTq-0Gzbx4Vo7ZQFn7Mw9_2gQzyGXToP-UWUMz5lN6AFMAPNhumbERNSigZ1E')",
                  }}
                />
              </div>
              <div className="flex flex-col">
                <h1 className="text-xl font-bold text-white">CreativeArtist</h1>
                <p className="text-sm text-white/60">2.4k Followers</p>
              </div>
              <button className="w-full rounded-lg bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20">
                프로필 수정
              </button>
            </div>
            <div className="flex flex-col gap-2">
              <Link
                to="/profile"
                className="flex items-center gap-3 rounded-lg bg-primary/20 px-3 py-2 text-primary"
              >
                <span className="material-symbols-outlined">queue_music</span>
                <p className="text-sm font-bold">내 음악</p>
              </Link>
              <button className="flex items-center gap-3 rounded-lg px-3 py-2 text-left text-white/70 transition hover:bg-white/10 hover:text-white">
                <span className="material-symbols-outlined">bar_chart</span>
                <p className="text-sm font-medium">통계</p>
              </button>
              <button className="flex items-center gap-3 rounded-lg px-3 py-2 text-left text-white/70 transition hover:bg-white/10 hover:text-white">
                <span className="material-symbols-outlined">settings</span>
                <p className="text-sm font-medium">프로필 설정</p>
              </button>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="w-full space-y-8 lg:w-3/4 xl:w-4/5">
          <div className="border-b border-white/10">
            <div className="flex gap-8 px-1 sm:px-4">
              <p className="border-b-[3px] border-primary pb-3 pt-2 text-sm font-bold text-white">My Music</p>
              <p className="pb-3 pt-2 text-sm font-bold text-white/50">Statistics</p>
              <p className="pb-3 pt-2 text-sm font-bold text-white/50">Playlists</p>
            </div>
          </div>

          <div className="flex flex-col gap-4 px-1 sm:flex-row sm:items-center sm:px-4">
            <div className="w-full sm:w-2/3 lg:w-1/2">
              <label className="flex h-11 w-full flex-col">
                <div className="flex h-full w-full items-stretch rounded-lg">
                  <div className="flex items-center justify-center rounded-l-lg bg-[#1E1E1E] pl-4 text-gray-400">
                    <span className="material-symbols-outlined">search</span>
                  </div>
                  <input
                    className="form-input h-full flex-1 rounded-l-none rounded-lg border-none bg-[#1E1E1E] px-4 text-base text-white placeholder:text-gray-500 focus:outline-0 focus:ring-2 focus:ring-primary/50"
                    placeholder="Search my music by title..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </label>
            </div>
            <div className="flex w-full flex-grow justify-start sm:justify-end">
              <div className="flex gap-2 overflow-x-auto">
                <button className="flex h-9 items-center gap-2 rounded-lg bg-[#1E1E1E] px-3 text-sm text-white hover:bg-[#2a2a2a]">
                  <span>Sort by: Recent</span>
                  <span className="material-symbols-outlined text-base">expand_more</span>
                </button>
                <button className="flex h-9 items-center gap-2 rounded-lg bg-[#1E1E1E] px-3 text-sm text-white hover:bg-[#2a2a2a]">
                  <span>Status: All</span>
                  <span className="material-symbols-outlined text-base">expand_more</span>
                </button>
              </div>
            </div>
          </div>

          <div className="px-1 sm:px-4">
            <div className="overflow-hidden rounded-xl border border-white/10 bg-[#1E1E1E]">
              {loading ? (
                <p className="p-4 text-sm text-white/70">불러오는 중...</p>
              ) : error ? (
                <p className="p-4 text-sm text-red-400">{error}</p>
              ) : filtered.length === 0 ? (
                <p className="p-4 text-sm text-white/60">트랙이 없습니다.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-gray-300">
                    <thead className="bg-white/5 text-xs uppercase text-gray-400">
                      <tr>
                        <th scope="col" className="min-w-[250px] px-6 py-3">
                          Track
                        </th>
                        <th scope="col" className="px-6 py-3">
                          Plays
                        </th>
                        <th scope="col" className="px-6 py-3">
                          Downloads
                        </th>
                        <th scope="col" className="px-6 py-3">
                          Status
                        </th>
                        <th scope="col" className="px-6 py-3">
                          Date Added
                        </th>
                        <th scope="col" className="px-6 py-3">
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((track) => {
                        const coverStyle = track.cover_url
                          ? { backgroundImage: `url(${track.cover_url})` }
                          : { backgroundImage: "linear-gradient(135deg, #2d1b4b, #6b3fa0)" };
                        const streamUrl = `${apiBase}/tracks/${track.id}/stream`;
                        return (
                          <tr key={track.id} className="border-b border-white/10 hover:bg-white/5">
                            <th scope="row" className="whitespace-nowrap px-6 py-4 font-medium text-white">
                              <div className="flex items-center gap-4">
                                <div className="size-12 rounded-md bg-cover bg-center" style={coverStyle} />
                                <div className="flex flex-col gap-1">
                                  <Link to={`/tracks/${track.id}`} className="text-white hover:text-primary">
                                    {track.title}
                                  </Link>
                                  <a
                                    className="text-xs text-primary hover:underline"
                                    href={streamUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                  >
                                    스트리밍 열기
                                  </a>
                                </div>
                              </div>
                            </th>
                            <td className="px-6 py-4">0</td>
                            <td className="px-6 py-4">0</td>
                            <td className="px-6 py-4">
                              <span className="rounded-full bg-green-500/20 px-2.5 py-0.5 text-xs font-medium text-green-400">
                                {track.status}
                              </span>
                            </td>
                            <td className="px-6 py-4">{new Date(track.created_at).toLocaleDateString()}</td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-4">
                                <Link className="font-medium text-primary hover:underline" to={`/tracks/${track.id}/edit`}>
                                  Edit
                                </Link>
                                <button className="text-gray-400 transition-colors hover:text-white">
                                  <span className="material-symbols-outlined text-xl">more_vert</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default ProfilePage;
