/**

 * Client-side public IP / network lookup helpers.

 * Lookups are initiated by the browser against third-party JSON APIs —

 * JoinMyPDF does not proxy or log the response.

 */



export type NetworkIpInfo = {

  ip: string;

  version: "IPv4" | "IPv6" | "Unknown";

  /** Secondary stack address when dual-stack is detectable (optional). */

  ipv4: string | null;

  ipv6: string | null;

  city: string | null;

  region: string | null;

  country: string | null;

  countryCode: string | null;

  isp: string | null;

  org: string | null;

  asn: string | null;

  timezone: string | null;

  /** Human-readable connection summary (e.g. Fiber, Cellular, VPN detected). */

  connectionType: string | null;

  proxyStatus: "vpn" | "proxy" | "hosting" | "tor" | "clear" | "unknown";

  latitude: number | null;

  longitude: number | null;

  source: string;

  queriedIp: string | null;

};



export type SystemStatusInfo = {

  userAgent: string;

  browser: string;

  os: string;

  device: string;

  language: string;

  languages: string;

  platform: string;

  cookiesEnabled: boolean;

  online: boolean;

  hardwareConcurrency: number | null;

};



const IPV4_PATTERN =

  /^(?:(?:25[0-5]|2[0-4]\d|1?\d?\d)\.){3}(?:25[0-5]|2[0-4]\d|1?\d?\d)$/;

const IPV6_PATTERN =

  /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]+|::(ffff(:0{1,4})?:)?((25[0-5]|(2[0-4]|1?\d)?\d)\.){3}(25[0-5]|(2[0-4]|1?\d)?\d)|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1?\d)?\d)\.){3}(25[0-5]|(2[0-4]|1?\d)?\d))$/;



export function detectIpVersion(ip: string): "IPv4" | "IPv6" | "Unknown" {

  if (IPV4_PATTERN.test(ip)) return "IPv4";

  if (ip.includes(":") && IPV6_PATTERN.test(ip)) return "IPv6";

  if (ip.includes(":")) return "IPv6";

  return "Unknown";

}



export function isValidIpAddress(value: string): boolean {

  const trimmed = value.trim();

  if (!trimmed) return false;

  const version = detectIpVersion(trimmed);

  return version === "IPv4" || version === "IPv6";

}



function asString(value: unknown): string | null {

  if (typeof value === "string" && value.trim()) return value.trim();

  if (typeof value === "number" && Number.isFinite(value)) return String(value);

  return null;

}



function asNumber(value: unknown): number | null {

  if (typeof value === "number" && Number.isFinite(value)) return value;

  if (typeof value === "string" && value.trim() && !Number.isNaN(Number(value))) {

    return Number(value);

  }

  return null;

}



function asBoolean(value: unknown): boolean {

  return value === true;

}



async function fetchJson(url: string, init?: RequestInit): Promise<Record<string, unknown>> {

  const response = await fetch(url, {

    ...init,

    headers: {

      Accept: "application/json",

      ...(init?.headers ?? {}),

    },

  });

  if (!response.ok) {

    throw new Error(`Lookup failed (${response.status})`);

  }

  return (await response.json()) as Record<string, unknown>;

}



function resolveProxyStatus(security: Record<string, unknown> | null): NetworkIpInfo["proxyStatus"] {

  if (!security) return "unknown";

  if (asBoolean(security.tor)) return "tor";

  if (asBoolean(security.vpn)) return "vpn";

  if (asBoolean(security.proxy)) return "proxy";

  if (asBoolean(security.hosting)) return "hosting";

  if (

    security.vpn === false ||

    security.proxy === false ||

    security.tor === false ||

    security.hosting === false

  ) {

    return "clear";

  }

  return "unknown";

}



function formatConnectionLabel(

  rawType: string | null,

  proxyStatus: NetworkIpInfo["proxyStatus"],

  version: NetworkIpInfo["version"],

): string {

  const base =

    rawType && rawType.trim() && !/^IP\s/i.test(rawType)

      ? rawType.trim()

      : version !== "Unknown"

        ? version

        : "Unknown";



  switch (proxyStatus) {

    case "vpn":

      return `${base} · VPN detected`;

    case "proxy":

      return `${base} · Proxy detected`;

    case "tor":

      return `${base} · Tor detected`;

    case "hosting":

      return `${base} · Hosting / datacenter`;

    default:

      return base;

  }

}



function attachStackAddresses(info: NetworkIpInfo): NetworkIpInfo {

  const ipv4 = info.version === "IPv4" ? info.ip : info.ipv4;

  const ipv6 = info.version === "IPv6" ? info.ip : info.ipv6;

  return { ...info, ipv4, ipv6 };

}



function fromIpApiCo(

  data: Record<string, unknown>,

  queriedIp: string | null,

): NetworkIpInfo | null {

  const ip = asString(data.ip);

  if (!ip) return null;

  if (data.error) return null;



  const version = detectIpVersion(ip);

  const proxyStatus: NetworkIpInfo["proxyStatus"] = "unknown";



  return attachStackAddresses({

    ip,

    version,

    ipv4: null,

    ipv6: null,

    city: asString(data.city),

    region: asString(data.region) ?? asString(data.region_code),

    country: asString(data.country_name) ?? asString(data.country),

    countryCode: asString(data.country_code) ?? asString(data.country),

    isp: asString(data.org) ?? asString(data.asn),

    org: asString(data.org),

    asn: asString(data.asn),

    timezone: asString(data.timezone),

    connectionType: formatConnectionLabel(

      asString(data.version) ? `IP ${asString(data.version)}` : null,

      proxyStatus,

      version,

    ),

    proxyStatus,

    latitude: asNumber(data.latitude),

    longitude: asNumber(data.longitude),

    source: "ipapi.co",

    queriedIp,

  });

}



function fromIpWhoIs(

  data: Record<string, unknown>,

  queriedIp: string | null,

): NetworkIpInfo | null {

  if (data.success === false) return null;

  const ip = asString(data.ip);

  if (!ip) return null;



  const connection =

    data.connection && typeof data.connection === "object"

      ? (data.connection as Record<string, unknown>)

      : null;

  const security =

    data.security && typeof data.security === "object"

      ? (data.security as Record<string, unknown>)

      : null;



  const version = detectIpVersion(ip);

  const proxyStatus = resolveProxyStatus(security);



  return attachStackAddresses({

    ip,

    version,

    ipv4: null,

    ipv6: null,

    city: asString(data.city),

    region: asString(data.region),

    country: asString(data.country),

    countryCode: asString(data.country_code),

    isp: asString(connection?.isp) ?? asString(connection?.org),

    org: asString(connection?.org),

    asn: connection?.asn != null ? String(connection.asn) : null,

    timezone:

      data.timezone && typeof data.timezone === "object"

        ? asString((data.timezone as Record<string, unknown>).id)

        : asString(data.timezone),

    connectionType: formatConnectionLabel(

      asString(connection?.type),

      proxyStatus,

      version,

    ),

    proxyStatus,

    latitude: asNumber(data.latitude),

    longitude: asNumber(data.longitude),

    source: "ipwho.is",

    queriedIp,

  });

}



async function fetchPlainIp(url: string): Promise<string | null> {

  try {

    const data = await fetchJson(url);

    const ip = asString(data.ip);

    return ip;

  } catch {

    return null;

  }

}



/**

 * Best-effort dual-stack companion address (ipv4 when viewing ipv6, or vice versa).

 * Only used for "my IP" lookups — not for arbitrary query targets.

 */

async function enrichWithCompanionStack(info: NetworkIpInfo): Promise<NetworkIpInfo> {

  if (info.queriedIp) return info;



  if (info.version === "IPv4" && !info.ipv6) {

    const ipv6 = await fetchPlainIp("https://api64.ipify.org?format=json");

    if (ipv6 && detectIpVersion(ipv6) === "IPv6" && ipv6 !== info.ip) {

      return { ...info, ipv6 };

    }

  }



  if (info.version === "IPv6" && !info.ipv4) {

    const ipv4 = await fetchPlainIp("https://api.ipify.org?format=json");

    if (ipv4 && detectIpVersion(ipv4) === "IPv4" && ipv4 !== info.ip) {

      return { ...info, ipv4 };

    }

  }



  return info;

}



/**

 * Resolve public IP + geo/ISP metadata from the browser.

 * Pass `queryIp` to look up another address; omit for the current visitor.

 * Tries ipapi.co first, then ipwho.is as fallback.

 */

export async function fetchNetworkIpInfo(queryIp?: string): Promise<NetworkIpInfo> {

  const trimmed = queryIp?.trim() || null;

  if (trimmed && !isValidIpAddress(trimmed)) {

    throw new Error("invalid_ip");

  }



  const errors: string[] = [];

  const ipapiUrl = trimmed ? `https://ipapi.co/${encodeURIComponent(trimmed)}/json/` : "https://ipapi.co/json/";

  const ipwhoUrl = trimmed ? `https://ipwho.is/${encodeURIComponent(trimmed)}` : "https://ipwho.is/";



  try {

    const data = await fetchJson(ipapiUrl);

    const parsed = fromIpApiCo(data, trimmed);

    if (parsed) {

      const enriched = trimmed ? parsed : await enrichWithCompanionStack(parsed);

      return enriched;

    }

    errors.push("ipapi.co returned an unexpected payload");

  } catch (cause) {

    errors.push(cause instanceof Error ? cause.message : "ipapi.co failed");

  }



  try {

    const data = await fetchJson(ipwhoUrl);

    const parsed = fromIpWhoIs(data, trimmed);

    if (parsed) {

      const enriched = trimmed ? parsed : await enrichWithCompanionStack(parsed);

      return enriched;

    }

    errors.push("ipwho.is returned an unexpected payload");

  } catch (cause) {

    errors.push(cause instanceof Error ? cause.message : "ipwho.is failed");

  }



  throw new Error(

    `Could not look up IP from the browser. ${errors.join(" · ")}`,

  );

}



export function readSystemStatus(): SystemStatusInfo {

  if (typeof navigator === "undefined") {

    return {

      userAgent: "",

      browser: "—",

      os: "—",

      device: "—",

      language: "—",

      languages: "—",

      platform: "—",

      cookiesEnabled: false,

      online: false,

      hardwareConcurrency: null,

    };

  }



  const ua = navigator.userAgent || "";

  return {

    userAgent: ua,

    browser: detectBrowser(ua),

    os: detectOs(ua),

    device: detectDevice(ua),

    language: navigator.language || "—",

    languages: Array.isArray(navigator.languages)

      ? navigator.languages.join(", ")

      : navigator.language || "—",

    platform: navigator.platform || "—",

    cookiesEnabled: navigator.cookieEnabled,

    online: navigator.onLine,

    hardwareConcurrency: navigator.hardwareConcurrency || null,

  };

}



function detectBrowser(ua: string): string {

  if (/Edg\//i.test(ua)) return "Microsoft Edge";

  if (/OPR\//i.test(ua) || /Opera/i.test(ua)) return "Opera";

  if (/Chrome\//i.test(ua) && !/Edg\//i.test(ua)) return "Google Chrome";

  if (/Safari\//i.test(ua) && !/Chrome\//i.test(ua)) return "Safari";

  if (/Firefox\//i.test(ua)) return "Firefox";

  if (/MSIE|Trident\//i.test(ua)) return "Internet Explorer";

  return "Unknown browser";

}



function detectOs(ua: string): string {

  if (/Windows NT 10/i.test(ua)) return "Windows 10/11";

  if (/Windows NT 6\.3/i.test(ua)) return "Windows 8.1";

  if (/Windows/i.test(ua)) return "Windows";

  if (/Android/i.test(ua)) return "Android";

  if (/iPhone|iPad|iPod/i.test(ua)) return "iOS";

  if (/Mac OS X/i.test(ua)) return "macOS";

  if (/CrOS/i.test(ua)) return "Chrome OS";

  if (/Linux/i.test(ua)) return "Linux";

  return "Unknown OS";

}



function detectDevice(ua: string): string {

  if (/iPad|Tablet|Android(?!.*Mobile)/i.test(ua)) return "Tablet";

  if (/Mobi|iPhone|Android.*Mobile/i.test(ua)) return "Mobile";

  return "Desktop";

}



export function formatLocation(info: NetworkIpInfo): string {

  const parts = [info.city, info.region, info.country].filter(Boolean);

  return parts.length ? parts.join(", ") : "—";

}



export function proxyStatusLabel(

  status: NetworkIpInfo["proxyStatus"],

  labels: {

    vpn: string;

    proxy: string;

    hosting: string;

    tor: string;

    clear: string;

    unknown: string;

  },

): string {

  switch (status) {

    case "vpn":

      return labels.vpn;

    case "proxy":

      return labels.proxy;

    case "hosting":

      return labels.hosting;

    case "tor":

      return labels.tor;

    case "clear":

      return labels.clear;

    default:

      return labels.unknown;

  }

}


