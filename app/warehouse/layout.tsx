import { WarehouseFrame } from "@/components/warehouse/warehouse-frame";
import { canAccessProtectedPath, defaultPathForRole } from "@/lib/auth/access-control";
import { getCurrentAuthContext } from "@/services/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function WarehouseLayout({ children }: { children: React.ReactNode }) {
  const context = await getCurrentAuthContext();
  if (!context.userId) {
    redirect(`/login?next=${encodeURIComponent("/warehouse/dashboard")}`);
  }
  if (!context.role || !canAccessProtectedPath(context.role, "/warehouse")) {
    redirect(`${defaultPathForRole(context.role)}?access_status=forbidden&next=${encodeURIComponent("/warehouse/dashboard")}`);
  }
  return <WarehouseFrame>{children}</WarehouseFrame>;
}
