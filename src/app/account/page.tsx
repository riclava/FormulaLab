import Link from "next/link";
import { ArrowRight, Cloud, Database, ShieldCheck } from "lucide-react";

import { PhaseShell } from "@/components/app/phase-shell";
import { AccountPanel } from "@/components/account/account-panel";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { getCurrentLearner } from "@/server/auth/current-learner";

function sanitizeReturnTo(value?: string) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/review";
  }

  return value;
}

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string }>;
}) {
  const params = await searchParams;
  const current = await getCurrentLearner();
  const returnTo = sanitizeReturnTo(params.returnTo);
  const signedInEmail = current.authSession?.user.email ?? null;

  return (
    <PhaseShell
      activePath="/account"
      eyebrow="账号与同步"
      title="先把训练记录稳稳留住，再考虑跨设备继续。"
      description="FormulaLab 继续保留匿名起步。只有当你想保存进度、跨设备继续或者长期积累复习记录时，才需要绑定账号。"
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <AccountPanel
          authenticated={!current.anonymous}
          email={signedInEmail}
          returnTo={returnTo}
        />

        <section className="grid gap-4 rounded-lg border bg-background p-6 shadow-sm">
          <div className="grid gap-3">
            <Badge variant="secondary" className="w-fit">
              当前状态
            </Badge>
            <h2 className="text-xl font-semibold">
              {current.anonymous ? "当前是匿名学习" : "当前账号已经接管学习进度"}
            </h2>
            <p className="text-sm leading-6 text-muted-foreground">
              当前 learner ID：
              <span className="font-mono text-foreground">{current.learner.id}</span>
            </p>
          </div>

          <div className="grid gap-3">
            <StatusCard
              icon={Cloud}
              title="匿名起步"
              description="第一次进入时，系统会先给当前设备分配匿名学习身份，不打断诊断和今日复习。"
            />
            <StatusCard
              icon={Database}
              title="进度绑定"
              description="登录成功后，当前设备上的 learner 会优先绑定到账户，后续 API 和页面统一读取这一条学习记录。"
            />
            <StatusCard
              icon={ShieldCheck}
              title="后续扩展"
              description="后面如果加 Google 登录、运营权限或跨端同步，都会落在 auth 层，不会把 review 业务逻辑搅乱。"
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <Link href={returnTo} className={buttonVariants({ variant: "outline" })}>
              回到当前训练
            </Link>
            <Link href="/review" className={buttonVariants()}>
              去今日复习
              <ArrowRight data-icon="inline-end" />
            </Link>
          </div>
        </section>
      </div>
    </PhaseShell>
  );
}

function StatusCard({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Cloud;
  title: string;
  description: string;
}) {
  return (
    <article className="rounded-lg border p-4">
      <div className="mb-2 flex items-center gap-2">
        <Icon data-icon="inline-start" />
        <h3 className="font-medium">{title}</h3>
      </div>
      <p className="text-sm leading-6 text-muted-foreground">{description}</p>
    </article>
  );
}
