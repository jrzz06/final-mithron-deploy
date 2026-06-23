import { Suspense } from "react";
import { HeroCarouselDynamic } from "@/sections/home/hero-carousel-dynamic";
import { CmsStorefrontSurface } from "@/components/home/cms-storefront-surface";
import { HomeLandingComposite } from "@/sections/home/home-landing-composite";
import { getPublicCmsSnapshot } from "@/services/cms";
import { getHomepageCmsContent } from "@/services/homepage-cms";
import { getHomepageProducts } from "@/services/catalog";

// ISR: 60-second fallback TTL. CMS publish actions call revalidatePath("/")
// + revalidateTag("cms","max") to bust both the page cache and Data Cache
// immediately, so live changes appear on the next request after publish.
export const revalidate = 60;

function HomeBelowHeroFallback() {
  return <div className="min-h-[40vh] animate-pulse bg-[#eef0f3]" aria-hidden="true" />;
}

export default async function HomePage() {
  const [cms, products, homepageCms] = await Promise.all([
    getPublicCmsSnapshot(),
    getHomepageProducts(),
    getHomepageCmsContent()
  ]);

  return (
    <>
      <HeroCarouselDynamic slides={cms.home.heroBanners} cmsSectionKey="hero" />
      <Suspense fallback={<HomeBelowHeroFallback />}>
        <CmsStorefrontSurface
          promotionalCampaigns={cms.promotionalCampaigns}
          trustCards={cms.trustCards}
        />
        <HomeLandingComposite
          products={products}
          productReviews={cms.productSupport.reviews}
          footer={cms.footer}
          homepageCms={homepageCms}
        />
      </Suspense>
    </>
  );
}
