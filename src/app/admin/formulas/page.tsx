import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Filter,
  Pencil,
  Search,
  ShieldCheck,
} from "lucide-react";

import { OfficialFormulaImportExport } from "@/components/admin/official-formula-import-export";
import { NewOfficialFormulaSheet } from "@/components/admin/new-official-formula-sheet";
import { LatexRenderer } from "@/components/formula/latex-renderer";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { requireCurrentAdmin } from "@/server/auth/current-learner";
import { getOfficialFormulaMaintenanceCatalog } from "@/server/services/formula-maintenance-service";
import type { OfficialFormulaMaintenanceItem } from "@/server/services/formula-maintenance-service";

export const dynamic = "force-dynamic";

export default async function AdminFormulaMaintenancePage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    domain?: string;
    difficulty?: string;
  }>;
}) {
  const current = await requireCurrentAdmin();
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const domain = params.domain?.trim() || undefined;
  const difficulty = parseDifficulty(params.difficulty);
  const catalog = await getOfficialFormulaMaintenanceCatalog({
    query: query || undefined,
    domain,
    difficulty,
  });
  const summary = buildQualitySummary(catalog.items);
  const buildHref = createAdminFormulaHrefBuilder({
    q: query || null,
    domain: domain ?? null,
    difficulty: difficulty ?? null,
  });

  return (
    <main className="min-h-screen bg-muted/30">
      <div className="mx-auto grid w-full max-w-6xl gap-5 px-4 py-6 md:px-6 lg:px-8">
        <header className="grid gap-4 border-b pb-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="grid gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge>
                  <ShieldCheck data-icon="inline-start" />
                  管理员
                </Badge>
                <Badge variant="outline">{current.authUser?.email}</Badge>
              </div>
              <div className="grid gap-1">
                <h1 className="text-2xl font-semibold tracking-normal">
                  官方公式库巡检
                </h1>
                <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                  维护官方公式内容，检查训练所需的解释、变量、复习题和关系。
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <NewOfficialFormulaSheet
                relationOptions={catalog.items.map((item) => ({
                  slug: item.slug,
                  title: item.title,
                }))}
              />
              <Link href="/formulas" className={buttonVariants({ variant: "outline" })}>
                返回公式库
              </Link>
            </div>
          </div>
        </header>

        <OfficialFormulaImportExport />

        <section className="grid gap-4 rounded-lg border bg-background p-4 shadow-sm md:p-5">
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">官方公式 {catalog.items.length}</Badge>
            <Badge variant={summary.incompleteCount > 0 ? "destructive" : "secondary"}>
              待补 {summary.incompleteCount}
            </Badge>
            <Badge variant="outline">完整 {summary.completeCount}</Badge>
          </div>

          <form action="/admin/formulas" className="grid gap-3">
            <div className="grid gap-2">
              <Label htmlFor="admin-formula-search">搜索官方公式</Label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  id="admin-formula-search"
                  name="q"
                  type="search"
                  defaultValue={query}
                  placeholder="搜索标题、解释、变量或标签"
                  className="h-9 flex-1"
                />
                {domain ? <input type="hidden" name="domain" value={domain} /> : null}
                {difficulty !== undefined ? (
                  <input type="hidden" name="difficulty" value={difficulty} />
                ) : null}
                <button
                  type="submit"
                  className={cn(
                    buttonVariants({ size: "lg" }),
                    "min-w-24 justify-center",
                  )}
                >
                  <Search data-icon="inline-start" />
                  搜索
                </button>
              </div>
            </div>
          </form>

          <div className="grid gap-3 border-t pt-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Filter data-icon="inline-start" />
              筛选
            </div>
            <FilterRow
              label="知识域"
              items={[
                {
                  label: "全部",
                  href: buildHref({ domain: null }),
                  active: !domain,
                },
                ...catalog.filters.domains.map((item) => ({
                  label: item,
                  href: buildHref({ domain: item }),
                  active: domain === item,
                })),
              ]}
            />
            <FilterRow
              label="难度"
              items={[
                {
                  label: "全部",
                  href: buildHref({ difficulty: null }),
                  active: difficulty === undefined,
                },
                ...catalog.filters.difficulties.map((item) => ({
                  label: `难度 ${item}`,
                  href: buildHref({ difficulty: item }),
                  active: difficulty === item,
                })),
              ]}
            />
            <div>
              <Link
                href="/admin/formulas"
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                清空筛选
              </Link>
            </div>
          </div>
        </section>

        <section className="grid gap-3">
          {catalog.items.length > 0 ? (
            catalog.items.map((item) => (
              <FormulaMaintenanceCard key={item.id} item={item} />
            ))
          ) : (
            <div className="rounded-lg border bg-background p-6 text-sm text-muted-foreground">
              没有找到符合条件的官方公式。
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function FormulaMaintenanceCard({
  item,
}: {
  item: OfficialFormulaMaintenanceItem;
}) {
  const isComplete = item.quality.status === "complete";

  return (
    <article className="grid gap-4 rounded-lg border bg-background p-4 shadow-sm md:p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="grid min-w-0 gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold">{item.title}</h2>
            <Badge variant="outline">{item.domain}</Badge>
            {item.subdomain ? <Badge variant="outline">{item.subdomain}</Badge> : null}
            <Badge variant="outline">难度 {item.difficulty}</Badge>
            <Badge variant={isComplete ? "secondary" : "destructive"}>
              {isComplete ? (
                <CheckCircle2 data-icon="inline-start" />
              ) : (
                <AlertTriangle data-icon="inline-start" />
              )}
              {isComplete ? "完整" : `缺 ${item.quality.missingItems.length} 项`}
            </Badge>
          </div>

          <div className="max-w-full overflow-x-auto text-sm">
            <LatexRenderer expression={item.expressionLatex} />
          </div>

          <div className="flex flex-wrap gap-2">
            {item.tags.map((tag) => (
              <Badge key={tag} variant="outline">
                {tag}
              </Badge>
            ))}
          </div>
        </div>

        <div className="grid gap-2 text-sm text-muted-foreground lg:min-w-48 lg:text-right">
          <p>变量 {item.variableCount}</p>
          <p>复习题 {item.reviewItemCount}</p>
          <p>更新 {formatDateTime(item.updatedAt)}</p>
        </div>
      </div>

      {!isComplete ? (
        <div className="flex flex-wrap gap-2 border-t pt-3">
          {item.quality.missingItems.map((missingItem) => (
            <Badge key={missingItem} variant="destructive">
              {missingItem}
            </Badge>
          ))}
        </div>
      ) : null}

      <div className="flex flex-wrap justify-end gap-2 border-t pt-3">
        <Link
          href={`/admin/formulas/${item.slug}/edit`}
          className={buttonVariants({ variant: "secondary", size: "sm" })}
        >
          <Pencil data-icon="inline-start" />
          编辑
        </Link>
        <Link
          href={`/formulas/${item.slug}`}
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          查看详情
          <ExternalLink data-icon="inline-end" />
        </Link>
      </div>
    </article>
  );
}

function FilterRow({
  label,
  items,
}: {
  label: string;
  items: Array<{
    label: string;
    href: string;
    active: boolean;
  }>;
}) {
  return (
    <div className="grid gap-2 md:grid-cols-[4rem_minmax(0,1fr)] md:items-start">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <Link
            key={`${label}-${item.label}`}
            href={item.href}
            className={buttonVariants({
              size: "sm",
              variant: item.active ? "secondary" : "outline",
            })}
          >
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

function parseDifficulty(value: string | undefined) {
  if (!value) {
    return undefined;
  }

  const parsed = Number.parseInt(value, 10);

  return Number.isInteger(parsed) && parsed >= 1 && parsed <= 5
    ? parsed
    : undefined;
}

function createAdminFormulaHrefBuilder(current: {
  q: string | null;
  domain: string | null;
  difficulty: number | null;
}) {
  return (patch: Partial<typeof current>) => {
    const next = {
      ...current,
      ...patch,
    };
    const params = new URLSearchParams();

    if (next.q) {
      params.set("q", next.q);
    }

    if (next.domain) {
      params.set("domain", next.domain);
    }

    if (next.difficulty !== null) {
      params.set("difficulty", String(next.difficulty));
    }

    const queryString = params.toString();

    return queryString ? `/admin/formulas?${queryString}` : "/admin/formulas";
  };
}

function buildQualitySummary(items: OfficialFormulaMaintenanceItem[]) {
  const incompleteCount = items.filter(
    (item) => item.quality.status === "incomplete",
  ).length;

  return {
    incompleteCount,
    completeCount: items.length - incompleteCount,
  };
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}
