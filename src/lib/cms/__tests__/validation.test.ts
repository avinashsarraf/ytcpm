import { describe, expect, it } from "vitest";
import {
  asBool,
  asInt,
  asList,
  asOptionalString,
  asTrimmed,
  isEmail,
  isSafePath,
  LIMITS,
  normalizeTag,
  validatePassword,
  validatePostInput,
  validateRedirectInput,
  validateUserInput,
} from "@/lib/cms/validation";

function form(values: Record<string, string | boolean>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) {
    if (typeof value === "boolean") {
      if (value) data.set(key, "on");
    } else {
      data.set(key, value);
    }
  }
  return data;
}

describe("field readers", () => {
  it("trims and reads strings safely", () => {
    expect(asTrimmed("  x  ")).toBe("x");
    expect(asOptionalString("   ")).toBeNull();
    expect(asOptionalString(" y ")).toBe("y");
  });

  it("reads integers with a fallback", () => {
    expect(asInt("42")).toBe(42);
    expect(asInt("nope", 7)).toBe(7);
    expect(asInt(null, 3)).toBe(3);
  });

  it("reads booleans from the usual form values", () => {
    expect(asBool("on")).toBe(true);
    expect(asBool("true")).toBe(true);
    expect(asBool("1")).toBe(true);
    expect(asBool("off")).toBe(false);
    expect(asBool(null)).toBe(false);
  });

  it("splits a list, de-duplicates it and caps it", () => {
    expect(asList("a, b, a, c")).toEqual(["a", "b", "c"]);
    expect(asList("a\nb")).toEqual(["a", "b"]);
    expect(asList("", 5)).toEqual([]);
    expect(asList("a,b,c,d", 2)).toHaveLength(2);
  });
});

describe("email and path checks", () => {
  it("accepts a normal address", () => {
    expect(isEmail("editor@ytcpm.online")).toBe(true);
  });

  it("rejects an address without a domain", () => {
    expect(isEmail("editor@")).toBe(false);
    expect(isEmail("editor")).toBe(false);
    expect(isEmail("a b@example.com")).toBe(false);
  });

  it("only accepts safe redirect paths", () => {
    expect(isSafePath("/old-page")).toBe(true);
    expect(isSafePath("//evil.example.com")).toBe(false);
    expect(isSafePath("old-page")).toBe(false);
    expect(isSafePath("/../etc/passwd")).toBe(false);
    expect(isSafePath("/a\\b")).toBe(false);
  });
});

describe("validatePassword", () => {
  it("requires a minimum length", () => {
    expect(validatePassword("short")).toContain("at least");
  });

  it("requires a mix of character classes", () => {
    expect(validatePassword("alllowercasepassword")).toContain("Mix");
    expect(validatePassword("Str0ng-Passphrase!")).toBeNull();
  });

  it("rejects a password that is too long", () => {
    expect(validatePassword("A1!".repeat(100))).toContain("at most");
  });
});

describe("normalizeTag", () => {
  it("turns a label into a URL-safe token", () => {
    expect(normalizeTag("CPM & RPM")).toBe("cpm-rpm");
    expect(normalizeTag("  Shorts  ")).toBe("shorts");
    expect(normalizeTag("")).toBe("");
  });
});

describe("validatePostInput", () => {
  const valid = {
    title: "YouTube CPM vs RPM explained",
    slug: "youtube-cpm-vs-rpm",
    contentMd: "## A heading\n\nSome body text.",
    status: "draft",
  };

  it("accepts a well-formed post", () => {
    const result = validatePostInput(form(valid));
    expect(result.ok).toBe(true);
  });

  it("requires a title and a body", () => {
    const result = validatePostInput(form({ ...valid, title: "", contentMd: "" }));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.title).toBeTruthy();
      expect(result.errors.contentMd).toBeTruthy();
    }
  });

  it("rejects a slug with uppercase or spaces", () => {
    const result = validatePostInput(form({ ...valid, slug: "Not A Slug" }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.slug).toBeTruthy();
  });

  it("rejects an unknown status", () => {
    const result = validatePostInput(form({ ...valid, status: "pending-review" }));
    expect(result.ok).toBe(false);
  });

  it("requires a publish date for a scheduled post", () => {
    const result = validatePostInput(form({ ...valid, status: "scheduled" }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.scheduledFor).toBeTruthy();
  });

  it("rejects a canonical URL that is not absolute", () => {
    const result = validatePostInput(form({ ...valid, canonicalUrl: "/blog/x" }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.canonicalUrl).toBeTruthy();
  });

  it("normalises the tags it stores", () => {
    const result = validatePostInput(form({ ...valid, tags: "CPM & RPM, shorts" }));
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.tags).toEqual(["cpm-rpm", "shorts"]);
  });

  it("keeps the body inside the size limit", () => {
    const result = validatePostInput(form({ ...valid, contentMd: "x".repeat(LIMITS.content + 1) }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.contentMd).toBeTruthy();
  });
});

describe("validateUserInput", () => {
  it("requires a password for a new account", () => {
    const result = validateUserInput(form({ name: "Editor", email: "editor@ytcpm.online", role: "editor" }), { requirePassword: true });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.password).toBeTruthy();
  });

  it("allows an existing account to keep its password", () => {
    const result = validateUserInput(form({ name: "Editor", email: "editor@ytcpm.online", role: "editor" }), { requirePassword: false });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.password).toBeNull();
  });

  it("rejects an invalid email address", () => {
    const result = validateUserInput(form({ name: "Editor", email: "nope", role: "editor", password: "Str0ng-Passphrase!" }), { requirePassword: true });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.email).toBeTruthy();
  });

  it("lower-cases the email address", () => {
    const result = validateUserInput(form({ name: "Editor", email: "Editor@YTCPM.online", role: "admin", password: "Str0ng-Passphrase!" }), { requirePassword: true });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.email).toBe("editor@ytcpm.online");
  });
});

describe("validateRedirectInput", () => {
  it("accepts a normal redirect", () => {
    const result = validateRedirectInput(form({ fromPath: "/old", toPath: "/new", statusCode: "301", isActive: "on" }));
    expect(result.ok).toBe(true);
  });

  it("accepts an absolute destination", () => {
    const result = validateRedirectInput(form({ fromPath: "/old", toPath: "https://ytcpm.online/new", statusCode: "301" }));
    expect(result.ok).toBe(true);
  });

  it("rejects an unsafe source path", () => {
    const result = validateRedirectInput(form({ fromPath: "//evil.example.com", toPath: "/new", statusCode: "301" }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.fromPath).toBeTruthy();
  });

  it("rejects an unsupported status code", () => {
    const result = validateRedirectInput(form({ fromPath: "/old", toPath: "/new", statusCode: "418" }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.statusCode).toBeTruthy();
  });
});
