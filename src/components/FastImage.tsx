import { Image, ImageProps } from "expo-image";
import React, { memo } from "react";

type Props = ImageProps & {
  /** RN-style alias, mapped to expo-image `contentFit`. */
  resizeMode?: "cover" | "contain" | "stretch" | "center";
};

const FIT: Record<string, ImageProps["contentFit"]> = {
  cover: "cover",
  contain: "contain",
  stretch: "fill",
  center: "scale-down",
};

/**
 * expo-image with fast defaults: memory+disk cache, short fade-in,
 * downscaling to view size (less RAM / faster decode on low-end Android).
 */
function FastImage({ resizeMode, contentFit, source, ...rest }: Props) {
  const uri = (source as any)?.uri;
  return (
    <Image
      source={source}
      contentFit={contentFit ?? (resizeMode ? FIT[resizeMode] : "cover")}
      cachePolicy="memory-disk"
      transition={180}
      allowDownscaling
      recyclingKey={typeof uri === "string" ? uri : undefined}
      {...rest}
    />
  );
}

export default memo(FastImage);

/** Warm the cache for a list of URLs (fire and forget). */
export function prefetchImages(urls: (string | null | undefined)[], max = 20) {
  const list = urls.filter((u): u is string => !!u).slice(0, max);
  if (list.length) Image.prefetch(list, "memory-disk").catch(() => {});
}
