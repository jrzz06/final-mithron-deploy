import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { GUEST_AUTH_HOME, resolveGuestPostAuthRedirect } from "@/lib/auth/guest-auth";
import { resolveLoginPageRedirect } from "@/lib/auth/post-auth-redirect";

const root = process.cwd();

function source(path: string) {
  return readFileSync(join(root, path), "utf8");
}

describe("guest auth workflow", () => {
  it("sends storefront guests to the homepage by default", () => {
    expect(resolveGuestPostAuthRedirect("")).toBe(GUEST_AUTH_HOME);
    expect(resolveGuestPostAuthRedirect("/login")).toBe(GUEST_AUTH_HOME);
    expect(resolveGuestPostAuthRedirect("/admin")).toBe(GUEST_AUTH_HOME);
    expect(resolveGuestPostAuthRedirect("/checkout")).toBe("/checkout");
  });

  it("keeps signed-in guests off the login page", () => {
    expect(resolveLoginPageRedirect({
      user: { id: "u1", app_metadata: {}, user_metadata: {}, aud: "", created_at: "" },
      role: "user",
      nextPath: ""
    })).toBe("/");
  });

  it("wires google oauth through supabase on the login form and callback", () => {
    const form = source("app/login/login-form.tsx");
    const callbackRoute = source("app/auth/callback/route.ts");

    expect(form).toContain("signInWithOAuth");
    expect(form).toContain('provider: "google"');
    expect(form).toContain("/auth/callback");
    expect(form).toContain("auth_error");
    expect(form).toContain("GUEST_AUTH_HOME");
    expect(form).toContain("login-guest-account");
    expect(callbackRoute).toContain("exchangeCodeForSession");
    expect(callbackRoute).toContain("resolveLoginPageRedirect");
  });

  it("shows the google customer name on the account hub", () => {
    const accountPage = source("app/(storefront)/account/page.tsx");
    expect(accountPage).toContain("display_name");
    expect(accountPage).toContain("customerName");
  });

  it("collects profile fields needed for enquiries", () => {
    const profilePage = source("app/(storefront)/account/profile/page.tsx");
    const contactPage = source("app/(storefront)/contact/page.tsx");
    const enquiryForm = source("components/contact/enquiry-form.tsx");

    expect(profilePage).toContain("Account email");
    expect(profilePage).toContain("pre-fill enquiry forms");
    expect(contactPage).toContain("defaultPhone");
    expect(enquiryForm).toContain("defaultPhone");
  });
});
