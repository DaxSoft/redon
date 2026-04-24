import type { ReactNode } from "react";

export interface ButtonProps {
  readonly children?: ReactNode;
  readonly icon?: ReactNode;
  readonly ariaLabel?: string;
}

export function Button({ children, icon, ariaLabel }: ButtonProps) {
  return (
    <button aria-label={ariaLabel} className="ui-button" type="button">
      {icon}
      {children !== undefined ? <span>{children}</span> : null}
    </button>
  );
}
