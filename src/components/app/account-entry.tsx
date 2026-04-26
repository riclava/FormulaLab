import Link from "next/link";
import { LogIn } from "lucide-react";

import { AccountMenu } from "@/components/app/account-menu";
import { buttonVariants } from "@/components/ui/button";
import { getCurrentAuthSession, isCurrentAdmin } from "@/server/auth/current-learner";

export async function AccountEntry({ returnTo }: { returnTo: string }) {
  const session = await getCurrentAuthSession();
  const href = `/account?returnTo=${encodeURIComponent(returnTo)}`;

  if (session?.user) {
    const isAdmin = await isCurrentAdmin();

    return (
      <AccountMenu
        accountHref={href}
        email={session.user.email}
        isAdmin={isAdmin}
      />
    );
  }

  return (
    <Link
      href={href}
      className={buttonVariants({
        size: "sm",
        variant: "outline",
        className: "shrink-0",
      })}
    >
      <LogIn data-icon="inline-start" />
      登录
    </Link>
  );
}
