import type { ReactNode } from "react";
import { SiteFooter } from "@/components/layout/site-footer";
import { StoreShellClient } from "@/components/layout/store-shell-client";
import type { FooterContent } from "@/config/storefront-content";
import type { EnterpriseMenuConfig } from "@/lib/nav-menu-types";
import type { NavigationNode } from "@/config/types";

export function StoreShell({
  children,
  navigationItems,
  enterpriseMenuConfigs,
  footer
}: {
  children: ReactNode;
  navigationItems: NavigationNode[];
  enterpriseMenuConfigs: EnterpriseMenuConfig[];
  footer: FooterContent;
}) {
  return (
    <StoreShellClient
      navigationItems={navigationItems}
      enterpriseMenuConfigs={enterpriseMenuConfigs}
      siteFooter={<SiteFooter content={footer} />}
    >
      {children}
    </StoreShellClient>
  );
}
