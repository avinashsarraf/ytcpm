import Link from "next/link";

/** A single metric tile used on the CMS dashboard. */
export default function CmsStat({
  label,
  value,
  href,
  tone = "default",
}: {
  label: string;
  value: number | string;
  href?: string;
  tone?: "default" | "warn";
}) {
  const body = (
    <>
      <p className="text-xs font-semibold uppercase tracking-wider text-fog">{label}</p>
      <p className={`mt-2 text-3xl font-bold ${tone === "warn" ? "text-amber" : "text-heading"}`}>{value}</p>
    </>
  );

  if (!href) {
    return <div className="rounded-xl border border-border bg-white p-5">{body}</div>;
  }
  return (
    <Link href={href} className="rounded-xl border border-border bg-white p-5 transition-colors hover:border-yt-red/40">
      {body}
    </Link>
  );
}
