import sharp from "sharp";
import { autoCutoutIfNeeded } from "@/lib/catalog/auto-cutout";
import { assertSupabaseAdminConfig } from "@/lib/env";
import { upsertMediaAssetRecord } from "@/services/admin-actions";
import {
  assertAllowedMediaMimeType,
  buildMediaAssetId,
  buildMediaAssetRecordFromFormData,
  buildStorageObjectPath
} from "@/services/media-manager";
import {
  buildOptimizedVariantStoragePath,
  buildResponsiveVariantsMetadata,
  buildSupabasePublicObjectUrl,
  createOptimizedImageVariants,
  findStoredOptimizedVariant,
  findLargestStoredAvifVariant,
  type StoredOptimizedImageVariant
} from "@/services/media-optimization";

import { MAX_PRODUCT_IMAGE_BYTES, MAX_PRODUCT_IMAGE_COUNT } from "@/lib/product-image-limits";

export type ProductImageUploadSource = "admin-product-create" | "supplier-product-create";

export type UploadedProductImage = {
  bucket: string;
  storagePath: string;
  optimizedStoragePath: string | null;
  publicUrl: string;
  mediaAssetId: string;
};

export type ProductImageUploadOptions = {
  applyAutoCutout?: boolean;
};

type UploadContext = {
  productName: string;
  productSlug: string;
  actorId: string | null;
  source: ProductImageUploadSource;
  applyAutoCutout: boolean;
  fileIndex: number;
};

function encodeObjectPath(path: string) {
  return path.split("/").map((segment) => encodeURIComponent(segment)).join("/");
}

function isUploadFile(value: FormDataEntryValue | null): value is File {
  return typeof File !== "undefined" && value instanceof File && value.size > 0;
}

function readOptionalFormText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

function splitGalleryUrls(value: string) {
  return value
    .split(/[\n,]+/g)
    .map((item) => item.trim())
    .filter(Boolean);
}

function mergeGalleryUrlsOnFormData(formData: FormData, urls: string[]) {
  const existing = splitGalleryUrls(readOptionalFormText(formData, "gallery_urls"));
  const merged = [...existing];
  for (const url of urls) {
    if (!merged.includes(url)) merged.push(url);
  }
  if (merged.length) {
    formData.set("gallery_urls", merged.join("\n"));
  }
}

export function slugifyProductNameForImage(value: string) {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (!slug) {
    throw new Error("Product name must contain letters or numbers before a local image can be uploaded.");
  }

  return slug;
}

export function collectProductImageUploadFiles(formData: FormData): File[] {
  const files: File[] = [];
  const seen = new Set<string>();

  for (const entry of formData.getAll("image_files")) {
    if (!isUploadFile(entry)) continue;
    const key = `${entry.name}:${entry.size}:${entry.lastModified}`;
    if (seen.has(key)) continue;
    seen.add(key);
    files.push(entry);
  }

  const legacy = formData.get("image_file");
  if (isUploadFile(legacy)) {
    const key = `${legacy.name}:${legacy.size}:${legacy.lastModified}`;
    if (!seen.has(key)) {
      files.push(legacy);
    }
  }

  return files;
}

async function readImageDimensions(buffer: Buffer, mimeType: string) {
  if (!mimeType.startsWith("image/")) return { width: null as number | null, height: null as number | null };

  try {
    const metadata = await sharp(buffer, { failOn: "none" }).metadata();
    return {
      width: typeof metadata.width === "number" ? metadata.width : null,
      height: typeof metadata.height === "number" ? metadata.height : null
    };
  } catch {
    return { width: null as number | null, height: null as number | null };
  }
}

async function uploadProductStorageObject(bucket: string, storagePath: string, contentType: string, buffer: Buffer) {
  const config = assertSupabaseAdminConfig();
  const uploadBody = new Uint8Array(buffer.byteLength);
  uploadBody.set(buffer);

  const response = await fetch(`${config.url}/storage/v1/object/${bucket}/${encodeObjectPath(storagePath)}`, {
    method: "POST",
    headers: {
      apikey: config.serviceRoleKey,
      Authorization: `Bearer ${config.serviceRoleKey}`,
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
      "x-upsert": "false"
    },
    body: uploadBody
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Supabase Storage upload failed for ${bucket}/${storagePath}: ${response.status} ${response.statusText} ${text}`);
  }

  return buildSupabasePublicObjectUrl(config.url, bucket, storagePath);
}

async function uploadProductOptimizedVariants(bucket: string, storagePath: string, buffer: Buffer, mimeType: string) {
  const config = assertSupabaseAdminConfig();
  const variants = await createOptimizedImageVariants(buffer, mimeType);
  const storedVariants: StoredOptimizedImageVariant[] = [];

  for (const variant of variants) {
    const variantStoragePath = buildOptimizedVariantStoragePath(storagePath, variant);
    await uploadProductStorageObject(bucket, variantStoragePath, variant.mimeType, variant.buffer);
    storedVariants.push({
      ...variant,
      storagePath: variantStoragePath,
      publicUrl: buildSupabasePublicObjectUrl(config.url, bucket, variantStoragePath)
    });
  }

  return storedVariants;
}

function validateUploadFile(file: File) {
  const bucket = "mithron-products";
  const mimeType = assertAllowedMediaMimeType(file.type || "application/octet-stream", bucket);
  if (!mimeType.startsWith("image/")) {
    throw new Error("Product image upload must be an image file.");
  }
  if (file.size > MAX_PRODUCT_IMAGE_BYTES) {
    throw new Error("Product image upload must be 12 MB or smaller.");
  }
  return mimeType;
}

export async function uploadSingleProductImageFile(
  file: File,
  ctx: UploadContext
): Promise<UploadedProductImage> {
  const bucket = "mithron-products";
  const mimeType = validateUploadFile(file);
  const uploadedAt = new Date(Date.now() + ctx.fileIndex).toISOString();
  const rawBuffer = Buffer.from(await file.arrayBuffer());

  let buffer = rawBuffer;
  let processedMimeType = mimeType;
  let uploadFileName = file.name;
  let cutoutMetadata: Record<string, unknown> | undefined;

  if (ctx.applyAutoCutout) {
    const cutoutResult = await autoCutoutIfNeeded(rawBuffer, mimeType);
    buffer = Buffer.from(cutoutResult.buffer);
    processedMimeType = cutoutResult.mimeType;
    uploadFileName = cutoutResult.wasProcessed
      ? file.name.replace(/\.[^.]+$/, "") + ".cutout.webp"
      : file.name;
    cutoutMetadata = cutoutResult.wasProcessed
      ? { autoProcessed: true, metrics: cutoutResult.metrics ?? null }
      : cutoutResult.skipped
        ? { autoProcessed: false, skipped: true, skipReason: cutoutResult.skipReason ?? null, metrics: cutoutResult.metrics ?? null }
        : { autoProcessed: false, alreadyCutout: true, metrics: cutoutResult.metrics ?? null };
  }

  const storagePath = buildStorageObjectPath({
    bucket,
    folder: `products/${ctx.productSlug}`,
    fileName: uploadFileName,
    at: uploadedAt
  });
  const sourceDimensions = await readImageDimensions(buffer, processedMimeType);
  const publicUrl = await uploadProductStorageObject(bucket, storagePath, processedMimeType, buffer);
  const optimizedVariants = await uploadProductOptimizedVariants(bucket, storagePath, buffer, processedMimeType);
  const webpVariant = findStoredOptimizedVariant(optimizedVariants, "large", "webp");
  const thumbnailVariant = findStoredOptimizedVariant(optimizedVariants, "thumbnail", "webp");
  const avifVariant = findLargestStoredAvifVariant(optimizedVariants);
  const optimizedUploadedBytes = optimizedVariants.reduce((total, variant) => total + variant.sizeBytes, 0);
  const mediaAssetId = buildMediaAssetId(bucket, storagePath);
  const recordForm = new FormData();
  recordForm.set("id", mediaAssetId);
  recordForm.set("bucket", bucket);
  recordForm.set("folder", `products/${ctx.productSlug}`);
  recordForm.set("storage_path", storagePath);
  recordForm.set("public_url", publicUrl);
  recordForm.set("mime_type", processedMimeType);
  recordForm.set("file_size_bytes", String(buffer.byteLength));
  recordForm.set("visibility", "public");
  recordForm.set("usage_scope", "product-catalog");
  recordForm.set("tags", `product, ${ctx.productSlug}`);
  recordForm.set("alt_text", ctx.productName || ctx.productSlug);
  recordForm.set("caption", ctx.productName || ctx.productSlug);
  if (thumbnailVariant) recordForm.set("thumbnail_path", thumbnailVariant.storagePath);
  if (webpVariant) recordForm.set("webp_path", webpVariant.storagePath);
  if (avifVariant) recordForm.set("avif_path", avifVariant.storagePath);
  recordForm.set(
    "responsive_variants",
    JSON.stringify(
      buildResponsiveVariantsMetadata(optimizedVariants, {
        width: sourceDimensions.width,
        height: sourceDimensions.height,
        sizeBytes: file.size,
        mimeType,
        storagePath,
        publicUrl,
        uploadedBytes: optimizedUploadedBytes
      })
    )
  );
  recordForm.set(
    "upload_metadata",
    JSON.stringify({
      original_file_name: file.name,
      original_mime_type: mimeType,
      original_size_bytes: file.size,
      original_storage_path: storagePath,
      original_public_url: publicUrl,
      optimized_uploaded_bytes: optimizedUploadedBytes,
      product_slug: ctx.productSlug,
      source: ctx.source,
      catalog_delivery: "original-primary-plus-responsive-variants",
      ...(cutoutMetadata ? { cutout: cutoutMetadata } : {})
    })
  );
  if (sourceDimensions.width) recordForm.set("width", String(sourceDimensions.width));
  if (sourceDimensions.height) recordForm.set("height", String(sourceDimensions.height));

  await upsertMediaAssetRecord(buildMediaAssetRecordFromFormData(recordForm, { actorId: ctx.actorId, at: uploadedAt }), ctx.actorId);

  return {
    bucket,
    storagePath,
    optimizedStoragePath: webpVariant?.storagePath ?? null,
    publicUrl,
    mediaAssetId
  };
}

export async function uploadProductImagesForDraft(
  formData: FormData,
  actorId: string | null,
  source: ProductImageUploadSource = "admin-product-create",
  options: ProductImageUploadOptions = {}
): Promise<UploadedProductImage[]> {
  const files = collectProductImageUploadFiles(formData);
  if (!files.length) return [];

  if (files.length > MAX_PRODUCT_IMAGE_COUNT) {
    throw new Error(`You can upload up to ${MAX_PRODUCT_IMAGE_COUNT} product images at a time.`);
  }

  const productName = readOptionalFormText(formData, "name");
  const productSlug = readOptionalFormText(formData, "slug") || slugifyProductNameForImage(productName);
  const uploads: UploadedProductImage[] = [];

  for (let index = 0; index < files.length; index += 1) {
    const upload = await uploadSingleProductImageFile(files[index], {
      productName,
      productSlug,
      actorId,
      source,
      applyAutoCutout: Boolean(options.applyAutoCutout),
      fileIndex: index
    });
    uploads.push(upload);
  }

  if (uploads[0]) {
    formData.set("image_src", uploads[0].publicUrl);
    formData.set("hero_src", uploads[0].publicUrl);
    mergeGalleryUrlsOnFormData(formData, uploads.map((upload) => upload.publicUrl));
  }

  return uploads;
}

export async function uploadProductImageForDraft(
  formData: FormData,
  actorId: string | null,
  source: ProductImageUploadSource = "admin-product-create",
  options: ProductImageUploadOptions = {}
): Promise<UploadedProductImage | null> {
  const uploads = await uploadProductImagesForDraft(formData, actorId, source, options);
  return uploads[0] ?? null;
}
