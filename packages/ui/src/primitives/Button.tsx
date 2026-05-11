import type { ReactNode } from "react";
import type { ButtonHTMLAttributes } from "react";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly children?: ReactNode;
  readonly icon?: ReactNode;
  readonly ariaLabel?: string;
}

export function Button({ children, icon, ariaLabel, type, ...props }: ButtonProps) {
  return (
    <button aria-label={ariaLabel} className="ui-button" type={type ?? "button"} {...props}>
      {icon}
      {children !== undefined ? <span>{children}</span> : null}
    </button>
  );
}
