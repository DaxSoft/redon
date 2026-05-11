import * as React from "react";
import { cn } from "../lib/utils";

export interface PanelProps extends React.HTMLAttributes<HTMLElement> {}

export function Panel({ children, className, ...props }: PanelProps) {
  return (
    <section className={cn("panel", className)} {...props}>
      {children}
    </section>
  );
}
