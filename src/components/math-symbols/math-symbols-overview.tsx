"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { BookOpenText, Calculator, Variable } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type CategoryLink = {
  id: string;
  title: string;
};

export function MathSymbolsOverview({
  symbolCount,
  categoryCount,
  categories,
}: {
  symbolCount: number;
  categoryCount: number;
  categories: CategoryLink[];
}) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    const getStickyOffset = () =>
      window.matchMedia("(min-width: 64rem)").matches ? 88 : 168;

    const updateCompactState = () => {
      const sentinel = sentinelRef.current;

      if (!sentinel) {
        return;
      }

      setCompact(sentinel.getBoundingClientRect().top <= getStickyOffset());
    };

    updateCompactState();
    window.addEventListener("scroll", updateCompactState, { passive: true });
    window.addEventListener("resize", updateCompactState);

    return () => {
      window.removeEventListener("scroll", updateCompactState);
      window.removeEventListener("resize", updateCompactState);
    };
  }, []);

  return (
    <>
      <div ref={sentinelRef} aria-hidden="true" className="h-px" />
      <section
        className={cn(
          "sticky top-[10.5rem] z-30 grid gap-4 rounded-lg border bg-background/95 p-5 shadow-sm backdrop-blur transition-[gap,padding,box-shadow] duration-200 lg:top-[5.5rem] lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center",
          compact && "gap-3 p-3 shadow-md lg:grid-cols-1",
        )}
      >
        <div className={cn("grid gap-3", compact && "gap-2")}>
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={cn(compact && "px-2 py-0.5 text-xs")}>
              <Variable data-icon="inline-start" />
              {symbolCount} 个符号
            </Badge>
            <Badge
              variant="secondary"
              className={cn(compact && "px-2 py-0.5 text-xs")}
            >
              <BookOpenText data-icon="inline-start" />
              {categoryCount} 个分类
            </Badge>
            <Badge
              variant="outline"
              className={cn(compact && "hidden px-2 py-0.5 text-xs sm:inline-flex")}
            >
              <Calculator data-icon="inline-start" />
              读音 / 用法 / 例子
            </Badge>
          </div>
          <p
            className={cn(
              "max-w-3xl text-sm leading-6 text-muted-foreground transition-all duration-200",
              compact && "hidden",
            )}
          >
            阅读公式时先读出符号，再说出它在当前公式里的角色。比如 μ
            不只是“缪”，在概率统计里通常还意味着总体均值或期望。
          </p>
        </div>

        <nav
          aria-label="数学符号分类"
          className={cn(
            "flex flex-wrap gap-2 lg:max-w-md lg:justify-end",
            compact && "lg:max-w-none lg:justify-start",
          )}
        >
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`#${category.id}`}
              className={cn(
                "rounded-md border bg-background px-3 py-1.5 text-sm transition-colors hover:bg-muted",
                compact && "px-2 py-1 text-xs",
              )}
            >
              {category.title}
            </Link>
          ))}
        </nav>
      </section>
    </>
  );
}
