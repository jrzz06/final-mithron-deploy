import type { CSSProperties, ImgHTMLAttributes } from "react";
import { getMediaDeliveryProfile, type MediaDeliveryRole } from "@/config/media-delivery-profiles";
import type { ResponsiveMediaAsset } from "@/config/types";
import { MithronResponsiveImageImg } from "@/components/media/mithron-responsive-image-img";
import { buildResponsiveImageModel } from "@/lib/media/responsive-image-model";
import { cn } from "@/lib/utils";

type MithronResponsiveImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "alt" | "loading"> & {
  src: string;
  alt: string;
  fill?: boolean;
  priority?: boolean;
  loading?: "eager" | "lazy";
  sizes?: string;
  imageRole?: MediaDeliveryRole;
  preferredFormat?: "avif" | "webp" | "png";
  maxVariantWidth?: number;
  webpOnly?: boolean;
  responsive?: ResponsiveMediaAsset;
  useSourceImage?: boolean;
  wrapperClassName?: string;
  imageClassName?: string;
};

export function MithronResponsiveImage({
  src,
  alt,
  fill = false,
  priority = false,
  loading,
  sizes,
  imageRole,
  preferredFormat: preferredFormatProp,
  maxVariantWidth: maxVariantWidthProp,
  webpOnly: webpOnlyProp,
  responsive: responsiveOverride,
  useSourceImage = false,
  className,
  wrapperClassName,
  imageClassName,
  style,
  width: widthProp,
  height: heightProp,
  onError,
  onLoad,
  ...props
}: MithronResponsiveImageProps) {
  const profile = imageRole ? getMediaDeliveryProfile(imageRole) : undefined;
  const model = buildResponsiveImageModel({
    src,
    imageRole,
    preferredFormat: preferredFormatProp ?? profile?.preferredFormat,
    maxVariantWidth: maxVariantWidthProp ?? profile?.maxVariantWidth,
    webpOnly: webpOnlyProp ?? profile?.webpOnly,
    responsive: responsiveOverride,
    useSourceImage,
    fill,
    width: widthProp,
    height: heightProp,
    sizes
  });

  const backgroundStyle = model.backgroundStyle as CSSProperties;

  if (model.mode === "source" || model.mode === "remote") {
    return (
      <picture
        data-mithron-asset-id={model.assetId}
        data-mithron-asset-status={model.assetStatus}
        data-mithron-asset-bucket={model.assetBucket}
        className={cn("mithron-responsive-image-frame", fill ? "absolute inset-0 block" : "block", wrapperClassName)}
        style={backgroundStyle}
      >
        <MithronResponsiveImageImg
          {...props}
          model={model}
          alt={alt}
          fill={fill}
          priority={priority}
          loading={loading}
          className={className}
          imageClassName={imageClassName}
          style={style}
          width={widthProp}
          height={heightProp}
          onError={onError}
          onLoad={onLoad}
        />
      </picture>
    );
  }

  return (
    <picture
      data-mithron-asset-id={model.assetId}
      data-mithron-asset-status={model.assetStatus}
      data-mithron-asset-bucket={model.assetBucket}
      data-blur-placeholder={model.blurPlaceholder ? "true" : "false"}
      className={cn("mithron-responsive-image-frame", fill ? "absolute inset-0 block" : "block", wrapperClassName)}
      style={backgroundStyle}
    >
      {model.avifSrcSet ? <source type="image/avif" srcSet={model.avifSrcSet} sizes={model.resolvedSizes} /> : null}
      {model.webpSrcSet ? <source type="image/webp" srcSet={model.webpSrcSet} sizes={model.resolvedSizes} /> : null}
      {model.pngSrcSet ? <source type="image/png" srcSet={model.pngSrcSet} sizes={model.resolvedSizes} /> : null}
      <MithronResponsiveImageImg
        {...props}
        model={model}
        alt={alt}
        fill={fill}
        priority={priority}
        loading={loading}
        className={className}
        imageClassName={imageClassName}
        style={style}
        width={widthProp}
        height={heightProp}
        onError={onError}
        onLoad={onLoad}
      />
    </picture>
  );
}
