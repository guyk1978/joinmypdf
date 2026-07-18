import type { ToolDocumentation } from "@/lib/types";

/** Documentation overlay for `base-converter` — owned by the registry, not the tool UI. */
export const documentation: ToolDocumentation = {
  whyItMatters: "An online base number converter bridges how humans read values (decimal) and how machines and protocols store them (binary, octal, hex). From memory addresses and machine code to CSS color hex, instant binary to decimal and hex to decimal conversion keeps debugging in your browser.",
  faq: [{"question":"What are the supported bases?","answer":"Binary (2), octal (8), decimal (10), and hexadecimal (16). Optional 0b, 0o, and 0x prefixes are accepted when they match the selected From base."},{"question":"How large of a number can I convert?","answer":"Conversions use JavaScript BigInt, so you can handle integers far beyond Number.MAX_SAFE_INTEGER as long as your device can store them in memory."},{"question":"Is this safe for sensitive data?","answer":"Yes. All conversion and clipboard work runs locally in your browser. Nothing is uploaded to a server."},{"question":"When can I use bitwise operations?","answer":"When From Base is Binary, enable Bitwise Operations to AND, OR, or XOR your source with a second binary operand. The live result still formats in your To Base."},{"question":"Why do I see an error for digit 9?","answer":"Digits must be valid for the selected From base. Binary only allows 0 and 1; octal allows 0–7; hex allows 0–9 and A–F."},{"question":"Is the Base Converter free?","answer":"Yes. Free to use with no account required."}],
};

export default documentation;
