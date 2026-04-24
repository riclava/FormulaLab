import Link from "next/link";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export type SectionNavItem = {
  href: string;
  label: string;
  description?: string;
  icon: LucideIcon;
  active: boolean;
};

export function SectionNav({
  label,
  items,
  className,
}: {
  label: string;
  items: SectionNavItem[];
  className?: string;
}) {
  return (
    <nav
      aria-label={label}
      className={cn(
        "grid gap-2 rounded-lg border bg-background p-2 shadow-sm sm:grid-cols-3",
        className,
      )}
    >
      {items.map((item) => {
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={item.active ? "page" : undefined}
            className={cn(
              "grid min-h-16 gap-1 rounded-md px-3 py-2 text-left transition-colors hover:bg-muted/70",
              item.active ? "bg-muted text-foreground" : "text-muted-foreground",
            )}
          >
            <span className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Icon data-icon="inline-start" />
              {item.label}
            </span>
            {item.description ? (
              <span className="text-xs leading-5 text-muted-foreground">
                {item.description}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
