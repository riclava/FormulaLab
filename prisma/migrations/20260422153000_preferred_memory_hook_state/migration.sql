ALTER TABLE "user_formula_states"
ADD COLUMN IF NOT EXISTS "preferredMemoryHookId" TEXT;

CREATE INDEX IF NOT EXISTS "user_formula_states_preferredMemoryHookId_idx"
ON "user_formula_states"("preferredMemoryHookId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'user_formula_states_preferredMemoryHookId_fkey'
  ) THEN
    ALTER TABLE "user_formula_states"
    ADD CONSTRAINT "user_formula_states_preferredMemoryHookId_fkey"
    FOREIGN KEY ("preferredMemoryHookId") REFERENCES "formula_memory_hooks"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
