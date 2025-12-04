import { Link } from "react-router-dom";

import type { Track } from "../../types/music";
import { labels } from "../../lib/i18n";

interface TrackCardProps {
  track: Track;
}

function TrackCard({ track }: TrackCardProps) {
  return (
    <Link to={`/tracks/${track.id}`} className="rounded-xl bg-white/5 p-4 transition hover:bg-white/10">
      <div
        className="aspect-square w-full rounded-lg bg-cover bg-center"
        style={{ backgroundImage: `url(${track.coverUrl})` }}
      />
      <div className="mt-4">
        <p className="text-base font-semibold">{track.title}</p>
        <p className="text-sm text-white/60">{track.artist}</p>
      </div>
      <div className="mt-3 flex items-center justify-between text-xs text-white/50">
        <span>{track.duration ?? ""}</span>
        <span>
          {labels.plays} {Intl.NumberFormat("ko-KR").format(track.plays ?? 0)} · {labels.likes}{" "}
          {Intl.NumberFormat("ko-KR").format(track.likes ?? 0)}
        </span>
      </div>
    </Link>
  );
}

export default TrackCard;
