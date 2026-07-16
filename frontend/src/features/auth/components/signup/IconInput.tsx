import * as React from "react"
import type { LucideIcon } from "lucide-react"

import { cn } from "@lib/utils"
import { Input } from "@components/ui/input"

type Props = React.ComponentProps<typeof Input> & { icon: LucideIcon }

/** Auth text input with a trailing icon (matches the signup design). */
export function IconInput({ icon: Icon, className, ...props }: Props) {
  return (
    <div className="relative">
      <Input className={cn("h-10 bg-muted/50 pr-10", className)} {...props} />
      <Icon className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  )
}
