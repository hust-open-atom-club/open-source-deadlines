import * as React from "react"
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area"

import { cn } from "@/lib/utils"

// 扩展 ScrollArea 组件，允许通过 viewportRef props 传递 ref 到 Viewport 元素
interface ScrollAreaProps extends React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root> {
  viewportRef?: React.Ref<HTMLDivElement>;
}

const ScrollArea = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.Root>,
  ScrollAreaProps
>(({ className, children, viewportRef, ...props }, ref) => (
  <ScrollAreaPrimitive.Root
    ref={ref}
    className={cn("relative", className)}
    {...props}
  >
    {/* 允许外部通过 viewportRef 获取 Viewport DOM 元素，实现溢出检测和自动滚动等功能 */}
    <ScrollAreaPrimitive.Viewport ref={viewportRef} className="h-full w-full rounded-[inherit]">
      {children}
    </ScrollAreaPrimitive.Viewport>
    <ScrollBar orientation="horizontal" />
    <ScrollAreaPrimitive.Corner />
  </ScrollAreaPrimitive.Root>
))
ScrollArea.displayName = ScrollAreaPrimitive.Root.displayName

const ScrollBar = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.Scrollbar>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Scrollbar>
>(({ className, orientation = "vertical", ...props }, ref) => (
  orientation === "horizontal" ? (
    <ScrollAreaPrimitive.Scrollbar
      ref={ref}
      orientation={orientation}
      className={cn(
        "flex touch-none select-none transition-colors",
        "h-2.5 flex-col border-t border-t-transparent p-[1px]",
        className
      )}
      {...props}
    >
      <ScrollAreaPrimitive.Thumb className="relative flex-1 rounded-full bg-border" />
    </ScrollAreaPrimitive.Scrollbar>
  ) : null
))
ScrollBar.displayName = ScrollAreaPrimitive.Scrollbar.displayName

export { ScrollArea, ScrollBar } 