"use client";

import Link from "next/link";
import { ChevronDown, ShieldCheck, UserRound } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function AccountMenu({
  accountHref,
  email,
  isAdmin,
}: {
  accountHref: string;
  email: string;
  isAdmin: boolean;
}) {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      const target = event.target;

      if (target instanceof Node && !rootRef.current?.contains(target)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-controls={menuId}
        aria-expanded={open}
        aria-haspopup="menu"
        className={cn(
          buttonVariants({
            size: "sm",
            variant: "outline",
          }),
          "max-w-64 justify-start",
        )}
        onClick={() => setOpen((current) => !current)}
      >
        <UserRound data-icon="inline-start" />
        <span className="truncate">{email}</span>
        <ChevronDown data-icon="inline-end" className="ml-0.5" />
      </button>

      {open ? (
        <nav
          id={menuId}
          aria-label="账户菜单"
          className="absolute right-0 top-full z-30 mt-2 grid w-56 gap-1 rounded-xl border bg-background p-2 shadow-lg"
        >
          {isAdmin ? (
            <Link
              href="/admin/formulas"
              className={buttonVariants({
                size: "sm",
                variant: "ghost",
                className: "justify-start",
              })}
              onClick={() => setOpen(false)}
            >
              <ShieldCheck data-icon="inline-start" />
              维护后台
            </Link>
          ) : null}
          <Link
            href={accountHref}
            className={buttonVariants({
              size: "sm",
              variant: "ghost",
              className: "justify-start",
            })}
            onClick={() => setOpen(false)}
          >
            <UserRound data-icon="inline-start" />
            账号
          </Link>
        </nav>
      ) : null}
    </div>
  );
}
