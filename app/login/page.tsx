import Link from "next/link";
import { redirect } from "next/navigation";
import { MithronBrandMark } from "@/components/brand/mithron-brand-mark";
import styles from "./login.module.css";
import { mapAuthPageNotice } from "@/lib/auth/client-errors";
import { resolveGuestPostAuthRedirect, resolveLoginPageRedirect } from "@/lib/auth/post-auth-redirect";
import { getAuthProviderAvailability } from "@/lib/auth/provider-registry";
import { buildAuthAuditClientToken } from "@/lib/auth-audit-client";
import { createClient } from "@/lib/server";
import { LoginFormClient } from "./login-form-client";

type LoginPageProps = {
  searchParams: Promise<{
    next?: string;
    auth_status?: string;
    admin_status?: string;
    access_status?: string;
    auth_error?: string;
    logout_status?: string;
    logout_reason?: string;
    logout_notice?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;

  if (user) {
    const { data: role } = await supabase.rpc("current_enterprise_role");
    if (role) {
      redirect(resolveLoginPageRedirect({
        user,
        role,
        nextPath: params.next ?? ""
      }));
    }

    redirect(resolveGuestPostAuthRedirect(params.next ?? ""));
  }

  const auditToken = buildAuthAuditClientToken();
  const providers = getAuthProviderAvailability();
  const notice = mapAuthPageNotice(params);

  return (
    <main className={styles.authGateway} data-testid="login-auth-gateway">
      <section className={styles.authShell} aria-labelledby="mithron-login-title">
        <div className={styles.brandPanel}>
          <div className={styles.brandMark} aria-label="Mithron">
            <MithronBrandMark className={styles.brandMarkImage} priority />
          </div>

          <div className={styles.brandContent}>
            <h1 className={styles.brandTitle}>Mithron</h1>
            <p className={styles.brandCopy}>
              Google sign-in for shoppers. Email sign-in for team accounts.
            </p>
          </div>

          <p className={styles.brandFootnote}>
            Need an account?{" "}
            <Link href="/signup" className={styles.brandLink}>Request access</Link>
          </p>
        </div>

        <div className={styles.formPanel}>
          <div className={styles.formStack}>
            <header className={styles.formHeader}>
              <h2 className={styles.formTitle} id="mithron-login-title">Sign in</h2>
              <p className={styles.formCopy}>Guests use Google. Authorized users use email and password.</p>
            </header>

            {notice ? (
              <p
                className={notice.tone === "error" ? styles.pageAlert : `${styles.pageAlert} ${styles.neutralAlert}`}
                role={notice.tone === "error" ? "alert" : "status"}
              >
                {notice.message}
              </p>
            ) : null}

            <LoginFormClient
              nextPath={params.next ?? ""}
              auditToken={auditToken}
              providers={providers}
            />
          </div>
        </div>
      </section>
    </main>
  );
}
