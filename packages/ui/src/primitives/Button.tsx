import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/utils";

const buttonVariants = cva(
  "ui-button inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-1 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "",
        destructive: "",
        outline: "",
        secondary: "",
        ghost: "",
        link: ""
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  readonly asChild?: boolean;
  readonly icon?: React.ReactNode;
  readonly ariaLabel?: string;
}

export function Button({ className, variant, size, asChild = false, icon, ariaLabel, children, type, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp aria-label={ariaLabel} className={cn(buttonVariants({ variant, size, className }))} type={type ?? "button"} {...props}>
      {icon}
      {children !== undefined ? <span>{children}</span> : null}
    </Comp>
  );
}
