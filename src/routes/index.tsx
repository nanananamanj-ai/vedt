import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";

import vedtCss from "../vedt/vedt.css?url";
import bodyHtml from "../vedt/body.html?raw";
import initScript from "../vedt/vedt-init.js?raw";

const TITLE =
  "V-EDT — Freelance Video Editing Studio · Reels, Weddings, Brands, Podcasts";
const DESCRIPTION =
  "V-EDT is a two-person freelance video editing studio cutting reels, weddings, brand content, events, podcasts, travel and music videos. Watch the work inline.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { name: "theme-color", content: "#0B0C0A" },
      { property: "og:title", content: "V-EDT — Freelance Video Editing Studio" },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "V-EDT — Freelance Video Editing Studio" },
      { name: "twitter:description", content: DESCRIPTION },
    ],
    links: [{ rel: "stylesheet", href: vedtCss }],
  }),
  component: Index,
});

function Index() {
  useEffect(() => {
    document.body.id = "top";
    const el = document.createElement("script");
    el.textContent = initScript;
    document.body.appendChild(el);
    return () => {
      el.remove();
    };
  }, []);

  return <div dangerouslySetInnerHTML={{ __html: bodyHtml }} />;
}
