import type { ToolDocumentation } from "@/lib/types";

/** Documentation overlay for `storage-data-converter` — owned by the registry, not the tool UI. */
export const documentation: ToolDocumentation = {
  whyItMatters: "An online storage calculator helps you convert GB to MB, map terabyte to gigabyte figures, and reconcile drive stickers with what your OS reports. This data size calculator keeps every step local while labeling KB versus KiB clearly.",
  faq: [{"question":"Why are there different storage sizes for the same file?","answer":"Vendors often advertise capacities using decimal (SI) units where 1 GB = 1,000³ bytes, while many operating systems report binary (IEC) units where 1 GiB = 1,024³ bytes. The same byte count therefore looks smaller when shown as GiB than as GB."},{"question":"What is the maximum supported unit?","answer":"Petabyte (PB, decimal) and pebibyte (PiB, binary). You can also convert from or into Bytes, KB/KiB, MB/MiB, GB/GiB, and TB/TiB."},{"question":"Is this tool free?","answer":"Yes. The Storage & Data Unit Converter is free to use with no account required."},{"question":"What is the difference between KB and KiB?","answer":"KB uses a base of 1,000 (1 KB = 1,000 bytes). KiB uses a base of 1,024 (1 KiB = 1,024 bytes). Choose SI labels for decimal marketing sizes and IEC labels for binary OS/developer sizes."},{"question":"Is my data uploaded?","answer":"No. Conversion runs entirely in your browser. Only the numbers you type are processed locally."},{"question":"Can I convert GB to MB?","answer":"Yes. Set From to GB and To to MB (or swap), then type any value — the live result updates instantly."}],
};

export default documentation;
