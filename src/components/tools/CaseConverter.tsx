"use client";

import { useId, useState } from "react";
import { clsx } from "clsx";
import { copyTextToClipboard } from "@/lib/favicon-code-generator";

type CaseTransform = "uppercase" | "lowercase" | "title" | "camel" | "snake" | "kebab";

type TransformAction = {
  id: CaseTransform;
  label: string;
};

const TRANSFORM_ACTIONS: TransformAction[] = [
  { id: "uppercase", label: "UPPERCASE" },
  { id: "lowercase", label: "lowercase" },
  { id: "title", label: "Title Case" },
  { id: "camel", label: "camelCase" },
  { id: "snake", label: "snake_case" },
  { id: "kebab", label: "kebab-case" },
];

const BUTTON_CLASS =
  "text-xs uppercase tracking-widest text-[#a3a3a3] transition-colors hover:text-white";

function splitIntoWords(input: string): string[] {
  return input
    .trim()
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((word) => word.replace(/[^\p{L}\p{N}]/gu, ""))
    .filter(Boolean);
}

function toTitleCase(input: string): string {
  return input
    .split("\n")
    .map((line) =>
      splitIntoWords(line)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(" "),
    )
    .join("\n");
}

function toCamelCase(input: string): string {
  const words = splitIntoWords(input);
  if (words.length === 0) return "";

  return words
    .map((word, index) => {
      const lower = word.toLowerCase();
      if (index === 0) return lower;
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join("");
}

function toSnakeCase(input: string): string {
  return splitIntoWords(input)
    .map((word) => word.toLowerCase())
    .join("_");
}

function toKebabCase(input: string): string {
  return splitIntoWords(input)
    .map((word) => word.toLowerCase())
    .join("-");
}

function applyCaseTransform(input: string, transform: CaseTransform): string {
  switch (transform) {
    case "uppercase":
      return input.toUpperCase();
    case "lowercase":
      return input.toLowerCase();
    case "title":
      return toTitleCase(input);
    case "camel":
      return toCamelCase(input);
    case "snake":
      return toSnakeCase(input);
    case "kebab":
      return toKebabCase(input);
    default:
      return input;
  }
}

type CaseConverterProps = {
  className?: string;
  placeholder?: string;
};

export function CaseConverter({
  className,
  placeholder = "Type or paste text here…",
}: CaseConverterProps) {
  const inputId = useId();
  const [text, setText] = useState("");
  const [copied, setCopied] = useState(false);

  const onTransform = (transform: CaseTransform) => {
    setText((current) => applyCaseTransform(current, transform));
  };

  const onCopy = async () => {
    if (!text) return;

    const success = await copyTextToClipboard(text);
    if (!success) return;

    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  const onClear = () => {
    setText("");
    setCopied(false);
  };

  return (
    <div className={clsx("mx-auto w-full max-w-7xl", className)}>
      <div className="border border-[#262626] bg-[#0a0a0a] p-6">
        <label className="sr-only" htmlFor={inputId}>
          Text to convert
        </label>
        <textarea
          id={inputId}
          className="min-h-[280px] w-full resize-y bg-transparent text-base leading-relaxed text-white placeholder:text-[#525252] focus:outline-none focus:ring-0"
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder={placeholder}
          dir="auto"
          spellCheck={false}
          rows={14}
        />

        <div className="mt-4 border-t border-[#262626] pt-4">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            {TRANSFORM_ACTIONS.map((action) => (
              <button
                key={action.id}
                type="button"
                className={BUTTON_CLASS}
                onClick={() => onTransform(action.id)}
              >
                {action.label}
              </button>
            ))}

            <span className="hidden h-4 w-px bg-[#262626] sm:inline-block" aria-hidden />

            <button type="button" className={BUTTON_CLASS} onClick={() => void onCopy()} disabled={!text}>
              <span aria-live="polite">{copied ? "Copied!" : "Copy to Clipboard"}</span>
            </button>

            <button type="button" className={BUTTON_CLASS} onClick={onClear} disabled={!text}>
              Clear
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
