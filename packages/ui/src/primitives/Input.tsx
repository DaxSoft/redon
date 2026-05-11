import * as React from "react";
import { cn } from "../lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type, ...props }, ref) => {
  return <input ref={ref} type={type} className={cn("ui-input h-9 w-full rounded-md border px-3 py-1 text-sm", className)} {...props} />;
});

Input.displayName = "Input";
