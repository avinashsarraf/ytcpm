"use client";

import { usePathname } from "next/navigation";
import SiteFooter from "./site-footer";

/** The public footer, hidden on the CMS routes. */
export default function PublicFooter() {
  const pathname = usePathname();
  if (pathname.startsWith("/cms")) return null;
  return <SiteFooter />;
}
