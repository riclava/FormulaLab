"use client";

import { compile } from "mathjs";
import { Coordinates, Mafs, Plot, Theme } from "mafs";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { FormulaPlotConfig } from "@/types/formula";

type ParameterValues = Record<string, number>;

export function FormulaCurveViewer({
  config,
  className,
}: {
  config: FormulaPlotConfig;
  className?: string;
}) {
  const [parameterValues, setParameterValues] = useState<ParameterValues>(() =>
    getInitialParameterValues(config),
  );

  const compiledExpression = useMemo(() => {
    if (!isExpressionAllowed(config.y.expression)) {
      return {
        code: null,
        error: "表达式包含暂不支持的字符。",
      };
    }

    try {
      return {
        code: compile(config.y.expression),
        error: null,
      };
    } catch {
      return {
        code: null,
        error: "表达式暂时无法解析。",
      };
    }
  }, [config.y.expression]);

  function evaluateY(x: number) {
    if (!compiledExpression.code) {
      return Number.NaN;
    }

    try {
      const result = compiledExpression.code.evaluate({
        ...parameterValues,
        x,
      });
      const value = Number(result);

      return Number.isFinite(value) ? value : Number.NaN;
    } catch {
      return Number.NaN;
    }
  }

  const xDomain: [number, number] = [config.x.min, config.x.max];
  const viewBox = {
    x: config.viewBox?.x ?? xDomain,
    y: config.viewBox?.y,
    padding: 0.5,
  };

  return (
    <div className={cn("grid gap-4", className)}>
      <div className="grid gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">自动曲线</Badge>
          <h3 className="font-medium">{config.title ?? "公式曲线"}</h3>
        </div>
        {config.description ? (
          <p className="text-sm leading-6 text-muted-foreground">{config.description}</p>
        ) : null}
      </div>

      <div className="overflow-hidden rounded-lg border bg-muted/10">
        <Mafs
          height={360}
          pan
          preserveAspectRatio="contain"
          viewBox={viewBox}
          width="auto"
          zoom={{ min: 0.5, max: 8 }}
        >
          <Coordinates.Cartesian />
          {compiledExpression.error ? null : (
            <Plot.OfX
              y={evaluateY}
              domain={xDomain}
              color={Theme.blue}
              weight={3}
            />
          )}
        </Mafs>
      </div>

      {compiledExpression.error ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50/70 px-3 py-2 text-sm text-amber-900">
          {compiledExpression.error}
        </p>
      ) : null}

      <div className="grid gap-3 md:grid-cols-2">
        {config.parameters.map((parameter) => {
          const value = parameterValues[parameter.name] ?? parameter.defaultValue;
          const step = parameter.step ?? getDefaultStep(parameter.min, parameter.max);

          return (
            <div key={parameter.name} className="rounded-lg border bg-background p-3">
              <div className="mb-2 flex items-center justify-between gap-3">
                <label
                  className="min-w-0 text-sm font-medium"
                  htmlFor={`plot-parameter-${parameter.name}`}
                >
                  {parameter.label ?? parameter.name}
                </label>
                <code className="shrink-0 rounded bg-muted px-2 py-1 text-xs">
                  {formatNumber(value)}
                </code>
              </div>
              <Input
                id={`plot-parameter-${parameter.name}`}
                aria-label={parameter.label ?? parameter.name}
                type="range"
                min={parameter.min}
                max={parameter.max}
                step={step}
                value={value}
                onChange={(event) => {
                  const nextValue = Number(event.target.value);

                  setParameterValues((current) => ({
                    ...current,
                    [parameter.name]: Number.isFinite(nextValue)
                      ? nextValue
                      : parameter.defaultValue,
                  }));
                }}
              />
              <div className="mt-1 flex justify-between text-xs text-muted-foreground">
                <span>{formatNumber(parameter.min)}</span>
                <span>{formatNumber(parameter.max)}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-lg border bg-muted/20 px-3 py-2 text-sm text-muted-foreground">
        <span className="font-medium text-foreground">{config.y.label ?? "y"}</span>
        <span className="mx-2">=</span>
        <code>{config.y.expression}</code>
        <span className="mx-2">，</span>
        <span>{config.x.label ?? "x"}</span>
        <span>
          {" "}
          ∈ [{formatNumber(config.x.min)}, {formatNumber(config.x.max)}]
        </span>
      </div>
    </div>
  );
}

function getInitialParameterValues(config: FormulaPlotConfig) {
  return Object.fromEntries(
    config.parameters.map((parameter) => [parameter.name, parameter.defaultValue]),
  );
}

function getDefaultStep(min: number, max: number) {
  return Number(((max - min) / 100).toPrecision(2));
}

function formatNumber(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(3).replace(/0+$/, "").replace(/\.$/, "");
}

function isExpressionAllowed(expression: string) {
  return expression.length <= 240 && /^[\w\s+\-*/^().,%]+$/.test(expression);
}
