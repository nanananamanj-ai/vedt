import { createFileRoute } from "@tanstack/react-router";

import vedtCss from "../vedt/vedt.css?url";
import { VIDEOS, SECTIONS } from "../vedt/data";
import { loadVideos } from "../vedt/db";
import { VideoCard } from "../vedt/VideoCard";
import { Header, Rail, Marquee, Preloader, RenderBar, Outro } from "../vedt/ui";

const TITLE = "V-EDT — Video / Film Editing House for Filmmakers & Elite Production Houses";
const DESCRIPTION =
  "Problem-solving edits for filmmakers and elite production houses. Reels, weddings, brands, events, podcasts, travel and music — story, rhythm and grade under one roof.";
const FONTS =
  "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,400..700;1,14..32,400..600&display=swap";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { name: "theme-color", content: "#EDF2F3" },
      { property: "og:title", content: "V-EDT — Video / Film Editing House" },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: vedtCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossorigin: "" },
      { rel: "stylesheet", href: FONTS },
      { rel: "icon", type: "image/png", href: "/favicon.png" },
    ],
  }),
  loader: () => loadVideos(),
  component: Index,
});

function Index() {
  const videos = Route.useLoaderData() ?? VIDEOS;
  const featured = videos.filter((v) => v.featured || v.section === "start");

  return (
    <>
      <Preloader />
      <Header />
      <Rail />
      <main>
        <section className="hero" aria-label="Intro">
          <p className="mono kicker">Video / Film Editing House</p>
          <h1 className="disp">Cuts that solve the story.</h1>
        </section>

        <Marquee />

        <section id="start" aria-label="Featured work">
          <div className="strip">
            {featured.map((v) => (
              <VideoCard key={`s${v.position}`} v={v} />
            ))}
          </div>
        </section>

        {SECTIONS.map((sec) => {
          const list = videos.filter((v) => v.section === sec.id);
          return (
            <section id={sec.id} key={sec.id} aria-label={sec.label}>
              <div className="wrap">
                <div className="sec-head">
                  <h2 className="disp">{sec.label}</h2>
                  <span className="rule" />
                </div>
                {"subs" in sec && sec.subs ? (
                  sec.subs.map((sub) => (
                    <div key={sub}>
                      <p className="mono subhead">{sub}s</p>
                      <Rows id={`${sec.id}-${sub}`} list={list.filter((v) => v.sub === sub)} />
                    </div>
                  ))
                ) : (
                  <Rows id={sec.id} list={list} />
                )}
              </div>
            </section>
          );
        })}

        <Outro />
      </main>
      <RenderBar />
    </>
  );
}
