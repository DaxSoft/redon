import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "../lib/utils";

export interface SelectProps {
  readonly ariaLabel?: string;
  readonly className?: string;
  readonly value?: string;
  readonly defaultValue?: string;
  readonly placeholder?: string;
  readonly onValueChange?: (value: string) => void;
  readonly children?: React.ReactNode;
}

export function Select({ ariaLabel, className, value, defaultValue, placeholder, onValueChange, children }: SelectProps) {
  const options = React.Children.toArray(children)
    .filter(React.isValidElement)
    .map((child) => {
      const props = child.props as { value?: string; children?: React.ReactNode; disabled?: boolean };
      return {
        value: props.value ?? "",
        label: typeof props.children === "string" ? props.children : String(props.children ?? ""),
        disabled: Boolean(props.disabled)
      };
    });

  const rootProps = {
    ...(value !== undefined ? { value } : {}),
    ...(defaultValue !== undefined ? { defaultValue } : {}),
    ...(onValueChange !== undefined ? { onValueChange } : {})
  };

  return (
    <SelectPrimitive.Root {...rootProps}>
      <SelectPrimitive.Trigger aria-label={ariaLabel} className={cn("ui-select inline-flex h-9 w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-sm", className)}>
        <SelectPrimitive.Value placeholder={placeholder ?? "Select"} />
        <SelectPrimitive.Icon asChild>
          <ChevronDown size={14} />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content className="ui-select-content z-50 min-w-[8rem] overflow-hidden rounded-md border bg-black p-1">
          <SelectPrimitive.Viewport>
            {options.map((option) => (
              <SelectPrimitive.Item key={option.value} value={option.value} disabled={option.disabled} className="ui-select-item relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none">
                <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                  <SelectPrimitive.ItemIndicator>
                    <Check size={14} />
                  </SelectPrimitive.ItemIndicator>
                </span>
                <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}
