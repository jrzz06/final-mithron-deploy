import { normalizeCmsRole } from "@/lib/auth/access-control";
import { resolveGuestPostAuthRedirect } from "@/lib/auth/guest-auth";
import { getRoleAwareAuthRedirectPath } from "@/lib/auth/redirects";
import { adminUserNeedsMfaEnrollment, getAdminMfaRedirectPath } from "@/lib/auth/admin-mfa";
import type { User } from "@supabase/supabase-js";

export function resolvePostAuthRedirect(input: {
  user: User;
  role: string;
  nextPath: string;
}) {
  if (adminUserNeedsMfaEnrollment(input.user)) {
    return getAdminMfaRedirectPath(getRoleAwareAuthRedirectPath(input.nextPath, input.role));
  }

  return getRoleAwareAuthRedirectPath(input.nextPath, input.role);
}

/** Already signed-in visitors hitting /login: guests go home, staff go to their workspace. */
export function resolveLoginPageRedirect(input: {
  user: User;
  role: string;
  nextPath: string;
}) {
  const role = normalizeCmsRole(input.role);
  if (!role || role === "user") {
    return resolveGuestPostAuthRedirect(input.nextPath);
  }

  return resolvePostAuthRedirect(input);
}

export { resolveGuestPostAuthRedirect, GUEST_AUTH_HOME } from "@/lib/auth/guest-auth";
