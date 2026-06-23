"use client";

import { useCallback, useEffect, useState } from "react";

export function useImageReveal(src: string) {
  const [isRevealed, setIsRevealed] = useState(false);

  useEffect(() => {
    setIsRevealed(false);
  }, [src]);

  const revealFromImage = useCallback((img: HTMLImageElement | null) => {
    if (!img) return;
    if (img.complete && img.naturalWidth > 0) {
      setIsRevealed(true);
    }
  }, []);

  const handleReveal = useCallback(() => {
    setIsRevealed(true);
  }, []);

  return { isRevealed, revealFromImage, handleReveal };
}
