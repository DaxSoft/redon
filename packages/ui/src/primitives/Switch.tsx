import * as React from "react";
import * as SwitchPrimitives from "@radix-ui/react-switch";
import { cn } from "../lib/utils";

export function Switch({ className, ...props }: React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>) {
  return (
    <SwitchPrimitives.Root className={cn("ui-switch peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border transition-colors", className)} {...props}>
      <SwitchPrimitives.Thumb className="ui-switch-thumb pointer-events-none block h-4 w-4 rounded-full bg-white shadow-lg transition-transform data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0" />
    </SwitchPrimitives.Root>
  );
}
