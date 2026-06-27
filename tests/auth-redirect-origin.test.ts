import { describe, expect, it } from "vitest";
import {
  buildAuthCallbackUrl,
  buildPasswordResetUrl,
  resolveAuthRedirectUrlFromRequest,
  resolveRequestOrigin
} from "@/lib/auth/request-origin";
import { resolveClientAuthRedirectPath } from "@/lib/auth/redirects";
import {
  getSiteOrigin,
  hasConfiguredSiteUrl,
  isObsoleteAppHost,
  sanitizeAppOrigin
} from "@/lib/site-url";

describe("auth redirect origin resolution", () => {
  it("rejects obsolete deployment hosts", () => {
    expect(isObsoleteAppHost("final-mithron-deploy.vercel.app")).toBe(true);
    expect(sanitizeAppOrigin("https://final-mithron-deploy.vercel.app")).toBeNull();
    expect(
      getSiteOrigin({
        NEXT_PUBLIC_SITE_URL: "https://final-mithron-deploy.vercel.app",
        VERCEL_PROJECT_PRODUCTION_URL: "mithron-flight-systems-kbkbkh.vercel.app"
      })
    ).toBe("https://mithron-flight-systems-kbkbkh.vercel.app");
  });

  it("prefers the active Vercel production URL over stale env values", () => {
    expect(
      getSiteOrigin({
        VERCEL_PROJECT_PRODUCTION_URL: "mithron-flight-systems-kbkbkh.vercel.app",
        NEXT_PUBLIC_SITE_URL: "https://final-mithron-deploy.vercel.app"
      })
    ).toBe("https://mithron-flight-systems-kbkbkh.vercel.app");
  });

  it("resolves auth callback URLs from the incoming request origin", () => {
    const request = new Request("https://mithron-flight-systems-kbkbkh.vercel.app/login", {
      headers: {
        host: "mithron-flight-systems-kbkbkh.vercel.app",
        "x-forwarded-host": "mithron-flight-systems-kbkbkh.vercel.app",
        "x-forwarded-proto": "https"
      }
    });

    expect(resolveRequestOrigin(request)).toBe("https://mithron-flight-systems-kbkbkh.vercel.app");
    expect(buildAuthCallbackUrl(resolveRequestOrigin(request), "/warehouse")).toBe(
      "https://mithron-flight-systems-kbkbkh.vercel.app/auth/callback?next=%2Fwarehouse"
    );
    expect(buildPasswordResetUrl(resolveRequestOrigin(request))).toBe(
      "https://mithron-flight-systems-kbkbkh.vercel.app/reset-password"
    );
  });

  it("falls back to request origin when client redirect targets an obsolete host", () => {
    const request = new Request("https://mithron-flight-systems-kbkbkh.vercel.app/api/auth/signup", {
      headers: {
        host: "mithron-flight-systems-kbkbkh.vercel.app",
        "x-forwarded-proto": "https"
      }
    });

    expect(
      resolveAuthRedirectUrlFromRequest(request, {
        clientRedirectTo: "https://final-mithron-deploy.vercel.app/auth/callback?next=/onboarding",
        defaultPath: "/auth/callback",
        defaultNext: "/onboarding"
      })
    ).toBe("https://mithron-flight-systems-kbkbkh.vercel.app/auth/callback?next=%2Fonboarding");
  });

  it("only allows relative client redirects after login", () => {
    expect(resolveClientAuthRedirectPath("/warehouse")).toBe("/warehouse");
    expect(resolveClientAuthRedirectPath("https://final-mithron-deploy.vercel.app/admin")).toBe("/account");
    expect(resolveClientAuthRedirectPath("//evil.example/admin")).toBe("/account");
  });

  it("accepts Vercel deployment URLs as configured site URLs", () => {
    expect(
      hasConfiguredSiteUrl({
        VERCEL_PROJECT_PRODUCTION_URL: "mithron-flight-systems-kbkbkh.vercel.app"
      })
    ).toBe(true);
  });
});
