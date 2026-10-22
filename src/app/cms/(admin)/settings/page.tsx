import type { Metadata } from "next";
import { getSettings } from "@/lib/cms/settings";
import CmsPageHeader from "../../page-header";
import SettingsForm from "./settings-form";

export const metadata: Metadata = { title: "Settings" };
export const dynamic = "force-dynamic";

export default async function CmsSettingsPage() {
  const settings = await getSettings();

  return (
    <div className="px-5 py-7 sm:px-8 sm:py-9">
      <CmsPageHeader
        title="Settings"
        description="The copy, the defaults and the secrets that drive the blog."
      />
      <SettingsForm values={{ ...settings }} />
    </div>
  );
}
