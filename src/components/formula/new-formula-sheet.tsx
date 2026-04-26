"use client";

import { Plus } from "lucide-react";
import { useState } from "react";

import { OfficialFormulaForm } from "@/components/admin/official-formula-form";
import { buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function NewFormulaSheet() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        className={buttonVariants({ size: "lg", variant: "secondary" })}
      >
        <Plus data-icon="inline-start" />
        添加公式
      </DialogTrigger>
      <DialogContent className="max-w-4xl">
        <DialogHeader className="border-b bg-background px-5 py-4">
          <DialogTitle>添加我的公式</DialogTitle>
          <DialogDescription>
            粘贴题目、笔记或公式名，让 AI 先整理草稿，再确认后加入训练库。
          </DialogDescription>
        </DialogHeader>
        <div className="overflow-y-auto p-5">
          <OfficialFormulaForm variant="custom" mode="create" />
        </div>
      </DialogContent>
    </Dialog>
  );
}
