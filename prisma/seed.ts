import "dotenv/config";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

import { PrismaPg } from "@prisma/adapter-pg";

import {
  FormulaRelationType,
  PrismaClient,
  ReviewItemType,
} from "../src/generated/prisma/client";

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL ?? "",
  }),
});

type ApprovedContentAssistDraft = {
  formulaSlug: string;
  status: "draft" | "approved";
  explanation: {
    oneLineUse: string;
    meaning: string;
    useConditions: string[];
    nonUseConditions: string[];
    antiPatterns: string[];
    typicalProblems: string[];
    variableExplanations: Array<{
      symbol: string;
      name: string;
      description: string;
      unit?: string | null;
    }>;
  };
  reviewItems: Array<{
    type: ReviewItemType;
    prompt: string;
    answer: string;
    explanation: string;
    difficulty: number;
  }>;
  relationCandidates: Array<{
    toSlug: string;
    relationType: FormulaRelationType;
    note: string;
  }>;
};

const formulas = [
  {
    slug: "bayes-theorem",
    title: "贝叶斯定理",
    expressionLatex: "P(A \\mid B)=\\frac{P(B \\mid A)P(A)}{P(B)}",
    domain: "概率统计",
    subdomain: "条件概率",
    oneLineUse: "已知结果发生，反推导致该结果的某个原因的概率。",
    meaning:
      "贝叶斯定理把先验概率和观测到的证据结合起来，更新某个原因或假设成立的概率。",
    intuition:
      "它像一次证据更新：先有一个初始判断，再用新看到的结果重新调整判断。",
    derivation:
      "由条件概率定义 P(A|B)=P(A∩B)/P(B) 与 P(B|A)=P(A∩B)/P(A) 联立得到。",
    useConditions: [
      "题目要求从结果 B 反推原因 A 的概率。",
      "题目给出了 P(B|A) 这类正向条件概率，但要求 P(A|B)。",
      "分母 P(B) 可以直接给出，或能用全概率公式展开。",
    ],
    nonUseConditions: [
      "题目只要求结果 B 的总概率，而不是从结果反推原因。",
      "A 与 B 明确独立且直接有 P(A|B)=P(A)，无需额外反推。",
    ],
    antiPatterns: [
      "把 P(A|B) 和 P(B|A) 当成同一个概率。",
      "忘记用全概率公式展开 P(B)，只计算了分子。",
      "忽略先验概率 P(A)，导致罕见事件被高估。",
    ],
    typicalProblems: ["医疗检测", "质量检测", "垃圾邮件判断", "原因反推"],
    examples: [
      "某疾病发病率为 1%，检测对患病者阳性的概率为 99%，对未患病者误报阳性的概率为 5%。若检测阳性，求真正患病的概率。",
    ],
    plotConfig: {
      type: "explicit",
      title: "先验概率如何变成后验概率",
      description:
        "横轴是原因 A 的先验概率，拖动似然和误报率，观察同一次证据 B 会怎样改变后验概率。",
      x: {
        min: 0.001,
        max: 0.999,
        label: "P(A)",
      },
      y: {
        expression: "sensitivity * x / (sensitivity * x + falsePositive * (1 - x))",
        label: "P(A | B)",
      },
      parameters: [
        {
          name: "sensitivity",
          label: "P(B | A)",
          defaultValue: 0.99,
          min: 0.05,
          max: 1,
          step: 0.01,
        },
        {
          name: "falsePositive",
          label: "P(B | not A)",
          defaultValue: 0.05,
          min: 0.01,
          max: 0.8,
          step: 0.01,
        },
      ],
      viewBox: {
        x: [0, 1],
        y: [0, 1],
      },
    },
    difficulty: 3,
    tags: ["bayes", "conditional-probability", "inverse-inference"],
    variables: [
      {
        symbol: "P(A \\mid B)",
        name: "后验概率",
        description: "已知 B 发生后，A 发生的概率。",
      },
      {
        symbol: "P(B \\mid A)",
        name: "似然",
        description: "假设 A 发生时，B 发生的概率。",
      },
      {
        symbol: "P(A)",
        name: "先验概率",
        description: "没有观察到 B 之前，A 发生的概率。",
      },
      {
        symbol: "P(B)",
        name: "证据概率",
        description: "B 发生的总概率，常用全概率公式计算。",
      },
    ],
    reviewItems: [
      {
        type: ReviewItemType.recall,
        prompt: "写出贝叶斯定理的核心表达式。",
        answer: "P(A|B)=P(B|A)P(A)/P(B)",
        explanation: "注意竖线两侧的方向：它是从 B 反推 A。",
        difficulty: 2,
      },
      {
        type: ReviewItemType.recognition,
        prompt:
          "题目给出“患病时检测阳性的概率”，却要求“检测阳性时患病的概率”，应优先想到什么公式？",
        answer: "贝叶斯定理。",
        explanation: "这是典型的从结果反推原因。",
        difficulty: 2,
      },
      {
        type: ReviewItemType.application,
        prompt:
          "A 线生产 60% 零件，次品率 1%；B 线生产 40% 零件，次品率 2%。抽到一个次品，求它来自 A 线的概率。",
        answer:
          "P(A|次)=0.01*0.6/(0.01*0.6+0.02*0.4)=0.006/0.014=3/7。",
        explanation: "分母是抽到次品的总概率。",
        difficulty: 3,
      },
    ],
  },
  {
    slug: "law-of-total-probability",
    title: "全概率公式",
    expressionLatex: "P(B)=\\sum_i P(B \\mid A_i)P(A_i)",
    domain: "概率统计",
    subdomain: "条件概率",
    oneLineUse: "把一个结果的总概率拆成多个互斥原因路径再相加。",
    meaning:
      "当样本空间被一组互斥且完备的事件划分时，某个结果 B 的概率可以按每条路径加权求和。",
    intuition: "像树状图上每条通往 B 的路径概率相加。",
    derivation: "由 B=(B∩A1)∪...∪(B∩An) 且各部分互斥可得。",
    useConditions: [
      "原因集合 A_i 两两互斥且覆盖全部可能。",
      "题目要求某个结果 B 的总概率。",
      "每条路径的条件概率 P(B|A_i) 和权重 P(A_i) 可知。",
    ],
    nonUseConditions: [
      "题目要求的是 P(A|B) 这类反向条件概率时，不能只停在全概率公式。",
      "原因路径不是互斥且完备划分时，不能直接套用。",
    ],
    antiPatterns: [
      "原因集合没有覆盖全部情况。",
      "把不同路径概率直接相加但漏乘路径权重。",
      "和贝叶斯公式混淆，没有看清要求的是总概率还是反推原因。",
    ],
    typicalProblems: ["抽样来源混合", "生产线次品率", "分层人群事件率"],
    examples: [
      "A 线生产 60% 零件且次品率 1%，B 线生产 40% 零件且次品率 2%，随机抽到次品的总概率是多少？",
    ],
    plotConfig: {
      type: "explicit",
      title: "两条路径的加权平均",
      description:
        "横轴是一条路径的权重，曲线表示结果 B 的总概率；权重变化时，总概率会在线性加权中移动。",
      x: {
        min: 0,
        max: 1,
        label: "P(A)",
      },
      y: {
        expression: "rateWhenA * x + rateWhenNotA * (1 - x)",
        label: "P(B)",
      },
      parameters: [
        {
          name: "rateWhenA",
          label: "P(B | A)",
          defaultValue: 0.01,
          min: 0,
          max: 0.5,
          step: 0.01,
        },
        {
          name: "rateWhenNotA",
          label: "P(B | not A)",
          defaultValue: 0.02,
          min: 0,
          max: 0.5,
          step: 0.01,
        },
      ],
      viewBox: {
        x: [0, 1],
        y: [0, 0.5],
      },
    },
    difficulty: 2,
    tags: ["total-probability", "conditional-probability", "partition"],
    variables: [
      {
        symbol: "A_i",
        name: "原因划分",
        description: "一组互斥且完备的事件。",
      },
      {
        symbol: "P(B \\mid A_i)",
        name: "路径条件概率",
        description: "在原因 A_i 发生时，结果 B 发生的概率。",
      },
      {
        symbol: "P(A_i)",
        name: "路径权重",
        description: "原因 A_i 本身发生的概率。",
      },
    ],
    reviewItems: [
      {
        type: ReviewItemType.recall,
        prompt: "写出离散划分下的全概率公式。",
        answer: "P(B)=Σ P(B|A_i)P(A_i)",
        explanation: "每条路径先乘条件概率和路径权重，再求和。",
        difficulty: 2,
      },
      {
        type: ReviewItemType.recognition,
        prompt:
          "题目要求“随机抽到一个次品的总概率”，且给出各生产线占比和次品率，应优先想到什么公式？",
        answer: "全概率公式。",
        explanation: "生产线是互斥路径，次品是结果。",
        difficulty: 2,
      },
      {
        type: ReviewItemType.application,
        prompt: "A 线占 60%，次品率 1%；B 线占 40%，次品率 2%。求总体次品率。",
        answer: "0.6*0.01+0.4*0.02=0.014，即 1.4%。",
        explanation: "按两条来源路径加权求和。",
        difficulty: 2,
      },
    ],
  },
  {
    slug: "expectation-linearity",
    title: "期望的线性性质",
    expressionLatex: "E(aX+bY)=aE(X)+bE(Y)",
    domain: "概率统计",
    subdomain: "随机变量",
    oneLineUse: "把复杂随机变量的平均值拆成多个简单部分的平均值。",
    meaning:
      "无论随机变量是否独立，期望都满足线性加法和数乘规则。",
    intuition: "平均值可以先拆账再合账，不需要每个部分互不影响。",
    derivation: "由期望定义和求和/积分的线性性质得到。",
    useConditions: [
      "需要计算多个随机变量线性组合的期望。",
      "只涉及加法、减法和常数倍。",
      "不需要随机变量相互独立。",
    ],
    nonUseConditions: [
      "题目涉及乘积期望 E(XY) 时，不能直接把线性性套到乘法上。",
      "题目要求的是方差、协方差，而不是期望时，需要换公式。",
    ],
    antiPatterns: [
      "误以为必须独立才能使用期望线性性。",
      "把 E(XY)=E(X)E(Y) 也当成无条件成立。",
      "遗漏常数项的期望。",
    ],
    typicalProblems: ["总收益期望", "指示变量法", "抽奖平均收益"],
    examples: [
      "掷 10 次硬币，令 X 为正面次数，可把 X 拆成 10 个指示变量求期望。",
    ],
    plotConfig: {
      type: "explicit",
      title: "线性组合的期望",
      description:
        "横轴是 E(X)，拖动 a、b 和 E(Y)，观察线性组合的期望仍然保持直线变化。",
      x: {
        min: -5,
        max: 5,
        label: "E(X)",
      },
      y: {
        expression: "a * x + b * expectationY",
        label: "E(aX + bY)",
      },
      parameters: [
        {
          name: "a",
          label: "a",
          defaultValue: 1,
          min: -5,
          max: 5,
          step: 0.1,
        },
        {
          name: "b",
          label: "b",
          defaultValue: 1,
          min: -5,
          max: 5,
          step: 0.1,
        },
        {
          name: "expectationY",
          label: "E(Y)",
          defaultValue: 2,
          min: -5,
          max: 5,
          step: 0.1,
        },
      ],
      viewBox: {
        x: [-5, 5],
        y: [-10, 10],
      },
    },
    difficulty: 2,
    tags: ["expectation", "linearity", "random-variable"],
    variables: [
      {
        symbol: "E(X)",
        name: "X 的期望",
        description: "随机变量 X 的长期平均值。",
      },
      {
        symbol: "a,b",
        name: "常数系数",
        description: "线性组合中的固定倍数。",
      },
    ],
    reviewItems: [
      {
        type: ReviewItemType.recall,
        prompt: "写出两个随机变量线性组合的期望公式。",
        answer: "E(aX+bY)=aE(X)+bE(Y)",
        explanation: "不需要 X 与 Y 独立。",
        difficulty: 1,
      },
      {
        type: ReviewItemType.recognition,
        prompt: "计算总收益的平均值，收益可拆成多个部分相加，应优先想到什么性质？",
        answer: "期望的线性性质。",
        explanation: "平均值对加法和数乘保持线性。",
        difficulty: 1,
      },
      {
        type: ReviewItemType.application,
        prompt: "若 E(X)=3，E(Y)=5，求 E(2X-4Y+7)。",
        answer: "2*3-4*5+7=-7。",
        explanation: "常数 7 的期望仍是 7。",
        difficulty: 1,
      },
    ],
  },
  {
    slug: "variance-shift-scale",
    title: "方差的平移与缩放",
    expressionLatex: "\\operatorname{Var}(aX+b)=a^2\\operatorname{Var}(X)",
    domain: "概率统计",
    subdomain: "随机变量",
    oneLineUse: "判断随机变量线性变换后离散程度如何变化。",
    meaning:
      "加常数只移动中心，不改变离散程度；乘常数会让方差按常数平方缩放。",
    intuition: "整体平移不改变散开程度，拉伸两倍会让平方距离变成四倍。",
    derivation:
      "由 Var(X)=E[(X-E(X))^2] 代入 aX+b 后，b 与均值平移相互抵消，a 被平方提出。",
    useConditions: [
      "随机变量发生线性变换 aX+b。",
      "需要比较或计算方差。",
      "只讨论离散程度，不讨论均值本身。",
    ],
    nonUseConditions: [
      "题目要求期望线性变换时，不能把方差公式直接拿来用。",
      "线性变换之外的非线性函数（如 X²）不能直接套 Var(aX+b)。",
    ],
    antiPatterns: [
      "误以为加常数 b 会增加方差。",
      "忘记缩放系数 a 要平方。",
      "把方差变换和期望线性变换混在一起。",
    ],
    typicalProblems: ["标准化", "单位换算", "线性变换后的波动"],
    examples: [
      "若 Var(X)=9，求 Var(2X+10)。答案是 4*9=36。",
    ],
    plotConfig: {
      type: "explicit",
      title: "缩放系数平方放大方差",
      description:
        "横轴是缩放系数 a。平移 b 不改变方差，缩放会按 a 的平方改变离散程度。",
      x: {
        min: -5,
        max: 5,
        label: "a",
      },
      y: {
        expression: "x^2 * variance",
        label: "Var(aX + b)",
      },
      parameters: [
        {
          name: "variance",
          label: "Var(X)",
          defaultValue: 1,
          min: 0,
          max: 5,
          step: 0.1,
        },
      ],
      viewBox: {
        x: [-5, 5],
        y: [0, 25],
      },
    },
    difficulty: 2,
    tags: ["variance", "random-variable", "scale-shift"],
    variables: [
      {
        symbol: "\\operatorname{Var}(X)",
        name: "X 的方差",
        description: "随机变量 X 相对其均值的平均平方偏离。",
      },
      {
        symbol: "a",
        name: "缩放系数",
        description: "会以平方倍数影响方差。",
      },
      {
        symbol: "b",
        name: "平移常数",
        description: "只移动位置，不改变方差。",
      },
    ],
    reviewItems: [
      {
        type: ReviewItemType.recall,
        prompt: "写出 Var(aX+b) 的公式。",
        answer: "Var(aX+b)=a²Var(X)",
        explanation: "b 不影响方差，a 要平方。",
        difficulty: 2,
      },
      {
        type: ReviewItemType.recognition,
        prompt:
          "题目问单位换算后方差如何变化，例如 X 从米变成厘米，应想到哪个公式？",
        answer: "方差的平移与缩放公式。",
        explanation: "单位缩放会按比例的平方影响方差。",
        difficulty: 2,
      },
      {
        type: ReviewItemType.application,
        prompt: "若 Var(X)=4，求 Var(3X-2)。",
        answer: "Var(3X-2)=9*4=36。",
        explanation: "平移 -2 不影响方差。",
        difficulty: 2,
      },
    ],
  },
];

const relations: Array<{
  from: string;
  to: string;
  relationType: FormulaRelationType;
  note: string;
}> = [
  {
    from: "bayes-theorem",
    to: "law-of-total-probability",
    relationType: FormulaRelationType.prerequisite,
    note: "全概率公式常用于展开贝叶斯分母 P(B)。",
  },
  {
    from: "law-of-total-probability",
    to: "bayes-theorem",
    relationType: FormulaRelationType.related,
    note: "先算结果总概率，再支持反推原因。",
  },
  {
    from: "expectation-linearity",
    to: "variance-shift-scale",
    relationType: FormulaRelationType.confusable,
    note: "期望对 aX+b 是线性的，方差对缩放系数要平方且不受平移影响。",
  },
  {
    from: "variance-shift-scale",
    to: "expectation-linearity",
    relationType: FormulaRelationType.confusable,
    note: "不要把 Var(aX+b) 错写成 aVar(X)+b。",
  },
];

async function loadApprovedDrafts() {
  const approvedDir = path.join(process.cwd(), "content-assist", "approved");

  try {
    const entries = await readdir(approvedDir, { withFileTypes: true });
    const drafts = await Promise.all(
      entries
        .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
        .map(async (entry) => {
          const content = await readFile(path.join(approvedDir, entry.name), "utf8");
          return JSON.parse(content) as ApprovedContentAssistDraft;
        }),
    );

    return drafts.filter((draft) => draft.status === "approved");
  } catch {
    return [] as ApprovedContentAssistDraft[];
  }
}

function applyApprovedDrafts(
  baseFormulas: typeof formulas,
  baseRelations: typeof relations,
  approvedDrafts: ApprovedContentAssistDraft[],
) {
  const draftsBySlug = new Map(
    approvedDrafts.map((draft) => [draft.formulaSlug, draft]),
  );
  const nextFormulas = baseFormulas.map((formula) => {
    const approvedDraft = draftsBySlug.get(formula.slug);

    if (!approvedDraft) {
      return formula;
    }

    return {
      ...formula,
      oneLineUse: approvedDraft.explanation.oneLineUse,
      meaning: approvedDraft.explanation.meaning,
      useConditions: approvedDraft.explanation.useConditions,
      nonUseConditions: approvedDraft.explanation.nonUseConditions,
      antiPatterns: approvedDraft.explanation.antiPatterns,
      typicalProblems: approvedDraft.explanation.typicalProblems,
      variables: approvedDraft.explanation.variableExplanations.map((variable) => ({
        symbol: variable.symbol,
        name: variable.name,
        description: variable.description,
        unit: variable.unit ?? undefined,
      })),
      reviewItems: approvedDraft.reviewItems,
    };
  });
  const baseRelationKeys = new Set(
    baseRelations.map(
      (relation) => `${relation.from}:${relation.to}:${relation.relationType}`,
    ),
  );
  const nextRelations = [...baseRelations];

  for (const draft of approvedDrafts) {
    for (const relation of draft.relationCandidates) {
      const relationKey = `${draft.formulaSlug}:${relation.toSlug}:${relation.relationType}`;

      if (baseRelationKeys.has(relationKey)) {
        continue;
      }

      baseRelationKeys.add(relationKey);
      nextRelations.push({
        from: draft.formulaSlug,
        to: relation.toSlug,
        relationType: relation.relationType,
        note: relation.note,
      });
    }
  }

  return {
    formulas: nextFormulas,
    relations: nextRelations,
  };
}

async function main() {
  const approvedDrafts = await loadApprovedDrafts();
  const seeded = applyApprovedDrafts(formulas, relations, approvedDrafts);

  await prisma.reviewLog.deleteMany();
  await prisma.studySession.deleteMany();
  await prisma.diagnosticAttempt.deleteMany();
  await prisma.userFormulaState.deleteMany();
  await prisma.formulaMemoryHook.deleteMany();
  await prisma.reviewItem.deleteMany();
  await prisma.formulaVariable.deleteMany();
  await prisma.formulaRelation.deleteMany();
  await prisma.formula.deleteMany();

  const created = new Map<string, string>();

  for (const formula of seeded.formulas) {
    const item = await prisma.formula.create({
      data: {
        slug: formula.slug,
        title: formula.title,
        expressionLatex: formula.expressionLatex,
        domain: formula.domain,
        subdomain: formula.subdomain,
        oneLineUse: formula.oneLineUse,
        meaning: formula.meaning,
        intuition: formula.intuition,
        derivation: formula.derivation,
        useConditions: formula.useConditions,
        nonUseConditions: formula.nonUseConditions,
        antiPatterns: formula.antiPatterns,
        typicalProblems: formula.typicalProblems,
        examples: formula.examples,
        plotConfig: "plotConfig" in formula ? formula.plotConfig : undefined,
        difficulty: formula.difficulty,
        tags: formula.tags,
        variables: {
          create: formula.variables.map((variable, index) => ({
            ...variable,
            sortOrder: index,
          })),
        },
        reviewItems: {
          create: formula.reviewItems,
        },
      },
    });

    created.set(formula.slug, item.id);
  }

  for (const relation of seeded.relations) {
    const fromFormulaId = created.get(relation.from);
    const toFormulaId = created.get(relation.to);

    if (!fromFormulaId || !toFormulaId) {
      throw new Error(`Missing relation formula: ${relation.from} -> ${relation.to}`);
    }

    await prisma.formulaRelation.create({
      data: {
        fromFormulaId,
        toFormulaId,
        relationType: relation.relationType,
        note: relation.note,
      },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
