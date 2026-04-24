import type { ReactNode } from "react";

export interface CommandInputProps {
  readonly icon?: ReactNode;
  readonly placeholder: string;
}

export function CommandInput({ icon, placeholder }: CommandInputProps) {
  return (
    <label className="command-input">
      {icon}
      <input aria-label={placeholder} placeholder={placeholder} />
    </label>
  );
}
