import type { Metadata } from "next";
import { absoluteUrl } from "@/lib/site";

export const OG_IMAGE_WIDTH = 1200;
export const OG_IMAGE_HEIGHT = 630;

/** Locale-specific default social preview (public/og-image-*.png). */
export function localeOgImagePath(locale: string): string {
  return locale === "he" ? "/og-image-he.png" : "/og-image-en.png";
}

export function localeOgImageUrl(locale: string): string {
  return absoluteUrl(localeOgImagePath(locale));
}

export type OgImageDescriptor = {
  url: string;
  width: number;
  height: number;
  alt: string;
};

export function buildOgImageDescriptor(imageUrl: string, alt = "JoinMyPDF"): OgImageDescriptor {
  const url = /^https?:\/\//i.test(imageUrl) ? imageUrl : absoluteUrl(imageUrl);
  return { url, width: OG_IMAGE_WIDTH, height: OG_IMAGE_HEIGHT, alt };
}

export function buildLocaleOgImage(locale: string, alt = "JoinMyPDF"): OgImageDescriptor {
  return buildOgImageDescriptor(localeOgImagePath(locale), alt);
}

/** Default Open Graph + Twitter image fields for a page. */
export function buildDefaultSocialImages(
  locale: string,
  options?: { alt?: string; imagePath?: string },
): Pick<Metadata, "openGraph" | "twitter"> {
  const image = buildOgImageDescriptor(options?.imagePath ?? localeOgImagePath(locale), options?.alt);

  return {
    openGraph: {
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      images: [image.url],
    },
  };
}
