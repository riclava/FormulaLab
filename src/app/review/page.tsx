import Link from "next/link";

import { PhaseShell } from "@/components/app/phase-shell";
import { ReviewSession } from "@/components/review/review-session";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default async function ReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  const params = await searchParams;
  const mode = params.mode === "weak" ? "weak" : "today";

  return (
    <PhaseShell
      activePath="/review"
      eyebrow={mode === "weak" ? "错题重练" : "今日复习"}
      title={
        mode === "weak"
          ? "先把卡住的公式补回来。"
          : "从第一题开始，完成今天的公式复习。"
      }
    >
      <section className="flex flex-col gap-4 rounded-lg border bg-background p-4 shadow-sm md:flex-row md:items-center md:justify-between">
        <p className="text-sm font-medium">训练模式</p>
        <div className="flex flex-wrap gap-2">
          {[
            {
              href: "/review",
              label: "今日复习",
              active: mode === "today",
            },
            {
              href: "/review?mode=weak",
              label: "弱项重练",
              active: mode === "weak",
            },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={item.active ? "page" : undefined}
              className={cn(
                buttonVariants({
                  size: "sm",
                  variant: item.active ? "default" : "outline",
                }),
                "min-w-28 justify-center",
              )}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </section>

      <ReviewSession key={mode} mode={mode} />
    </PhaseShell>
  );
}
