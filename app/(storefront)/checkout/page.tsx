import { Suspense } from "react";
import { buildAuthAuditClientToken } from "@/lib/auth-audit-client";
import { CheckoutPageClient } from "./checkout-page-client";
import CheckoutLoading from "./loading";

export default function CheckoutPage() {
  const auditToken = buildAuthAuditClientToken();

  return (
    <Suspense fallback={<CheckoutLoading />}>
      <CheckoutPageClient auditToken={auditToken} />
    </Suspense>
  );
}
