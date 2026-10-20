import type { ReactNode } from "react";

/**
 * One heading pattern for every section: mono eyebrow → display title with an
 * italic serif focal word → readable lede. Keeps rhythm and voice consistent
 * instead of every section inventing its own hierarchy.
 */
export default function SectionHeading({
  eyebrow,
  title,
  lede,
  align = "left",
  className = "",
  children,
}: {
  eyebrow: string;
  title: ReactNode;
  lede?: ReactNode;
  align?: "left" | "center";
  className?: string;
  children?: ReactNode;
}) {
  const centered = align === "center";
  return (
    <header className={`section-head ${centered ? "items-center text-center" : ""} ${className}`}>
      <p className="eyebrow">{eyebrow}</p>
      <h2 className="display-2">{title}</h2>
      {lede ? <p className={`lede ${centered ? "mx-auto" : ""}`}>{lede}</p> : null}
      {children}
    </header>
  );
}
