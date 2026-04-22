import { Lightbulb, Sparkles } from "lucide-react";

import { PhaseShell } from "@/components/app/phase-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const suggestions = [
  "先验乘似然，再除总证据。",
  "执果索因：果在竖线后，因在竖线前。",
  "看到检测阳性，反推真正得病的概率。",
];

export default function MemoryHooksPage() {
  return (
    <PhaseShell
      activePath="/memory-hooks"
      eyebrow="Phase 5 placeholder"
      title="记忆钩子会把公式挂到用户已有经验上。"
      description="Phase 0 先保留创建和选择联想的交互位置；正式实现会记录来源、类型、使用次数和有效性反馈。"
    >
      <section className="grid gap-5 rounded-lg border bg-background p-6 shadow-sm md:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="flex flex-col gap-3">
          <Label htmlFor="memory-hook">我的个人联想</Label>
          <Textarea
            id="memory-hook"
            placeholder="这个公式让你想到了什么？例如一个场景、画面、口诀或易混淆对比。"
          />
          <Button className="w-fit">
            <Lightbulb data-icon="inline-start" />
            保存为下次提示
          </Button>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Sparkles data-icon="inline-start" />
            <h2 className="font-medium">AI 推荐候选</h2>
          </div>
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              className="rounded-lg border p-3 text-left text-sm transition-colors hover:bg-muted"
              type="button"
            >
              <Badge variant="secondary" className="mb-2">
                候选联想
              </Badge>
              <span className="block text-muted-foreground">{suggestion}</span>
            </button>
          ))}
        </div>
      </section>
    </PhaseShell>
  );
}
