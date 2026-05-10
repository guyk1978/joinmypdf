import { createServer } from "node:http";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createReadStream, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

const pendingPath = path.join(root, "drafts", "pending-seo-pages.json");
const reportPath = path.join(root, "logs", "auto-execution-report.json");
const subscribersPath = path.join(root, "logs", "email-subscribers.json");
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function json(res, code, payload) {
  res.writeHead(code, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload));
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > 1_000_000) reject(new Error("Payload too large"));
    });
    req.on("end", () => {
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new Error("Invalid JSON body"));
      }
    });
    req.on("error", reject);
  });
}

async function safeRead(filePath, fallback) {
  try {
    return JSON.parse(await readFile(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

function runNodeScript(args) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args, { cwd: root, stdio: "pipe" });
    let out = "";
    let err = "";
    child.stdout.on("data", (d) => (out += d.toString()));
    child.stderr.on("data", (d) => (err += d.toString()));
    child.on("exit", (code) => {
      if (code === 0) resolve({ out, err });
      else reject(new Error((err || out || "").trim() || "Command failed"));
    });
    child.on("error", reject);
  });
}

function mimeType(filePath) {
  if (filePath.endsWith(".html")) return "text/html; charset=utf-8";
  if (filePath.endsWith(".css")) return "text/css; charset=utf-8";
  if (filePath.endsWith(".js")) return "application/javascript; charset=utf-8";
  if (filePath.endsWith(".json")) return "application/json; charset=utf-8";
  if (filePath.endsWith(".svg")) return "image/svg+xml";
  return "text/plain; charset=utf-8";
}

function serveStatic(req, res, targetPath) {
  if (!existsSync(targetPath)) {
    res.writeHead(404);
    res.end("Not found");
    return;
  }
  res.writeHead(200, { "Content-Type": mimeType(targetPath) });
  createReadStream(targetPath).pipe(res);
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url || "/", "http://localhost");
    if (req.method === "GET" && (url.pathname === "/" || url.pathname === "/admin")) {
      return serveStatic(req, res, path.join(root, "admin", "seo-approval-dashboard.html"));
    }
    if (req.method === "GET" && url.pathname === "/api/drafts") {
      try {
        if (!existsSync(pendingPath)) {
          return json(res, 200, { drafts: [] });
        }
        const raw = await readFile(pendingPath, "utf8");
        const parsed = JSON.parse(raw);
        const drafts = Array.isArray(parsed)
          ? parsed
          : Array.isArray(parsed && parsed.drafts)
          ? parsed.drafts
          : [];
        return json(res, 200, { drafts });
      } catch (err) {
        console.error("/api/drafts failed:", err);
        return json(res, 500, { drafts: [], error: err && err.message ? err.message : "read failed" });
      }
    }
    if (req.method === "POST" && url.pathname === "/api/draft-status") {
      const body = await parseBody(req);
      const id = String(body.id || "");
      const status = String(body.status || "");
      if (!id || !["approved", "rejected"].includes(status)) {
        return json(res, 400, { message: "Invalid draft status request." });
      }
      const pending = await safeRead(pendingPath, { drafts: [], rejected: [] });
      const draft = (pending.drafts || []).find((item) => item.id === id);
      if (!draft) return json(res, 404, { message: "Draft not found." });

      if (status === "approved") {
        if (!(draft.publishEligible === true && Number(draft.qualityScore || 0) >= 7)) {
          return json(res, 400, { message: "Draft does not pass approval gate." });
        }
        draft.status = "approved";
      } else {
        pending.drafts = (pending.drafts || []).filter((item) => item.id !== id);
        pending.rejected = pending.rejected || [];
        pending.rejected.push({
          id: draft.id,
          keyword: draft.keyword,
          reason: "Manually rejected in dashboard.",
          qualityScore: draft.qualityScore,
          overlapRisk: draft.overlapRisk,
        });
      }
      await writeFile(pendingPath, JSON.stringify(pending, null, 2), "utf8");
      return json(res, 200, { message: "Draft " + id + " updated to " + status + "." });
    }
    if (req.method === "OPTIONS" && url.pathname === "/api/subscribe") {
      res.writeHead(204, {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      });
      return res.end();
    }
    if (req.method === "POST" && url.pathname === "/api/subscribe") {
      try {
        const body = await parseBody(req);
        const email = String(body.email || "").trim().toLowerCase();
        if (!EMAIL_RE.test(email)) {
          return json(res, 400, { ok: false, error: "Invalid email" });
        }
        await mkdir(path.dirname(subscribersPath), { recursive: true });
        const current = await safeRead(subscribersPath, { subscribers: [] });
        const list = Array.isArray(current.subscribers) ? current.subscribers : [];
        if (!list.some((entry) => (entry.email || "").toLowerCase() === email)) {
          list.push({
            email,
            page: typeof body.page === "string" ? body.page.slice(0, 200) : "",
            referrer: typeof body.referrer === "string" ? body.referrer.slice(0, 200) : "",
            userAgent: (req.headers["user-agent"] || "").toString().slice(0, 200),
            at: new Date().toISOString(),
          });
        }
        await writeFile(
          subscribersPath,
          JSON.stringify({ subscribers: list }, null, 2),
          "utf8"
        );
        res.writeHead(200, {
          "Content-Type": "application/json; charset=utf-8",
          "Access-Control-Allow-Origin": "*",
        });
        return res.end(JSON.stringify({ ok: true }));
      } catch (err) {
        console.error("/api/subscribe failed:", err);
        return json(res, 500, { ok: false, error: err && err.message ? err.message : "save failed" });
      }
    }
    if (req.method === "POST" && url.pathname === "/api/publish") {
      const body = await parseBody(req);
      const ids = Array.isArray(body.ids) ? body.ids.map((id) => String(id)).filter(Boolean) : [];
      if (!ids.length) return json(res, 400, { message: "No draft IDs provided." });
      if (ids.length > 3) return json(res, 400, { message: "Max 3 drafts per publish action." });

      await runNodeScript([path.join("scripts", "publish-approved-drafts.mjs"), ...ids]);
      const report = await safeRead(reportPath, { publishedPages: [] });
      return json(res, 200, {
        message: "Publish completed successfully.",
        publishedPages: report.publishedPages || [],
      });
    }

    if (url.pathname.startsWith("/api/")) {
      return json(res, 404, { error: "API route not found", path: url.pathname });
    }

    const staticTarget = path.join(root, decodeURIComponent(url.pathname).replace(/^\/+/, ""));
    if (req.method === "GET" && staticTarget.startsWith(root)) {
      return serveStatic(req, res, staticTarget);
    }

    res.writeHead(404);
    res.end("Not found");
  } catch (error) {
    json(res, 500, { message: error && error.message ? error.message : "Server error" });
  }
});

const port = Number(process.env.SEO_DASHBOARD_PORT || 4173);
server.listen(port, () => {
  console.log("SEO Approval Dashboard running at http://localhost:" + port + "/admin");
});
