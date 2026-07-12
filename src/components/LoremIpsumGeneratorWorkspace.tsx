"use client";

import { capture, EVENTS } from "@/components/AnalyticsClient";
import {
  clampLoremCount,
  copyTextToClipboard,
  generateLoremIpsum,
  LOREM_DEFAULT_COUNT,
  LOREM_MAX_COUNT,
  LOREM_MIN_COUNT,
  type LoremOutputFormat,
  type LoremUnit,
} from "@/lib/lorem-ipsum-generator";
import type { ToolDefinition } from "@/lib/types";
import { clsx } from "clsx";
import { useTranslations } from "next-intl";
import { useEffect, useId, useState } from "react";

type LoremIpsumGeneratorWorkspaceProps = {
  tool: ToolDefinition;
  slug: string;
};

const UNITS: LoremUnit[] = ["paragraphs", "sentences", "words"];
const FORMATS: LoremOutputFormat[] = ["plain", "markdown"];

export function LoremIpsumGeneratorWorkspace({
  tool,
  slug,
}: LoremIpsumGeneratorWorkspaceProps) {
  const t = useTranslations("LoremIpsumGenerator");
  const baseId = useId();
  const [unit, setUnit] = useState<LoremUnit>("paragraphs");
  const [count, setCount] = useState(LOREM_DEFAULT_COUNT);
  const [format, setFormat] = useState<LoremOutputFormat>("plain");
  const [startWithLorem, setStartWithLorem] = useState(true);
  const [output, setOutput] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    capture(EVENTS.tool_view, { slug, operation: tool.operation });
  }, [slug, tool.operation]);

  const onGenerate = () => {
    setError(null);
    setCopied(false);
    const next = generateLoremIpsum({
      unit,
      count: clampLoremCount(count),
      format,
      startWithLorem,
    });
    setOutput(next);
    capture(EVENTS.tool_run_success, {
      operation: tool.operation,
      slug,
      unit,
      format,
      count: clampLoremCount(count),
    });
  };

  const onReset = () => {
    setUnit("paragraphs");
    setCount(LOREM_DEFAULT_COUNT);
    setFormat("plain");
    setStartWithLorem(true);
    setOutput("");
    setCopied(false);
    setError(null);
  };

  const onCopy = async () => {
    if (!output) return;
    try {
      await copyTextToClipboard(output);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError(t("copyFailed"));
    }
  };

  return (
    <div className="space-y-6">
      <p className="m-0 rounded-sm border border-[#262626] bg-[#0a0a0a] px-4 py-3 text-xs uppercase tracking-widest text-[#a3a3a3]">
        {t("privacyBadge")}
      </p>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,280px)_minmax(0,1fr)]">
        <aside
          className="space-y-5 border border-[#262626] bg-[#0a0a0a] p-4"
          aria-label={t("settingsTitle")}
        >
          <div>
            <h2 className="m-0 mb-3 text-xs font-semibold uppercase tracking-widest text-[#a3a3a3]">
              {t("unitLabel")}
            </h2>
            <div className="grid gap-2">
              {UNITS.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setUnit(item)}
                  className={clsx(
                    "border px-3 py-2.5 text-left text-sm font-medium transition-colors",
                    unit === item
                      ? "border-white bg-white text-black"
                      : "border-[#262626] text-[#a3a3a3] hover:border-[#404040] hover:text-white",
                  )}
                >
                  {t(`units.${item}`)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label
              htmlFor={`${baseId}-count`}
              className="mb-2 block text-xs font-semibold uppercase tracking-widest text-[#a3a3a3]"
            >
              {t("countLabel")}
            </label>
            <input
              id={`${baseId}-count`}
              type="number"
              min={LOREM_MIN_COUNT}
              max={LOREM_MAX_COUNT}
              value={count}
              onChange={(event) => setCount(clampLoremCount(Number(event.target.value)))}
              className="w-full border border-[#262626] bg-black px-3 py-2.5 text-sm text-white outline-none focus:border-white"
            />
            <p className="m-0 mt-2 text-xs text-[#737373]">
              {t("countHint", { min: LOREM_MIN_COUNT, max: LOREM_MAX_COUNT })}
            </p>
          </div>

          <div>
            <h2 className="m-0 mb-3 text-xs font-semibold uppercase tracking-widest text-[#a3a3a3]">
              {t("formatLabel")}
            </h2>
            <div className="grid grid-cols-2 gap-2">
              {FORMATS.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setFormat(item)}
                  className={clsx(
                    "border px-3 py-2.5 text-sm font-medium uppercase tracking-wider transition-colors",
                    format === item
                      ? "border-white bg-white text-black"
                      : "border-[#262626] text-[#a3a3a3] hover:border-[#404040] hover:text-white",
                  )}
                >
                  {t(`formats.${item}`)}
                </button>
              ))}
            </div>
          </div>

          <label className="flex cursor-pointer items-start gap-3 text-sm text-[#a3a3a3]">
            <input
              type="checkbox"
              className="mt-1 accent-white"
              checked={startWithLorem}
              onChange={(event) => setStartWithLorem(event.target.checked)}
            />
            <span>
              <span className="block font-medium text-white">{t("classicOpenerLabel")}</span>
              <span className="mt-1 block text-xs leading-relaxed text-[#737373]">
                {t("classicOpenerHint")}
              </span>
            </span>
          </label>

          <div className="flex flex-col gap-2 border-t border-[#262626] pt-4">
            <button
              type="button"
              onClick={onGenerate}
              className="border border-white bg-white px-4 py-3 text-xs font-semibold uppercase tracking-widest text-black transition-opacity hover:opacity-90"
            >
              {t("generate")}
            </button>
            <button
              type="button"
              onClick={onReset}
              className="border border-[#262626] bg-transparent px-4 py-3 text-xs font-semibold uppercase tracking-widest text-[#a3a3a3] transition-colors hover:border-white hover:text-white"
            >
              {t("reset")}
            </button>
          </div>
        </aside>

        <section className="flex min-h-[320px] flex-col border border-[#262626] bg-[#0a0a0a]" aria-label={t("outputTitle")}>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#262626] px-4 py-3">
            <h2 className="m-0 text-xs font-semibold uppercase tracking-widest text-[#a3a3a3]">
              {t("outputTitle")}
            </h2>
            <button
              type="button"
              onClick={onCopy}
              disabled={!output}
              className="border border-[#262626] bg-transparent px-3 py-2 text-xs font-semibold uppercase tracking-widest text-white transition-colors hover:border-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              {copied ? t("copied") : t("copy")}
            </button>
          </div>

          <textarea
            readOnly
            value={output}
            placeholder={t("outputPlaceholder")}
            className="min-h-[280px] flex-1 resize-y bg-transparent px-4 py-4 font-mono text-sm leading-relaxed text-white outline-none placeholder:text-[#525252]"
            spellCheck={false}
            aria-label={t("outputTitle")}
          />
        </section>
      </div>

      {error ? (
        <p className="m-0 border border-red-900/60 bg-red-950/40 px-4 py-3 text-sm text-red-300" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
