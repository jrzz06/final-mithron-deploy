"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useCallback, useRef } from "react";
import { MithronThumbImage } from "@/components/media/mithron-thumb-image";
import { useReducedMotionPreference } from "@/hooks/use-reduced-motion";
import type { HomeMiniCarouselItem } from "@/lib/home/mini-carousel";
import styles from "./home-landing-composite.module.css";

export function HomeMiniCarousel({
  items
}: {
  items: HomeMiniCarouselItem[];
}) {
  const miniCarouselRailRef = useRef<HTMLDivElement | null>(null);
  const reducedMotion = useReducedMotionPreference();
  const scrollMiniCarousel = useCallback(() => {
    const rail = miniCarouselRailRef.current;
    if (!rail) return;
    rail.scrollBy({ left: rail.clientWidth * 0.8, behavior: reducedMotion ? "auto" : "smooth" });
  }, [reducedMotion]);

  return (
    <div
      className={styles.miniCarousel}
      data-testid="home-mini-carousel"
      data-carousel-kind="product"
      data-media-state={items.some((item) => item.sourceState === "VERIFIED") ? "VERIFIED" : "FALLBACK"}
    >
      <div className={styles.miniCarouselViewport}>
        <div
          ref={miniCarouselRailRef}
          className={styles.miniCarouselRail}
          data-testid="home-mini-carousel-rail"
          aria-label="Mithron product category carousel"
        >
          {items.map((item) => (
            <Link
              href={item.href}
              className={styles.miniCarouselItem}
              data-testid="home-mini-carousel-item"
              data-media-state={item.sourceState}
              key={item.itemKey}
              title={item.fullLabel}
            >
              <span className={styles.miniCarouselImageWell}>
                <MithronThumbImage
                  src={item.media.src}
                  alt=""
                  aria-hidden={true}
                  fill
                  responsive={item.media.responsive}
                  sizes="(max-width: 640px) 92px, 128px"
                  className={styles.miniCarouselImage}
                />
              </span>
              <span className={styles.miniCarouselLabel}>{item.label}</span>
            </Link>
          ))}
        </div>
        <button
          type="button"
          className={styles.miniCarouselNext}
          aria-label="Show more Mithron categories"
          onClick={scrollMiniCarousel}
        >
          <ArrowRight size={22} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
