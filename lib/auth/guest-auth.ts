import { isAdminProtectedPath, isControlPanelPath } from "@/lib/auth/access-control";
import { getSafeAuthRedirectPath } from "@/lib/auth/redirects";

export const GUEST_AUTH_HOME = "/";

/** Storefront customers (Google OAuth) land on the homepage unless a safe storefront path was requested. */
export function resolveGuestPostAuthRedirect(nextPath: string) {
  const requested = getSafeAuthRedirectPath(nextPath, "");
  if (!requested || requested === "/login") return GUEST_AUTH_HOME;
  if (isAdminProtectedPath(requested) || isControlPanelPath(requested)) return GUEST_AUTH_HOME;
  return requested;
}

export function isGuestStorefrontNextPath(nextPath: string) {
  const requested = getSafeAuthRedirectPath(nextPath, "");
  if (!requested || requested === "/login") return false;
  return !isAdminProtectedPath(requested) && !isControlPanelPath(requested);
}
