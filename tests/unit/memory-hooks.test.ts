import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { sortMemoryHooksForPrompt } from "../../src/lib/memory-hooks";
import type { MemoryHookRecord } from "../../src/types/memory-hook";

function hook(overrides: Partial<MemoryHookRecord>): MemoryHookRecord {
  return {
    id: overrides.id ?? "hook",
    source: overrides.source ?? "ai_suggested",
    type: overrides.type ?? "mnemonic",
    content: overrides.content ?? "content",
    prompt: overrides.prompt ?? null,
    usedCount: overrides.usedCount ?? 0,
    helpfulCount: overrides.helpfulCount ?? 0,
    lastUsedAt: overrides.lastUsedAt ?? null,
  };
}

describe("memory hook prompt ordering", () => {
  it("prioritizes user-created hooks over AI suggestions", () => {
    const sorted = sortMemoryHooksForPrompt([
      hook({ id: "ai", source: "ai_suggested", helpfulCount: 99 }),
      hook({ id: "user", source: "user_created", helpfulCount: 1 }),
    ]);

    assert.equal(sorted[0].id, "user");
  });

  it("sorts hooks by helpfulness, usage, and recency inside a source", () => {
    const sorted = sortMemoryHooksForPrompt([
      hook({
        id: "older",
        source: "user_created",
        helpfulCount: 2,
        usedCount: 2,
        lastUsedAt: "2026-04-20T00:00:00.000Z",
      }),
      hook({
        id: "helpful",
        source: "user_created",
        helpfulCount: 3,
        usedCount: 1,
        lastUsedAt: "2026-04-19T00:00:00.000Z",
      }),
      hook({
        id: "recent",
        source: "user_created",
        helpfulCount: 2,
        usedCount: 2,
        lastUsedAt: "2026-04-21T00:00:00.000Z",
      }),
    ]);

    assert.deepEqual(
      sorted.map((item) => item.id),
      ["helpful", "recent", "older"],
    );
  });
});
