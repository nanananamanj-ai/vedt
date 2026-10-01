import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import type { Session } from "@supabase/supabase-js";

import vedtCss from "../vedt/vedt.css?url";
import { SECTIONS, type Aspect, type Platform, type Video } from "../vedt/data";
import { Header, ThemeToggle } from "../vedt/ui";
import { supabase } from "../integrations/supabase/client";

type Row = Video & { id: string };

type Cat = { id: string; slug: string; label: string; subs: string[]; position: number };

type EditorState = {
  id: string | null;
  section: string;
  sub: string;
  platform: Platform;
  code: string;
  kind: string;
  aspect: Aspect;
  title: string;
  detail: string;
  thumb: string;
  link: string;
  featured: boolean;
  position: number;
  file_path: string;
};

const blank = (position: number): EditorState => ({
  id: null,
  section: "brands",
  sub: "",
  platform: "instagram",
  code: "",
  kind: "p",
  aspect: "landscape",
  title: "",
  detail: "",
  thumb: "",
  link: "",
  featured: false,
  position,
  file_path: "",
});

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Portfolio Admin — V-EDT" },
      { name: "description", content: "Private V-EDT portfolio management workspace." },
      { property: "og:title", content: "Portfolio Admin — V-EDT" },
      { property: "og:description", content: "Private V-EDT portfolio management workspace." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
    links: [{ rel: "stylesheet", href: vedtCss }],
  }),
  component: Admin,
});

function Admin() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [cats, setCats] = useState<Cat[]>([]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [adv, setAdv] = useState(false);
  const [view, setView] = useState<"videos" | "niches">("videos");
  const [msg, setMsg] = useState<{ text: string; err: boolean } | null>(null);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("videos")
      .select("*")
      .order("position", { ascending: true });
    if (data) setRows(data as unknown as Row[]);
    const { data: cs } = await supabase
      .from("categories")
      .select("*")
      .order("position", { ascending: true });
    if (cs) setCats(cs as unknown as Cat[]);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    void load();
    const openEditor = (r: Row) => {
    setAdv(false);
    setEditor({
      id: r.id, section: r.section, sub: r.sub ?? "", platform: r.platform,
      code: r.code, kind: r.kind, aspect: r.aspect, title: r.title,
      detail: r.detail, thumb: r.thumb, link: r.link, featured: r.featured,
      position: r.position, file_path: r.file_path ?? "",
    });
  };

  if (!ready || !session) {
    return (
      <>
        <Header />
        <main>
          <div className="adm adm-login">
            <p className="mono">Private workspace</p>
            <h1 className="disp">Admin</h1>
            <p className="note">Sign in to manage the V-EDT portfolio.</p>
            {!ready ? <p className="msg">Loading…</p> : (
              <form className="login" onSubmit={login}>
                <input type="email" required placeholder="Email" aria-label="Email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" />
                <input type="password" required placeholder="Password" aria-label="Password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
                <button className="btn btn-acc" type="submit">Sign in</button>
                <button className="btn btn-ghost" type="button" onClick={() => void createLogin()}>First time? Create my password</button>
                {msg ? <p className={`msg${msg.err ? " err" : ""}`}>{msg.text}</p> : null}
              </form>
            )}
            <Link className="mono adm-back" to="/">← Back to the site</Link>
          </div>
        </main>
      </>
    );
  }

  return (
    <main className="admin-shell">
      <aside className="admin-side">
        <Link className="admin-mark" to="/" aria-label="V-EDT home">V</Link>
        <nav aria-label="Admin sections">
          <button className={view === "videos" ? "active" : ""} onClick={() => setView("videos")} type="button">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 4 13 8-13 8V4Z" /></svg><span>Videos</span>
          </button>
          <button className={view === "niches" ? "active" : ""} onClick={() => setView("niches")} type="button">
            <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><rect x="14" y="14" width="6" height="6" rx="1"/></svg><span>Niches</span>
          </button>
        </nav>
        <div className="admin-side-foot">
          <ThemeToggle />
          <Link to="/" title="View site" aria-label="View site"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 5h5v5M19 5l-8 8M19 14v5H5V5h5" /></svg></Link>
          <button type="button" title="Sign out" aria-label="Sign out" onClick={() => void supabase.auth.signOut()}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 5H5v14h5M14 8l4 4-4 4M8 12h10" /></svg></button>
        </div>
      </aside>

      <section className="admin-work">
        <header className="admin-work-head">
          <div><p className="mono">V-EDT Admin</p><h1 className="disp">{view === "videos" ? "Videos" : "Niches"}</h1></div>
          <button className="btn btn-acc" type="button" onClick={() => view === "videos" ? setEditor(blank(rows.length)) : void addCat()}>+ Add {view === "videos" ? "video" : "niche"}</button>
        </header>
        {msg && !editor ? <p className={`admin-status${msg.err ? " err" : ""}`}>{msg.text}</p> : null}

        {view === "niches" ? (
          <div className="admin-list niches-list">
            <div className="admin-list-head"><span>Order</span><span>Niche</span><span>Sub-groups</span><span>Actions</span></div>
            {cats.map((c, i) => (
              <div className="admin-list-row niche-row" key={c.id}>
                <div className="order-controls"><button type="button" disabled={i === 0} onClick={() => void moveCat(i, -1)} aria-label={`Move ${c.label} up`}>↑</button><button type="button" disabled={i === cats.length - 1} onClick={() => void moveCat(i, 1)} aria-label={`Move ${c.label} down`}>↓</button></div>
                <input defaultValue={c.label} aria-label={`${c.label} name`} onBlur={(e) => { const value = e.target.value.trim(); if (value && value !== c.label) void saveCat(c, { label: value }); }} />
                <input defaultValue={(c.subs ?? []).join(", ")} aria-label={`${c.label} sub-groups`} placeholder="None" onBlur={(e) => { const subs = e.target.value.split(",").map((s) => s.trim()).filter(Boolean); if (subs.join("|") !== (c.subs ?? []).join("|")) void saveCat(c, { subs }); }} />
                <button className="rowbtn danger" type="button" onClick={() => void delCat(c)}>Delete</button>
              </div>
            ))}
          </div>
        ) : (
          <>
            {editor ? (
              <form className="editor" onSubmit={save}>
                <div className="editor-head full"><h2>{editor.id ? "Edit video" : "Add video"}</h2><button type="button" className="rowbtn" onClick={() => setEditor(null)}>Close</button></div>
                <label className="mono">Title<input value={editor.title} required onChange={(e) => set("title", e.target.value)} /></label>
                <label className="mono">Niche<select value={editor.section} onChange={(e) => set("section", e.target.value)}>{(cats.length ? cats.map((c) => ({ id: c.slug, label: c.label })) : SECTIONS).map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}</select></label>
                {subOptions.length ? <label className="mono">Sub-group<select value={editor.sub} onChange={(e) => set("sub", e.target.value)}><option value="">None</option>{subOptions.map((s) => <option key={s} value={s}>{s}</option>)}</select></label> : null}
                <label className="mono">Shape<select value={editor.aspect} onChange={(e) => set("aspect", e.target.value as Aspect)}><option value="landscape">Wide</option><option value="portrait">Vertical</option><option value="4x5">4:5</option></select></label>
                <label className="mono full">Video link<input value={editor.link} placeholder="YouTube, Instagram or Vimeo link" onChange={(e) => applyLink(e.target.value)} /><small>{editor.code ? `${editor.platform} link detected` : "Paste a link, or upload the file below."}</small></label>
                <label className="mono full">Upload video<input type="file" accept="video/*" onChange={(e) => { const file = e.target.files?.[0]; if (file) void upload(file); }} />{editor.file_path ? <small>File uploaded</small> : null}</label>
                <button className="advanced-toggle full" type="button" onClick={() => setAdv((value) => !value)}>{adv ? "Hide advanced" : "Show advanced"}</button>
                {adv ? <><label className="mono">Platform<select value={editor.platform} onChange={(e) => set("platform", e.target.value as Platform)}><option value="instagram">Instagram</option><option value="youtube">YouTube</option><option value="vimeo">Vimeo</option></select></label><label className="mono">Video ID<input value={editor.code} onChange={(e) => set("code", e.target.value)} /></label><label className="mono">Kind<input value={editor.kind} onChange={(e) => set("kind", e.target.value)} /></label><label className="mono">Thumbnail path<input value={editor.thumb} onChange={(e) => set("thumb", e.target.value)} /></label><label className="mono">Position<input type="number" value={editor.position} onChange={(e) => set("position", Number(e.target.value))} /></label></> : null}
                <div className="editor-actions full"><button className="btn btn-acc" type="submit">{editor.id ? "Save changes" : "Add video"}</button><button className="btn btn-ghost" type="button" onClick={() => setEditor(null)}>Cancel</button></div>
                {msg ? <p className={`msg full${msg.err ? " err" : ""}`}>{msg.text}</p> : null}
              </form>
            ) : null}
            <div className="admin-list video-list">
              <div className="admin-list-head"><span>Order</span><span>Video</span><span>Niche</span><span>Shape</span><span>Actions</span></div>
              {rows.map((r, i) => (
                <div className="admin-list-row video-row" key={r.id}>
                  <div className="order-controls"><button type="button" disabled={i === 0} onClick={() => void move(i, -1)} aria-label={`Move ${r.title} up`}>↑</button><button type="button" disabled={i === rows.length - 1} onClick={() => void move(i, 1)} aria-label={`Move ${r.title} down`}>↓</button></div>
                  <strong>{r.title}</strong><span>{r.section}{r.sub ? ` / ${r.sub}` : ""}</span><span>{r.aspect === "landscape" ? "Wide" : r.aspect === "portrait" ? "Vertical" : "4:5"}</span>
                  <div className="row-actions"><button className="rowbtn" type="button" onClick={() => openEditor(r)}>Edit</button><button className="rowbtn danger" type="button" onClick={() => void remove(r.id)}>Delete</button></div>
                </div>
              ))}
            </div>
          </>
        )}
      </section>
    </main>
  );
}
