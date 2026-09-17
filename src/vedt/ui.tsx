import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { SECTIONS, CONTACT } from "./data";

/* ---------------- theme ---------------- */

export function useTheme(): [string, () => void] {
  // Start at "light" on both server and client to keep hydration identical,
  // then sync with the persisted attribute right after mount.
  const [theme, setTheme] = useState<string>("light");
  useEffect(() => {
    setTheme(document.documentElement.getAttribute("data-theme") ?? "light");
  }, []);
  const toggle = () => {
    const next = theme === "light" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("vedt-theme", next);
    } catch {
      /* storage unavailable */
    }
    setTheme(next);
  };
  return [theme, toggle];
}

const Sun = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4m11.4-11.4 1.4-1.4" />
  </svg>
);
const Moon = (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
  </svg>
);

export function ThemeToggle() {
  const [theme, toggle] = useTheme();
  return (
    <button
      type="button"
      className="theme-btn"
      onClick={toggle}
      aria-label={theme === "light" ? "Switch to dark theme" : "Switch to light theme"}
      title={theme === "light" ? "Dark" : "Light"}
    >
      {theme === "light" ? Moon : Sun}
    </button>
  );
}

/* ---------------- header ---------------- */

export function Header() {
  return (
    <header className="hdr">
      <div className="hdr-in">
        <Link className="brand" to="/" aria-label="V-EDT home">
          V-EDT
        </Link>
        <span className="hdr-sp" />
        <ThemeToggle />
        <Link className="hdr-cta" to="/contact">
          Contact
        </Link>
      </div>
    </header>
  );
}

/* ---------------- left rail: niches only ---------------- */

export function Rail() {
  return (
    <nav className="rail" aria-label="Niches">
      {SECTIONS.map((s) => (
        <a key={s.id} href={`#${s.id}`}>
          {s.label}
        </a>
      ))}
      <div className="rail-foot">
        <Link to="/contact">Contact</Link>
        <a href={`mailto:${CONTACT.email}`}>Email</a>
        <a href={CONTACT.whatsapp} target="_blank" rel="noopener noreferrer">
          WhatsApp
        </a>
      </div>
    </nav>
  );
}

/* ---------------- preloader ---------------- */

export function Preloader() {
  const [done, setDone] = useState(false);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    let armed = false;
    const t0 = window.setTimeout(() => {
      armed = true;
    }, 400);
    // Safety net: never trap the user behind the overlay.
    const t1 = window.setTimeout(() => setDone(true), 4000);
    const go = () => {
      if (armed) setDone(true);
    };
    // wheel = desktop scroll, touchmove/touchstart = mobile swipe,
    // scroll = programmatic/restored scrolls, keydown = keyboard users.
    window.addEventListener("wheel", go, { passive: true });
    window.addEventListener("touchmove", go, { passive: true });
    window.addEventListener("touchstart", go, { passive: true });
    window.addEventListener("scroll", go, { passive: true });
    window.addEventListener("keydown", go);
    return () => {
      window.clearTimeout(t0);
      window.clearTimeout(t1);
      window.removeEventListener("wheel", go);
      window.removeEventListener("touchmove", go);
      window.removeEventListener("touchstart", go);
      window.removeEventListener("scroll", go);
      window.removeEventListener("keydown", go);
    };
  }, []);

  useEffect(() => {
    if (!done) return;
    const t = window.setTimeout(() => setGone(true), 1500);
    return () => window.clearTimeout(t);
  }, [done]);

  if (gone) return null;
  return (
    <div className={`pre${done ? " done" : ""}`} aria-hidden="true">
      <span className="pre-w">V-EDT</span>
    </div>
  );
}

/* ---------------- DaVinci-style render bar ---------------- */

export function RenderBar() {
  const [pct, setPct] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setPct(max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);
  const p = Math.round(pct * 100);
  return (
    <div className="rb" aria-hidden="true">
      <i style={{ width: `${p}%` }} />
    </div>
  );
}

/* ---------------- marquee ---------------- */

export function Marquee() {
  const items = ["Video", "Film", "Editing", "House", ...SECTIONS.map((s) => s.label)];
  const half = (key: string) =>
    items.map((t, i) => (
      <span key={`${key}${i}`}>
        {t} <i>·</i>
      </span>
    ));
  return (
    <div className="marquee" aria-hidden="true">
      <div className="mq-track">
        {half("a")}
        {half("b")}
      </div>
    </div>
  );
}

/* ---------------- footer + giant half-cut wordmark ---------------- */

export function Outro() {
  return (
    <div className="wm" aria-hidden="true">
      <span>V-EDT</span>
    </div>
  );
}
