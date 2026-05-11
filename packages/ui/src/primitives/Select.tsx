import { ChevronDown } from "lucide-react";
import type { SelectHTMLAttributes } from "react";

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  readonly ariaLabel?: string;
}

export function Select({ ariaLabel, className, children, ...props }: SelectProps) {
  return (
    <span className={`ui-select${className ? ` ${className}` : ""}`}>
      <select aria-label={ariaLabel} {...props}>
        {children}
      </select>
      <ChevronDown aria-hidden size={14} />
    </span>
  );
}
