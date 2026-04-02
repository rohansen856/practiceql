"use client"

import * as ResizablePrimitive from "react-resizable-panels"

import { cn } from "@/lib/utils"

type ResizablePanelGroupProps = Omit<ResizablePrimitive.GroupProps, "orientation"> & {
  /**
   * Layout direction of the panel group. Mapped to the underlying library's
   * `orientation` prop for compatibility with the shadcn-style API.
   */
  direction?: ResizablePrimitive.Orientation
  orientation?: ResizablePrimitive.Orientation
}

function ResizablePanelGroup({
  className,
  direction,
  orientation,
  ...props
}: ResizablePanelGroupProps) {
  return (
    <ResizablePrimitive.Group
      data-slot="resizable-panel-group"
      className={cn(
        "flex h-full w-full aria-[orientation=vertical]:flex-col",
        className
      )}
      orientation={orientation ?? direction}
      {...props}
    />
  )
}

// react-resizable-panels v4 interprets bare numbers as **pixels** and
// bare strings as **percentages** ("22" === "22%"). shadcn / this codebase
// have always passed numbers expecting percentages, so normalize here.
function toPercent(
  size: number | string | undefined
): number | string | undefined {
  if (typeof size === "number") return `${size}%`
  return size
}

function ResizablePanel({
  defaultSize,
  minSize,
  maxSize,
  collapsedSize,
  ...props
}: ResizablePrimitive.PanelProps) {
  return (
    <ResizablePrimitive.Panel
      data-slot="resizable-panel"
      defaultSize={toPercent(defaultSize)}
      minSize={toPercent(minSize)}
      maxSize={toPercent(maxSize)}
      collapsedSize={toPercent(collapsedSize)}
      {...props}
    />
  )
}

function ResizableHandle({
  withHandle,
  className,
  ...props
}: ResizablePrimitive.SeparatorProps & {
  withHandle?: boolean
}) {
  return (
    <ResizablePrimitive.Separator
      data-slot="resizable-handle"
      className={cn(
        // Base: visible 1px line, generous 9px hit area via ::after, hover tint
        "group/handle relative flex w-px items-center justify-center bg-border transition-colors",
        "hover:bg-primary/50 data-[separator=active]:bg-primary data-[separator=hover]:bg-primary/50 data-[separator=focus]:bg-primary/50",
        "after:absolute after:inset-y-0 after:left-1/2 after:w-[9px] after:-translate-x-1/2 after:content-['']",
        "cursor-col-resize focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
        // Horizontal group (vertical split): flip everything
        "aria-[orientation=horizontal]:h-px aria-[orientation=horizontal]:w-full aria-[orientation=horizontal]:cursor-row-resize",
        "aria-[orientation=horizontal]:after:left-0 aria-[orientation=horizontal]:after:h-[9px] aria-[orientation=horizontal]:after:w-full",
        "aria-[orientation=horizontal]:after:translate-x-0 aria-[orientation=horizontal]:after:-translate-y-1/2",
        "[&[aria-orientation=horizontal]>div]:rotate-90",
        className
      )}
      {...props}
    >
      {withHandle && (
        <div className="z-10 flex h-8 w-1.5 shrink-0 items-center justify-center rounded-full border bg-background shadow-sm transition-colors group-hover/handle:border-primary/60 group-hover/handle:bg-primary/10" />
      )}
    </ResizablePrimitive.Separator>
  )
}

export { ResizableHandle, ResizablePanel, ResizablePanelGroup }
