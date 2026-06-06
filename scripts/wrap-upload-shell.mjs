import fs from "fs";
import { globSync } from "fs";

const PRIVACY_BLOCK =
  /<div className="privacy-callout" role="note">\s*<strong>\{ws\.securePrefix\}<\/strong>\s*\{ws\.wsText\("privacyNote"\)\}\s*<\/div>\s*\n\s*/g;

const IMPORT =
  'from "@/components/FileUploadZone"\nimport { WorkspaceUploadShell } from "@/components/WorkspaceUploadShell"';

function ensureImport(s) {
  if (s.includes("WorkspaceUploadShell")) return s;
  return s.replace('from "@/components/FileUploadZone"', IMPORT);
}

function openShell(s) {
  return s.replace(PRIVACY_BLOCK, '<WorkspaceUploadShell securePrefix={ws.securePrefix} privacyNote={ws.wsText("privacyNote")}>\n      ');
}

function closeAfterUploadZone(s) {
  if (!s.includes("<WorkspaceUploadShell") || s.includes("</WorkspaceUploadShell>")) return s;

  // Ternary: {!file ? ( ... ) : ( ... )}
  if (s.includes("{!file ? (")) {
    return s.replace(
      /(\{!file \? \([\s\S]*?\n      \)\})\s*\n(\s*\{(?:runError|showWorkspace|busy|done|progress|file|plan|error))/,
      "$1\n      </WorkspaceUploadShell>\n$2",
    );
  }

  if (s.includes("{!showOptions ? (")) {
    return s.replace(
      /(\{!showOptions \? \([\s\S]*?\n      \)\})\s*\n(\s*\{(?:showOptions|runError|busy|done|status|file))/,
      "$1\n      </WorkspaceUploadShell>\n$2",
    );
  }

  if (s.includes("{!showWorkspace ? (")) {
    return s.replace(
      /(\{!showWorkspace \? \([\s\S]*?\n      \)\})\s*\n(\s*\{(?:showWorkspace|runError|busy|done|status|file|leftFile|plan))/,
      "$1\n      </WorkspaceUploadShell>\n$2",
    );
  }

  // Direct FileUploadZone then next element
  return s.replace(
    /(<FileUploadZone[\s\S]*?\n      \/>)\s*\n(\s*)/,
    "$1\n      </WorkspaceUploadShell>\n$2",
  );
}

const files = globSync("src/components/**/*Workspace*.tsx");
let count = 0;

for (const file of files) {
  let s = fs.readFileSync(file, "utf8");
  const orig = s;
  if (!s.includes("privacy-callout") && !s.includes("<WorkspaceUploadShell")) continue;

  s = ensureImport(s);
  s = openShell(s);
  s = closeAfterUploadZone(s);

  if (s !== orig) {
    fs.writeFileSync(file, s);
    count += 1;
    console.log("updated", file);
  }
}

for (const file of files) {
  const s = fs.readFileSync(file, "utf8");
  if (s.includes("<WorkspaceUploadShell") && !s.includes("</WorkspaceUploadShell>")) {
    console.warn("UNCLOSED", file);
  }
  if (s.includes("privacy-callout")) {
    console.warn("STILL privacy-callout", file);
  }
}

console.log("total", count);
