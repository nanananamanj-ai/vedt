import { useState, type FormEvent } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";

import vedtCss from "../vedt/vedt.css?url";
import { CONTACT } from "../vedt/data";
import { Header } from "../vedt/ui";
import { supabase } from "@/integrations/supabase/client";

const URL = "https://vedt.lovable.app/contact";
const TITLE = "Contact V-EDT — Hire a Video / Film Editor";
const DESC =
  "Start a project with V-EDT. Send a brief, or reach us on WhatsApp, phone, email or Instagram @v.edt.house.";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { property: "og:url", content: URL },
      { property: "og:site_name", content: "V-EDT" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: TITLE },
      { name: "twitter:description", content: DESC },
    ],
    links: [
      { rel: "canonical", href: URL },
      { rel: "stylesheet", href: vedtCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,400..700;1,14..32,400..600&display=swap",
      },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "ContactPage",
          url: URL,
          name: TITLE,
          mainEntity: {
            "@type": "ProfessionalService",
            name: "V-EDT",
            url: "https://vedt.lovable.app/",
            email: CONTACT.email,
            telephone: "+919997100445",
            sameAs: [CONTACT.instagram],
          },
        }),
      },
    ],
  }),
  component: Contact,
});

const schema = z.object({
  name: z.string().trim().min(1, "Please add your name").max(100),
  email: z.string().trim().email("Please add a valid email").max(255),
  phone: z.string().trim().max(40),
  project_type: z.string().trim().max(60),
  message: z.string().trim().min(1, "Tell us a little about the project").max(2000),
});

const TYPES = ["Travel", "Brand", "Wedding", "Event", "Podcast", "Music video", "Other"];

function ContactForm() {
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [err, setErr] = useState("");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    if (fd.get("website")) return; // honeypot
    const parsed = schema.safeParse(Object.fromEntries(fd));
    if (!parsed.success) {
      setErr(parsed.error.issues[0]?.message ?? "Please check the form");
      return;
    }
    setErr("");
    setState("sending");
    const { error } = await supabase.from("contact_submissions").insert(parsed.data);
    if (error) {
      setState("idle");
      setErr("Couldn't send right now — please try WhatsApp or email.");
      return;
    }
    setState("sent");
  }

  if (state === "sent") {
    return (
      <div className="cf-done" role="status">
        <p className="cf-done-h">Thank you — brief received.</p>
        <p className="cf-done-p">We'll get back to you shortly.</p>
      </div>
    );
  }

  return (
    <form className="cf" onSubmit={onSubmit} noValidate>
      <div className="cf-grid">
        <label className="cf-f">
          <span>Name</span>
          <input name="name" required maxLength={100} autoComplete="name" />
        </label>
        <label className="cf-f">
          <span>Email</span>
          <input name="email" type="email" required maxLength={255} autoComplete="email" />
        </label>
        <label className="cf-f">
          <span>Phone (optional)</span>
          <input name="phone" type="tel" maxLength={40} autoComplete="tel" />
        </label>
        <label className="cf-f">
          <span>Project type</span>
          <select name="project_type" defaultValue="">
            <option value="">Select…</option>
            {TYPES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </label>
      </div>
      <label className="cf-f">
        <span>Project details</span>
        <textarea name="message" rows={5} required maxLength={2000} placeholder="Footage length, deadline, references…" />
      </label>
      <input name="website" tabIndex={-1} autoComplete="off" className="cf-hp" aria-hidden="true" />
      {err ? <p className="cf-err" role="alert">{err}</p> : null}
      <button className="cf-btn" type="submit" disabled={state === "sending"}>
        {state === "sending" ? "Sending…" : "Send brief"}
      </button>
    </form>
  );
}

function Contact() {
  return (
    <>
      <Header />
      <main>
        <div className="ct">
          <div className="ct-box">
            <h1>Get in touch</h1>
            <ContactForm />
            <p className="mono ct-or">Or reach us directly</p>
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
            <div className="ct-row">
              <span className="k">Instagram</span>
              <a className="v" href={CONTACT.instagram} target="_blank" rel="noopener noreferrer">
                {CONTACT.instagramHandle} ↗
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
