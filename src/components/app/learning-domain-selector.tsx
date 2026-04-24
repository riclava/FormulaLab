"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { BookMarked } from "lucide-react";

import { LEARNING_DOMAIN_COOKIE } from "@/lib/learning-domain";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function LearningDomainSelector({
  currentDomain,
  domains,
}: {
  currentDomain: string;
  domains: string[];
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const options = domains.includes(currentDomain)
    ? domains
    : [currentDomain, ...domains];

  function handleChange(nextDomain: string | null) {
    if (!nextDomain) {
      return;
    }

    const params = new URLSearchParams(searchParams);
    params.set("domain", nextDomain);
    document.cookie = `${LEARNING_DOMAIN_COOKIE}=${encodeURIComponent(
      nextDomain,
    )}; path=/; max-age=31536000; samesite=lax`;
    router.replace(`${pathname}?${params.toString()}`);
  }

  return (
    <Select value={currentDomain} onValueChange={handleChange}>
      <SelectTrigger
        aria-label="当前知识域"
        className="h-9 min-w-44 shrink-0 gap-2 border-border bg-background px-3"
      >
        <BookMarked data-icon="inline-start" className="text-muted-foreground" />
        <span className="whitespace-nowrap text-muted-foreground">知识域</span>
        <SelectValue className="min-w-0 font-medium" />
      </SelectTrigger>
      <SelectContent
        align="start"
        alignItemWithTrigger={false}
        className="min-w-44"
        sideOffset={6}
      >
        {options.map((domain) => (
          <SelectItem key={domain} value={domain}>
            {domain}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
