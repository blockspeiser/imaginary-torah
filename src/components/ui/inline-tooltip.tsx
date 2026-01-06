import { type ReactNode } from "react"

import { cn } from "@/lib/utils"

type InlineTooltipProps = {
  label: string
  children: ReactNode
  placement?: "top" | "bottom"
  tone?: "neutral" | "rose" | "blue"
  className?: string
}

export function InlineTooltip({
  label,
  children,
  placement = "bottom",
  tone = "neutral",
  className,
}: InlineTooltipProps) {
  const toneClasses =
    tone === "rose"
      ? "bg-rose-50 text-rose-800 ring-rose-200"
      : tone === "blue"
        ? "bg-blue-50 text-blue-800 ring-blue-200"
        : "bg-zinc-50 text-zinc-700 ring-zinc-200"

  return (
    <span className={cn("relative inline-flex", "group", className)}>
      {children}
      <span
        role="tooltip"
        className={cn(
          "pointer-events-none absolute left-1/2 z-50",
          "-translate-x-1/2",
          placement === "top" ? "bottom-full mb-3" : "top-full mt-3",
          placement === "top" ? "opacity-0 translate-y-[-2px]" : "opacity-0 translate-y-[2px]",
          placement === "top"
            ? "group-hover:opacity-100 group-hover:translate-y-0 group-focus-within:opacity-100 group-focus-within:translate-y-0"
            : "group-hover:opacity-100 group-hover:translate-y-0 group-focus-within:opacity-100 group-focus-within:translate-y-0",
          "transition duration-75",
          "whitespace-nowrap",
          "rounded-md px-3 py-2 text-sm",
          "ring-1",
          toneClasses
        )}
      >
        {label}
      </span>
    </span>
  )
}
