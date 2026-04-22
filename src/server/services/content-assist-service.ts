import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { getFormulaDetail, getFormulaRelationDetails, getFormulaSummaries } from "@/server/services/formula-service";
import type { FormulaDetail, FormulaRelationDetail } from "@/types/formula";
import type {
  ContentAssistDraft,
  ContentAssistMemoryHookDraft,
  ContentAssistRelationDraft,
  ContentAssistReviewItemDraft,
  ContentAssistWorkspaceItem,
} from "@/types/content-assist";

const CONTENT_ASSIST_ROOT = path.join(process.cwd(), "content-assist");
const DRAFTS_DIR = path.join(CONTENT_ASSIST_ROOT, "drafts");
const APPROVED_DIR = path.join(CONTENT_ASSIST_ROOT, "approved");

export async function listContentAssistWorkspace(): Promise<ContentAssistWorkspaceItem[]> {
  const [formulas, drafts] = await Promise.all([
    getFormulaSummaries(),
    readAllDrafts(),
  ]);
  const draftsBySlug = new Map(drafts.map((draft) => [draft.formulaSlug, draft]));

  return formulas.map((formula) => {
    const draft = draftsBySlug.get(formula.slug);

    return {
      formulaId: formula.id,
      formulaSlug: formula.slug,
      title: formula.title,
      domain: formula.domain,
      oneLineUse: formula.oneLineUse,
      difficulty: formula.difficulty,
      draftStatus: draft?.status ?? null,
      draftUpdatedAt: draft?.updatedAt ?? null,
      approvedAt: draft?.approvedAt ?? null,
    };
  });
}

export async function getContentAssistDraft({
  formulaIdOrSlug,
}: {
  formulaIdOrSlug: string;
}) {
  const formula = await getFormulaDetail(formulaIdOrSlug);

  if (!formula) {
    return null;
  }

  const existingDraft = await readDraft(formula.slug);

  if (existingDraft) {
    return {
      formula,
      draft: existingDraft,
    };
  }

  const draft = await generateContentAssistDraft({
    formula,
  });

  return {
    formula,
    draft,
  };
}

export async function regenerateContentAssistDraft({
  formulaIdOrSlug,
}: {
  formulaIdOrSlug: string;
}) {
  const formula = await getFormulaDetail(formulaIdOrSlug);

  if (!formula) {
    return null;
  }

  const draft = await generateContentAssistDraft({
    formula,
  });

  return {
    formula,
    draft,
  };
}

export async function updateContentAssistDraft({
  formulaSlug,
  input,
}: {
  formulaSlug: string;
  input: ContentAssistDraft;
}) {
  const formula = await getFormulaDetail(formulaSlug);

  if (!formula) {
    return null;
  }

  const nextDraft: ContentAssistDraft = {
    ...input,
    schemaVersion: 1,
    formulaId: formula.id,
    formulaSlug: formula.slug,
    formulaTitle: formula.title,
    formulaDomain: formula.domain,
    updatedAt: new Date().toISOString(),
  };

  await saveDraft(nextDraft);

  return nextDraft;
}

export async function approveContentAssistDraft(formulaSlug: string) {
  const existingDraft = await readDraft(formulaSlug);

  if (!existingDraft) {
    return null;
  }

  const approvedDraft: ContentAssistDraft = {
    ...existingDraft,
    status: "approved",
    approvedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await Promise.all([
    saveDraft(approvedDraft),
    saveApprovedDraft(approvedDraft),
  ]);

  return approvedDraft;
}

export async function readApprovedContentAssistDrafts() {
  await ensureContentAssistDirectories();
  const files = await readdir(APPROVED_DIR, { withFileTypes: true });
  const drafts = await Promise.all(
    files
      .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
      .map(async (entry) => {
        const filePath = path.join(APPROVED_DIR, entry.name);
        const content = await readFile(filePath, "utf8");
        return JSON.parse(content) as ContentAssistDraft;
      }),
  );

  return drafts.sort((left, right) =>
    right.updatedAt.localeCompare(left.updatedAt),
  );
}

async function generateContentAssistDraft({
  formula,
}: {
  formula: FormulaDetail;
}) {
  const relations = (await getFormulaRelationDetails(formula.slug)) ?? [];
  const relationCandidates =
    relations.length > 0
      ? relations.map(toRelationCandidate)
      : await buildDerivedRelationCandidates(formula);
  const draft: ContentAssistDraft = {
    schemaVersion: 1,
    formulaId: formula.id,
    formulaSlug: formula.slug,
    formulaTitle: formula.title,
    formulaDomain: formula.domain,
    status: "draft",
    generator: {
      id: "heuristic-v1",
      label: "Heuristic Content Assist v1",
    },
    generatedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    approvedAt: null,
    reviewerNotes: "",
    explanation: {
      oneLineUse: formula.oneLineUse,
      meaning: formula.meaning,
      useConditions:
        formula.useConditions.length > 0
          ? formula.useConditions
          : buildUseConditionFallback(formula),
      nonUseConditions:
        formula.nonUseConditions.length > 0
          ? formula.nonUseConditions
          : buildNonUseConditionFallback(formula),
      antiPatterns:
        formula.antiPatterns.length > 0
          ? formula.antiPatterns
          : buildAntiPatternFallback(formula),
      typicalProblems:
        formula.typicalProblems.length > 0
          ? formula.typicalProblems
          : buildTypicalProblemFallback(formula),
      variableExplanations: formula.variables.map((variable) => ({
        symbol: variable.symbol,
        name: variable.name,
        description:
          variable.description ||
          `${variable.name} 是 ${formula.title} 中需要先确认含义再代入的变量。`,
        unit: variable.unit,
      })),
    },
    reviewItems: buildReviewItemDrafts(formula),
    relationCandidates,
    memoryHookCandidates: buildMemoryHookCandidates(formula),
  };

  await saveDraft(draft);

  return draft;
}

async function buildDerivedRelationCandidates(formula: FormulaDetail) {
  const peers = await getFormulaSummaries({
    domain: formula.domain,
  });

  return peers
    .filter((candidate) => candidate.slug !== formula.slug)
    .map((candidate) => ({
      candidate,
      overlapScore: candidate.tags.filter((tag) => formula.tags.includes(tag)).length,
    }))
    .filter((candidate) => candidate.overlapScore > 0)
    .sort((left, right) => {
      if (right.overlapScore !== left.overlapScore) {
        return right.overlapScore - left.overlapScore;
      }

      return left.candidate.difficulty - right.candidate.difficulty;
    })
    .slice(0, 3)
    .map(({ candidate }) => ({
      toSlug: candidate.slug,
      toTitle: candidate.title,
      relationType:
        candidate.subdomain && formula.subdomain && candidate.subdomain === formula.subdomain
          ? "confusable"
          : "related",
      note:
        candidate.subdomain && formula.subdomain && candidate.subdomain === formula.subdomain
          ? `两条公式都在 ${formula.subdomain} 下，适合一起审查边界和误用。`
          : `两条公式都服务于 ${formula.domain}，可以一起整理应用链路。`,
    })) satisfies ContentAssistRelationDraft[];
}

function buildReviewItemDrafts(formula: FormulaDetail): ContentAssistReviewItemDraft[] {
  const existingByType = new Map(formula.reviewItems.map((item) => [item.type, item]));

  return [
    {
      type: "recall",
      prompt:
        existingByType.get("recall")?.prompt ??
        `写出 ${formula.title} 的核心表达式，并说明它什么时候该用。`,
      answer:
        existingByType.get("recall")?.answer ?? formula.expressionLatex,
      explanation:
        existingByType.get("recall")?.explanation ??
        formula.oneLineUse,
      difficulty: existingByType.get("recall")?.difficulty ?? Math.max(1, formula.difficulty - 1),
    },
    {
      type: "recognition",
      prompt:
        existingByType.get("recognition")?.prompt ??
        `题目出现“${formula.typicalProblems[0] ?? formula.useConditions[0] ?? formula.domain}”时，应优先想到哪条公式？`,
      answer:
        existingByType.get("recognition")?.answer ?? formula.title,
      explanation:
        existingByType.get("recognition")?.explanation ??
        `这是 ${formula.title} 的典型触发信号，先确认 ${formula.useConditions[0] ?? "条件方向"}。`,
      difficulty: existingByType.get("recognition")?.difficulty ?? formula.difficulty,
    },
    {
      type: "application",
      prompt:
        existingByType.get("application")?.prompt ??
        formula.examples[0] ??
        `请根据 ${formula.title} 设计一个小题，并演示如何代入求解。`,
      answer:
        existingByType.get("application")?.answer ??
        `${formula.oneLineUse}。先确认 ${formula.useConditions[0] ?? "使用条件"}，再按公式结构代入。`,
      explanation:
        existingByType.get("application")?.explanation ??
        `${formula.antiPatterns[0] ?? "先确认边界，再代入计算。"}。`,
      difficulty: existingByType.get("application")?.difficulty ?? Math.max(formula.difficulty, 2),
    },
  ];
}

function buildMemoryHookCandidates(formula: FormulaDetail): ContentAssistMemoryHookDraft[] {
  const hooksByType = new Map(formula.memoryHooks.map((hook) => [hook.type, hook]));

  return [
    {
      type: "analogy",
      content:
        hooksByType.get("analogy")?.content ??
        `把 ${formula.title} 想成“${formula.oneLineUse}”这件事的快捷模板。`,
      prompt:
        hooksByType.get("analogy")?.prompt ??
        "用熟悉动作来类比公式用途。",
    },
    {
      type: "scenario",
      content:
        hooksByType.get("scenario")?.content ??
        `当题目出现“${formula.typicalProblems[0] ?? formula.domain}”这类场景时，先想到 ${formula.title}。`,
      prompt:
        hooksByType.get("scenario")?.prompt ??
        "绑定一个常见题型或生活场景。",
    },
    {
      type: "visual",
      content:
        hooksByType.get("visual")?.content ??
        `先在脑中放一个画面：${formula.examples[0] ?? formula.oneLineUse}`,
      prompt:
        hooksByType.get("visual")?.prompt ??
        "用图像化画面帮助回忆。",
    },
    {
      type: "mnemonic",
      content:
        hooksByType.get("mnemonic")?.content ??
        `${formula.title}：先看条件，再按结构一步步代入。`,
      prompt:
        hooksByType.get("mnemonic")?.prompt ??
        "压成一句做题时能默念的短句。",
    },
    {
      type: "contrast",
      content:
        hooksByType.get("contrast")?.content ??
        `先提醒自己：${formula.antiPatterns[0] ?? formula.nonUseConditions[0] ?? formula.useConditions[0] ?? formula.oneLineUse}`,
      prompt:
        hooksByType.get("contrast")?.prompt ??
        "把最常见的误用点变成反向提醒。",
    },
  ];
}

function buildUseConditionFallback(formula: FormulaDetail) {
  return [
    `题目目标与“${formula.oneLineUse}”一致时优先考虑 ${formula.title}。`,
    formula.typicalProblems[0]
      ? `看到“${formula.typicalProblems[0]}”这类题型时，可以先检查 ${formula.title} 是否适用。`
      : `先确认题目是不是在求 ${formula.title} 处理的那类关系。`,
  ];
}

function buildNonUseConditionFallback(formula: FormulaDetail) {
  return [
    formula.antiPatterns[0]
      ? `如果你准备直接这样做：“${formula.antiPatterns[0]}”，通常说明现在不该直接套 ${formula.title}。`
      : `如果题目目标不是“${formula.oneLineUse}”，先不要直接套 ${formula.title}。`,
  ];
}

function buildAntiPatternFallback(formula: FormulaDetail) {
  return [
    `不要在没确认条件方向前就直接套 ${formula.title}。`,
    `代入前先检查变量含义是否和 ${formula.title} 中的定义一致。`,
    `如果题型更接近“${formula.typicalProblems[0] ?? formula.domain}”之外的场景，先确认是否换公式。`,
  ];
}

function buildTypicalProblemFallback(formula: FormulaDetail) {
  return [
    `${formula.domain} 中需要判断 ${formula.title} 适用边界的题。`,
  ];
}

function toRelationCandidate(relation: FormulaRelationDetail): ContentAssistRelationDraft {
  return {
    toSlug: relation.formula.slug,
    toTitle: relation.formula.title,
    relationType: relation.relationType,
    note: relation.note ?? "",
  };
}

async function readAllDrafts() {
  await ensureContentAssistDirectories();
  const files = await readdir(DRAFTS_DIR, { withFileTypes: true });
  const drafts = await Promise.all(
    files
      .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
      .map(async (entry) => {
        const filePath = path.join(DRAFTS_DIR, entry.name);
        const content = await readFile(filePath, "utf8");
        return JSON.parse(content) as ContentAssistDraft;
      }),
  );

  return drafts.sort((left, right) =>
    right.updatedAt.localeCompare(left.updatedAt),
  );
}

async function readDraft(formulaSlug: string) {
  await ensureContentAssistDirectories();
  const filePath = path.join(DRAFTS_DIR, `${formulaSlug}.json`);

  try {
    const content = await readFile(filePath, "utf8");
    return JSON.parse(content) as ContentAssistDraft;
  } catch {
    return null;
  }
}

async function saveDraft(draft: ContentAssistDraft) {
  await ensureContentAssistDirectories();
  const filePath = path.join(DRAFTS_DIR, `${draft.formulaSlug}.json`);
  await writeFile(filePath, `${JSON.stringify(draft, null, 2)}\n`, "utf8");
}

async function saveApprovedDraft(draft: ContentAssistDraft) {
  await ensureContentAssistDirectories();
  const filePath = path.join(APPROVED_DIR, `${draft.formulaSlug}.json`);
  await writeFile(filePath, `${JSON.stringify(draft, null, 2)}\n`, "utf8");
}

async function ensureContentAssistDirectories() {
  await Promise.all([
    mkdir(DRAFTS_DIR, { recursive: true }),
    mkdir(APPROVED_DIR, { recursive: true }),
  ]);
}
