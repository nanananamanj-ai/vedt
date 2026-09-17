import { createFileRoute, Link } from "@tanstack/react-router";

import vedtCss from "../vedt/vedt.css?url";
import { CONTACT } from "../vedt/data";
import { Header } from "../vedt/ui";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — V-EDT" },
      {
        name: "description",
        content: "Reach V-EDT on WhatsApp, phone or email. Replies within 24 hours.",
      },
    ],
    links: [
      { rel: "stylesheet", href: vedtCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossorigin: "" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,400..700;1,14..32,400..600&display=swap",
      },
      { rel: "icon", type: "image/png", href: "/favicon.png" },
    ],
  }),
  component: Contact,
});

function Contact() {
  return (
    <>
      <Header />
      <main>
        <div className="ct">
          <div className="ct-box">
            <h1>Get in touch</h1>
            <div className="ct-row">
              <span className="k">WhatsApp</span>
              <a className="v" href={CONTACT.whatsapp} target="_blank" rel="noopener noreferrer">
                Chat with the studio ↗
              </a>
            </div>
            <div className="ct-row">
              <span className="k">Phone</span>
              <a className="v" href={CONTACT.phoneTel}>
                {CONTACT.phoneDisplay}
              </a>
            </div>
            <div className="ct-row">
              <span className="k">Email</span>
              <a className="v" href={`mailto:${CONTACT.email}`}>
                {CONTACT.email}
              </a>
            </div>
            <Link className="mono ct-back" to="/">
              ← Back to the work
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
