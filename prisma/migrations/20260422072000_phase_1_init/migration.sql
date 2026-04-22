-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "FormulaRelationType" AS ENUM ('prerequisite', 'related', 'confusable', 'application_of');

-- CreateEnum
CREATE TYPE "ReviewItemType" AS ENUM ('recall', 'recognition', 'application');

-- CreateEnum
CREATE TYPE "ReviewResult" AS ENUM ('easy', 'good', 'hard', 'again');

-- CreateEnum
CREATE TYPE "MemoryHookSource" AS ENUM ('ai_suggested', 'user_created');

-- CreateEnum
CREATE TYPE "MemoryHookType" AS ENUM ('analogy', 'scenario', 'visual', 'mnemonic', 'contrast', 'personal');

-- CreateEnum
CREATE TYPE "StudySessionStatus" AS ENUM ('active', 'completed', 'abandoned');

-- CreateEnum
CREATE TYPE "ProductEventType" AS ENUM ('weak_formula_impression', 'weak_formula_opened');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "displayName" TEXT,
    "anonymousSessionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "formulas" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "expressionLatex" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "subdomain" TEXT,
    "oneLineUse" TEXT NOT NULL,
    "meaning" TEXT NOT NULL,
    "intuition" TEXT,
    "derivation" TEXT,
    "useConditions" TEXT[],
    "nonUseConditions" TEXT[],
    "antiPatterns" TEXT[],
    "typicalProblems" TEXT[],
    "examples" TEXT[],
    "difficulty" INTEGER NOT NULL,
    "tags" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "formulas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "formula_variables" (
    "id" TEXT NOT NULL,
    "formulaId" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "unit" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "formula_variables_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "formula_relations" (
    "id" TEXT NOT NULL,
    "fromFormulaId" TEXT NOT NULL,
    "toFormulaId" TEXT NOT NULL,
    "relationType" "FormulaRelationType" NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "formula_relations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "review_items" (
    "id" TEXT NOT NULL,
    "formulaId" TEXT NOT NULL,
    "type" "ReviewItemType" NOT NULL,
    "prompt" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "explanation" TEXT,
    "difficulty" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "review_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_formula_states" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "formulaId" TEXT NOT NULL,
    "memoryStrength" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "stability" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "difficultyEstimate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lastReviewedAt" TIMESTAMP(3),
    "nextReviewAt" TIMESTAMP(3),
    "totalReviews" INTEGER NOT NULL DEFAULT 0,
    "correctReviews" INTEGER NOT NULL DEFAULT 0,
    "lapseCount" INTEGER NOT NULL DEFAULT 0,
    "consecutiveCorrect" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_formula_states_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "review_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "formulaId" TEXT NOT NULL,
    "reviewItemId" TEXT NOT NULL,
    "studySessionId" TEXT,
    "result" "ReviewResult" NOT NULL,
    "responseTimeMs" INTEGER,
    "confidence" INTEGER,
    "memoryHookUsedId" TEXT,
    "reviewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "review_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "diagnostic_attempts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "reviewItemIds" TEXT[],
    "weakFormulaIds" TEXT[],
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "diagnostic_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "formula_memory_hooks" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "formulaId" TEXT NOT NULL,
    "source" "MemoryHookSource" NOT NULL,
    "type" "MemoryHookType" NOT NULL,
    "content" TEXT NOT NULL,
    "prompt" TEXT,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "helpfulCount" INTEGER NOT NULL DEFAULT 0,
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "formula_memory_hooks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "study_sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "status" "StudySessionStatus" NOT NULL DEFAULT 'active',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "study_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_events" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "formulaId" TEXT,
    "studySessionId" TEXT,
    "type" "ProductEventType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_anonymousSessionId_key" ON "users"("anonymousSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "formulas_slug_key" ON "formulas"("slug");

-- CreateIndex
CREATE INDEX "formulas_domain_subdomain_idx" ON "formulas"("domain", "subdomain");

-- CreateIndex
CREATE INDEX "formula_variables_formulaId_idx" ON "formula_variables"("formulaId");

-- CreateIndex
CREATE INDEX "formula_relations_toFormulaId_idx" ON "formula_relations"("toFormulaId");

-- CreateIndex
CREATE UNIQUE INDEX "formula_relations_fromFormulaId_toFormulaId_relationType_key" ON "formula_relations"("fromFormulaId", "toFormulaId", "relationType");

-- CreateIndex
CREATE INDEX "review_items_formulaId_type_idx" ON "review_items"("formulaId", "type");

-- CreateIndex
CREATE INDEX "user_formula_states_formulaId_idx" ON "user_formula_states"("formulaId");

-- CreateIndex
CREATE UNIQUE INDEX "user_formula_states_userId_formulaId_key" ON "user_formula_states"("userId", "formulaId");

-- CreateIndex
CREATE INDEX "review_logs_userId_reviewedAt_idx" ON "review_logs"("userId", "reviewedAt");

-- CreateIndex
CREATE INDEX "review_logs_formulaId_idx" ON "review_logs"("formulaId");

-- CreateIndex
CREATE INDEX "diagnostic_attempts_userId_completedAt_idx" ON "diagnostic_attempts"("userId", "completedAt");

-- CreateIndex
CREATE INDEX "formula_memory_hooks_formulaId_userId_idx" ON "formula_memory_hooks"("formulaId", "userId");

-- CreateIndex
CREATE INDEX "study_sessions_userId_startedAt_idx" ON "study_sessions"("userId", "startedAt");

-- CreateIndex
CREATE INDEX "product_events_userId_type_createdAt_idx" ON "product_events"("userId", "type", "createdAt");

-- CreateIndex
CREATE INDEX "product_events_formulaId_type_idx" ON "product_events"("formulaId", "type");

-- AddForeignKey
ALTER TABLE "formula_variables" ADD CONSTRAINT "formula_variables_formulaId_fkey" FOREIGN KEY ("formulaId") REFERENCES "formulas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "formula_relations" ADD CONSTRAINT "formula_relations_fromFormulaId_fkey" FOREIGN KEY ("fromFormulaId") REFERENCES "formulas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "formula_relations" ADD CONSTRAINT "formula_relations_toFormulaId_fkey" FOREIGN KEY ("toFormulaId") REFERENCES "formulas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_items" ADD CONSTRAINT "review_items_formulaId_fkey" FOREIGN KEY ("formulaId") REFERENCES "formulas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_formula_states" ADD CONSTRAINT "user_formula_states_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_formula_states" ADD CONSTRAINT "user_formula_states_formulaId_fkey" FOREIGN KEY ("formulaId") REFERENCES "formulas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_logs" ADD CONSTRAINT "review_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_logs" ADD CONSTRAINT "review_logs_formulaId_fkey" FOREIGN KEY ("formulaId") REFERENCES "formulas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_logs" ADD CONSTRAINT "review_logs_reviewItemId_fkey" FOREIGN KEY ("reviewItemId") REFERENCES "review_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_logs" ADD CONSTRAINT "review_logs_studySessionId_fkey" FOREIGN KEY ("studySessionId") REFERENCES "study_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_logs" ADD CONSTRAINT "review_logs_memoryHookUsedId_fkey" FOREIGN KEY ("memoryHookUsedId") REFERENCES "formula_memory_hooks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diagnostic_attempts" ADD CONSTRAINT "diagnostic_attempts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "formula_memory_hooks" ADD CONSTRAINT "formula_memory_hooks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "formula_memory_hooks" ADD CONSTRAINT "formula_memory_hooks_formulaId_fkey" FOREIGN KEY ("formulaId") REFERENCES "formulas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_sessions" ADD CONSTRAINT "study_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_events" ADD CONSTRAINT "product_events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_events" ADD CONSTRAINT "product_events_formulaId_fkey" FOREIGN KEY ("formulaId") REFERENCES "formulas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_events" ADD CONSTRAINT "product_events_studySessionId_fkey" FOREIGN KEY ("studySessionId") REFERENCES "study_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
