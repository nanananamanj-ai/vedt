import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import type { Session } from "@supabase/supabase-js";

import vedtCss from "../vedt/vedt.css?url";
import { SECTIONS, type Aspect, type Platform, type Video } from "../vedt/data";
import { Header } from "../vedt/ui";
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
    meta: [{ title: "Admin — V-EDT" }, { name: "robots", content: "noindex" }],
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
      file_path: editor.file_path.trim() === "" ? null : editor.file_path.trim(),
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

  // Move a row up or down by swapping positions with its neighbour.
  const move = async (index: number, dir: -1 | 1) => {
    const a = rows[index];
    const b = rows[index + dir];
    if (!a || !b) return;
    await supabase.from("videos").update({ position: b.position }).eq("id", a.id);
    await supabase.from("videos").update({ position: a.position }).eq("id", b.id);
    await load();
  };

  // Reorder niches: swap positions with the neighbouring category.
  const moveCat = async (index: number, dir: -1 | 1) => {
    const a = cats[index];
    const b = cats[index + dir];
    if (!a || !b) return;
    await supabase.from("categories").update({ position: b.position }).eq("id", a.id);
    await supabase.from("categories").update({ position: a.position }).eq("id", b.id);
    await load();
  };

  const saveCat = async (c: Cat, patch: Partial<Cat>) => {
    const { error } = await supabase.from("categories").update(patch).eq("id", c.id);
    setMsg(
      error
        ? { text: `Category save failed: ${error.message}`, err: true }
        : { text: "Category updated.", err: false },
    );
    await load();
  };

  const addCat = async () => {
    const label = window.prompt("New niche name (e.g. Fashion)")?.trim();
    if (!label) return;
    const slug = label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const { error } = await supabase
      .from("categories")
      .insert({ slug, label, subs: [], position: cats.length });
    setMsg(
      error
        ? { text: `Add failed: ${error.message}`, err: true }
        : { text: `Added ${label}.`, err: false },
    );
    await load();
  };

  const delCat = async (c: Cat) => {
    if (!window.confirm(`Remove the ${c.label} niche? Videos in it stay in the database.`)) return;
    const { error } = await supabase.from("categories").delete().eq("id", c.id);
    if (error) setMsg({ text: `Delete failed: ${error.message}`, err: true });
    await load();
  };

  // Upload the actual video file to private storage; playback then shows no
  // outside branding at all.
  const upload = async (file: File) => {
    setMsg({ text: `Uploading ${file.name}…`, err: false });
    const path = `videos/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_")}`;
    const { error } = await supabase.storage.from("media").upload(path, file, { upsert: false });
    if (error) {
      setMsg({ text: `Upload failed: ${error.message}`, err: true });
      return;
    }
    set("file_path", path);
    setMsg({ text: "Uploaded. Save to apply.", err: false });
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

              <h2 className="disp" style={{ marginTop: 18 }}>
                Niches
              </h2>
              <p className="note">
                Drag-free ordering: use ↑ / ↓ to change the order they appear on the site. Names
                and sub-groups are editable here too.
              </p>
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Name</th>
                    <th>Sub-groups (comma separated)</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {cats.map((c, i) => (
                    <tr key={c.id}>
                      <td>{i + 1}</td>
                      <td>
                        <input
                          defaultValue={c.label}
                          onBlur={(e) => {
                            const v = e.target.value.trim();
                            if (v && v !== c.label) void saveCat(c, { label: v });
                          }}
                        />
                      </td>
                      <td>
                        <input
                          defaultValue={(c.subs ?? []).join(", ")}
                          onBlur={(e) => {
                            const subs = e.target.value
                              .split(",")
                              .map((s) => s.trim())
                              .filter(Boolean);
                            if (subs.join("|") !== (c.subs ?? []).join("|"))
                              void saveCat(c, { subs });
                          }}
                        />
                      </td>
                      <td>
                        <button
                          className="rowbtn"
                          type="button"
                          disabled={i === 0}
                          onClick={() => void moveCat(i, -1)}
                        >
                          ↑
                        </button>
                        <button
                          className="rowbtn"
                          type="button"
                          disabled={i === cats.length - 1}
                          onClick={() => void moveCat(i, 1)}
                        >
                          ↓
                        </button>
                        <button
                          className="rowbtn danger"
                          type="button"
                          onClick={() => void delCat(c)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button className="btn btn-ghost" type="button" onClick={() => void addCat()}>
                + Add niche
              </button>

              <h2 className="disp" style={{ marginTop: 26 }}>
                Videos
              </h2>
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
                    Niche
                    <select value={editor.section} onChange={(e) => set("section", e.target.value)}>
                      {(cats.length > 0
                        ? cats.map((c) => ({ id: c.slug, label: c.label }))
                        : SECTIONS.map((s) => ({ id: s.id, label: s.label }))
                      ).map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  {subOptions.length > 0 ? (
                    <label className="mono">
                      Sub-group
                      <select value={editor.sub} onChange={(e) => set("sub", e.target.value)}>
                        <option value="">— none —</option>
                        {subOptions.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </label>
                  ) : null}
                  <label className="mono">
                    Shape
                    <select
                      value={editor.aspect}
                      onChange={(e) => set("aspect", e.target.value as Aspect)}
                    >
                      <option value="landscape">Wide (film)</option>
                      <option value="portrait">Vertical (reel)</option>
                      <option value="4x5">Square-ish (4:5)</option>
                    </select>
                  </label>
                  <label className="mono full">
                    Paste the video link (YouTube, Instagram or Vimeo)
                    <input
                      value={editor.link}
                      placeholder="https://youtu.be/…"
                      onChange={(e) => applyLink(e.target.value)}
                    />
                    <span className="msg">
                      {editor.code
                        ? `Detected: ${editor.platform} · ${editor.code}`
                        : "We read the platform and video id from the link automatically."}
                    </span>
                  </label>
                  <label className="mono full">
                    …or upload the video file (plays with no outside branding)
                    <input
                      type="file"
                      accept="video/*"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) void upload(f);
                      }}
                    />
                    {editor.file_path ? (
                      <span className="msg">Stored file: {editor.file_path}</span>
                    ) : null}
                  </label>

                  <div className="full">
                    <button className="rowbtn" type="button" onClick={() => setAdv((v) => !v)}>
                      {adv ? "Hide advanced" : "Advanced options"}
                    </button>
                  </div>

                  {adv ? (
                    <>
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
                        <input value={editor.code} onChange={(e) => set("code", e.target.value)} />
                      </label>
                      <label className="mono">
                        Kind (p / reel / watch / shorts / video)
                        <input value={editor.kind} onChange={(e) => set("kind", e.target.value)} />
                      </label>
                      <label className="mono">
                        Thumbnail path (e.g. /assets/thumbs/00.webp)
                        <input
                          value={editor.thumb}
                          onChange={(e) => set("thumb", e.target.value)}
                        />
                      </label>
                      <label className="mono">
                        Position
                        <input
                          type="number"
                          value={editor.position}
                          onChange={(e) => set("position", Number(e.target.value))}
                        />
                      </label>
                    </>
                  ) : null}

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
                  {rows.map((r, i) => (
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
                          disabled={i === 0}
                          onClick={() => void move(i, -1)}
                        >
                          ↑
                        </button>
                        <button
                          className="rowbtn"
                          type="button"
                          disabled={i === rows.length - 1}
                          onClick={() => void move(i, 1)}
                        >
                          ↓
                        </button>
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
                              file_path: r.file_path ?? "",
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
