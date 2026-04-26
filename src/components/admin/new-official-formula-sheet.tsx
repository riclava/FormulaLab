"use client";

import { Plus } from "lucide-react";
import { useState } from "react";

import { OfficialFormulaForm } from "@/components/admin/official-formula-form";
import type { RelationOption } from "@/components/admin/official-formula-form";
import { buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function NewOfficialFormulaSheet({
  relationOptions,
}: {
  relationOptions: RelationOption[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className={buttonVariants()}>
        <Plus data-icon="inline-start" />
        新增公式
      </DialogTrigger>
      <DialogContent className="max-w-5xl">
        <DialogHeader className="border-b bg-background px-5 py-4">
          <DialogTitle>新增官方公式</DialogTitle>
          <DialogDescription>
            维护官方公式内容、变量说明、复习题、关系和图像配置。
          </DialogDescription>
        </DialogHeader>
        <div className="overflow-y-auto p-5">
          <OfficialFormulaForm
            variant="official"
            mode="create"
            relationOptions={relationOptions}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
