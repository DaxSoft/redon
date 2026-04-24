import type { ReactNode } from "react";

export interface PanelProps {
  readonly children: ReactNode;
  readonly className?: string;
}

export function Panel({ children, className }: PanelProps) {
  const classes = className === undefined ? "panel" : `panel ${className}`;

  return <section className={classes}>{children}</section>;
}
