/**
 * Shared media configuration for the CMS.
 *
 * The default social card is the site-wide Open Graph image; a post can
 * override it with its own uploaded image.
 */

export const defaultOgImage = "/opengraph-image";

export const OG_IMAGE_WIDTH = 1200;
export const OG_IMAGE_HEIGHT = 630;

/** Builds an absolute URL for a stored or uploaded image. */
export function absoluteMediaUrl(siteUrl: string, path: string): string {
  if (!path) return `${siteUrl}${defaultOgImage}`;
  if (/^https?:\/\//i.test(path)) return path;
  return `${siteUrl}${path.startsWith("/") ? "" : "/"}${path}`;
}
