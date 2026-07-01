import Image from "next/image";
import Link from "next/link";
import { cn } from "@/shared/lib/utils";

type LogoProps = {
  variant?: "icon" | "full";
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  href?: string;
};

const iconSizes = {
  xs: "h-7 w-7",
  sm: "h-8 w-8",
  md: "h-9 w-9",
  lg: "h-12 w-12",
  xl: "h-16 w-16",
};

const fullSizes = {
  xs: "h-8",
  sm: "h-9",
  md: "h-10",
  lg: "h-12",
  xl: "h-16",
};

export default function Logo({ variant = "icon", size = "md", className, href }: LogoProps) {
  const image =
    variant === "full" ? (
      <Image
        src="/medha-sync-logo.svg"
        alt="Medha Sync — All your messages, synced"
        width={680}
        height={280}
        className={cn("w-auto", fullSizes[size], className)}
        priority
      />
    ) : (
      <Image
        src="/medha-sync-icon.svg"
        alt="Medha Sync"
        width={280}
        height={280}
        className={cn(iconSizes[size], className)}
        priority
      />
    );

  if (href) {
    return (
      <Link href={href} className="inline-flex shrink-0 items-center">
        {image}
      </Link>
    );
  }

  return image;
}
