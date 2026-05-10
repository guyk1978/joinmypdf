import { readFile, rm, stat } from "node:fs/promises";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { setTimeout as sleep } from "node:timers/promises";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

const results = [];
function record(name, ok, detail) {
  results.push({ name, ok, detail: detail || "" });
  const tag = ok ? "PASS" : "FAIL";
  console.log("[" + tag + "] " + name + (detail ? " — " + detail : ""));
}

function assert(name, condition, detail) {
  record(name, Boolean(condition), detail);
}

async function staticChecks() {
  console.log("\n== Static behavior checks (assets/js/email-popup.js) ==");
  const popupPath = path.join(root, "assets", "js", "email-popup.js");
  const src = await readFile(popupPath, "utf8");

  assert(
    "20s timer trigger present",
    /SHOW_AFTER_MS\s*=\s*20000/.test(src) && /setTimeout\([^,]+,\s*SHOW_AFTER_MS\)/.test(src),
    "constant + setTimeout call"
  );

  assert(
    "Tool-complete trigger present",
    /TOOL_COMPLETE_EVENT\s*=\s*"joinmypdf:tool-complete"/.test(src) &&
      /addEventListener\(TOOL_COMPLETE_EVENT/.test(src),
    "constant + listener"
  );

  assert(
    "7-day cooldown logic present",
    /COOLDOWN_MS\s*=\s*7\s*\*\s*24\s*\*\s*60\s*\*\s*60\s*\*\s*1000/.test(src) &&
      /recentlyShown\(/.test(src) &&
      /alreadySubscribed\(/.test(src),
    "constant + cooldown gates"
  );

  assert(
    "Close paths bound (X, Esc, backdrop, Maybe Later)",
    /jmp-popup__close/.test(src) &&
      /event\.key === "Escape"/.test(src) &&
      /event\.target === overlay/.test(src) &&
      /jmp-popup__later/.test(src),
    "all four close handlers wired"
  );

  assert(
    "Email validation present",
    /EMAIL_RE\s*=\s*\/\^\[\^\\s@\]/.test(src) && /EMAIL_RE\.test\(/.test(src),
    "regex defined and used at submit"
  );

  assert(
    "GA + Plausible tracking calls",
    /window\.gtag/.test(src) &&
      /window\.plausible/.test(src) &&
      /track\("popup_view"/.test(src) &&
      /track\("popup_submit"/.test(src) &&
      /track\("popup_close"/.test(src),
    "all 3 events emitted"
  );

  assert(
    "Backend POST + local fallback",
    /SUBSCRIBE_ENDPOINT\s*=\s*"\/api\/subscribe"/.test(src) &&
      /fetch\(SUBSCRIBE_ENDPOINT/.test(src) &&
      /queuePending\(/.test(src),
    "POST with localStorage fallback"
  );

  assert(
    "Bookmark CTA wired",
    /jmp-popup__bookmark/.test(src) && /showBookmarkHint\(/.test(src),
    "button + handler"
  );

  console.log("\n== ui-core.js dispatches tool-complete ==");
  const uiSrc = await readFile(path.join(root, "assets", "js", "ui-core.js"), "utf8");
  assert(
    "ui-core dispatches joinmypdf:tool-complete on success",
    /CustomEvent\("joinmypdf:tool-complete"/.test(uiSrc) && /if \(succeeded\)/.test(uiSrc),
    "event fires only on success"
  );

  console.log("\n== HTML wiring ==");
  const homepage = await readFile(path.join(root, "index.html"), "utf8");
  const homeMatches = (homepage.match(/email-popup\.js/g) || []).length;
  assert("index.html includes email-popup.js exactly once", homeMatches === 1, "occurrences=" + homeMatches);

  const toolPage = await readFile(path.join(root, "tools", "pdf-merge", "index.html"), "utf8");
  const toolMatches = (toolPage.match(/email-popup\.js/g) || []).length;
  assert("tools/pdf-merge/index.html includes email-popup.js once", toolMatches === 1, "occurrences=" + toolMatches);

  const blogIdx = await readFile(path.join(root, "blog", "index.html"), "utf8");
  const blogMatches = (blogIdx.match(/email-popup\.js/g) || []).length;
  assert("blog/index.html includes email-popup.js once", blogMatches === 1, "occurrences=" + blogMatches);

  console.log("\n== Service worker precache ==");
  const sw = await readFile(path.join(root, "sw.js"), "utf8");
  assert("sw.js cache version bumped to v2", /CACHE_NAME\s*=\s*"joinmypdf-shell-v2"/.test(sw));
  assert("sw.js precaches /assets/js/email-popup.js", /\/assets\/js\/email-popup\.js/.test(sw));
}

function waitFor(predicate, timeoutMs) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    (function tick() {
      if (predicate()) return resolve();
      if (Date.now() - start > timeoutMs) return reject(new Error("timeout"));
      setTimeout(tick, 50);
    })();
  });
}

function makeSandbox() {
  const listeners = {};
  const storage = new Map();
  const timers = [];
  let now = 1_700_000_000_000;
  const tracks = [];
  let nextTimerId = 1;

  const docListeners = {};
  const fakeDoc = {
    readyState: "complete",
    head: { appendChild() {} },
    body: { appendChild() {} },
    addEventListener(type, fn) { (docListeners[type] = docListeners[type] || []).push(fn); },
    createElement() {
      const handlers = {};
      return {
        id: "", className: "", innerHTML: "", textContent: "",
        dataset: {}, style: {},
        setAttribute() {}, appendChild() {},
        addEventListener(type, fn) { handlers[type] = fn; },
        dispatchEvent(evt) { if (handlers[evt.type]) handlers[evt.type](evt); },
      };
    },
    getElementById(id) {
      return {
        id, value: "", dataset: {},
        focus() {}, setAttribute() {}, removeAttribute() {},
        addEventListener() {}, dispatchEvent() {},
        textContent: "",
      };
    },
  };

  function sandboxSetTimeout(fn, delay) {
    const id = nextTimerId++;
    timers.push({ id, at: now + (Number(delay) || 0), fn });
    return id;
  }
  function sandboxClearTimeout(id) {
    const idx = timers.findIndex((t) => t.id === id);
    if (idx >= 0) timers.splice(idx, 1);
  }
  function sandboxRAF(fn) { return sandboxSetTimeout(fn, 16); }

  const sandbox = {
    __tracks: tracks,
    __storage: storage,
    __listeners: listeners,
    __docListeners: docListeners,
    __advance(ms) {
      now += ms;
      const due = timers.filter((t) => t.at <= now).sort((a, b) => a.at - b.at);
      const future = timers.filter((t) => t.at > now);
      timers.length = 0;
      timers.push(...future);
      due.forEach((t) => { try { t.fn(); } catch (_) {} });
    },
    document: fakeDoc,
    location: { pathname: "/test", href: "https://example.com/test" },
    navigator: { userAgent: "node-smoke", platform: "node" },
    setTimeout: sandboxSetTimeout,
    clearTimeout: sandboxClearTimeout,
    requestAnimationFrame: sandboxRAF,
    Date: { now: () => now },
    CustomEvent: class { constructor(type, init) { this.type = type; this.detail = init && init.detail; } },
    console,
    URL,
  };
  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;
  sandbox.matchMedia = () => ({ matches: false, addListener() {}, removeListener() {} });
  sandbox.addEventListener = (type, fn) => { (listeners[type] = listeners[type] || []).push(fn); };
  sandbox.dispatchEvent = (evt) => { (listeners[evt.type] || []).forEach((fn) => fn(evt)); return true; };
  sandbox.localStorage = {
    getItem: (k) => (storage.has(k) ? storage.get(k) : null),
    setItem: (k, v) => storage.set(k, String(v)),
    removeItem: (k) => storage.delete(k),
  };
  sandbox.gtag = (_action, name, payload) => tracks.push({ name, payload });
  sandbox.plausible = () => {};
  sandbox.fetch = async () => ({ ok: true, status: 200, json: async () => ({ ok: true }) });
  sandbox.alert = () => {};
  return sandbox;
}

async function behavioralChecks() {
  console.log("\n== Behavioral runtime checks (sandboxed DOM) ==");
  const popupSrc = await readFile(path.join(root, "assets", "js", "email-popup.js"), "utf8");
  const vm = await import("node:vm");

  function runSession(setup) {
    const sandbox = makeSandbox();
    if (setup) setup(sandbox);
    const ctx = vm.createContext(sandbox);
    try { vm.runInContext(popupSrc, ctx, { timeout: 1500 }); } catch (e) { return { sandbox, error: e }; }
    return { sandbox };
  }

  const fresh = runSession();
  if (fresh.error) { assert("Popup script loads cleanly (fresh)", false, fresh.error.message); return; }
  fresh.sandbox.__advance(19000);
  const before20s = fresh.sandbox.__tracks.some((t) => t.name === "popup_view");
  fresh.sandbox.__advance(2000);
  const after20s = fresh.sandbox.__tracks.some((t) => t.name === "popup_view");
  assert("Popup does NOT open before 20s", !before20s);
  assert("Popup opens after 20s timer", after20s);

  const tool = runSession();
  if (tool.error) { assert("Popup script loads cleanly (tool)", false, tool.error.message); }
  tool.sandbox.__advance(500);
  tool.sandbox.dispatchEvent({ type: "joinmypdf:tool-complete" });
  tool.sandbox.__advance(50);
  const toolViewed = tool.sandbox.__tracks.some((t) => t.name === "popup_view" && t.payload && t.payload.trigger === "tool_complete");
  assert("Popup opens immediately on joinmypdf:tool-complete event", toolViewed);

  const cooldown = runSession((sb) => {
    sb.localStorage.setItem("joinmypdf-popup-shown-at", String(sb.Date.now() - 1 * 24 * 60 * 60 * 1000));
  });
  cooldown.sandbox.__advance(25000);
  cooldown.sandbox.dispatchEvent({ type: "joinmypdf:tool-complete" });
  cooldown.sandbox.__advance(50);
  const blocked = !cooldown.sandbox.__tracks.some((t) => t.name === "popup_view");
  assert("7-day cooldown blocks reopening within window", blocked);

  const expired = runSession((sb) => {
    sb.localStorage.setItem("joinmypdf-popup-shown-at", String(sb.Date.now() - 8 * 24 * 60 * 60 * 1000));
  });
  expired.sandbox.__advance(21000);
  const reopened = expired.sandbox.__tracks.some((t) => t.name === "popup_view");
  assert("Popup reopens after cooldown expires (>7 days)", reopened);

  const subscribed = runSession((sb) => {
    sb.localStorage.setItem("joinmypdf-popup-subscribed", "1");
  });
  subscribed.sandbox.__advance(25000);
  const blockedSubscriber = !subscribed.sandbox.__tracks.some((t) => t.name === "popup_view");
  assert("Subscribed users never see popup again", blockedSubscriber);

  const closeTest = runSession();
  closeTest.sandbox.__advance(21000);
  closeTest.sandbox.__advance(50);
  const opened = closeTest.sandbox.__tracks.some((t) => t.name === "popup_view");
  const keyListeners = closeTest.sandbox.__listeners.keydown || [];
  const docKeyHandlers = (closeTest.sandbox.__docListeners || {})["keydown"] || [];
  [...keyListeners, ...docKeyHandlers].forEach((fn) => fn({ key: "Escape" }));
  closeTest.sandbox.__advance(50);
  const closeFired = closeTest.sandbox.__tracks.some((t) => t.name === "popup_close");
  assert("Close path fires popup_close tracking (Escape key)", opened && closeFired);
}

async function backendChecks() {
  console.log("\n== Live backend: /api/subscribe ==");
  const subscribersPath = path.join(root, "logs", "email-subscribers.json");
  await rm(subscribersPath, { force: true });

  const port = 4173 + Math.floor(Math.random() * 1000) + 100;
  const env = Object.assign({}, process.env, { SEO_DASHBOARD_PORT: String(port) });
  const child = spawn(process.execPath, [path.join("scripts", "seo-approval-server.mjs")], {
    cwd: root,
    env,
    stdio: ["ignore", "pipe", "pipe"],
  });
  let serverOut = "";
  child.stdout.on("data", (d) => (serverOut += d.toString()));
  child.stderr.on("data", (d) => (serverOut += d.toString()));

  try {
    await waitFor(() => /running at/i.test(serverOut), 4000);

    const ok = await fetch("http://localhost:" + port + "/api/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "smoke-test@example.com",
        page: "/",
        referrer: "smoke-test",
      }),
    });
    const okBody = await ok.json();
    assert(
      "POST valid email returns ok:true",
      ok.status === 200 && okBody && okBody.ok === true,
      "status=" + ok.status + " body=" + JSON.stringify(okBody)
    );

    const bad = await fetch("http://localhost:" + port + "/api/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "not-an-email" }),
    });
    const badBody = await bad.json();
    assert(
      "POST invalid email returns 400",
      bad.status === 400 && badBody && badBody.ok === false,
      "status=" + bad.status + " body=" + JSON.stringify(badBody)
    );

    const dup = await fetch("http://localhost:" + port + "/api/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "smoke-test@example.com" }),
    });
    assert("POST duplicate email is idempotent (200)", dup.status === 200);

    await sleep(50);
    const fileExists = await stat(subscribersPath).then(() => true, () => false);
    assert("logs/email-subscribers.json was written", fileExists);
    if (fileExists) {
      const stored = JSON.parse(await readFile(subscribersPath, "utf8"));
      const list = Array.isArray(stored.subscribers) ? stored.subscribers : [];
      const sample = list.find((entry) => entry.email === "smoke-test@example.com");
      assert(
        "stored entry has email + timestamp + page",
        Boolean(sample && sample.at && sample.page === "/"),
        "entry=" + JSON.stringify(sample)
      );
      assert("duplicate did not double-insert", list.filter((e) => e.email === "smoke-test@example.com").length === 1);
    }

    const unknown = await fetch("http://localhost:" + port + "/api/totally-bogus");
    assert(
      "Unknown /api/* path returns JSON 404, not HTML",
      unknown.status === 404 && /application\/json/.test(unknown.headers.get("content-type") || ""),
      "ct=" + unknown.headers.get("content-type")
    );
  } finally {
    child.kill();
    await sleep(150);
    await rm(subscribersPath, { force: true });
  }
}

async function main() {
  await staticChecks();
  await behavioralChecks();
  await backendChecks();

  console.log("\n== Final summary ==");
  const failed = results.filter((r) => !r.ok);
  console.log("Total: " + results.length + "   Passed: " + (results.length - failed.length) + "   Failed: " + failed.length);
  if (failed.length) {
    for (const f of failed) console.log("  FAIL: " + f.name + (f.detail ? " — " + f.detail : ""));
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err && err.stack ? err.stack : String(err));
  process.exit(1);
});
