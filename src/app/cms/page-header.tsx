import type { ReactNode } from "react";

/** A consistent page header for every CMS screen. */
export default function CmsPageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold text-heading">{title}</h1>
        {description ? <p className="mt-1.5 text-sm leading-6 text-fog">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}
