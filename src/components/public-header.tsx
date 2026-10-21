"use client";

import { usePathname } from "next/navigation";
import SiteHeader from "./site-header";

/**
 * The public header, hidden on the CMS routes.
 *
 * The CMS has its own shell, so the marketing header and footer are removed
 * from `/cms/**` rather than duplicated with `display:none` in CSS.
 */
export default function PublicHeader() {
  const pathname = usePathname();
  if (pathname.startsWith("/cms")) return null;
  return <SiteHeader />;
}
