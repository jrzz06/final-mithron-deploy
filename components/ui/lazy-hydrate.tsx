"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

type LazyHydrateProps = {
  children: ReactNode;
  fallback?: ReactNode;
  rootMargin?: string;
  minHeight?: string | number;
  className?: string;
};

export function LazyHydrate({
  children,
  fallback = null,
  rootMargin = "240px 0px",
  minHeight,
  className
}: LazyHydrateProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    if (typeof IntersectionObserver === "undefined") {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin, threshold: 0.01 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [rootMargin]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={minHeight !== undefined ? { minHeight } : undefined}
    >
      {isVisible ? children : fallback}
    </div>
  );
}
