import type { PropsWithChildren } from "react";

import NowPlayingBar from "../components/player/NowPlayingBar";
import TopNav from "../components/navigation/TopNav";

function AppLayout({ children }: PropsWithChildren) {
  return (
    <div className="min-h-screen bg-background-dark text-white flex flex-col">
      <TopNav />
      <main className="flex-1 px-4 py-8 sm:px-8 lg:px-16">{children}</main>
      <NowPlayingBar />
    </div>
  );
}

export default AppLayout;
