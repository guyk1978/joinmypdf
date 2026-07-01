import { UAParser } from "ua-parser-js";

import { copyTextToClipboard } from "@/lib/favicon-code-generator";

export { copyTextToClipboard };

export type ParsedUserAgent = {
  userAgent: string;
  browser: { name: string; version: string };
  os: { name: string; version: string };
  device: { model: string; type: string };
  engine: { name: string; version: string };
};

const UNKNOWN = "—";

function displayValue(value?: string): string {
  return value?.trim() || UNKNOWN;
}

function formatDeviceType(type?: string): string {
  if (!type) return "Desktop";
  return type.charAt(0).toUpperCase() + type.slice(1);
}

function emptyParsed(userAgent: string): ParsedUserAgent {
  return {
    userAgent,
    browser: { name: UNKNOWN, version: UNKNOWN },
    os: { name: UNKNOWN, version: UNKNOWN },
    device: { model: UNKNOWN, type: UNKNOWN },
    engine: { name: UNKNOWN, version: UNKNOWN },
  };
}

export function parseUserAgent(userAgent: string): ParsedUserAgent {
  const trimmed = userAgent.trim();
  if (!trimmed) return emptyParsed("");

  const { browser, os, device, engine } = new UAParser(trimmed).getResult();

  return {
    userAgent: trimmed,
    browser: {
      name: displayValue(browser.name),
      version: displayValue(browser.version),
    },
    os: {
      name: displayValue(os.name),
      version: displayValue(os.version),
    },
    device: {
      model: displayValue(device.model),
      type: formatDeviceType(device.type),
    },
    engine: {
      name: displayValue(engine.name),
      version: displayValue(engine.version),
    },
  };
}

export function parsedUserAgentToJson(parsed: ParsedUserAgent): string {
  return JSON.stringify(parsed, null, 2);
}

export function getNavigatorUserAgent(): string {
  if (typeof navigator === "undefined") return "";
  return navigator.userAgent;
}
