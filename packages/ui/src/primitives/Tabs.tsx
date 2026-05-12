import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "../lib/utils";

export const Tabs = TabsPrimitive.Root;

export function TabsList({ className, ...props }: TabsPrimitive.TabsListProps) {
  return <TabsPrimitive.List className={cn("ui-tabs-list inline-flex h-9 items-center justify-center rounded-lg p-1", className)} {...props} />;
}

export function TabsTrigger({ className, ...props }: TabsPrimitive.TabsTriggerProps) {
  return <TabsPrimitive.Trigger className={cn("ui-tabs-trigger inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm", className)} {...props} />;
}

export function TabsContent({ className, ...props }: TabsPrimitive.TabsContentProps) {
  return <TabsPrimitive.Content className={cn("ui-tabs-content mt-2", className)} {...props} />;
}
