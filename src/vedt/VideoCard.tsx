import { useRef, useState, type MouseEvent } from "react";
import type { Video } from "./data";

const BADGE: Record<Video["platform"], string> = {
  instagram: "IG",
  youtube: "YT",
  vimeo: "VM",
};

function embedSrc(v: Video): string {
  if (v.platform === "youtube")
    return `https://www.youtube-nocookie.com/embed/${v.code}?autoplay=1&rel=0&playsinline=1`;
  if (v.platform === "vimeo")
    return `https://player.vimeo.com/video/${v.code}?autoplay=1&title=0&byline=0&portrait=0`;
  return `https://www.instagram.com/${v.kind === "reel" ? "reel" : "p"}/${v.code}/embed`;
}

/**
 * Orientation-aware card. Plays inline inside its own frame on click
 * (no dialog); a bottom-right control requests fullscreen for that frame.
 */
export function VideoCard({ v }: { v: Video }) {
  const [playing, setPlaying] = useState(false);
  const [imgDead, setImgDead] = useState(false);
  const rootRef = useRef<HTMLAnchorElement>(null);

  const goFull = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const el = rootRef.current?.querySelector(".thumb");
    if (el && el.requestFullscreen) void el.requestFullscreen();
  };

  const onClick = (e: MouseEvent) => {
    if (!playing) {
      // Keep the external link as a fallback (open-in-new-tab) but play inline first.
      e.preventDefault();
      setPlaying(true);
    }
  };

  return (
    <a
      ref={rootRef}
      className={`card a-${v.aspect}`}
      href={v.link}
      target="_blank"
      rel="noopener noreferrer"
      onClick={onClick}
      aria-label={`Play: ${v.title} — ${v.detail}`}
    >
      <span
        className={`thumb${!v.thumb || imgDead ? " nocover" : ""}`}
        data-init={v.title.charAt(0)}
      >
        {v.thumb && !imgDead && !playing ? (
          <img
            src={v.thumb}
            alt={`${v.title} — ${v.detail}`}
            loading="lazy"
            decoding="async"
            onError={() => setImgDead(true)}
          />
        ) : null}
        <span className="badge">{BADGE[v.platform]}</span>
        {!playing && (
          <>
            <span className="veil" aria-hidden="true">
              {v.sub ? <span className="v-sub">{v.sub}</span> : null}
              <span className="v-title">{v.title}</span>
              <span className="v-detail">{v.detail}</span>
            </span>
            <span className="play" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </span>
          </>
        )}
        {playing && (
          <>
            <iframe
              src={embedSrc(v)}
              title={v.title}
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
            />
            <button
              type="button"
              className="fs"
              onClick={goFull}
              aria-label="Make video fullscreen"
            >
              <svg viewBox="0 0 24 24">
                <path d="M4 4h6v2H6v4H4V4Zm10 0h6v6h-2V6h-4V4ZM4 14h2v4h4v2H4v-6Zm14 0h2v6h-6v-2h4v-4Z" />
              </svg>
            </button>
          </>
        )}
      </span>
    </a>
  );
}
