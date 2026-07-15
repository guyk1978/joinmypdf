import { UAParser } from "ua-parser-js";
import { Bots } from "ua-parser-js/extensions";

import { copyTextToClipboard } from "@/lib/favicon-code-generator";

export { copyTextToClipboard };

export type DeviceKind = "Desktop" | "Mobile" | "Tablet" | "Bot/Crawler";

export type ParsedUserAgent = {
  userAgent: string;
  browser: { name: string; version: string };
  os: { name: string; version: string };
  device: { model: string; type: DeviceKind };
  engine: { name: string; version: string };
};

const UNKNOWN = "—";

function displayValue(value?: string | null): string {
  return value?.trim() || UNKNOWN;
}

function formatDeviceType(
  deviceType?: string | null,
  browserType?: string | null,
): DeviceKind {
  const botTypes = new Set(["bot", "crawler", "fetcher", "cli", "library", "email"]);
  if (browserType && botTypes.has(browserType.toLowerCase())) {
    return "Bot/Crawler";
  }

  const normalized = (deviceType || "").toLowerCase();
  if (normalized === "mobile") return "Mobile";
  if (normalized === "tablet") return "Tablet";
  if (normalized === "bot" || normalized === "crawler") return "Bot/Crawler";
  return "Desktop";
}

function emptyParsed(userAgent: string): ParsedUserAgent {
  return {
    userAgent,
    browser: { name: UNKNOWN, version: UNKNOWN },
    os: { name: UNKNOWN, version: UNKNOWN },
    device: { model: UNKNOWN, type: "Desktop" },
    engine: { name: UNKNOWN, version: UNKNOWN },
  };
}

/**
 * Parse a User-Agent string entirely in the browser via ua-parser-js (+ Bots extension).
 */
export function parseUserAgent(userAgent: string): ParsedUserAgent {
  const trimmed = userAgent.trim();
  if (!trimmed) return emptyParsed("");

  const result = UAParser(trimmed, Bots);
  const { browser, os, device, engine } = result;

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
      type: formatDeviceType(device.type, browser.type),
    },
    engine: {
      name: displayValue(engine.name),
      version: displayValue(engine.version),
    },
  };
}

export function parsedUserAgentToJson(parsed: ParsedUserAgent): string {
  return JSON.stringify(
    {
      userAgent: parsed.userAgent,
      browser: parsed.browser,
      operatingSystem: parsed.os,
      device: parsed.device,
      renderingEngine: parsed.engine,
    },
    null,
    2,
  );
}

export function getNavigatorUserAgent(): string {
  if (typeof navigator === "undefined") return "";
  return navigator.userAgent;
}
