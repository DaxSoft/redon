import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/utils";

const badgeVariants = cva(
  "badge inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2",
  {
    variants: {
      tone: {
        success: "badge-success",
        info: "badge-info",
        warning: "badge-warning",
        danger: "badge-danger",
        muted: "badge-muted"
      }
    },
    defaultVariants: {
      tone: "muted"
    }
  }
);

export type BadgeTone = "success" | "info" | "warning" | "danger" | "muted";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {
  readonly tone?: BadgeTone;
}

export function Badge({ className, tone, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ tone }), className)} {...props} />;
}
