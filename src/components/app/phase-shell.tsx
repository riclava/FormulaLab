import Link from "next/link";
import {
  BookOpen,
  Brain,
  ChartNoAxesColumn,
  ClipboardCheck,
  FlaskConical,
  Lightbulb,
  Route,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  description: string;
  icon: typeof Brain;
  priority: "primary" | "secondary";
};

const navItems: NavItem[] = [
  {
    href: "/review",
    label: "今日复习",
    description: "打开就开始练",
    icon: ClipboardCheck,
    priority: "primary",
  },
  {
    href: "/diagnostic",
    label: "首次诊断",
    description: "快速找到薄弱点",
    icon: Brain,
    priority: "primary",
  },
  {
    href: "/summary",
    label: "复习总结",
    description: "看结果和下一步",
    icon: ChartNoAxesColumn,
    priority: "primary",
  },
  {
    href: "/formulas",
    label: "公式列表",
    description: "查找与回看",
    icon: BookOpen,
    priority: "primary",
  },
  {
    href: "/memory-hooks",
    label: "记忆钩子",
    description: "整理个人联想",
    icon: Lightbulb,
    priority: "secondary",
  },
  {
    href: "/paths",
    label: "学习路径",
    description: "阶段性安排",
    icon: Route,
    priority: "secondary",
  },
  {
    href: "/derivation",
    label: "推导训练",
    description: "理解公式来源",
    icon: Brain,
    priority: "secondary",
  },
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
  const primaryItems = navItems.filter((item) => item.priority === "primary");
  const secondaryItems = navItems.filter((item) => item.priority === "secondary");
  const activeItem = navItems.find((item) => item.href === activePath);

  return (
    <main className="min-h-svh bg-background">
      <header className="border-b bg-background/95">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-5 py-4 md:px-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-4">
            <Link href="/review" className="flex w-fit items-center gap-3">
              <span className="flex size-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <FlaskConical data-icon="inline-start" />
              </span>
              <span>
                <span className="block text-base font-semibold leading-none">
                  FormulaLab
                </span>
                <span className="mt-1 block text-xs text-muted-foreground">
                  每天练一点，公式真的记住
                </span>
              </span>
            </Link>
            {activeItem ? (
              <Badge variant="secondary" className="hidden sm:inline-flex">
                {activeItem.description}
              </Badge>
            ) : null}
          </div>

          <nav aria-label="核心页面" className="flex flex-wrap gap-2">
            {primaryItems.map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={activePath === item.href ? "page" : undefined}
                  className={buttonVariants({
                    size: "sm",
                    variant: activePath === item.href ? "default" : "ghost",
                  })}
                >
                  <Icon data-icon="inline-start" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-5 py-8 md:px-8 md:py-10">
        <div className="flex flex-col gap-5 border-b pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex min-w-0 max-w-3xl flex-col gap-3">
            <Badge variant="secondary" className="w-fit">
              {eyebrow}
            </Badge>
            <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
              {title}
            </h1>
            <p className="text-base leading-7 text-muted-foreground">
              {description}
            </p>
          </div>

          <nav aria-label="辅助页面" className="flex flex-wrap gap-2">
            {secondaryItems.map((item) => (
              <PhaseLink
                key={item.href}
                href={item.href}
                active={activePath === item.href}
                icon={item.icon}
                label={item.label}
              />
            ))}
          </nav>
        </div>

        <div className="flex min-w-0 flex-col gap-8">{children}</div>
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
      aria-current={active ? "page" : undefined}
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
