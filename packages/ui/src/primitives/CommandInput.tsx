import type { ChangeEventHandler, ReactNode } from "react";
import { Input } from "./Input";

export interface CommandInputProps {
  readonly icon?: ReactNode;
  readonly placeholder: string;
  readonly value?: string;
  readonly onChange?: ChangeEventHandler<HTMLInputElement>;
}

export function CommandInput({ icon, placeholder, value, onChange }: CommandInputProps) {
  return (
    <label className="command-input">
      {icon}
      <Input aria-label={placeholder} placeholder={placeholder} value={value} onChange={onChange} />
    </label>
  );
}
