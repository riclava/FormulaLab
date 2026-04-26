import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  Brain,
  ClipboardCheck,
  FlaskConical,
  Lightbulb,
  Orbit,
} from "lucide-react";

import { EmailPasswordAuthForm } from "@/components/account/email-password-auth-form";
import { LatexRenderer } from "@/components/formula/latex-renderer";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getCurrentLearner } from "@/server/auth/current-learner";

export const dynamic = "force-dynamic";

const loopSteps = [
  {
    title: "诊断",
    description: "先找出薄弱公式。",
    icon: Brain,
  },
  {
    title: "复习",
    description: "按队列完成今天的题目。",
    icon: ClipboardCheck,
  },
  {
    title: "补弱",
    description: "Again 和 Hard 会进入补弱。",
    icon: Orbit,
  },
  {
    title: "恢复线索",
    description: "把提示写成自己的话。",
    icon: Lightbulb,
  },
];

const sampleFormulas = [
  {
    eyebrow: "概率统计",
    title: "贝叶斯定理",
    expression: "P(A\\mid B)=\\frac{P(B\\mid A)P(A)}{P(B)}",
    description: "反推原因时常用。",
  },
  {
    eyebrow: "抽样分布",
    title: "标准误",
    expression: "\\mathrm{SE}(\\bar{x})=\\frac{\\sigma}{\\sqrt{n}}",
    description: "样本均值波动常用。",
  },
];

function sanitizeReturnTo(value?: string) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/review";
  }

  return value;
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string }>;
}) {
  const params = await searchParams;
  const returnTo = sanitizeReturnTo(params.returnTo);
  const current = await getCurrentLearner();

  if (current) {
    redirect(returnTo);
  }

  return (
    <main className="min-h-svh bg-[#f6f7f2] text-slate-950">
      <header className="border-b border-slate-200/80 bg-white/85">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-4 md:px-8">
          <Link href="/" className="flex min-w-0 items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-slate-950 text-slate-50">
              <FlaskConical data-icon="inline-start" />
            </span>
            <span className="min-w-0">
              <span className="block text-base font-semibold">FormulaLab</span>
            </span>
          </Link>

          <Link
            href="#login"
            className={buttonVariants({
              size: "sm",
              variant: "outline",
            })}
          >
            登录
          </Link>
        </div>
      </header>

      <section className="mx-auto grid w-full max-w-6xl gap-6 px-5 py-6 md:px-8 md:py-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(20rem,0.72fr)] lg:items-start">
        <div className="grid gap-5 lg:pt-8">
          <Badge className="w-fit rounded-md border border-emerald-200 bg-emerald-50 px-3 py-1 text-emerald-950 shadow-none">
            Review-first
          </Badge>

          <div className="grid max-w-2xl gap-3">
            <h1 className="text-3xl font-semibold leading-tight md:text-5xl">
              登录后开始今天的复习
            </h1>
            <p className="max-w-xl text-base leading-7 text-slate-700">
              先诊断，再复习和补弱。FormulaLab 会把每条公式的下次提示，慢慢变成你自己的回忆线索。
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="#login"
              className={cn(buttonVariants({ size: "lg" }), "h-11 px-5")}
            >
              输入邮箱登录
              <ArrowRight data-icon="inline-end" />
            </Link>
            <Link
              href="#loop"
              className={cn(
                buttonVariants({
                  size: "lg",
                  variant: "outline",
                }),
                "h-11 px-5 bg-white",
              )}
            >
              看训练流程
            </Link>
          </div>

          <div className="hidden grid-cols-2 gap-3 md:grid">
            {sampleFormulas.map((item) => (
              <article
                key={item.title}
                className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
              >
                <p className="text-xs font-medium text-slate-500">
                  {item.eyebrow}
                </p>
                <h2 className="mt-2 text-lg font-semibold">{item.title}</h2>
                <LatexRenderer
                  block
                  expression={item.expression}
                  className="mt-3 border-slate-200 bg-slate-50 px-3 py-4 text-sm shadow-none"
                />
                <p className="mt-3 text-sm leading-5 text-slate-600">{item.description}</p>
              </article>
            ))}
          </div>
        </div>

        <aside
          id="login"
          className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm md:p-6 lg:sticky lg:top-6"
        >
          <div className="grid gap-5">
            <div className="grid gap-2">
              <Badge variant="secondary" className="w-fit rounded-md px-3 py-1">
                账号登录
              </Badge>
              <div className="grid gap-1.5">
                <h2 className="text-xl font-semibold">登录或注册</h2>
                <p className="text-sm leading-6 text-slate-600">
                  登录后直接进入训练页，复习记录会保存在账号下。
                </p>
              </div>
            </div>

            <EmailPasswordAuthForm
              callbackURL={returnTo}
              fieldClassName="gap-3"
              inputClassName="h-11 bg-white"
              buttonClassName="h-11"
            />

            <div className="grid gap-2 border-t border-slate-200 pt-4 text-sm text-slate-600">
              <div className="flex items-start gap-3">
                <span className="mt-1.5 h-2 w-2 rounded-full bg-emerald-500" />
                <p>登录后进入今日复习。</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="mt-1.5 h-2 w-2 rounded-full bg-sky-500" />
                <p>没有训练队列时，会先引导完成诊断校准。</p>
              </div>
            </div>
          </div>
        </aside>
      </section>

      <section
        id="loop"
        className="border-y border-slate-200 bg-white"
      >
        <div className="mx-auto grid w-full max-w-6xl gap-6 px-5 py-8 md:px-8 lg:grid-cols-[minmax(0,0.72fr)_minmax(0,1.28fr)]">
          <div className="grid content-start gap-3">
            <Badge variant="secondary" className="w-fit rounded-md px-3 py-1">
              流程
            </Badge>
            <h2 className="text-2xl font-semibold md:text-3xl">
              登录后只做下一步。
            </h2>
            <p className="max-w-md text-sm leading-6 text-slate-600">
              页面会根据当前状态，把入口收敛到训练、公式库或进展。
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {loopSteps.map((step, index) => {
              const Icon = step.icon;

              return (
                <article
                  key={step.title}
                  className="grid gap-2 rounded-lg border border-slate-200 bg-[#fafbf8] p-4"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex size-9 items-center justify-center rounded-lg bg-slate-950 text-slate-50">
                      <Icon data-icon="inline-start" />
                    </span>
                    <div>
                      <p className="text-xs text-slate-500">
                        Step {index + 1}
                      </p>
                      <h3 className="text-base font-semibold">{step.title}</h3>
                    </div>
                  </div>
                  <p className="text-sm leading-5 text-slate-600">
                    {step.description}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}
