-- Repair migration for environments that applied the original Phase 1
-- migration before later V1 schema additions were folded into it.

ALTER TABLE "formulas"
ADD COLUMN IF NOT EXISTS "nonUseConditions" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

ALTER TABLE "formulas"
ALTER COLUMN "nonUseConditions" DROP DEFAULT;

DO $$
BEGIN
  CREATE TYPE "ProductEventType" AS ENUM ('weak_formula_impression', 'weak_formula_opened');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "product_events" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "formulaId" TEXT,
  "studySessionId" TEXT,
  "type" "ProductEventType" NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "product_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "product_events_userId_type_createdAt_idx"
ON "product_events"("userId", "type", "createdAt");

CREATE INDEX IF NOT EXISTS "product_events_formulaId_type_idx"
ON "product_events"("formulaId", "type");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'product_events_userId_fkey'
  ) THEN
    ALTER TABLE "product_events"
    ADD CONSTRAINT "product_events_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'product_events_formulaId_fkey'
  ) THEN
    ALTER TABLE "product_events"
    ADD CONSTRAINT "product_events_formulaId_fkey"
    FOREIGN KEY ("formulaId") REFERENCES "formulas"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'product_events_studySessionId_fkey'
  ) THEN
    ALTER TABLE "product_events"
    ADD CONSTRAINT "product_events_studySessionId_fkey"
    FOREIGN KEY ("studySessionId") REFERENCES "study_sessions"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
