import Image from "next/image"
import Link from "next/link"

import { cn } from "@lib/utils"

type LogoProps = {
  href?: string
  className?: string
  /** Use the white wordmark for dark surfaces (e.g. the footer). */
  variant?: "normal" | "white"
}

/** MediNex+ wordmark (provided asset in /public). The white variant is used on dark surfaces. */
export function Logo({ href = "/", className, variant = "normal" }: LogoProps) {
  return (
    <Link href={href} className={cn("inline-flex items-center", className)} aria-label="MediNex+ home">
      <Image
        src={variant === "white" ? "/medinexplus-logo-white.png" : "/medinexplus-logo-normal.png"}
        alt="MediNex+"
        width={1045}
        height={199}
        priority
        className="h-9 w-auto"
      />
    </Link>
  )
}
