import { createChatCompletion } from "@/server/services/openai-compatible-client";
import {
  getFormulaDetail,
  normalizeFormulaPlotConfig,
  saveFormulaPlotConfig,
} from "@/server/services/formula-service";
import type { FormulaDetail, FormulaPlotConfig } from "@/types/formula";

export async function generateAndSaveFormulaPlotConfig({
  formulaIdOrSlug,
  userId,
}: {
  formulaIdOrSlug: string;
  userId?: string;
}) {
  const formula = await getFormulaDetail({
    idOrSlug: formulaIdOrSlug,
    userId,
  });

  if (!formula) {
    return null;
  }

  const plotConfig = await generateFormulaPlotConfig(formula);

  return saveFormulaPlotConfig({
    formulaIdOrSlug,
    userId,
    plotConfig,
  });
}

async function generateFormulaPlotConfig(
  formula: FormulaDetail,
): Promise<FormulaPlotConfig> {
  const content = await createChatCompletion({
    messages: [
      {
        role: "system",
        content: [
          "你是 FormulaLab 的数学可视化配置助手。",
          "请根据公式详情生成一个能帮助中文学习者理解公式的交互曲线配置。",
          "必须只返回严格 JSON object，不要 Markdown，不要解释文字。",
          "只支持 type=explicit，即 y=f(x)。如果原公式不是 y=f(x)，请选择一个最能表达公式关系的教学变量作为 x。",
          "y.expression 必须是 mathjs 可解析表达式，只能使用 x、参数名、数字、括号、+ - * / ^、以及常见函数 sqrt, exp, log, sin, cos, tan, abs。",
          "参数名必须使用 ASCII 字母、数字或下划线，不要使用希腊字母或中文。",
          "坐标范围要保守，避免巨大数值，默认曲线应能在 viewBox 中看清。",
        ].join("\n"),
      },
      {
        role: "user",
        content: buildPlotConfigPrompt(formula),
      },
    ],
    responseFormat: { type: "json_object" },
  });

  const value = parseJsonContent(content);
  const plotConfig = normalizeFormulaPlotConfig(readPlotConfig(value));

  if (!plotConfig) {
    throw new Error("AI returned an invalid plot config");
  }

  return plotConfig;
}

function buildPlotConfigPrompt(formula: FormulaDetail) {
  return [
    "请为下面公式生成 FormulaLab plotConfig。",
    "",
    "必须返回 JSON object，字段结构如下：",
    "{",
    '  "type": "explicit",',
    '  "title": "简短中文标题",',
    '  "description": "一句中文说明，说明拖动参数能观察什么",',
    '  "x": { "min": -5, "max": 5, "label": "x轴含义" },',
    '  "y": { "expression": "a * x + b", "label": "y轴含义" },',
    '  "parameters": [',
    '    { "name": "a", "label": "a", "defaultValue": 1, "min": -5, "max": 5, "step": 0.1 }',
    "  ],",
    '  "viewBox": { "x": [-5, 5], "y": [-10, 10] }',
    "}",
    "",
    "公式信息：",
    `标题：${formula.title}`,
    `LaTeX：${formula.expressionLatex}`,
    `知识域：${formula.domain}${formula.subdomain ? ` / ${formula.subdomain}` : ""}`,
    `用途：${formula.oneLineUse}`,
    `含义：${formula.meaning}`,
    `直觉：${formula.intuition ?? ""}`,
    `适用条件：${formula.useConditions.join("；")}`,
    `常见误用：${formula.antiPatterns.join("；")}`,
    "变量：",
    ...formula.variables.map(
      (variable) =>
        `- ${variable.symbol}: ${variable.name}。${variable.description}`,
    ),
    "",
    "生成要求：",
    "- 优先生成连续曲线；概率类公式的 x/y 范围通常在 0 到 1。",
    "- 如果公式本身抽象，请构造一个能说明公式机制的教学模型。",
    "- parameters 数量控制在 1 到 4 个。",
    "- expression 不要写 LaTeX，不要写等号左边，只写右边可计算表达式。",
  ].join("\n");
}

function readPlotConfig(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return value;
  }

  const record = value as Record<string, unknown>;
  return record.plotConfig ?? value;
}

function parseJsonContent(content: string) {
  const trimmed = content.trim();
  const fencedJson = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  const jsonText = fencedJson?.[1] ?? trimmed;
  return JSON.parse(jsonText) as unknown;
}
