"use client";

import { useEffect, useRef, useState, type CSSProperties, type ImgHTMLAttributes, type SyntheticEvent } from "react";
import type { ResponsiveImageModel } from "@/lib/media/responsive-image-model";
import { pickResponsiveWidth } from "@/lib/media/responsive-image-utils";
import { reportImageRenderMetrics } from "@/lib/media/debug-image-metrics";
import { useImageReveal } from "@/hooks/use-image-reveal";
import { cn } from "@/lib/utils";

type MithronResponsiveImageImgProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "alt" | "loading"> & {
  model: ResponsiveImageModel;
  alt: string;
  fill?: boolean;
  priority?: boolean;
  loading?: "eager" | "lazy";
  imageClassName?: string;
};

function resolveNextSrc(model: ResponsiveImageModel, failedSrc: string | null) {
  if (!failedSrc) return model.primarySrc;
  if (model.useNativeRemoteImage) {
    if (failedSrc === model.primarySrc && model.remoteFallbackSrc && model.remoteFallbackSrc !== model.primarySrc) {
      return model.remoteFallbackSrc;
    }
    return failedSrc;
  }
  if (failedSrc === model.primarySrc && model.variantFallbackSrc && model.variantFallbackSrc !== model.primarySrc) {
    return model.variantFallbackSrc;
  }
  if (model.variantFallbackSrc && failedSrc !== model.variantFallbackSrc) {
    return model.variantFallbackSrc;
  }
  return failedSrc;
}

export function MithronResponsiveImageImg({
  model,
  alt,
  fill = false,
  priority = false,
  loading,
  className,
  imageClassName,
  style,
  width: widthProp,
  height: heightProp,
  onError: onErrorProp,
  onLoad: onLoadProp,
  ...props
}: MithronResponsiveImageImgProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const imageSrc = resolveNextSrc(model, failedSrc);
  const resolvedLoading = priority ? "eager" : loading ?? "lazy";
  const width = widthProp ?? model.width;
  const height = heightProp ?? model.height;
  const { isRevealed, revealFromImage, handleReveal } = useImageReveal(imageSrc);

  useEffect(() => {
    revealFromImage(imgRef.current);
  }, [imageSrc, revealFromImage]);

  const handleImageError = (event: SyntheticEvent<HTMLImageElement>) => {
    const notifyParent = () => onErrorProp?.(event);

    if (model.useNativeRemoteImage) {
      if (!failedSrc && model.remoteFallbackSrc && model.remoteFallbackSrc !== model.primarySrc) {
        setFailedSrc(model.primarySrc);
        return;
      }
      notifyParent();
      return;
    }

    if (!failedSrc && model.primarySrc !== model.optimizedSrc) {
      setFailedSrc(model.primarySrc);
      return;
    }

    if (!failedSrc || failedSrc === model.primarySrc) {
      if (model.variantFallbackSrc && model.variantFallbackSrc !== imageSrc) {
        setFailedSrc(model.variantFallbackSrc);
        return;
      }
    }

    notifyParent();
  };

  const handleImageLoad = (event: SyntheticEvent<HTMLImageElement>) => {
    handleReveal();
    onLoadProp?.(event);
    const img = event.currentTarget;
    reportImageRenderMetrics(img, {
      component: "MithronResponsiveImage",
      hypothesisId: "A-B-E",
      requestedSrc: model.requestedSrc,
      deliveredSrc: imageSrc,
      sizes: model.resolvedSizes,
      srcSet: model.avifSrcSet || model.webpSrcSet || model.pngSrcSet,
      assetStatus: model.responsive?.status,
      assetId: model.responsive?.assetId,
      maxVariantWidth: model.deliveredMaxVariantWidth || undefined
    });
  };

  return (
    <img
      {...props}
      ref={imgRef}
      src={imageSrc}
      alt={alt}
      width={fill ? undefined : (model.useSourceImage || model.useNativeRemoteImage ? pickResponsiveWidth(width, fill) : width)}
      height={fill ? undefined : (model.useSourceImage || model.useNativeRemoteImage ? (typeof height === "number" ? Math.min(height, 1280) : 512) : height)}
      loading={resolvedLoading}
      fetchPriority={priority ? "high" : "auto"}
      decoding={priority ? "sync" : "async"}
      sizes={model.resolvedSizes}
      className={cn(
        model.useSourceImage || model.useNativeRemoteImage ? "mithron-responsive-image object-cover" : "mithron-responsive-image",
        fill && "absolute inset-0 h-full w-full object-cover",
        isRevealed && "is-revealed",
        className,
        imageClassName
      )}
      data-image-reveal={isRevealed ? "revealed" : "pending"}
      style={style}
      onError={handleImageError}
      onLoad={handleImageLoad}
    />
  );
}
