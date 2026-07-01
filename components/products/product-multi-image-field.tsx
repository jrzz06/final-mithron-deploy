import {
  MAX_PRODUCT_IMAGE_BYTES,
  MAX_PRODUCT_IMAGE_COUNT
} from "@/lib/product-image-limits";

const IMAGE_ACCEPT = "image/jpeg,image/png,image/webp,image/avif,image/gif,image/svg+xml";
const SUPPLIER_IMAGE_ACCEPT = "image/jpeg,image/png,image/webp,image/avif,image/gif";
const MAX_IMAGE_MB = Math.round(MAX_PRODUCT_IMAGE_BYTES / (1024 * 1024));

export type ProductMultiImageFieldDefaults = {
  imageSrc?: string;
  imageAlt?: string;
};

type ProductMultiImageFieldProps = {
  variant: "admin" | "supplier";
  defaults?: ProductMultiImageFieldDefaults;
  labelClassName?: string;
  fieldClassName?: string;
  fileInputClassName?: string;
};

export function ProductMultiImageField({
  variant,
  defaults,
  labelClassName = "text-sm text-[var(--platform-text-secondary)]",
  fieldClassName = "rounded-lg border border-[var(--platform-border)] bg-[var(--platform-surface)] px-3 py-2 text-[var(--platform-text-primary)]",
  fileInputClassName
}: ProductMultiImageFieldProps) {
  const accept = variant === "admin" ? IMAGE_ACCEPT : SUPPLIER_IMAGE_ACCEPT;
  const helper = `Upload up to ${MAX_PRODUCT_IMAGE_COUNT} images (${MAX_IMAGE_MB} MB each). The first selected file becomes the primary image.`;

  return (
    <div
      className="grid gap-3 rounded-lg border border-[var(--platform-border)] bg-[var(--platform-surface)]/60 p-3"
      data-product-multi-image-field
      data-product-multi-image-variant={variant}
    >
      <div className="grid gap-1 text-sm">
        <span className={labelClassName}>Product images</span>
        <span className="text-xs text-[var(--platform-text-muted)]">{helper}</span>
        {defaults?.imageSrc ? (
          <span className="text-xs text-[var(--platform-text-muted)]">
            Current primary: {defaults.imageSrc}
          </span>
        ) : null}
      </div>

      <label className="grid gap-1.5 text-sm" data-product-local-image-upload>
        <span className={labelClassName}>Upload images</span>
        <input
          type="file"
          name="image_files"
          multiple
          accept={accept}
          className={
            fileInputClassName
            ?? (variant === "admin"
              ? `${fieldClassName} py-2 text-xs file:mr-3 file:rounded-md file:border-0 file:bg-[var(--platform-accent-soft)] file:px-2.5 file:py-1 file:text-xs file:font-medium file:text-[var(--platform-text-secondary)]`
              : "platform-file-input block w-full text-sm text-[var(--platform-text-secondary)] file:mr-3")
          }
        />
      </label>

      <label className="grid gap-1.5 text-sm" data-product-media-picker>
        <span className={labelClassName}>Primary image URL</span>
        <input
          name="image_src"
          type="url"
          defaultValue={defaults?.imageSrc ?? ""}
          placeholder="Optional if uploading"
          className={fieldClassName}
        />
      </label>

      <label className="grid gap-1.5 text-sm">
        <span className={labelClassName}>Additional image URLs</span>
        <textarea
          name="gallery_urls"
          rows={3}
          placeholder="One URL per line (optional)"
          className={fieldClassName}
        />
      </label>

      {variant === "supplier" ? (
        <label className="grid gap-1.5 text-sm">
          <span className={labelClassName}>Image description</span>
          <input
            name="image_alt"
            defaultValue={defaults?.imageAlt ?? ""}
            placeholder="Describe the product for accessibility"
            className={fieldClassName}
          />
        </label>
      ) : null}
    </div>
  );
}
