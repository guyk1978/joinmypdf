import type { ToolDocumentation } from "@/lib/types";

/** Documentation overlay for `my-ip` — owned by the registry, not the tool UI. */
export const documentation: ToolDocumentation = {
  whyItMatters: "An IP address is the public identifier networks use to route traffic to your connection. Checking it helps with network troubleshooting, confirming VPN egress, and verifying what remote APIs see.",
  faq: [{"question":"How is my location determined?","answer":"Approximate city, region, and country come from an IP geolocation database maintained by the lookup provider your browser contacts (such as ipapi.co). It is not GPS and can be wrong for VPNs, CGNAT, or mobile networks."},{"question":"Is my IP being tracked?","answer":"JoinMyPDF does not store or log your IP for this tool. The request goes from your browser to a public IP API. We do not receive or keep the result on our servers."},{"question":"What is the difference between IPv4 and IPv6?","answer":"IPv4 uses 32-bit dotted addresses (like 203.0.113.10). IPv6 uses 128-bit addresses written with colons. When dual-stack is detectable, this tool may show a companion address alongside your primary public IP."},{"question":"Can I look up someone else's IP?","answer":"Yes. Use Look up another IP with a public IPv4 or IPv6 address to fetch ISP, location, and connection hints. Only public metadata is shown."},{"question":"Does this detect VPN or proxy?","answer":"When the provider reports security flags (VPN, proxy, Tor, or hosting), they appear under VPN / Proxy and in the connection type summary. Flags are informational and not guaranteed to be complete."},{"question":"Is the IP lookup free?","answer":"Yes. It is free to use with no account required."}],
};

export default documentation;
