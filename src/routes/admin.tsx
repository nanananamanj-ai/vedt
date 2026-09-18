import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import type { Session } from "@supabase/supabase-js";

import vedtCss from "../vedt/vedt.css?url";
import { SECTIONS, type Aspect, type Platform, type Video } from "../vedt/data";
import { Header } from "../vedt/ui";
import { supabase } from "../integrations/supabase/client";

type Row = Video & { id: string };

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
    meta: [{ title: "Admin — V-EDT" }, { name: "robots", content: "noindex" }],
    links: [{ rel: "stylesheet", href: vedtCss }],
  }),
  component: Admin,
});

function Admin() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [msg, setMsg] = useState<{ text: string; err: boolean } | null>(null);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("videos")
      .select("*")
      .order("position", { ascending: true });
    if (data) setRows(data as unknown as Row[]);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    void load();
    return () => sub.subscription.unsubscribe();
  }, [load]);

  const login = async (e: FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setMsg(error ? { text: error.message, err: true } : { text: "Signed in.", err: false });
  };

  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (!editor) return;
    const payload = {
      section: editor.section,
      sub: editor.sub.trim() === "" ? null : editor.sub.trim(),
      platform: editor.platform,
      code: editor.code,
      kind: editor.kind,
      aspect: editor.aspect,
      title: editor.title,
      detail: editor.detail,
      thumb: editor.thumb,
      link: editor.link,
      featured: editor.featured,
      position: editor.position,
    };
    const q = editor.id
      ? supabase.from("videos").update(payload).eq("id", editor.id)
      : supabase.from("videos").insert(payload);
    const { error } = await q;
    if (error) {
      setMsg({
        text: `Save failed: ${error.message} — writes require the admin role (see note below).`,
        err: true,
      });
      return;
    }
    setMsg({ text: editor.id ? "Updated." : "Added.", err: false });
    setEditor(null);
    await load();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("videos").delete().eq("id", id);
    setMsg(
      error
        ? { text: `Delete failed: ${error.message}`, err: true }
        : { text: "Deleted.", err: false },
    );
    await load();
  };

  const set = <K extends keyof EditorState>(k: K, v: EditorState[K]) =>
    setEditor((s) => (s ? { ...s, [k]: v } : s));

  return (
    <>
      <Header />
      <main>
        <div className="adm">
          <h1 className="disp">Admin</h1>
          <p className="note">
            Manage the public catalogue directly — every save here is what the homepage renders.
            Writes are protected by Row Level Security and require the <code>admin</code> role.
          </p>

          {!ready ? (
            <p className="msg">Loading…</p>
          ) : !session ? (
            <form className="login" onSubmit={login}>
              <input
                type="email"
                required
                placeholder="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="username"
              />
              <input
                type="password"
                required
                placeholder="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
              <button className="btn btn-acc" type="submit">
                Sign in
              </button>
              {msg ? <p className={`msg${msg.err ? " err" : ""}`}>{msg.text}</p> : null}
            </form>
          ) : (
            <>
              <p className="msg">
                Signed in as {session.user.email} ·{" "}
                <button
                  className="rowbtn"
                  onClick={() => void supabase.auth.signOut()}
                  type="button"
                >
                  Sign out
                </button>
              </p>

              <button
                className="btn btn-acc"
                type="button"
                onClick={() => setEditor(blank(rows.length))}
              >
                + Add video
              </button>

              {editor ? (
                <form className="editor" onSubmit={save}>
                  <label className="mono">
                    Title
                    <input
                      value={editor.title}
                      required
                      onChange={(e) => set("title", e.target.value)}
                    />
                  </label>
                  <label className="mono">
                    One-liner detail
                    <input value={editor.detail} onChange={(e) => set("detail", e.target.value)} />
                  </label>
                  <label className="mono">
                    Section
                    <select value={editor.section} onChange={(e) => set("section", e.target.value)}>
                      <option value="start">start (featured)</option>
                      {SECTIONS.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="mono">
                    Sub-category (Teaser / Highlight / Reel)
                    <input value={editor.sub} onChange={(e) => set("sub", e.target.value)} />
                  </label>
                  <label className="mono">
                    Platform
                    <select
                      value={editor.platform}
                      onChange={(e) => set("platform", e.target.value as Platform)}
                    >
                      <option value="instagram">instagram</option>
                      <option value="youtube">youtube</option>
                      <option value="vimeo">vimeo</option>
                    </select>
                  </label>
                  <label className="mono">
                    Video code / id
                    <input
                      value={editor.code}
                      required
                      onChange={(e) => set("code", e.target.value)}
                    />
                  </label>
                  <label className="mono">
                    Kind (p / reel / watch / shorts / video)
                    <input value={editor.kind} onChange={(e) => set("kind", e.target.value)} />
                  </label>
                  <label className="mono">
                    Aspect
                    <select
                      value={editor.aspect}
                      onChange={(e) => set("aspect", e.target.value as Aspect)}
                    >
                      <option value="landscape">landscape</option>
                      <option value="portrait">portrait</option>
                      <option value="4x5">4x5</option>
                    </select>
                  </label>
                  <label className="mono">
                    Thumbnail path (e.g. /assets/thumbs/00.webp)
                    <input value={editor.thumb} onChange={(e) => set("thumb", e.target.value)} />
                  </label>
                  <label className="mono">
                    External link
                    <input value={editor.link} onChange={(e) => set("link", e.target.value)} />
                  </label>
                  <label className="mono">
                    Position
                    <input
                      type="number"
                      value={editor.position}
                      onChange={(e) => set("position", Number(e.target.value))}
                    />
                  </label>
                  <label className="mono">
                    Featured
                    <input
                      type="checkbox"
                      checked={editor.featured}
                      onChange={(e) => set("featured", e.target.checked)}
                    />
                  </label>
                  <div className="full">
                    <button className="btn btn-acc" type="submit">
                      {editor.id ? "Save changes" : "Add to catalogue"}
                    </button>{" "}
                    <button className="btn btn-ghost" type="button" onClick={() => setEditor(null)}>
                      Cancel
                    </button>
                  </div>
                  {msg ? <p className={`msg full${msg.err ? " err" : ""}`}>{msg.text}</p> : null}
                </form>
              ) : null}

              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Section</th>
                    <th>Title</th>
                    <th>Platform</th>
                    <th>Aspect</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id}>
                      <td>{r.position}</td>
                      <td>
                        {r.section}
                        {r.sub ? ` / ${r.sub}` : ""}
                      </td>
                      <td>{r.title}</td>
                      <td>{r.platform}</td>
                      <td>{r.aspect}</td>
                      <td>
                        <button
                          className="rowbtn"
                          type="button"
                          onClick={() =>
                            setEditor({
                              id: r.id,
                              section: r.section,
                              sub: r.sub ?? "",
                              platform: r.platform,
                              code: r.code,
                              kind: r.kind,
                              aspect: r.aspect,
                              title: r.title,
                              detail: r.detail,
                              thumb: r.thumb,
                              link: r.link,
                              featured: r.featured,
                              position: r.position,
                            })
                          }
                        >
                          Edit
                        </button>
                        <button
                          className="rowbtn danger"
                          type="button"
                          onClick={() => void remove(r.id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <p className="note" style={{ marginTop: 26 }}>
                First time? If your signed-in user cannot write yet, grant the admin role once in
                the Supabase SQL editor:{" "}
                <code>
                  insert into public.user_roles (user_id, role) values
                  (&apos;&lt;your-auth-user-uuid&gt;&apos;, &apos;admin&apos;);
                </code>
              </p>
            </>
          )}

          <p className="note">
            <Link className="mono" to="/">
              ← Back to the site
            </Link>
          </p>
        </div>
      </main>
    </>
  );
}
