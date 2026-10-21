import type { Metadata } from "next";
import { listActivity } from "@/lib/cms/activity";
import CmsPageHeader from "../../page-header";

export const metadata: Metadata = { title: "Activity" };
export const dynamic = "force-dynamic";

/** Human-readable labels for the action names in the audit trail. */
const ACTION_LABELS: Record<string, string> = {
  "auth.login": "Signed in",
  "auth.logout": "Signed out",
  "auth.failed": "Failed sign-in",
  "post.created": "Post created",
  "post.updated": "Post updated",
  "post.published": "Post published",
  "post.draft": "Post unpublished",
  "post.scheduled": "Post scheduled",
  "post.archived": "Post archived",
  "post.deleted": "Post deleted",
  "post.restored": "Version restored",
  "media.uploaded": "Media uploaded",
  "media.updated": "Media updated",
  "media.deleted": "Media deleted",
  "comment.approved": "Comment approved",
  "comment.pending": "Comment held",
  "comment.spam": "Comment marked spam",
  "comment.deleted": "Comment deleted",
  "redirect.saved": "Redirect saved",
  "redirect.deleted": "Redirect deleted",
  "user.created": "Account created",
  "user.updated": "Account updated",
  "user.deleted": "Account deleted",
  "user.password_changed": "Password changed",
  "settings.updated": "Settings updated",
};

export default async function CmsActivityPage() {
  const entries = await listActivity(200);

  return (
    <div className="px-5 py-7 sm:px-8 sm:py-9">
      <CmsPageHeader
        title="Activity log"
        description="Every administrative change, newest first. The log is append-only."
      />

      {entries.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-border bg-white p-10 text-center">
          <p className="text-sm font-semibold text-heading">Nothing recorded yet.</p>
          <p className="mt-1 text-sm text-fog">Actions appear here as soon as an editor makes a change.</p>
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-xl border border-border bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-left text-sm">
              <caption className="sr-only">Administrative activity log</caption>
              <thead>
                <tr className="border-b border-border bg-surface text-xs uppercase tracking-wider text-fog">
                  <th scope="col" className="px-4 py-3 font-bold">When</th>
                  <th scope="col" className="px-4 py-3 font-bold">Who</th>
                  <th scope="col" className="px-4 py-3 font-bold">Action</th>
                  <th scope="col" className="px-4 py-3 font-bold">Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {entries.map((entry) => (
                  <tr key={entry.id}>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-fog">
                      {new Date(entry.createdAt).toLocaleString("en-GB")}
                    </td>
                    <td className="px-4 py-3 text-xs font-semibold text-heading">
                      {entry.userName ?? entry.userEmail ?? "System"}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <span className="rounded-full bg-surface px-2.5 py-1 font-bold text-fog">
                        {ACTION_LABELS[entry.action] ?? entry.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-fog">{entry.summary}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
