import "server-only";

import { getResponsiveAssetForSrc } from "@/config/generated-assets";
import {
  buildResponsiveImageModel,
  type ResponsiveImageModelInput
} from "@/lib/media/responsive-image-model";

/** Server-only: resolves manifest entries before building the image model. */
export function buildResponsiveImageModelServer(input: ResponsiveImageModelInput) {
  return buildResponsiveImageModel({
    ...input,
    responsive: input.responsive ?? getResponsiveAssetForSrc(input.src)
  });
}
