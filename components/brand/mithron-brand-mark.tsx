import Image from "next/image";
import { resolveBrandMarkSrc } from "@/lib/media/brand-mark";

type MithronBrandMarkProps = {
  className?: string;
  priority?: boolean;
};

export function MithronBrandMark({
  className = "mithron-brand-mark relative inline-flex h-[22px] w-auto max-w-[108px] shrink-0 items-center md:h-[26px] md:max-w-[128px]",
  priority = false
}: MithronBrandMarkProps) {
  const src = resolveBrandMarkSrc();

  return (
    <span aria-hidden="true" className={className}>
      <Image
        src={src}
        alt="Mithron"
        width={925}
        height={111}
        className="block h-full w-auto max-w-full object-contain object-left"
        priority={priority}
        unoptimized
      />
    </span>
  );
}
