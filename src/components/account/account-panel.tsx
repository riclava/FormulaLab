"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, LogOut, Mail, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";

export function AccountPanel({
  authenticated,
  email,
  returnTo,
}: {
  authenticated: boolean;
  email: string | null;
  returnTo: string;
}) {
  const router = useRouter();
  const [emailInput, setEmailInput] = useState(email ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <section className="rounded-lg border bg-background p-6 shadow-sm">
      {authenticated ? (
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Badge variant="secondary" className="w-fit">
              已连接账号
            </Badge>
            <h2 className="text-xl font-semibold">你的学习进度已经可以跨设备继续。</h2>
            <p className="text-sm leading-6 text-muted-foreground">
              当前登录邮箱：<span className="font-medium text-foreground">{email}</span>
            </p>
          </div>

          <div className="rounded-lg border bg-muted/30 p-4 text-sm leading-6 text-muted-foreground">
            <div className="mb-2 flex items-center gap-2 font-medium text-foreground">
              <ShieldCheck data-icon="inline-start" />
              账号已生效
            </div>
            登录后，当前设备上的训练记录会优先绑定到这个账号，之后在新设备登录也能继续同一条复习链路。
          </div>

          {error ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={() =>
                startTransition(async () => {
                  setError(null);
                  setMessage(null);

                  const result = await authClient.signOut();

                  if (result?.error) {
                    setError(result.error.message ?? "退出登录失败");
                    return;
                  }

                  router.push(returnTo);
                  router.refresh();
                })
              }
            >
              {isPending ? (
                <Loader2 data-icon="inline-start" className="animate-spin" />
              ) : (
                <LogOut data-icon="inline-start" />
              )}
              退出登录
            </Button>
          </div>
        </div>
      ) : (
        <form
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            startTransition(async () => {
              setError(null);
              setMessage(null);

              const normalizedEmail = emailInput.trim();

              if (!normalizedEmail) {
                setError("请输入邮箱地址");
                return;
              }

              const result = await authClient.signIn.magicLink({
                email: normalizedEmail,
                callbackURL: returnTo,
                newUserCallbackURL: returnTo,
              });

              if (result?.error) {
                setError(result.error.message ?? "发送登录链接失败");
                return;
              }

              setMessage(
                "登录链接已发送。开发环境未配置邮件服务时，可以在服务端日志里查看 magic link。",
              );
            });
          }}
        >
          <div className="grid gap-2">
            <Badge variant="secondary" className="w-fit">
              保存学习进度
            </Badge>
            <h2 className="text-xl font-semibold">先练习，再决定什么时候绑定账号。</h2>
            <p className="text-sm leading-6 text-muted-foreground">
              输入邮箱后，我们会发送一封 magic link。登录完成后，当前设备上的学习记录会自动绑定到账户。
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="account-email">邮箱地址</Label>
            <Input
              id="account-email"
              type="email"
              name="email"
              autoComplete="email"
              value={emailInput}
              onChange={(event) => setEmailInput(event.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>

          {error ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          ) : null}

          {message ? (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50/80 px-4 py-3 text-sm text-emerald-950">
              {message}
            </div>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <Loader2 data-icon="inline-start" className="animate-spin" />
              ) : (
                <Mail data-icon="inline-start" />
              )}
              发送登录链接
            </Button>
          </div>
        </form>
      )}
    </section>
  );
}
