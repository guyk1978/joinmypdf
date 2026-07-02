import * as yaml from "js-yaml";

import { copyTextToClipboard } from "@/lib/favicon-code-generator";

export { copyTextToClipboard };

export type YamlJsonDirection = "yaml-to-json" | "json-to-yaml";

export type YamlJsonConvertResult =
  | { ok: true; output: string }
  | { ok: false; error: "empty" | "parse" };

export function convertYamlJson(input: string, direction: YamlJsonDirection): YamlJsonConvertResult {
  const trimmed = input.trim();
  if (!trimmed) {
    return { ok: false, error: "empty" };
  }

  try {
    if (direction === "yaml-to-json") {
      const data = yaml.load(trimmed);
      return { ok: true, output: JSON.stringify(data, null, 2) };
    }

    const data = JSON.parse(trimmed) as unknown;
    return {
      ok: true,
      output: yaml.dump(data, { lineWidth: -1, noRefs: true, sortKeys: false }),
    };
  } catch {
    return { ok: false, error: "parse" };
  }
}
