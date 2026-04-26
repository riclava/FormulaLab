import assert from "node:assert/strict";
import { describe, it } from "node:test";

const baseUrl = process.env.E2E_BASE_URL;
const authCookie = process.env.E2E_AUTH_COOKIE;
const maybeIt = baseUrl && authCookie ? it : it.skip;
const maybeBaseUrlIt = baseUrl ? it : it.skip;

describe("critical learning path", () => {
  maybeBaseUrlIt("rejects unauthenticated formula field completion requests", async () => {
    assert.ok(baseUrl);

    const response = await fetch(new URL("/api/formulas/field-completion", baseUrl), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        variant: "custom",
        mode: "create",
        target: "title",
        currentValue: "",
        formula: {},
      }),
    });

    assert.equal(response.status, 401);
  });

  maybeIt("walks diagnostic to review summary through API smoke checks", async () => {
    assert.ok(baseUrl);
    assert.ok(authCookie);

    const cookieJar = new Map<string, string>();
    cookieJar.set(authCookie.split("=")[0], authCookie);

    const request = async (path: string, init?: RequestInit) => {
      const response = await fetch(new URL(path, baseUrl), {
        ...init,
        headers: {
          "Content-Type": "application/json",
          ...(cookieJar.size > 0
            ? { cookie: Array.from(cookieJar.values()).join("; ") }
            : {}),
          ...init?.headers,
        },
      });
      const setCookie = response.headers.get("set-cookie");

      if (setCookie) {
        const cookie = setCookie.split(";")[0];
        const [name] = cookie.split("=");
        cookieJar.set(name, cookie);
      }

      return response;
    };

    const diagnosticStart = await request("/api/diagnostic/start");
    assert.equal(diagnosticStart.status, 200);
    const diagnosticStartBody = (await diagnosticStart.json()) as {
      data: {
        domain: string;
        questions: Array<{
          id: string;
          formulaId: string;
        }>;
      };
    };
    assert.ok(diagnosticStartBody.data.questions.length > 0);

    const diagnosticSubmit = await request("/api/diagnostic/submit", {
      method: "POST",
      body: JSON.stringify({
        domain: diagnosticStartBody.data.domain,
        answers: diagnosticStartBody.data.questions.slice(0, 3).map((question) => ({
          reviewItemId: question.id,
          assessment: "none",
        })),
      }),
    });
    assert.equal(diagnosticSubmit.status, 200);

    const reviewToday = await request("/api/review/today");
    assert.equal(reviewToday.status, 200);
    const reviewTodayBody = (await reviewToday.json()) as {
      data: {
        sessionId: string | null;
        items: Array<{
          reviewItemId: string;
          formulaId: string;
        }>;
      };
    };
    assert.ok(reviewTodayBody.data.sessionId);
    assert.ok(reviewTodayBody.data.items.length > 0);

    const firstItem = reviewTodayBody.data.items[0];
    const hint = await request("/api/review/hint", {
      method: "POST",
      body: JSON.stringify({
        formulaId: firstItem.formulaId,
      }),
    });
    assert.equal(hint.status, 200);

    const submitReview = await request("/api/review/submit", {
      method: "POST",
      body: JSON.stringify({
        sessionId: reviewTodayBody.data.sessionId,
        reviewItemId: firstItem.reviewItemId,
        formulaId: firstItem.formulaId,
        result: "again",
        completed: true,
      }),
    });
    assert.equal(submitReview.status, 200);

    const defer = await request("/api/review/defer", {
      method: "POST",
      body: JSON.stringify({
        formulaId: firstItem.formulaId,
        minutes: 10,
      }),
    });
    assert.equal(defer.status, 200);

    const summary = await request("/api/stats/summary");
    assert.equal(summary.status, 200);
    const summaryBody = (await summary.json()) as {
      data: {
        advancedStats: {
          totalReviews: number;
        };
        learningRecommendations: Array<{
          href: string;
        }>;
      };
    };
    assert.ok(summaryBody.data.advancedStats.totalReviews >= 1);
    assert.ok(summaryBody.data.learningRecommendations.length > 0);

    const weakReview = await request("/api/review/today?mode=weak");
    assert.equal(weakReview.status, 200);
    const weakReviewBody = (await weakReview.json()) as {
      data: {
        mode: string;
        items: Array<unknown>;
      };
    };
    assert.equal(weakReviewBody.data.mode, "weak");
    assert.ok(weakReviewBody.data.items.length > 0);

    const customTitle = `测试自定义公式 ${Date.now()}`;
    const createFormula = await request("/api/formulas", {
      method: "POST",
      body: JSON.stringify({
        title: customTitle,
        expressionLatex: "a+b=b+a",
        domain: "测试公式",
        oneLineUse: "验证加法交换律。",
        meaning: "两个数相加时交换顺序，总和不变。",
        derivation: "由加法定义可知两个加数的位置不影响总和。",
        tags: ["test-custom"],
        memoryHook: "换位置，总和不变。",
      }),
    });
    assert.equal(createFormula.status, 201);
    const createFormulaBody = (await createFormula.json()) as {
      data: {
        slug: string;
        reviewItemCount: number;
      };
    };
    assert.ok(createFormulaBody.data.slug);
    assert.equal(createFormulaBody.data.reviewItemCount, 3);
  });
});
