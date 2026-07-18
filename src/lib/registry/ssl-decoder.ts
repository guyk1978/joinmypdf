import type { ToolDocumentation } from "@/lib/types";

/** Documentation overlay for `ssl-decoder` — owned by the registry, not the tool UI. */
export const documentation: ToolDocumentation = {
  whyItMatters: "SSL/TLS certificates are the trust fabric of the modern web. Every secure connection you open—whether you are shipping a customer portal, wiring an API gateway, or troubleshooting a browser warning—depends on an X.509 certificate that binds a public key to an identity. Understanding what that file contains is no longer optional for operators, developers, and security reviewers. This guide explains how to verify SSL certificates, how SSL/TLS security actually works, and why decoding certificates locally in your browser is safer than uploading them to an unknown server.",
  faq: [{"question":"Is my certificate uploaded to a server?","answer":"No. Decoding runs entirely in your browser with local X.509 parsing. Nothing is sent to JoinMyPDF servers."},{"question":"Which formats are supported?","answer":"PEM and CRT certificate text with BEGIN CERTIFICATE / END CERTIFICATE markers (DER encoded as Base64)."},{"question":"What fields can I see?","answer":"Issuer, subject, validity dates, serial number, signature algorithm, public key algorithm, and key size when available."},{"question":"Is the SSL Certificate Decoder free?","answer":"Yes. It is free to use with no account required."}],
};

export default documentation;
