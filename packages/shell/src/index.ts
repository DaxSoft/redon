import type { InspectorModuleManifest, NavigationItemManifest } from "@redon/plugin-contracts";

export interface ShellNavigationGroup {
  readonly id: string;
  readonly label: string;
  readonly items: readonly NavigationItemManifest[];
}

export function createModuleNavigation(modules: readonly InspectorModuleManifest[]): readonly NavigationItemManifest[] {
  return modules.flatMap((module) => module.navigation);
}
