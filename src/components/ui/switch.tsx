"use client"

import * as React from "react"
import * as SwitchPrimitive from "@radix-ui/react-switch"

import { cn } from "@/lib/utils"

/**
 * iOS UISwitch-style toggle.
 * - 51×31px track (rounded pill)
 * - 27px circular thumb with soft shadow
 * - On: iOS green (#34C759 via --k-color-green)
 * - Off: neutral fill
 * - 200ms spring transition
 */
function Switch({
  className,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        "peer relative inline-flex h-[31px] w-[51px] shrink-0 cursor-pointer items-center rounded-full outline-none",
        "transition-colors duration-200",
        "data-[state=checked]:bg-[var(--k-color-green)]",
        "data-[state=unchecked]:bg-[var(--k-fill-3)]",
        "focus-visible:ring-2 focus-visible:ring-[var(--k-color-coral)]/40 focus-visible:ring-offset-0",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      style={{
        transitionTimingFunction: "cubic-bezier(0.32, 0.72, 0, 1)",
      }}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          "pointer-events-none block h-[27px] w-[27px] rounded-full bg-white",
          "transition-transform duration-200",
          "data-[state=checked]:translate-x-[22px] data-[state=unchecked]:translate-x-[2px]"
        )}
        style={{
          boxShadow: "0 3px 8px rgba(0,0,0,0.15), 0 1px 2px rgba(0,0,0,0.08), 0 3px 1px rgba(0,0,0,0.06)",
          transitionTimingFunction: "cubic-bezier(0.32, 0.72, 0, 1)",
        }}
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
