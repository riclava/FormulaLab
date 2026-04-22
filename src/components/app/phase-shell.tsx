import Link from "next/link";
import {
  BookOpen,
  Brain,
  ChartNoAxesColumn,
  ClipboardCheck,
  FlaskConical,
  Lightbulb,
  ListChecks,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  phase: string;
};

const navItems: NavItem[] = [
  { href: "/review", label: "今日复习", phase: "Phase 3" },
  { href: "/diagnostic", label: "首次诊断", phase: "Phase 2" },
  { href: "/formulas", label: "公式列表", phase: "Phase 7" },
  { href: "/memory-hooks", label: "记忆钩子", phase: "Phase 5" },
  { href: "/summary", label: "复习总结", phase: "Phase 6" },
];

const phaseItems = [
  "Next.js + TypeScript initialized",
  "Tailwind CSS v4 and shadcn/ui configured",
  "KaTeX dependency and global styles wired",
  "Prisma configured for PostgreSQL",
  "Review-first routes scaffolded",
];

export function PhaseShell({
  activePath,
  eyebrow,
  title,
  description,
  children,
}: {
  activePath: string;
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-svh bg-[radial-gradient(circle_at_top_left,var(--muted),transparent_34rem)]">
      <div className="mx-auto flex min-h-svh w-full max-w-6xl flex-col px-5 py-5 md:px-8">
        <header className="flex flex-col gap-4 border-b pb-5 md:flex-row md:items-center md:justify-between">
          <Link href="/review" className="flex w-fit items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <FlaskConical data-icon="inline-start" />
            </span>
            <span>
              <span className="block text-base font-semibold leading-none">
                FormulaLab
              </span>
              <span className="mt-1 block text-xs text-muted-foreground">
                Review-first formula training
              </span>
            </span>
          </Link>

          <nav aria-label="主要页面" className="flex flex-wrap gap-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={buttonVariants({
                  size: "sm",
                  variant: activePath === item.href ? "default" : "ghost",
                })}
              >
                {item.label}
                <span className="sr-only">，计划阶段 {item.phase}</span>
              </Link>
            ))}
          </nav>
        </header>

        <section className="grid flex-1 gap-8 py-10 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
          <div className="flex min-w-0 flex-col gap-8">
            <div className="flex flex-col gap-4">
              <Badge variant="secondary" className="w-fit">
                {eyebrow}
              </Badge>
              <div className="flex max-w-3xl flex-col gap-3">
                <h1 className="text-3xl font-semibold tracking-tight md:text-5xl">
                  {title}
                </h1>
                <p className="text-base leading-7 text-muted-foreground md:text-lg">
                  {description}
                </p>
              </div>
            </div>

            {children}
          </div>

          <aside className="flex flex-col gap-5 rounded-lg border bg-background/80 p-5 shadow-sm backdrop-blur">
            <div className="flex items-center gap-2">
              <ListChecks data-icon="inline-start" />
              <h2 className="text-sm font-semibold">Phase 0 骨架状态</h2>
            </div>
            <Progress value={100} aria-label="Phase 0 scaffold progress" />
            <ul className="flex flex-col gap-3 text-sm text-muted-foreground">
              {phaseItems.map((item) => (
                <li key={item} className="flex gap-2">
                  <ClipboardCheck
                    data-icon="inline-start"
                    className="mt-0.5 text-primary"
                  />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <Separator />
            <div className="grid gap-3 text-sm">
              <PhaseLink
                href="/diagnostic"
                active={activePath === "/diagnostic"}
                icon={Brain}
                label="Diagnostic"
              />
              <PhaseLink
                href="/review"
                active={activePath === "/review"}
                icon={ClipboardCheck}
                label="Review"
              />
              <PhaseLink
                href="/formulas"
                active={activePath === "/formulas"}
                icon={BookOpen}
                label="Formula Content"
              />
              <PhaseLink
                href="/memory-hooks"
                active={activePath === "/memory-hooks"}
                icon={Lightbulb}
                label="Memory Hook"
              />
              <PhaseLink
                href="/summary"
                active={activePath === "/summary"}
                icon={ChartNoAxesColumn}
                label="Analytics"
              />
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}

function PhaseLink({
  href,
  active,
  icon: Icon,
  label,
}: {
  href: string;
  active: boolean;
  icon: typeof Brain;
  label: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2 rounded-md px-2 py-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
        active && "bg-muted text-foreground",
      )}
    >
      <Icon data-icon="inline-start" />
      {label}
    </Link>
  );
}
