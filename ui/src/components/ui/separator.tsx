"use client";

import * as React from "react";
import { cn } from "./utils";

type Orientation = "horizontal" | "vertical";

function Separator({
  className,
  orientation = "horizontal",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { orientation?: Orientation }) {
  return (
    <div
      role="separator"
      aria-orientation={orientation}
      data-slot="separator-root"
      className={cn(
        "bg-border shrink-0 data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-px",
        orientation === "horizontal" ? "h-px w-full" : "h-full w-px",
        className,
      )}
      {...props}
    />
  );
}

export { Separator };
