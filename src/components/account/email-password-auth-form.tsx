"use client";

import { useId, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, LogIn, UserPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

type AuthMode = "sign-in" | "sign-up";

function getDisplayName(email: string) {
  return email.split("@")[0] || email;
}

export function EmailPasswordAuthForm({
  callbackURL,
  className,
  fieldClassName,
  buttonClassName,
  inputClassName,
  defaultMode = "sign-in",
}: {
  callbackURL: string;
  className?: string;
  fieldClassName?: string;
  buttonClassName?: string;
  inputClassName?: string;
  defaultMode?: AuthMode;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>(defaultMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const emailFieldId = useId();
  const passwordFieldId = useId();
  const isSignUp = mode === "sign-up";

  return (
    <form
      className={cn("grid gap-4", className)}
      onSubmit={(event) => {
        event.preventDefault();
        startTransition(async () => {
          setError(null);

          const normalizedEmail = email.trim().toLowerCase();

          if (!normalizedEmail) {
            setError("请输入邮箱地址");
            return;
          }

          if (password.length < 8) {
            setError("密码至少需要 8 位");
            return;
          }

          const result = isSignUp
            ? await authClient.signUp.email({
                email: normalizedEmail,
                password,
                name: getDisplayName(normalizedEmail),
              })
            : await authClient.signIn.email({
                email: normalizedEmail,
                password,
              });

          if (result?.error) {
            setError(
              result.error.message ??
                (isSignUp ? "注册失败，请稍后再试" : "登录失败，请检查邮箱和密码"),
            );
            return;
          }

          router.push(callbackURL);
          router.refresh();
        });
      }}
    >
      <div className="grid grid-cols-2 gap-2 rounded-lg border bg-muted/30 p-1">
        <Button
          type="button"
          variant={mode === "sign-in" ? "secondary" : "ghost"}
          disabled={isPending}
          onClick={() => {
            setMode("sign-in");
            setError(null);
          }}
        >
          <LogIn data-icon="inline-start" />
          登录
        </Button>
        <Button
          type="button"
          variant={mode === "sign-up" ? "secondary" : "ghost"}
          disabled={isPending}
          onClick={() => {
            setMode("sign-up");
            setError(null);
          }}
        >
          <UserPlus data-icon="inline-start" />
          注册
        </Button>
      </div>

      <div className={cn("grid gap-2", fieldClassName)}>
        <Label htmlFor={emailFieldId}>邮箱地址</Label>
        <Input
          id={emailFieldId}
          type="email"
          name="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          required
          className={inputClassName}
        />
      </div>

      <div className={cn("grid gap-2", fieldClassName)}>
        <Label htmlFor={passwordFieldId}>密码</Label>
        <Input
          id={passwordFieldId}
          type="password"
          name="password"
          autoComplete={isSignUp ? "new-password" : "current-password"}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="至少 8 位"
          minLength={8}
          required
          className={inputClassName}
        />
      </div>

      {error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <Button type="submit" disabled={isPending} className={buttonClassName}>
        {isPending ? (
          <Loader2 data-icon="inline-start" className="animate-spin" />
        ) : isSignUp ? (
          <UserPlus data-icon="inline-start" />
        ) : (
          <LogIn data-icon="inline-start" />
        )}
        {isSignUp ? "注册并进入" : "登录"}
      </Button>
    </form>
  );
}
