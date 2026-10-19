"use client";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import s from "@/app/landing.module.css";

const links = [
  ["workflow", "How It Works"],
  ["product-capabilities", "Product Features"],
  ["who-we-serve", "Who We Serve"],
  ["why-mealrelay", "Why MealRelay"],
  ["architecture", "Cross-Platform"],
] as const;

export function LandingNavigation() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("");
  return <div className={s.navContainer} onKeyDown={event => {
    if (event.key === "Escape") { setOpen(false); event.currentTarget.querySelector("button")?.focus(); }
  }}>
    <button type="button" className={s.mobileToggle} aria-label={open ? "Close navigation menu" : "Open navigation menu"}
      aria-expanded={open} aria-controls="landing-navigation" onClick={() => setOpen(value => !value)}>
      {open ? <X size={22} /> : <Menu size={22} />}
    </button>
    <nav id="landing-navigation" className={s.navLinks} data-open={open} aria-label="Main navigation">
      {links.map(([id, label]) => <a key={id} href={`#${id}`} aria-current={active === id ? "location" : undefined}
        onClick={event => {
          const section = document.getElementById(id);
          if (!section) return;
          event.preventDefault();
          setOpen(false); setActive(id);
          window.history.pushState(null, "", `#${id}`);
          section.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: "start" });
        }}>{label}</a>)}
    </nav>
  </div>;
}
