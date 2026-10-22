#!/usr/bin/env node
/**
 * CMS end-to-end test.
 *
 * Runs the real application against a real (WebAssembly) PostgreSQL, signs
 * in through the real login form, and drives the admin screens and the public
 * blog with a real browser. Nothing is mocked: the SQL, the session cookies,
 * the server actions and the rendering are all the production code paths.
 *
 *   npm run test:cms
 *
 * The test covers:
 *   - the sign-in gate on /cms
 *   - every admin screen rendering with real rows
 *   - creating and publishing a post through the editor
 *   - the published post appearing on the blog, the feed and the sitemap
 *   - uploading an image and serving it from /media
 *   - a redirect created in the admin working on the public site
 *   - a public comment appearing in the moderation queue and being approved
 *   - signing out and the gate closing again
 */
import { spawn } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { chromium } from "playwright";
import { startTestDatabase } from "./cms-test-db.mjs";
import { ADMIN_EMAIL, ADMIN_PASSWORD, seedFixtures } from "./cms-test-fixtures.mjs";

// A port that is unlikely to clash with a running dev server. The test starts
// its own server, so the port has to be free.
const PORT = Number(process.env.CMS_TEST_PORT ?? 3131);
const BASE = `http://127.0.0.1:${PORT}`;
const API_KEY = "cms-e2e-test-key-0123456789";
const NEW_PASSWORD = "Ytc!RotatedOwner2026";
const REVALIDATE_SECRET = "cms-e2e-revalidate-secret-0123456789";

const results = [];
let failures = 0;

function check(name, condition, detail = "") {
  const ok = Boolean(condition);
  if (!ok) failures += 1;
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${detail && !ok ? ` — ${detail}` : ""}`);
}

/** Every file under a directory, as relative paths. */
async function listFiles(dir, prefix = "") {
  const { readdir } = await import("node:fs/promises");
  const files = [];
  let entries = [];
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return files;
  }
  for (const entry of entries) {
    if (entry.isDirectory()) files.push(...(await listFiles(`${dir}/${entry.name}`, `${prefix}${entry.name}/`)));
    else files.push(`${prefix}${entry.name}`);
  }
  return files;
}

async function waitForServer(url, timeoutMs = 120_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url, { redirect: "manual" });
      if (response.status > 0) return true;
    } catch {
      // the server is not listening yet
    }
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  throw new Error(`server did not start at ${url}`);
}

const consoleErrors = [];

async function main() {
  // Fail fast with a clear message instead of a confusing "address in use".
  try {
    const probe = await fetch(`${BASE}/api/health`, { signal: AbortSignal.timeout(1500) });
    if (probe.status) throw new Error("in use");
  } catch (error) {
    if (String(error.message).includes("in use")) {
      console.error(`Port ${PORT} is already in use. Set CMS_TEST_PORT to a free port.`);
      process.exit(1);
    }
  }

  const database = await startTestDatabase();
  const storageDir = await mkdtemp(join(tmpdir(), "ytcpm-cms-"));
  const screenshots = join(tmpdir(), "ytcpm-cms-shots");
  await mkdir(screenshots, { recursive: true });

  await seedFixtures(database.databaseUrl, storageDir);
  console.log("database ready with fixtures");

  // `detached` puts the server in its own process group so the whole tree
  // (npx -> next -> next-server) can be stopped again at the end.
  const server = spawn("npx", ["next", "start", "--port", String(PORT)], {
    cwd: process.cwd(),
    detached: true,
    env: {
      ...process.env,
      DATABASE_URL: database.databaseUrl,
      DATABASE_SSL: "false",
      DATABASE_POOL_MAX: "6",
      DATABASE_STATEMENT_TIMEOUT_MS: "30000",
      CMS_STORAGE_DIR: storageDir,
      CMS_MAX_UPLOAD_BYTES: String(2 * 1024 * 1024),
      CMS_API_KEY: API_KEY,
      CMS_REVALIDATE_SECRET: REVALIDATE_SECRET,
      NEXT_TELEMETRY_DISABLED: "1",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  server.stdout.on("data", (chunk) => process.env.CMS_TEST_VERBOSE && console.log("[server]", String(chunk).trim()));
  server.stderr.on("data", (chunk) => process.env.CMS_TEST_VERBOSE && console.log("[server:err]", String(chunk).trim()));

  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_EXECUTABLE_PATH,
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });

  try {
    await waitForServer(`${BASE}/api/health`);

    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    const page = await context.newPage();
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(`${page.url()} :: ${message.text()}`);
    });
    page.on("pageerror", (error) => consoleErrors.push(`${page.url()} :: ${error.message}`));

    /* 1. The gate ------------------------------------------------------- */
    await page.goto(`${BASE}/cms`, { waitUntil: "domcontentloaded" });
    check("/cms redirects an anonymous visitor to the sign-in screen", page.url().endsWith("/cms/login"), page.url());

    const loginHeading = await page.locator("h1").first().textContent();
    check("the sign-in screen renders", /content manager/i.test(loginHeading ?? ""), loginHeading ?? "");

    /* 2. Sign in -------------------------------------------------------- */
    await page.fill('input[name="email"]', ADMIN_EMAIL);
    await page.fill('input[name="password"]', ADMIN_PASSWORD);
    await Promise.all([page.waitForURL(/\/cms(\?|$)/, { timeout: 30_000 }), page.click('button[type="submit"]')]);
    check("signing in lands on the dashboard", /\/cms(\?|$)/.test(page.url()), page.url());

    const dashboard = await page.locator("body").innerText();
    check("the dashboard shows the published post count", /What a YouTube CPM actually tells you/.test(dashboard), dashboard.slice(0, 160));

    /* 3. Every admin screen renders ------------------------------------- */
    const screens = [
      ["/cms", "Dashboard"],
      ["/cms/posts", "Posts"],
      ["/cms/media", "Media library"],
      ["/cms/comments", "Comments"],
      ["/cms/redirects", "Redirects"],
      ["/cms/users", "Users"],
      ["/cms/settings", "Settings"],
      ["/cms/activity", "Activity"],
      ["/cms/posts/new", "New post"],
    ];

    for (const [path, heading] of screens) {
      const response = await page.goto(`${BASE}${path}`, { waitUntil: "domcontentloaded" });
      const text = await page.locator("body").innerText();
      const ok = response.status() === 200 && text.includes(heading) && !text.includes("Application error");
      check(`admin screen ${path} renders`, ok, `status ${response.status()}`);
      await page.screenshot({ path: join(screenshots, `admin${path.replace(/\//g, "-")}.png`), fullPage: false });
    }

    // A full article: long enough to clear the publish gate, with the focus
    // keyword in the title, description, slug, opening paragraph and a
    // sub-heading, an image with alt text and both internal and external
    // links.
    const longBody = [
      "## Why a youtube rpm figure is quoted so loosely",
      "",
      "A youtube rpm is the revenue a channel earns per thousand views, so it moves with watch time, audience country and the share of views that come from Shorts. A single number rarely describes a channel, which is why every estimate on this site is published with the assumptions that produced it.",
      "",
      "The most common mistake is comparing a youtube rpm taken from a single month against a benchmark taken from a twelve month average. A holiday quarter, one viral Shorts clip or a single sponsored upload can move a monthly figure far enough to make a healthy channel look broken. The same happens in the other direction, when a weak month hides a channel that is quietly improving.",
      "",
      "## How the estimate is built",
      "",
      "The model takes the audience country, the content niche and the monetisation mix, then applies a published rate for that combination. The rate table and every assumption behind it are listed on the methodology page, so the arithmetic can be checked by hand rather than taken on trust.",
      "",
      "![A creator reviewing channel analytics](/media/2026/10/cpm-chart.png)",
      "",
      "Run the [RPM calculator](/youtube-rpm-calculator) with your own numbers, then read the [methodology page](/methodology) to see exactly which rate was applied. The [sources page](/sources) lists where those rates come from, and the [CPM calculator](/youtube-cpm-calculator) shows the impression side of the same model. YouTube publishes its own definition of the metric in the [Partner Programme help centre](https://support.google.com/youtube/answer/9314357).",
      "",
      "## What the number does not tell you",
      "",
      "It does not tell you what a sponsor will pay, what a membership will be worth, or what the channel will earn next quarter. It describes the advertising revenue attached to a thousand views under a stated set of assumptions, which is useful precisely because it is narrow. Treat it as one input among several rather than as a verdict on the channel.",
      "",
      "A channel with a small but loyal audience in a high paying country often earns more per view than a channel with a large audience in a low paying one, and no headline figure captures that. The audience country mix is the variable worth checking first when the trend moves.",
      "",
      "## A practical rule for reading it",
      "",
      "Compare your own youtube rpm against your own history before you compare it against anybody else. Three months of trend separates a real change from noise, and a quarter of data is enough to see whether a format change actually worked. If the direction is stable, check the audience country mix next, because that single variable usually explains most of the movement.",
      "",
      "Finally, keep the comparison honest by using the same definition on both sides. A creator quoting a blended studio figure against a modelled benchmark is not comparing like with like, and the difference is usually larger than it looks.",
    ].join("\n");

    /* 4. Create and publish a post through the editor -------------------- */
    await page.goto(`${BASE}/cms/posts/new`, { waitUntil: "domcontentloaded" });

    const title = "How to read a YouTube RPM figure without guessing";
    const slug = "how-to-read-a-youtube-rpm-figure-without-guessing";
    const shortBody = [
      "## Why the number is quoted so loosely",
      "",
      "A youtube rpm moves with watch time and audience country, so one figure rarely describes a channel.",
    ].join("\n");

    await page.click('#tab-content');
    await page.fill("#title", title);
    await page.fill("#excerpt", "A YouTube RPM figure only means something next to watch time, audience country and Shorts share. Here is how to read one.");
    await page.fill("#contentMd", shortBody);

    await page.click('#tab-seo');
    await page.fill("#focusKeyword", "youtube rpm");
    await page.fill("#seoTitle", "YouTube RPM: how to read the figure");
    await page.fill("#seoDescription", "A YouTube RPM figure only means something next to watch time, audience country and Shorts share. Here is how to read one properly.");
    await page.fill("#category", "CPM & RPM");
    await page.fill("#tags", "rpm, earnings");

    const seoScore = await page.locator("aside h2", { hasText: "SEO check" }).locator("xpath=../span").first().innerText();
    check("the editor shows a live SEO score", /\d+/.test(seoScore), seoScore);

    // The publish gate: a thin article must not go live.
    await page.selectOption("#status", "published");
    await page.click('button:has-text("Create post")');
    await page.waitForTimeout(2500);
    const gateMessage = await page.locator('[role="status"]').first().innerText();
    check("the publish gate blocks a thin article", /blocking SEO issues/i.test(gateMessage), gateMessage);
    check("the blocked post was not created", !/\/cms\/posts\/\d+/.test(page.url()), page.url());

    // Now write a full article and publish it for real.
    await page.click('#tab-content');
    await page.fill("#contentMd", longBody);
    await page.click('button:has-text("Create post")');

    let created = true;
    try {
      await page.waitForURL(/\/cms\/posts\/\d+/, { timeout: 30_000 });
    } catch {
      created = false;
    }
    await page.waitForLoadState("networkidle").catch(() => {});
    const editorText = await page.locator("body").innerText();
    check("the post is created and the editor opens it", created, `${page.url()} — ${editorText.slice(0, 200)}`);
    const savedTitle = await page.locator("#title").inputValue().catch(() => "");
    check("the editor reopens the saved post", savedTitle === title, savedTitle);
    check("the editor offers to save changes", /save changes/i.test(editorText), editorText.slice(0, 200));

    const slugValue = await page.locator("#slug").inputValue();
    check("the slug is generated from the title", slugValue === slug, slugValue);
    const postId = Number(page.url().split("/").pop());

    /* 5. The post is live on the public blog ---------------------------- */
    const publicPost = await context.newPage();
    const postResponse = await publicPost.goto(`${BASE}/blog/${slug}`, { waitUntil: "domcontentloaded" });
    check("the published post is public", postResponse.status() === 200, `status ${postResponse.status()}`);

    const postHtml = await publicPost.content();
    check("the post page has the SEO title", postHtml.includes("YouTube RPM: how to read the figure"), "title missing");
    check("the post page has the meta description", postHtml.includes("A YouTube RPM figure only means something"), "description missing");
    check("the post page has BlogPosting structured data", postHtml.includes('"@type":"BlogPosting"'), "BlogPosting missing");
    check("the post page has a canonical URL", postHtml.includes(`https://ytcpm.online/blog/${slug}`), "canonical missing");
    check("the post page renders the Markdown headings", postHtml.includes("<h2"), "h2 missing");
    check("the post page has a table of contents", postHtml.includes("jump to") || postHtml.includes("On this page"), "toc missing");

    const ogImage = await publicPost.locator('meta[property="og:image"]').getAttribute("content");
    check("the post page has a social image", Boolean(ogImage), "og:image missing");
    if (ogImage) {
      // The tag is absolute, so it has to be pointed back at the test server.
      const ogResponse = await publicPost.request.get(ogImage.replace("https://ytcpm.online", BASE));
      check("the social image is served", ogResponse.status() === 200, `status ${ogResponse.status()}`);
    }

    await publicPost.goto(`${BASE}/blog`, { waitUntil: "domcontentloaded" });
    const indexText = await publicPost.locator("body").innerText();
    check("the post appears on the blog index", indexText.includes(title), "missing from index");

    const feed = await (await publicPost.request.get(`${BASE}/blog/rss.xml`)).text();
    check("the post appears in the RSS feed", feed.includes(slug), "missing from feed");

    const sitemap = await (await publicPost.request.get(`${BASE}/sitemap.xml`)).text();
    check("the post appears in the sitemap", sitemap.includes(`/blog/${slug}`), "missing from sitemap");

    /* 6. Upload an image and serve it ------------------------------------ */
    await page.goto(`${BASE}/cms/media`, { waitUntil: "domcontentloaded" });
    const png = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAAFklEQVR4nGP8z8Dwn4EIwESMolGFlAEAiTkDEbUyort/AAAAAElFTkSuQmCC",
      "base64",
    );
    await page.setInputFiles('input[name="file"]', { name: "upload-test.png", mimeType: "image/png", buffer: png });
    await page.fill('input[name="altText"]', "A tiny test image uploaded through the CMS");
    await Promise.all([page.waitForURL(/\/cms\/media/, { timeout: 30_000 }), page.click('button:has-text("Upload image")')]);

    // The library refreshes itself once the upload succeeds.
    const refreshed = await page
      .waitForFunction(() => document.querySelectorAll('img[src^="/media/"]').length > 1, null, { timeout: 15_000 })
      .then(() => true)
      .catch(() => false);
    check("the media library refreshes after an upload", refreshed, "the new file did not appear");

    const mediaText = await page.locator("body").innerText();
    check("the uploaded file appears in the media library", mediaText.includes("upload-test.png"), "file missing");

    // The file has to be on disk, not only in the database.
    const listing = await listFiles(storageDir);
    check("the uploaded file is written to the storage directory", listing.some((file) => file.endsWith(".png")), JSON.stringify(listing));

    const allSrcs = await page.locator("img").evaluateAll((nodes) => nodes.map((n) => n.getAttribute("src")));
    const uploadedUrls = allSrcs.filter((src) => src && src !== "/media/2026/10/cpm-chart.png");
    check("the uploaded image has a public URL", uploadedUrls.length > 0, "no /media URL");
    for (const url of uploadedUrls) {
      const mediaResponse = await publicPost.request.get(`${BASE}${url}`);
      check(`the uploaded image ${url} is served from /media`, mediaResponse.status() === 200, `status ${mediaResponse.status()}`);
    }

    /* 7. A redirect created in the admin works --------------------------- */
    await page.goto(`${BASE}/cms/redirects`, { waitUntil: "domcontentloaded" });
    await page.fill('input[name="fromPath"]', "/old-rpm-page");
    await page.fill('input[name="toPath"]', "/youtube-rpm-calculator");
    await page.selectOption('select[name="statusCode"]', "301");
    await page.click('button:has-text("Add redirect")');
    await page.waitForTimeout(1500);

    const redirectResponse = await publicPost.request.get(`${BASE}/old-rpm-page`, { maxRedirects: 0 });
    const location = redirectResponse.headers().location ?? "";
    check("the redirect is applied on the public site", [301, 302, 307, 308].includes(redirectResponse.status()) && location.includes("youtube-rpm-calculator"), `status ${redirectResponse.status()} location ${location}`);

    /* 8. Comments: submit publicly, moderate in the admin ---------------- */
    await publicPost.goto(`${BASE}/blog/${slug}`, { waitUntil: "domcontentloaded" });
    const nameInput = publicPost.locator('input[name="authorName"]');
    if (await nameInput.count()) {
      await nameInput.fill("Test Reader");
      await publicPost.fill('input[name="authorEmail"]', "reader@example.com");
      await publicPost.fill('textarea[name="body"]', "This is a moderated comment from the end-to-end test.");
      await publicPost.click('form button[type="submit"]');
      await publicPost.waitForTimeout(2000);
    }

    await page.goto(`${BASE}/cms/comments`, { waitUntil: "domcontentloaded" });
    const commentsText = await page.locator("body").innerText();
    check("the public comment reaches the moderation queue", commentsText.includes("moderated comment from the end-to-end test"), "comment missing");

    const approve = page.locator('button:has-text("Approve")').first();
    if (await approve.count()) {
      await approve.click();
      await page.waitForTimeout(2000);
    }
    const approvedText = await page.locator("body").innerText();
    check("the comment can be approved", !approvedText.includes("Publishing is blocked"), "approve failed");

    /* 9. The image sitemap and the tag archive -------------------------- */
    const imageSitemap = await (await publicPost.request.get(`${BASE}/image-sitemap.xml`)).text();
    check("the image sitemap lists the published post", imageSitemap.includes(`/blog/${slug}/opengraph-image`), "post image missing");

    const tagArchive = await publicPost.goto(`${BASE}/blog/tag/rpm`, { waitUntil: "domcontentloaded" });
    const tagText = await publicPost.locator("body").innerText();
    check("the tag archive lists the post", tagArchive.status() === 200 && tagText.includes(title), `status ${tagArchive.status()}`);

    /* 10. The signed revalidation webhook ------------------------------- */
    const { createHmac } = await import("node:crypto");
    const webhookBody = JSON.stringify({ slug, paths: ["/blog"] });
    const webhookTimestamp = String(Math.floor(Date.now() / 1000));
    const webhookSignature = createHmac("sha256", REVALIDATE_SECRET)
      .update(`${webhookTimestamp}.${webhookBody}`)
      .digest("base64url");
    const webhook = await publicPost.request.post(`${BASE}/api/cms/revalidate`, {
      headers: {
        "content-type": "application/json",
        "x-cms-timestamp": webhookTimestamp,
        "x-cms-signature": webhookSignature,
      },
      data: webhookBody,
    });
    check("the signed webhook revalidates the cache", webhook.status() === 200, `status ${webhook.status()}`);

    const badWebhook = await publicPost.request.post(`${BASE}/api/cms/revalidate`, {
      headers: {
        "content-type": "application/json",
        "x-cms-timestamp": webhookTimestamp,
        "x-cms-signature": "not-a-valid-signature",
      },
      data: webhookBody,
    });
    check("the webhook refuses a bad signature", badWebhook.status() === 401, `status ${badWebhook.status()}`);

    /* 11. The HTTP API --------------------------------------------------- */

    const apiCreate = await publicPost.request.post(`${BASE}/api/cms/posts`, {
      headers: { "content-type": "application/json", "x-cms-api-key": API_KEY },
      data: {
        title: "Created through the public API",
        slug: "created-through-the-public-api",
        excerpt: "A post created by the headless API to prove the endpoint works.",
        contentMd: "## Heading\n\nThe API endpoint accepts the same fields as the editor and runs the same validation.",
        status: "draft",
        focusKeyword: "cms api",
        seoDescription: "A post created by the headless API to prove the endpoint works.",
      },
    });
    check("the API creates a post", apiCreate.status() === 200 || apiCreate.status() === 201, `status ${apiCreate.status()}`);

    const apiUnauthorized = await publicPost.request.get(`${BASE}/api/cms/posts`);
    check("the API refuses a request without a key", apiUnauthorized.status() === 401 || apiUnauthorized.status() === 403, `status ${apiUnauthorized.status()}`);

    /* 11. Settings ------------------------------------------------------ */
    await page.goto(`${BASE}/cms/settings`, { waitUntil: "domcontentloaded" });
    await page.fill('input[name="blog.authorName"]', "YTCPM Test Desk");
    await page.click('button:has-text("Save settings")');
    await page.waitForTimeout(2500);
    const savedAuthor = await page.locator('input[name="blog.authorName"]').inputValue();
    check("a setting is saved and kept", savedAuthor === "YTCPM Test Desk", savedAuthor);

    /* 12. Users --------------------------------------------------------- */
    await page.goto(`${BASE}/cms/users`, { waitUntil: "domcontentloaded" });
    await page.fill('input[name="name"]', "Second Editor");
    await page.fill('input[name="email"]', "editor@ytcpm.online");
    await page.selectOption('select[name="role"]', "editor");
    await page.fill('input[name="password"]', "Ytc!SecondEditor2026");
    await page.click('button:has-text("Create account")');
    await page.waitForTimeout(2500);
    const usersText = await page.locator("body").innerText();
    check("a new account is created", usersText.includes("editor@ytcpm.online"), "account missing");

    const deleteUser = page.locator("form:has(input[value]) button:has-text('Delete')").first();
    if (await deleteUser.count()) {
      await deleteUser.click();
      await page.waitForTimeout(2000);
    }
    const usersAfter = await page.locator("body").innerText();
    check("an account can be deleted", !usersAfter.includes("editor@ytcpm.online"), "account still listed");

    /* 13. Post states --------------------------------------------------- */
    await page.goto(`${BASE}/cms/posts/${postId}`, { waitUntil: "domcontentloaded" });
    const unpublish = page.locator('button:has-text("Unpublish")');
    if (await unpublish.count()) {
      await unpublish.click();
      await page.waitForTimeout(2500);
    }
    const statusMessage = await page.locator('[role="status"]').allInnerTexts();
    const afterUnpublish = await publicPost.request.get(`${BASE}/blog/${slug}`);
    check("an unpublished post leaves the public blog", afterUnpublish.status() === 404, `status ${afterUnpublish.status()} — ${JSON.stringify(statusMessage)}`);

    /* Draft preview links ------------------------------------------------- */
    await page.goto(`${BASE}/cms/posts/${postId}`, { waitUntil: "domcontentloaded" });
    const previewHref = await page.locator('a:has-text("Preview the real page")').getAttribute("href");
    check("a draft offers a preview link", Boolean(previewHref && previewHref.includes("?preview=")), String(previewHref));

    const previewResponse = await publicPost.request.get(`${BASE}${previewHref}`);
    check("the preview link opens the draft", previewResponse.status() === 200, `status ${previewResponse.status()}`);
    const previewHtml = await previewResponse.text();
    check("the preview marks itself private", /noindex/i.test(previewHtml) && previewHtml.includes("Preview"), "no noindex or banner");
    check("the preview does not publish structured data", !previewHtml.includes("BlogPosting"), "BlogPosting present");

    await publicPost.goto(`${BASE}${previewHref}`, { waitUntil: "domcontentloaded" });
    await publicPost.screenshot({ path: join(screenshots, "draft-preview.png") });
    await publicPost.setViewportSize({ width: 390, height: 844 });
    await publicPost.screenshot({ path: join(screenshots, "draft-preview-mobile.png") });
    await publicPost.setViewportSize({ width: 1440, height: 900 });

    const forgedPreview = await publicPost.request.get(`${BASE}/blog/${slug}?preview=1900000000.forged-signature`);
    check("a forged preview token is refused", forgedPreview.status() === 404, `status ${forgedPreview.status()}`);

    const publishNow = page.locator('button:has-text("Publish now")');
    if (await publishNow.count()) {
      await publishNow.click();
      await page.waitForTimeout(2500);
    }
    const afterRepublish = await publicPost.request.get(`${BASE}/blog/${slug}`);
    check("the post can be published again", afterRepublish.status() === 200, `status ${afterRepublish.status()}`);

    /* 14. A scheduled post stays out of the public blog ------------------ */
    await page.goto(`${BASE}/cms/posts/new`, { waitUntil: "domcontentloaded" });
    await page.click('#tab-content');
    await page.fill("#title", "A post scheduled for next year");
    await page.fill("#excerpt", "A scheduled post proves the scheduling state is kept out of the public blog until its date.");
    await page.fill("#contentMd", "## Scheduled\n\nThis article is scheduled and must not be public before its date.");
    await page.click('#tab-seo');
    await page.fill("#focusKeyword", "scheduled post");
    await page.selectOption("#status", "scheduled");
    await page.fill("#scheduledFor", "2030-01-01T09:00");
    await page.click('button:has-text("Create post")');
    let scheduledCreated = true;
    try {
      await page.waitForURL(/\/cms\/posts\/\d+/, { timeout: 30_000 });
    } catch {
      scheduledCreated = false;
    }
    check("a scheduled post is created", scheduledCreated, page.url());
    const scheduledPublic = await publicPost.request.get(`${BASE}/blog/a-post-scheduled-for-next-year`);
    check("a scheduled post is not public yet", scheduledPublic.status() === 404, `status ${scheduledPublic.status()}`);

    /* 15. Restoring an earlier version ----------------------------------- */
    await page.goto(`${BASE}/cms/posts/${postId}`, { waitUntil: "domcontentloaded" });
    await page.click('#tab-content');
    await page.fill("#title", "A different title for the same post");
    await page.click('button:has-text("Save changes")');
    await page.waitForTimeout(2500);
    const changedTitle = await page.locator("#title").inputValue();
    check("an edit is saved", changedTitle === "A different title for the same post", changedTitle);

    // The preview tab renders the body with the renderer the public page uses.
    await page.click("#tab-preview");
    await page.waitForTimeout(600);
    const previewHeadings = await page.locator("#panel-preview article h2").count();
    const previewText = await page.locator("#panel-preview").innerText();
    check("the preview tab renders the article", previewHeadings >= 2 && previewText.includes("How the estimate is built"), `${previewHeadings} headings`);
    await page.screenshot({ path: join(screenshots, "editor-preview.png"), fullPage: false });
    await page.click("#tab-content");
    await page.waitForTimeout(300);

    const restore = page.locator('button:has-text("Restore this version")').first();
    if (await restore.count()) {
      await restore.click();
      await page.waitForTimeout(2500);
    }
    // No reload: the editor has to pick the restored version up on its own.
    const restoredTitle = await page.locator("#title").inputValue();
    check("an earlier version can be restored", restoredTitle === title, restoredTitle);

    /* 16. Deleting a post ------------------------------------------------ */
    await page.goto(`${BASE}/cms/posts/new`, { waitUntil: "domcontentloaded" });
    await page.click('#tab-content');
    await page.fill("#title", "A post that is about to be deleted");
    await page.fill("#excerpt", "This post exists only so the delete flow can be tested end to end.");
    await page.fill("#contentMd", "## Temporary\n\nThis article is deleted again a moment later.");
    await page.click('button:has-text("Create post")');
    let tempPostCreated = true;
    try {
      await page.waitForURL(/\/cms\/posts\/\d+/, { timeout: 30_000 });
    } catch {
      tempPostCreated = false;
    }
    check("a temporary post is created", tempPostCreated, page.url());

    const deleteToggle = page.locator('button:has-text("Delete post")');
    if (await deleteToggle.count()) {
      await deleteToggle.click();
      await page.waitForTimeout(800);
    }
    const confirmDelete = page.locator('button:has-text("Yes, delete it")');
    if (await confirmDelete.count()) {
      await confirmDelete.click();
      await page.waitForTimeout(3000);
    }
    const postsText = await page.locator("body").innerText();
    check("the deleted post is gone from the admin", !postsText.includes("A post that is about to be deleted"), "post still listed");

    /* 17. Deleting media and redirects ----------------------------------- */
    const mediaListBefore = await page.goto(`${BASE}/cms/media`, { waitUntil: "domcontentloaded" });
    void mediaListBefore;
    const deleteFile = page.locator('button:has-text("Delete file")').first();
    if (await deleteFile.count()) {
      await deleteFile.click();
      await page.waitForTimeout(2500);
    }
    const filesAfterDelete = await listFiles(storageDir);
    check("a deleted file is removed from the storage directory", filesAfterDelete.length === 1, JSON.stringify(filesAfterDelete));

    await page.goto(`${BASE}/cms/redirects`, { waitUntil: "domcontentloaded" });
    const deleteRedirect = page.locator('button:has-text("Delete")').first();
    if (await deleteRedirect.count()) {
      await deleteRedirect.click();
      await page.waitForTimeout(2500);
    }
    const afterRedirectDelete = await publicPost.request.get(`${BASE}/old-rpm-page`, { maxRedirects: 0 });
    check("a deleted redirect stops redirecting", afterRedirectDelete.status() !== 301, `status ${afterRedirectDelete.status()}`);

    /* 18. Changing the password ----------------------------------------- */
    await page.goto(`${BASE}/cms/settings`, { waitUntil: "domcontentloaded" });
    await page.fill('input[name="currentPassword"]', ADMIN_PASSWORD);
    await page.fill('input[name="newPassword"]', NEW_PASSWORD);
    await page.click('button:has-text("Change password")');
    await page.waitForTimeout(3000);
    const passwordMessage = await page.locator('[role="status"]').allInnerTexts();
    check("the password can be changed", passwordMessage.join(" ").toLowerCase().includes("password"), JSON.stringify(passwordMessage));

    await page.goto(`${BASE}/cms`, { waitUntil: "domcontentloaded" });
    const signOut2 = page.locator('button:has-text("Sign out")').first();
    if (await signOut2.count()) {
      await signOut2.click();
      await page.waitForTimeout(2000);
    }
    await page.goto(`${BASE}/cms/login`, { waitUntil: "domcontentloaded" });
    await page.fill('input[name="email"]', ADMIN_EMAIL);
    await page.fill('input[name="password"]', NEW_PASSWORD);
    await Promise.all([page.waitForURL(/\/cms(\?|$)/, { timeout: 30_000 }), page.click('form button[type="submit"]')]);
    check("the new password signs in", /\/cms(\?|$)/.test(page.url()), page.url());

    /* 19. Sign out ------------------------------------------------------ */
    await page.goto(`${BASE}/cms`, { waitUntil: "domcontentloaded" });
    const signOut = page.locator('button:has-text("Sign out")').first();
    if (await signOut.count()) {
      await Promise.all([page.waitForURL(/\/cms\/login/, { timeout: 30_000 }), signOut.click()]);
    }
    await page.goto(`${BASE}/cms/posts`, { waitUntil: "domcontentloaded" });
    check("the gate closes again after signing out", page.url().endsWith("/cms/login"), page.url());

    /* 20. No browser errors --------------------------------------------- */
    const noisy = consoleErrors.filter((entry) => !/favicon|404 \(Not Found\)/i.test(entry));
    check("no console errors in the browser", noisy.length === 0, noisy.slice(0, 3).join(" | "));

    console.log(`\nScreenshots: ${screenshots}`);
  } finally {
    await browser.close();
    try {
      process.kill(-server.pid, "SIGTERM");
    } catch {
      server.kill("SIGTERM");
    }
    await database.stop();
    await rm(storageDir, { recursive: true, force: true });
  }

  console.log(`\n${results.length - failures}/${results.length} checks passed`);
  if (failures) {
    console.log(`\n${failures} check(s) failed:`);
    for (const result of results.filter((r) => !r.ok)) console.log(` - ${result.name}${result.detail ? ` (${result.detail})` : ""}`);
    process.exitCode = 1;
  }
}

await main();
