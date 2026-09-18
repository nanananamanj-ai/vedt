import { useEffect, useRef, useState, type MouseEvent } from "react";
import type { Video } from "./data";
import { supabase } from "../integrations/supabase/client";

/**
 * Source-agnostic embed. All provider chrome is suppressed as far as each
 * player allows; self-hosted files (file_path) play with no third-party
 * involvement at all.
 */
function embedSrc(v: Video): string {
  if (v.platform === "youtube")
    return `https://www.youtube-nocookie.com/embed/${v.code}?autoplay=1&rel=0&modestbranding=1&playsinline=1&controls=1&iv_load_policy=3&fs=0&disablekb=1`;
  if (v.platform === "vimeo")
    return `https://player.vimeo.com/video/${v.code}?autoplay=1&title=0&byline=0&portrait=0&dnt=1`;
  return `https://www.instagram.com/${v.kind === "reel" ? "reel" : "p"}/${v.code}/embed`;
}

/**
 * Uniform tile. Plays inline inside its own frame on click; the bottom-right
 * control takes that frame fullscreen. Nothing links out.
 */
export function VideoCard({ v }: { v: Video }) {
  const [playing, setPlaying] = useState(false);
  const [imgDead, setImgDead] = useState(false);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  // Signed URL for self-hosted files, resolved only when the user presses play.
  useEffect(() => {
    if (!playing || !v.file_path) return;
    let alive = true;
    void supabase.storage
      .from("media")
      .createSignedUrl(v.file_path, 60 * 60 * 6)
      .then(({ data }) => {
        if (alive && data?.signedUrl) setFileUrl(data.signedUrl);
      });
    return () => {
      alive = false;
    };
  }, [playing, v.file_path]);

  const goFull = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const el = rootRef.current?.querySelector(".thumb");
    if (el && el.requestFullscreen) void el.requestFullscreen();
  };

  return (
    <div
      ref={rootRef}
      className={`card a-${v.aspect}`}
      role="button"
      tabIndex={playing ? -1 : 0}
      onClick={() => !playing && setPlaying(true)}
      onKeyDown={(e) => {
        if (!playing && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          setPlaying(true);
        }
      }}
      aria-label={playing ? v.title : `Play: ${v.title}`}
    >
      <span
        className={`thumb${!v.thumb || imgDead ? " nocover" : ""}`}
        data-init={v.title.charAt(0)}
      >
        {v.thumb && !imgDead && !playing ? (
          <img
            src={v.thumb}
            alt={v.title}
            loading="lazy"
            decoding="async"
            onError={() => setImgDead(true)}
          />
        ) : null}
        {!playing && (
          <>
            <span className="veil" aria-hidden="true">
              {v.sub ? <span className="v-sub">{v.sub}</span> : null}
              <span className="v-title">{v.title}</span>
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
            {v.file_path ? (
              fileUrl ? (
                // eslint-disable-next-line jsx-a11y/media-has-caption
                <video
                  src={fileUrl}
                  controls
                  autoPlay
                  playsInline
                  controlsList="nodownload noremoteplayback"
                  disablePictureInPicture
                />
              ) : (
                <span className="loadingf" aria-hidden="true" />
              )
            ) : (
              <>
                <iframe
                  src={embedSrc(v)}
                  title={v.title}
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                />
                <button type="button" className="fs" onClick={goFull} aria-label="Fullscreen">
                  <svg viewBox="0 0 24 24">
                    <path d="M4 4h6v2H6v4H4V4Zm10 0h6v6h-2V6h-4V4ZM4 14h2v4h4v2H4v-6Zm14 0h2v6h-6v-2h4v-4Z" />
                  </svg>
                </button>
              </>
            )}
          </>
        )}
      </span>
    </div>
  );
}
