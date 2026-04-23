import { createChatCompletion } from "@/server/services/openai-compatible-client";

export type GeneratedFormulaDraft = {
  title: string;
  expressionLatex: string;
  domain: string;
  subdomain: string;
  oneLineUse: string;
  meaning: string;
  derivation: string;
  difficulty: number;
  tags: string[];
  useConditions: string[];
  nonUseConditions: string[];
  antiPatterns: string[];
  typicalProblems: string[];
  examples: string[];
  memoryHook: string;
};

export async function generateFormulaDraft({
  prompt,
}: {
  prompt: string;
}): Promise<GeneratedFormulaDraft> {
  const content = await createChatCompletion({
    messages: [
      {
        role: "system",
        content: [
          "你是 FormulaLab 的公式内容整理助手。",
          "请把用户给出的公式、题目、笔记或学习目标整理成严格 JSON。",
          "面向中文学习者，内容要短、准、可直接进入间隔复习。",
          "LaTeX 只写表达式本体，不要包裹 $ 或 $$。",
          "如果信息不足，请做保守补全，并避免编造复杂背景。",
        ].join("\n"),
      },
      {
        role: "user",
        content: buildFormulaDraftPrompt(prompt),
      },
    ],
    responseFormat: { type: "json_object" },
    maxCompletionTokens: 1400,
  });

  return normalizeGeneratedFormulaDraft(parseJsonContent(content));
}

function buildFormulaDraftPrompt(prompt: string) {
  return [
    "请根据下面输入生成一个公式草稿。",
    "",
    "必须返回 JSON object，字段如下：",
    "{",
    '  "title": "公式标题",',
    '  "expressionLatex": "LaTeX表达式",',
    '  "domain": "知识域",',
    '  "subdomain": "子领域",',
    '  "oneLineUse": "一句话用途",',
    '  "meaning": "公式含义",',
    '  "derivation": "关键推导或直觉，可为空字符串",',
    '  "difficulty": 1到5的整数,',
    '  "tags": ["标签"],',
    '  "useConditions": ["什么时候用"],',
    '  "nonUseConditions": ["什么时候不能用"],',
    '  "antiPatterns": ["常见误用"],',
    '  "typicalProblems": ["典型题型"],',
    '  "examples": ["例题或应用场景"],',
    '  "memoryHook": "一句下次提示"',
    "}",
    "",
    "用户输入：",
    prompt,
  ].join("\n");
}

function parseJsonContent(content: string) {
  const trimmed = content.trim();
  const fencedJson = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  const jsonText = fencedJson?.[1] ?? trimmed;
  return JSON.parse(jsonText) as unknown;
}

function normalizeGeneratedFormulaDraft(value: unknown): GeneratedFormulaDraft {
  if (!value || typeof value !== "object") {
    throw new Error("AI returned an invalid formula draft");
  }

  const record = value as Record<string, unknown>;
  const title = toText(record.title);
  const expressionLatex = toText(record.expressionLatex);
  const oneLineUse = toText(record.oneLineUse);

  if (!title || !expressionLatex || !oneLineUse) {
    throw new Error("AI draft is missing title, expressionLatex or oneLineUse");
  }

  return {
    title,
    expressionLatex,
    domain: toText(record.domain) || "自定义公式",
    subdomain: toText(record.subdomain),
    oneLineUse,
    meaning: toText(record.meaning) || oneLineUse,
    derivation: toText(record.derivation),
    difficulty: clampInteger(Number(record.difficulty ?? 2), 1, 5),
    tags: toTextList(record.tags, ["custom"]),
    useConditions: toTextList(record.useConditions, [
      "题目中的条件与公式变量可以一一对应。",
    ]),
    nonUseConditions: toTextList(record.nonUseConditions, [
      "变量含义或前提条件无法确认时不要直接套用。",
    ]),
    antiPatterns: toTextList(record.antiPatterns, [
      "只记表达式但没有确认适用条件。",
    ]),
    typicalProblems: toTextList(record.typicalProblems, [
      `${title} 的基础识别和代入题。`,
    ]),
    examples: toTextList(record.examples, [
      `看到题目要求“${oneLineUse}”时，先判断是否可以使用 ${title}。`,
    ]),
    memoryHook: toText(record.memoryHook),
  };
}

function toText(value: unknown) {
  return typeof value === "string" || typeof value === "number"
    ? String(value).trim()
    : "";
}

function toTextList(value: unknown, fallback: string[]) {
  const list = Array.isArray(value)
    ? value.map(toText)
    : toText(value).split(/[\n,]/);
  const normalized = list.map((item) => item.trim()).filter(Boolean);
  return normalized.length > 0 ? normalized : fallback;
}

function clampInteger(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.max(min, Math.min(max, Math.round(value)));
}
