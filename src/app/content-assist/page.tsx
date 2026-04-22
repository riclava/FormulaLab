import Link from "next/link";
import { ArrowRight, Bot, FileCheck2, FilePenLine } from "lucide-react";

import { PhaseShell } from "@/components/app/phase-shell";
import { ContentAssistWorkspace } from "@/components/content-assist/content-assist-workspace";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { listContentAssistWorkspace } from "@/server/services/content-assist-service";

export const dynamic = "force-dynamic";

export default async function ContentAssistPage() {
  const items = await listContentAssistWorkspace();
  const approvedCount = items.filter((item) => item.draftStatus === "approved").length;
  const draftCount = items.filter((item) => item.draftStatus === "draft").length;

  return (
    <PhaseShell
      activePath=""
      eyebrow="Phase 8 / Internal AI Content Assist"
      title="这是内部内容辅助工作台，不是用户侧 AI 入口。"
      description="这里负责生成解释草稿、训练题、关联候选和记忆联想候选。所有输出都必须先人工编辑，再审核通过写入 seed 包。"
    >
      <section className="grid gap-4 rounded-lg border bg-background p-6 shadow-sm md:grid-cols-[minmax(0,1fr)_auto]">
        <div className="grid gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge>
              <Bot data-icon="inline-start" />
              内部能力
            </Badge>
            <Badge variant="secondary">
              <FilePenLine data-icon="inline-start" />
              草稿 {draftCount}
            </Badge>
            <Badge variant="outline">
              <FileCheck2 data-icon="inline-start" />
              已审核 {approvedCount}
            </Badge>
          </div>
          <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
            当前流转是：生成候选草稿 {"->"} 编辑修正 {"->"} 审核通过 {"->"} 写入
            <code className="mx-1 rounded bg-muted px-1.5 py-0.5 text-xs">
              content-assist/approved
            </code>
            {"->"} 下一次
            <code className="mx-1 rounded bg-muted px-1.5 py-0.5 text-xs">
              npm run db:seed
            </code>
            自动吸收。
          </p>
        </div>

        <div className="flex items-end">
          <Link href="/review" className={buttonVariants({ variant: "outline" })}>
            回到今日复习
            <ArrowRight data-icon="inline-end" />
          </Link>
        </div>
      </section>

      <ContentAssistWorkspace items={items} />
    </PhaseShell>
  );
}
