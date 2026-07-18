import type { ToolDocumentation } from "@/lib/types";

/** Documentation overlay for `global-timezone-converter` — owned by the registry, not the tool UI. */
export const documentation: ToolDocumentation = {
  whyItMatters: "Remote teams live across UTC, Pacific, India Standard Time, and Central Europe. An online time zone converter that stays on-device lets you compare time zones and convert UTC to local time without pasting schedules into a cloud calendar assistant.",
  faq: [{"question":"Does it account for Daylight Saving Time?","answer":"Yes. Conversions use the browser Intl API with IANA time zones, so DST rules for each region are applied automatically for the selected date."},{"question":"Can I save my favorite timezones?","answer":"Yes. Use Save favorites to store your source and target zones in localStorage on this device. Load favorites restores them anytime."},{"question":"Is the conversion accurate?","answer":"Yes for supported IANA zones. Accuracy depends on your browser’s timezone database, which follows worldwide DST and offset updates."},{"question":"What does Copy Meeting Link do?","answer":"It copies a ready message such as “Meeting scheduled for 10:00 AM (Tel Aviv) / 3:00 AM (New York)” for the current source time across your selected cities."},{"question":"Is my schedule uploaded to a server?","answer":"No. All conversion and clipboard work runs locally in your browser."},{"question":"Is the Global Time Zone Converter free?","answer":"Yes. Free to use with no account required."}],
};

export default documentation;
