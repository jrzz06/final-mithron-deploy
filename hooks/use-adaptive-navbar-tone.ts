"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";

export type NavbarInkTone = "light" | "dark";

const navbarToneStyles = {
  light: {
    "--adaptive-navbar-ink": "rgba(252, 253, 255, 0.98)",
    "--adaptive-navbar-hover": "rgba(255, 255, 255, 1)",
    "--adaptive-navbar-muted": "rgba(248, 250, 252, 0.72)",
    "--adaptive-navbar-underline": "rgba(255, 255, 255, 0.84)",
    "--adaptive-navbar-text-shadow": "none",
    "--adaptive-navbar-glass-start": "rgba(7, 10, 13, 0.62)",
    "--adaptive-navbar-glass-end": "rgba(7, 10, 13, 0.34)",
    "--adaptive-navbar-border": "rgba(255, 255, 255, 0.14)",
    "--adaptive-navbar-shadow": "0 10px 28px rgba(0, 0, 0, 0.18)",
    "--adaptive-navbar-menu-bg": "rgba(8, 10, 12, 0.72)",
    "--adaptive-navbar-menu-border": "rgba(255, 255, 255, 0.16)",
    "--adaptive-navbar-menu-control": "rgba(255, 255, 255, 0.07)"
  },
  dark: {
    "--adaptive-navbar-ink": "rgba(10, 12, 16, 0.97)",
    "--adaptive-navbar-hover": "rgba(10, 12, 16, 0.82)",
    "--adaptive-navbar-muted": "rgba(10, 12, 16, 0.62)",
    "--adaptive-navbar-underline": "rgba(10, 12, 16, 0.72)",
    "--adaptive-navbar-text-shadow": "none",
    "--adaptive-navbar-glass-start": "rgba(255, 255, 255, 0.9)",
    "--adaptive-navbar-glass-end": "rgba(255, 255, 255, 0.74)",
    "--adaptive-navbar-border": "rgba(17, 17, 19, 0.1)",
    "--adaptive-navbar-shadow": "0 10px 24px rgba(15, 23, 42, 0.08)",
    "--adaptive-navbar-menu-bg": "rgba(250, 252, 253, 0.76)",
    "--adaptive-navbar-menu-border": "rgba(17, 17, 19, 0.10)",
    "--adaptive-navbar-menu-control": "rgba(17, 17, 19, 0.055)"
  }
} satisfies Record<NavbarInkTone, CSSProperties & Record<`--${string}`, string>>;

const NAVBAR_ROOT_SELECTOR = ".TOP_NAVBAR, .adaptive-mobile-menu, .adaptive-mobile-menu__backdrop";
const MIN_CHECK_INTERVAL_MS = 100;

function isInteractionPaused() {
  return typeof document !== "undefined" && document.documentElement.hasAttribute("data-overlay-open");
}

function isNavbarElement(element: Element) {
  return Boolean(element.closest(NAVBAR_ROOT_SELECTOR));
}

function isMobileViewport() {
  return window.matchMedia("(max-width: 767px)").matches;
}

function toneFromExplicitAttributes(element: Element): NavbarInkTone | null {
  let current: Element | null = element;

  while (current && current !== document.documentElement) {
    const navbarInk = current.getAttribute("data-navbar-ink");
    if (navbarInk === "light" || navbarInk === "dark") return navbarInk;

    const activeHeroTheme = current.getAttribute("data-active-hero-theme");
    if (activeHeroTheme === "dark") return "light";
    if (activeHeroTheme === "light") return "dark";

    const backgroundTone = current.getAttribute("data-navbar-tone");
    if (backgroundTone === "dark") return "light";
    if (backgroundTone === "light") return "dark";

    current = current.parentElement;
  }

  return null;
}

function getNavbarSampleY() {
  const navRoot = document.querySelector(".TOP_NAVBAR");
  const bar = navRoot?.querySelector(".adaptive-navbar__bar");
  const barRect = bar?.getBoundingClientRect();

  if (barRect && barRect.height > 0) {
    return Math.min(Math.max(barRect.top + barRect.height * 0.52, 16), window.innerHeight - 1);
  }

  const navRect = navRoot?.getBoundingClientRect();
  return Math.min(Math.max((navRect?.bottom ?? 76) - 24, 16), window.innerHeight - 1);
}

function toneFromSurfaceAtNav(): NavbarInkTone | null {
  const sampleX = Math.round(window.innerWidth * 0.5);
  const sampleY = getNavbarSampleY();
  const stack = document.elementsFromPoint(sampleX, sampleY);

  for (const element of stack) {
    if (isNavbarElement(element)) continue;

    if (isMobileViewport() && element.closest('[data-testid="home-hero"]')) {
      return "light";
    }

    const tone = toneFromExplicitAttributes(element);
    if (tone) return tone;
  }

  return null;
}

function measureNavbarTone(currentTone: NavbarInkTone): NavbarInkTone {
  const surfaceTone = toneFromSurfaceAtNav();
  if (surfaceTone) return surfaceTone;

  const hero = document.querySelector("#hero");
  if (hero) {
    const sampleY = getNavbarSampleY();
    const heroRect = hero.getBoundingClientRect();
    if (heroRect.top <= sampleY && heroRect.bottom >= sampleY) {
      if (isMobileViewport()) return "light";
      return toneFromExplicitAttributes(hero) ?? currentTone;
    }
  }

  return "dark";
}

export function useAdaptiveNavbarTone(initialTone: NavbarInkTone = "dark") {
  const [tone, setTone] = useState(initialTone);
  const toneRef = useRef(initialTone);
  const lastCheckAtRef = useRef(0);
  const rafIdRef = useRef<number | null>(null);
  const resizeTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const applyTone = (nextTone: NavbarInkTone) => {
      if (toneRef.current === nextTone) return;
      toneRef.current = nextTone;
      setTone(nextTone);
    };

    const runToneCheck = () => {
      if (isInteractionPaused()) return;
      applyTone(measureNavbarTone(toneRef.current));
      lastCheckAtRef.current = performance.now();
    };

    const scheduleToneCheck = (force = false) => {
      if (rafIdRef.current !== null) return;

      rafIdRef.current = window.requestAnimationFrame(() => {
        rafIdRef.current = null;
        const elapsed = performance.now() - lastCheckAtRef.current;
        if (!force && elapsed < MIN_CHECK_INTERVAL_MS) {
          scheduleToneCheck();
          return;
        }
        runToneCheck();
      });
    };

    runToneCheck();

    let mountAttempts = 0;
    const retryUntilHeroReady = () => {
      scheduleToneCheck(true);
      if (!document.querySelector("#hero") && mountAttempts < 24) {
        mountAttempts += 1;
        window.requestAnimationFrame(retryUntilHeroReady);
      }
    };
    retryUntilHeroReady();

    const onResize = () => {
      if (resizeTimerRef.current) window.clearTimeout(resizeTimerRef.current);
      resizeTimerRef.current = window.setTimeout(() => scheduleToneCheck(true), 150);
    };

    const onScroll = () => scheduleToneCheck();

    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onScroll, { passive: true });

    const hero = document.querySelector("#hero");
    const heroObserver = hero
      ? new IntersectionObserver(() => scheduleToneCheck(true), { threshold: [0, 0.25, 0.5, 0.75, 1] })
      : null;
    if (hero && heroObserver) heroObserver.observe(hero);

    const mutationObserver = new MutationObserver(() => scheduleToneCheck());
    mutationObserver.observe(document.documentElement, {
      subtree: true,
      attributes: true,
      attributeFilter: ["data-overlay-open", "data-navbar-ink", "data-navbar-tone", "data-active-hero-theme", "data-hero-content-ink", "data-hero-slide-state"]
    });

    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll);
      if (resizeTimerRef.current) window.clearTimeout(resizeTimerRef.current);
      if (rafIdRef.current !== null) window.cancelAnimationFrame(rafIdRef.current);
      heroObserver?.disconnect();
      mutationObserver.disconnect();
    };
  }, []);

  return { tone, style: navbarToneStyles[tone] };
}
