import type { ReactNode } from "react";
import { Input } from "./Input";

export interface CommandInputProps {
  readonly icon?: ReactNode;
  readonly placeholder: string;
}

export function CommandInput({ icon, placeholder }: CommandInputProps) {
  return (
    <label className="command-input">
      {icon}
      <Input aria-label={placeholder} placeholder={placeholder} />
    </label>
  );
}
