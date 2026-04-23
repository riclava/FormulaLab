import Link from "next/link";
import { ArrowRight, BookOpenCheck } from "lucide-react";

import { PhaseShell } from "@/components/app/phase-shell";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { getAnonymousUserFromCookies } from "@/server/http/anonymous-user-cookie";
import { getFormulaCatalog } from "@/server/services/formula-service";

export const dynamic = "force-dynamic";

export default async function PathsPage() {
  const { user } = await getAnonymousUserFromCookies();
  const catalog = await getFormulaCatalog({
    userId: user.id,
  });
  const groups = groupByDomain(catalog.formulas);

  return (
    <PhaseShell
      activePath="/paths"
      eyebrow="学习路径"
      title="按一组内容推进，不把公式孤立地背。"
    >
      <div className="grid gap-5">
        {groups.map((group) => (
          <section key={group.domain} className="rounded-lg border bg-background p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <BookOpenCheck data-icon="inline-start" />
                  <h2 className="text-xl font-semibold">{group.domain}</h2>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {group.formulas.length} 条公式，{group.weakCount} 条需要补弱，{group.stableCount} 条稳定中。
                </p>
              </div>
              <Link
                href={`/formulas?domain=${encodeURIComponent(group.domain)}`}
                className={buttonVariants({ size: "sm", variant: "outline" })}
              >
                查看内容集
              </Link>
            </div>

            <div className="mt-5 grid gap-3">
              {group.formulas.map((formula, index) => (
                <Link
                  key={formula.id}
                  href={`/formulas/${formula.slug}?from=paths`}
                  className="grid gap-2 rounded-lg border p-4 transition-colors hover:bg-muted/40"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">{index + 1}</Badge>
                    <span className="font-medium">{formula.title}</span>
                    <Badge variant={formula.isWeak ? "destructive" : "secondary"}>
                      {formula.trainingStatusLabel}
                    </Badge>
                    {formula.subdomain ? <Badge variant="outline">{formula.subdomain}</Badge> : null}
                  </div>
                  <p className="text-sm leading-6 text-muted-foreground">
                    {formula.oneLineUse}
                  </p>
                </Link>
              ))}
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href={
                  group.formulas.find((formula) => formula.isWeak)?.slug
                    ? `/formulas/${group.formulas.find((formula) => formula.isWeak)!.slug}?from=paths&focus=use`
                    : `/formulas/${group.formulas[0]?.slug}?from=paths`
                }
                className={buttonVariants({ size: "sm" })}
              >
                继续这组内容
                <ArrowRight data-icon="inline-end" />
              </Link>
              <Link
                href="/review?mode=weak"
                className={buttonVariants({ size: "sm", variant: "secondary" })}
              >
                只练这组里的薄弱项
              </Link>
            </div>
          </section>
        ))}
      </div>
    </PhaseShell>
  );
}

function groupByDomain(formulas: Awaited<ReturnType<typeof getFormulaCatalog>>["formulas"]) {
  const groups = new Map<string, typeof formulas>();

  for (const formula of formulas) {
    groups.set(formula.domain, [...(groups.get(formula.domain) ?? []), formula]);
  }

  return Array.from(groups.entries()).map(([domain, items]) => ({
    domain,
    formulas: items.sort((left, right) => {
      if ((left.subdomain ?? "") !== (right.subdomain ?? "")) {
        return (left.subdomain ?? "").localeCompare(right.subdomain ?? "", "zh-CN");
      }

      return left.difficulty - right.difficulty;
    }),
    weakCount: items.filter((formula) => formula.isWeak).length,
    stableCount: items.filter((formula) => formula.trainingStatus === "stable").length,
  }));
}
