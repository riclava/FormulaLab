import Link from "next/link";
import { Cloud, UserRound } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getCurrentAuthSession } from "@/server/auth/current-learner";

export async function AccountEntry({ returnTo }: { returnTo: string }) {
  const session = await getCurrentAuthSession();
  const href = `/account?returnTo=${encodeURIComponent(returnTo)}`;

  if (session?.user) {
    return (
      <Link
        href={href}
        className={cn(
          buttonVariants({
            size: "sm",
            variant: "outline",
          }),
          "max-w-56 justify-start",
        )}
      >
        <UserRound data-icon="inline-start" />
        <span className="truncate">{session.user.email}</span>
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className={buttonVariants({
        size: "sm",
        variant: "outline",
      })}
    >
      <Cloud data-icon="inline-start" />
      保存进度
    </Link>
  );
}
