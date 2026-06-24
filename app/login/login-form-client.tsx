"use client";

import { LoginForm } from "./login-form";
import type { AuthProviderAvailability } from "@/lib/auth/provider-registry";

export function LoginFormClient({
  nextPath,
  auditToken,
  providers
}: {
  nextPath: string;
  auditToken?: string | null;
  providers: AuthProviderAvailability;
}) {
  return (
    <LoginForm
      nextPath={nextPath}
      auditToken={auditToken}
      providers={providers}
    />
  );
}
