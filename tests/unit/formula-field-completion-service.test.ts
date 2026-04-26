import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  normalizeSectionCompletionPatch,
  parseFormulaFieldCompletionContent,
  resolveSectionConfig,
} from "../../src/server/services/formula-field-completion-service";

describe("formula section completion normalization", () => {
  it("normalizes basics section fields", () => {
    assert.deepEqual(
      normalizeSectionCompletionPatch({
        target: "basics",
        rawPatch: {
          slug: " Bayes Theorem! ",
          title: "  贝叶斯公式  ",
          domain: "概率统计",
          difficulty: 8,
        },
      }),
      {
        slug: "bayes-theorem",
        title: "贝叶斯公式",
        domain: "概率统计",
        difficulty: 5,
      },
    );
  });

  it("preserves Chinese slug text when normalizing basics", () => {
    assert.deepEqual(
      normalizeSectionCompletionPatch({
        target: "basics",
        rawPatch: {
          slug: " 二项分布 ",
          title: "二项分布",
          domain: "概率统计",
          difficulty: 2,
        },
      }),
      {
        slug: "二项分布",
        title: "二项分布",
        domain: "概率统计",
        difficulty: 2,
      },
    );
  });

  it("ignores fields outside the requested section", () => {
    assert.deepEqual(
      normalizeSectionCompletionPatch({
        target: "previewCore",
        rawPatch: {
          title: "二项分布",
          expressionLatex: "P(X=k)=C_n^kp^k(1-p)^{n-k}",
          oneLineUse: "计算独立重复试验中成功 k 次的概率。",
          tags: ["不应写入"],
        },
      }),
      {
        title: "二项分布",
        expressionLatex: "P(X=k)=C_n^kp^k(1-p)^{n-k}",
        oneLineUse: "计算独立重复试验中成功 k 次的概率。",
      },
    );
  });

  it("normalizes list and nullable text fields", () => {
    assert.deepEqual(
      normalizeSectionCompletionPatch({
        target: "conditions",
        rawPatch: {
          useConditions: "事件互斥\n覆盖样本空间",
          nonUseConditions: [" 条件不完备 ", ""],
          antiPatterns: ["混淆条件概率"],
          typicalProblems: ["总概率计算"],
          intuition: "不应写入",
        },
      }),
      {
        useConditions: ["事件互斥", "覆盖样本空间"],
        nonUseConditions: ["条件不完备"],
        antiPatterns: ["混淆条件概率"],
        typicalProblems: ["总概率计算"],
      },
    );
  });

  it("normalizes variables section", () => {
    assert.deepEqual(
      normalizeSectionCompletionPatch({
        target: "variables",
        rawPatch: {
          variables: [
            {
              symbol: " n ",
              name: "试验次数",
              description: "独立伯努利试验的总次数。",
              unit: "",
            },
            {
              symbol: "",
              name: "无效",
              description: "缺少符号会被过滤。",
            },
          ],
        },
      }),
      {
        variables: [
          {
            symbol: "n",
            name: "试验次数",
            description: "独立伯努利试验的总次数。",
            unit: null,
          },
        ],
      },
    );
  });

  it("normalizes review items section", () => {
    assert.deepEqual(
      normalizeSectionCompletionPatch({
        target: "reviewItems",
        rawPatch: {
          reviewItems: [
            {
              type: "application",
              prompt: "如何代入？",
              answer: "先确认条件再代入。",
              explanation: "",
              difficulty: 9,
            },
            {
              type: "essay",
              prompt: "无效类型",
              answer: "会被过滤。",
            },
          ],
        },
      }),
      {
        reviewItems: [
          {
            type: "application",
            prompt: "如何代入？",
            answer: "先确认条件再代入。",
            explanation: null,
            difficulty: 5,
          },
        ],
      },
    );
  });

  it("validates relation targets against options", () => {
    assert.deepEqual(
      normalizeSectionCompletionPatch({
        target: "relations",
        relationOptions: [{ slug: "total-probability", title: "全概率公式" }],
        rawPatch: {
          relations: [
            {
              toSlug: "total-probability",
              relationType: "prerequisite",
              note: "常用于展开贝叶斯分母。",
            },
            {
              toSlug: "missing",
              relationType: "related",
              note: "无效目标会被过滤。",
            },
          ],
        },
      }),
      {
        relations: [
          {
            toSlug: "total-probability",
            relationType: "prerequisite",
            note: "常用于展开贝叶斯分母。",
          },
        ],
      },
    );
  });

  it("parses strict JSON section completion content", () => {
    assert.deepEqual(parseFormulaFieldCompletionContent('{ "patch": { "title": "ok" } }'), {
      title: "ok",
    });
    assert.deepEqual(
      parseFormulaFieldCompletionContent('```json\n{ "patch": { "title": "ok" } }\n```'),
      { title: "ok" },
    );
    assert.throws(() => parseFormulaFieldCompletionContent(""));
    assert.throws(() => parseFormulaFieldCompletionContent("not json"));
    assert.throws(() => parseFormulaFieldCompletionContent('{ "value": "ok" }'));
  });

  it("rejects unsupported sections and empty patches", () => {
    assert.throws(() => resolveSectionConfig("title"));
    assert.throws(() =>
      normalizeSectionCompletionPatch({
        target: "examples",
        rawPatch: {
          tags: ["wrong section"],
        },
      }),
    );
  });
});
