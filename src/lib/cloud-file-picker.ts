export type CloudProvider = "Dropbox" | "Google Drive" | "OneDrive";

type CloudPickerResult = {
  files: File[];
  cancelled?: boolean;
  error?: string;
};

type GooglePickerDoc = {
  id: string;
  name: string;
  mimeType?: string;
  url?: string;
};

type GoogleDocsView = {
  setIncludeFolders?: (v: boolean) => GoogleDocsView | unknown;
  setSelectFolderEnabled?: (v: boolean) => GoogleDocsView | unknown;
};

type GooglePickerBuilder = {
  addView: (view: unknown) => GooglePickerBuilder;
  setOAuthToken: (token: string) => GooglePickerBuilder;
  setDeveloperKey: (key: string) => GooglePickerBuilder;
  setAppId?: (appId: string) => GooglePickerBuilder;
  setOrigin?: (origin: string) => GooglePickerBuilder;
  setTitle?: (title: string) => GooglePickerBuilder;
  setSize?: (width: number, height: number) => GooglePickerBuilder;
  setMaxItems?: (n: number) => GooglePickerBuilder;
  setCallback: (
    cb: (data: Record<string, unknown>) => void,
  ) => GooglePickerBuilder;
  enableFeature?: (feature: unknown) => GooglePickerBuilder;
  setFeature?: (feature: unknown) => GooglePickerBuilder;
  setSelectableMimeTypes?: (types: string) => GooglePickerBuilder;
  build: () => GooglePickerInstance;
};

type GooglePickerInstance = {
  setVisible: (v: boolean) => GooglePickerInstance | void;
  dispose?: () => void;
};

declare global {
  interface Window {
    Dropbox?: {
      choose: (options: {
        success: (files: Array<{ link: string; name: string; bytes?: number }>) => void;
        cancel?: () => void;
        linkType?: "direct" | "preview";
        multiselect?: boolean;
        extensions?: string[];
        folderselect?: boolean;
      }) => void;
    };
    gapi?: {
      load: (name: string, callback: () => void) => void;
    };
    google?: {
      accounts?: {
        oauth2?: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: {
              access_token?: string;
              error?: string;
              error_description?: string;
            }) => void;
            error_callback?: (error: {
              type?: string;
              message?: string;
            }) => void;
          }) => { requestAccessToken: (opts?: { prompt?: string }) => void };
        };
      };
      picker?: {
        PickerBuilder: new () => GooglePickerBuilder;
        DocsView: new (viewId?: unknown) => GoogleDocsView;
        ViewId: { DOCS: unknown; DOCS_IMAGES: unknown; PDFS?: unknown };
        Action: { PICKED: string; CANCEL: string; LOADED?: string };
        Response?: { ACTION: string; DOCUMENTS: string };
        Feature?: { MULTISELECT_ENABLED: unknown; SUPPORT_DRIVES?: unknown };
      };
    };
    OneDrive?: {
      open: (options: {
        clientId: string;
        action: "download" | "query";
        multiSelect?: boolean;
        openInNewWindow?: boolean;
        success?: (response: {
          value?: Array<{
            name?: string;
            "@microsoft.graph.downloadUrl"?: string;
            file?: unknown;
          }>;
        }) => void;
        cancel?: () => void;
        error?: (error: unknown) => void;
      }) => void;
    };
  }
}

/**
 * Next.js only inlines NEXT_PUBLIC_* values for *static* `process.env.NAME`
 * access. Dynamic `process.env[name]` is always empty in the client bundle,
 * which previously forced the drive.google.com fallback.
 */
export function getCloudPickerConfig() {
  return {
    dropboxAppKey: (process.env.NEXT_PUBLIC_DROPBOX_APP_KEY ?? "").trim(),
    googleApiKey: (process.env.NEXT_PUBLIC_GOOGLE_API_KEY ?? "").trim(),
    googleClientId: (process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "").trim(),
    oneDriveClientId: (process.env.NEXT_PUBLIC_ONEDRIVE_CLIENT_ID ?? "").trim(),
  };
}

export function cloudProviderConfigured(provider: CloudProvider): boolean {
  const cfg = getCloudPickerConfig();
  if (provider === "Dropbox") return Boolean(cfg.dropboxAppKey);
  if (provider === "Google Drive") {
    return Boolean(cfg.googleApiKey && cfg.googleClientId);
  }
  return Boolean(cfg.oneDriveClientId);
}

export function cloudProviderHomeUrl(provider: CloudProvider): string {
  if (provider === "Dropbox") return "https://www.dropbox.com/home";
  if (provider === "Google Drive") return "https://drive.google.com/drive/my-drive";
  return "https://onedrive.live.com/";
}

/** Prefer the top frame so chooser popups sit above the tool-modal chrome. */
function getPickerWindow(): Window {
  if (typeof window === "undefined") {
    throw new Error("No window");
  }
  try {
    if (window.top && window.top !== window) {
      // Same-origin check.
      void window.top.document;
      return window.top;
    }
  } catch {
    /* cross-origin */
  }
  return window;
}

function loadScript(
  targetWin: Window,
  src: string,
  id: string,
  attrs?: Record<string, string>,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const doc = targetWin.document;
    if (!doc?.body) {
      reject(new Error("No document"));
      return;
    }
    const existing = doc.getElementById(id) as HTMLScriptElement | null;
    if (existing) {
      if (attrs) {
        for (const [key, value] of Object.entries(attrs)) {
          existing.setAttribute(key, value);
        }
      }
      if (existing.dataset.loaded === "1") {
        resolve();
        return;
      }
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener(
        "error",
        () => reject(new Error(`Failed to load ${src}`)),
        { once: true },
      );
      return;
    }
    const script = doc.createElement("script");
    script.id = id;
    script.src = src;
    script.async = true;
    if (attrs) {
      for (const [key, value] of Object.entries(attrs)) {
        script.setAttribute(key, value);
      }
    }
    script.onload = () => {
      script.dataset.loaded = "1";
      resolve();
    };
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    doc.body.appendChild(script);
  });
}

async function fetchAsFile(
  url: string,
  name: string,
  init?: RequestInit,
): Promise<File> {
  const response = await fetch(url, {
    mode: "cors",
    credentials: "omit",
    ...init,
  });
  if (!response.ok) {
    throw new Error(`Download failed (${response.status})`);
  }
  const blob = await response.blob();
  const type =
    blob.type && blob.type !== "application/octet-stream"
      ? blob.type
      : guessMimeFromName(name) || blob.type || "application/octet-stream";
  return new File([blob], name || "download", { type });
}

function guessMimeFromName(name: string): string {
  const lower = name.toLowerCase();
  if (lower.endsWith(".pdf")) return "application/pdf";
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".gif")) return "image/gif";
  if (lower.endsWith(".svg")) return "image/svg+xml";
  if (lower.endsWith(".mp4")) return "video/mp4";
  if (lower.endsWith(".webm")) return "video/webm";
  if (lower.endsWith(".mp3")) return "audio/mpeg";
  if (lower.endsWith(".wav")) return "audio/wav";
  if (lower.endsWith(".zip")) return "application/zip";
  if (lower.endsWith(".docx")) {
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  }
  if (lower.endsWith(".xlsx")) {
    return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  }
  return "";
}

async function openDropboxChooser(multiselect: boolean): Promise<CloudPickerResult> {
  const { dropboxAppKey } = getCloudPickerConfig();
  if (!dropboxAppKey) return { files: [], cancelled: true };

  const win = getPickerWindow();
  await loadScript(win, "https://www.dropbox.com/static/api/2/dropins.js", "dropboxjs", {
    "data-app-key": dropboxAppKey,
  });

  return new Promise((resolve) => {
    if (!win.Dropbox?.choose) {
      resolve({ files: [], error: "Dropbox chooser unavailable" });
      return;
    }
    win.Dropbox.choose({
      linkType: "direct",
      multiselect,
      success: (entries) => {
        void (async () => {
          try {
            const files = await Promise.all(
              entries.map((entry) => fetchAsFile(entry.link, entry.name)),
            );
            resolve({ files: files.filter((file) => file.size > 0) });
          } catch (err) {
            resolve({
              files: [],
              error: err instanceof Error ? err.message : "Dropbox download failed",
            });
          }
        })();
      },
      cancel: () => resolve({ files: [], cancelled: true }),
    });
  });
}

async function openOneDrivePicker(multiselect: boolean): Promise<CloudPickerResult> {
  const { oneDriveClientId } = getCloudPickerConfig();
  if (!oneDriveClientId) return { files: [], cancelled: true };

  const win = getPickerWindow();
  await loadScript(win, "https://js.live.net/v7.2/OneDrive.js", "onedrive-sdk");

  return new Promise((resolve) => {
    if (!win.OneDrive?.open) {
      resolve({ files: [], error: "OneDrive picker unavailable" });
      return;
    }
    win.OneDrive.open({
      clientId: oneDriveClientId,
      action: "download",
      multiSelect: multiselect,
      openInNewWindow: true,
      success: (response) => {
        void (async () => {
          try {
            const items = response.value ?? [];
            const downloads = items
              .map((item) => {
                const url = item["@microsoft.graph.downloadUrl"];
                if (!url) return null;
                return fetchAsFile(url, item.name || "onedrive-file");
              })
              .filter(Boolean) as Promise<File>[];
            const files = await Promise.all(downloads);
            resolve({ files: files.filter((file) => file.size > 0) });
          } catch (err) {
            resolve({
              files: [],
              error: err instanceof Error ? err.message : "OneDrive download failed",
            });
          }
        })();
      },
      cancel: () => resolve({ files: [], cancelled: true }),
      error: () => resolve({ files: [], error: "OneDrive picker error" }),
    });
  });
}

function googleAppIdFromClientId(clientId: string): string {
  const match = /^(\d+)-/.exec(clientId);
  return match?.[1] ?? "";
}

const GDRIVE_LOG = "[joinmypdf:gdrive]";

function gdriveLog(message: string, detail?: unknown) {
  if (typeof console === "undefined") return;
  if (detail !== undefined) {
    console.info(GDRIVE_LOG, message, detail);
  } else {
    console.info(GDRIVE_LOG, message);
  }
}

function gdriveWarn(message: string, detail?: unknown) {
  if (typeof console === "undefined") return;
  if (detail !== undefined) {
    console.warn(GDRIVE_LOG, message, detail);
  } else {
    console.warn(GDRIVE_LOG, message);
  }
}

/** Prefer top frame for Google so tool-iframe remounts don't kill the OAuth popup. */
function getGooglePickerWindow(): Window {
  return getPickerWindow();
}

let googleDriveApisPromise: Promise<Window> | null = null;

/** Warm GSI + Picker scripts so a later click can open the auth popup without awaiting first. */
export function preloadGoogleDrivePicker(): Promise<Window> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("No window"));
  }
  if (!googleDriveApisPromise) {
    const win = getGooglePickerWindow();
    googleDriveApisPromise = (async () => {
      gdriveLog("preload: start");
      await loadScript(win, "https://accounts.google.com/gsi/client", "google-gsi");
      await loadGooglePickerApi(win);
      gdriveLog("preload: ready", {
        hasGsi: Boolean(win.google?.accounts?.oauth2),
        hasPicker: Boolean(win.google?.picker),
      });
      return win;
    })().catch((err) => {
      googleDriveApisPromise = null;
      gdriveWarn("preload: failed", err);
      throw err;
    });
  }
  return googleDriveApisPromise;
}

/** Keep the in-page Google Picker above JoinMyPDF overlays / tool chrome. */
function elevateGooglePickerLayers(doc: Document) {
  const styleId = "joinmypdf-google-picker-z";
  if (!doc.getElementById(styleId)) {
    const style = doc.createElement("style");
    style.id = styleId;
    style.textContent = `
.picker-dialog-bg { z-index: 2147483645 !important; }
.picker-dialog { z-index: 2147483646 !important; }
`;
    doc.head.appendChild(style);
  }
  return () => {
    /* keep style for subsequent opens */
  };
}

function closeGooglePicker(picker: GooglePickerInstance | null) {
  if (!picker) return;
  try {
    picker.setVisible(false);
  } catch {
    /* ignore */
  }
  try {
    picker.dispose?.();
  } catch {
    /* ignore */
  }
}

function readPickerDocs(
  pickerNs: NonNullable<Window["google"]>["picker"],
  data: Record<string, unknown>,
): GooglePickerDoc[] {
  if (!pickerNs) return [];
  const docsKey = pickerNs.Response?.DOCUMENTS ?? "docs";
  const raw = data[docsKey] ?? data.docs;
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (doc): doc is GooglePickerDoc =>
      Boolean(doc && typeof doc === "object" && "id" in doc),
  );
}

function readPickerAction(
  pickerNs: NonNullable<Window["google"]>["picker"],
  data: Record<string, unknown>,
): string {
  if (!pickerNs) return "";
  const actionKey = pickerNs.Response?.ACTION ?? "action";
  return String(data[actionKey] ?? data.action ?? "");
}

function loadGooglePickerApi(win: Window): Promise<void> {
  return new Promise((resolve, reject) => {
    void loadScript(win, "https://apis.google.com/js/api.js", "google-api").then(() => {
      if (!win.gapi?.load) {
        reject(new Error("Google API unavailable"));
        return;
      }
      win.gapi.load("picker", () => {
        // gapi.load callback can fire before google.picker is fully attached.
        const deadline = Date.now() + 8000;
        const poll = () => {
          const picker = win.google?.picker;
          if (picker?.PickerBuilder && picker.DocsView && picker.ViewId) {
            gdriveLog("picker api: ready");
            resolve();
            return;
          }
          if (Date.now() > deadline) {
            reject(new Error("Google Picker API failed to initialize"));
            return;
          }
          win.setTimeout(poll, 50);
        };
        poll();
      });
    }, reject);
  });
}

/** Top-frame origin string required by Picker when the tool runs inside an iframe. */
function googlePickerOrigin(win: Window): string {
  return `${win.location.protocol}//${win.location.host}`;
}

function googlePickerDialogSize(win: Window): { width: number; height: number } {
  const vw = win.innerWidth || 1024;
  const vh = win.innerHeight || 768;
  return {
    width: Math.min(1051, Math.max(565, Math.floor(vw * 0.9))),
    height: Math.min(650, Math.max(350, Math.floor(vh * 0.8))),
  };
}

function requestGoogleAccessToken(win: Window, clientId: string): Promise<string> {
  return new Promise((resolve, reject) => {
    let settled = false;
    let popupClosedTimer = 0;
    const finish = (fn: () => void) => {
      if (settled) return;
      settled = true;
      if (popupClosedTimer) win.clearTimeout(popupClosedTimer);
      fn();
    };

    const oauth = win.google?.accounts?.oauth2;
    if (!oauth?.initTokenClient) {
      reject(new Error("Google Identity Services unavailable"));
      return;
    }

    // Picker-recommended non-sensitive scope. Broader drive.readonly often fails
    // unverified OAuth clients and is unnecessary for file selection.
    const scope = "https://www.googleapis.com/auth/drive.file";

    gdriveLog("token: initTokenClient", {
      clientIdPrefix: clientId.slice(0, 20),
      origin: win.location.origin,
      scope,
      coopHint:
        "Page needs Cross-Origin-Opener-Policy: same-origin-allow-popups for GIS popups",
    });

    const client = oauth.initTokenClient({
      client_id: clientId,
      scope,
      callback: (response) => {
        gdriveLog("token: callback", {
          hasToken: Boolean(response.access_token),
          error: response.error,
          error_description: response.error_description,
        });
        if (response.access_token) {
          finish(() => resolve(response.access_token!));
          return;
        }
        finish(() =>
          reject(
            new Error(
              response.error_description ||
                response.error ||
                "Google auth failed (no access token)",
            ),
          ),
        );
      },
      error_callback: (error) => {
        // GIS may fire popup_closed while transitioning account → consent.
        // Wait briefly for a successful token callback before cancelling.
        gdriveWarn("token: error_callback", error);
        const type = error?.type || "";
        if (type === "popup_closed" || type === "popup_closed_by_user") {
          if (popupClosedTimer) win.clearTimeout(popupClosedTimer);
          popupClosedTimer = win.setTimeout(() => {
            finish(() =>
              reject(
                new Error(
                  "cancelled — if this keeps happening, ensure Cross-Origin-Opener-Policy is same-origin-allow-popups (not same-origin)",
                ),
              ),
            );
          }, 2500);
          return;
        }
        finish(() =>
          reject(
            new Error(
              error?.message || type || "Google auth popup failed or was blocked",
            ),
          ),
        );
      },
    });

    gdriveLog("token: requestAccessToken");
    try {
      // Empty prompt skips re-consent when a grant already exists; still shows
      // account chooser when needed. Do not pass prompt:'consent' every time.
      client.requestAccessToken({ prompt: "" });
    } catch (err) {
      gdriveWarn("token: requestAccessToken threw", err);
      finish(() =>
        reject(err instanceof Error ? err : new Error("requestAccessToken failed")),
      );
    }
  });
}

async function downloadGoogleDriveFile(
  doc: GooglePickerDoc,
  accessToken: string,
): Promise<File> {
  // Export Google Docs editors formats to PDF; otherwise download binary media.
  const isGoogleNative =
    Boolean(doc.mimeType?.startsWith("application/vnd.google-apps.")) &&
    doc.mimeType !== "application/vnd.google-apps.folder";

  let url: string;
  let name = doc.name || "drive-file";

  if (isGoogleNative) {
    const exportMime = "application/pdf";
    url = `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(doc.id)}/export?mimeType=${encodeURIComponent(exportMime)}`;
    if (!/\.pdf$/i.test(name)) name = `${name}.pdf`;
  } else {
    url = `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(doc.id)}?alt=media`;
  }

  gdriveLog("download: start", { id: doc.id, name, native: isGoogleNative });
  return fetchAsFile(url, name, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

async function openGoogleDrivePicker(multiselect: boolean): Promise<CloudPickerResult> {
  const { googleApiKey, googleClientId } = getCloudPickerConfig();
  if (!googleApiKey || !googleClientId) {
    return {
      files: [],
      error:
        "Google Drive picker requires NEXT_PUBLIC_GOOGLE_API_KEY and NEXT_PUBLIC_GOOGLE_CLIENT_ID",
    };
  }

  gdriveLog("picker: open", {
    hasApiKey: Boolean(googleApiKey),
    hasClientId: Boolean(googleClientId),
    origin: typeof window !== "undefined" ? window.location.origin : "",
    multiselect,
  });

  // Prefer the top frame so the Picker dialog isn't trapped inside the tool iframe
  // (and so setOrigin matches the visible page).
  const win = await preloadGoogleDrivePicker();

  let accessToken: string;
  try {
    accessToken = await requestGoogleAccessToken(win, googleClientId);
  } catch (err) {
    gdriveWarn("picker: token failed", err);
    const message = err instanceof Error ? err.message : "Google auth failed";
    if (
      message === "cancelled" ||
      message.startsWith("cancelled") ||
      /popup_closed/i.test(message)
    ) {
      return { files: [], cancelled: true };
    }
    return {
      files: [],
      error: message,
    };
  }

  // Re-assert picker readiness after the OAuth await (scripts must still be present).
  const pickerNs = win.google?.picker;
  if (!pickerNs?.PickerBuilder || !pickerNs.DocsView || !pickerNs.ViewId) {
    try {
      await loadGooglePickerApi(win);
    } catch (err) {
      return {
        files: [],
        error: err instanceof Error ? err.message : "Google Picker unavailable",
      };
    }
  }

  return new Promise((resolve) => {
    const pickerApi = win.google?.picker;
    if (!pickerApi?.PickerBuilder || !pickerApi.DocsView) {
      resolve({ files: [], error: "Google Picker unavailable" });
      return;
    }

    let settled = false;
    let picker: GooglePickerInstance | null = null;
    elevateGooglePickerLayers(win.document);

    const finish = (result: CloudPickerResult) => {
      if (settled) return;
      settled = true;
      gdriveLog("picker: finish", {
        cancelled: result.cancelled,
        error: result.error,
        fileCount: result.files.length,
      });
      closeGooglePicker(picker);
      resolve(result);
    };

    try {
      if (!accessToken || !googleApiKey) {
        finish({ files: [], error: "Missing OAuth token or API key for Google Picker" });
        return;
      }

      // DocsView is required — without a valid view the dialog iframe stays blank.
      const view = new pickerApi.DocsView(pickerApi.ViewId.DOCS);
      view.setIncludeFolders?.(false);
      view.setSelectFolderEnabled?.(false);

      const origin = googlePickerOrigin(win);
      const size = googlePickerDialogSize(win);
      gdriveLog("picker: build", {
        origin,
        size,
        tokenLen: accessToken.length,
        apiKeyPrefix: googleApiKey.slice(0, 8),
      });

      const builder = new pickerApi.PickerBuilder()
        .addView(view)
        .setOAuthToken(accessToken)
        .setDeveloperKey(googleApiKey)
        .setCallback((data) => {
          try {
            const action = readPickerAction(pickerApi, data);
            gdriveLog("picker: callback", { action, keys: Object.keys(data) });

            const picked = pickerApi.Action.PICKED;
            const cancelled = pickerApi.Action.CANCEL;
            const loaded = pickerApi.Action.LOADED;

            if (action === cancelled || action === "cancel") {
              finish({ files: [], cancelled: true });
              return;
            }

            // Ignore LOADED / unknown — do not dispose the picker.
            if (action === loaded || action === "loaded") {
              return;
            }
            if (action !== picked && action !== "picked") {
              gdriveLog("picker: ignoring action", action);
              return;
            }

            const docs = readPickerDocs(pickerApi, data);
            if (!docs.length) {
              finish({ files: [], error: "No file selected" });
              return;
            }

            // Hide picker UI right away; keep downloading in the background.
            closeGooglePicker(picker);
            picker = null;

            const selected = multiselect ? docs : docs.slice(0, 1);
            void (async () => {
              try {
                const files = await Promise.all(
                  selected.map((doc) => downloadGoogleDriveFile(doc, accessToken)),
                );
                const usable = files.filter((file) => file.size > 0);
                finish(
                  usable.length
                    ? { files: usable }
                    : { files: [], error: "Downloaded file was empty" },
                );
              } catch (err) {
                gdriveWarn("picker: download failed", err);
                finish({
                  files: [],
                  error:
                    err instanceof Error ? err.message : "Google Drive download failed",
                });
              }
            })();
          } catch (err) {
            gdriveWarn("picker: callback exception", err);
            finish({
              files: [],
              error: err instanceof Error ? err.message : "Google Picker callback failed",
            });
          }
        });

      const appId =
        (process.env.NEXT_PUBLIC_GOOGLE_APP_ID ?? "").trim() ||
        googleAppIdFromClientId(googleClientId);
      if (appId) {
        builder.setAppId?.(appId);
        gdriveLog("picker: setAppId", appId);
      } else {
        gdriveWarn(
          "picker: missing App ID — set NEXT_PUBLIC_GOOGLE_APP_ID to your Cloud project number for drive.file scope",
        );
      }

      // Required when the app (or tool) is framed — must match the top page origin.
      builder.setOrigin?.(origin);
      builder.setSize?.(size.width, size.height);
      builder.setTitle?.("Select a file");
      if (!multiselect) builder.setMaxItems?.(1);

      if (multiselect && pickerApi.Feature?.MULTISELECT_ENABLED) {
        builder.enableFeature?.(pickerApi.Feature.MULTISELECT_ENABLED);
      }
      if (pickerApi.Feature?.SUPPORT_DRIVES) {
        builder.enableFeature?.(pickerApi.Feature.SUPPORT_DRIVES);
      }

      picker = builder.build();
      gdriveLog("picker: setVisible(true)");
      picker.setVisible(true);
    } catch (err) {
      gdriveWarn("picker: build/show threw", err);
      finish({
        files: [],
        error: err instanceof Error ? err.message : "Google Picker failed to open",
      });
    }
  });
}

/**
 * Opens the native cloud chooser when the corresponding public app key is
 * configured. Returns cancelled/empty when the SDK is unavailable.
 */
export async function openCloudProviderPicker(
  provider: CloudProvider,
  options?: { multiselect?: boolean },
): Promise<CloudPickerResult> {
  const multiselect = Boolean(options?.multiselect);
  try {
    if (provider === "Dropbox") return await openDropboxChooser(multiselect);
    if (provider === "OneDrive") return await openOneDrivePicker(multiselect);
    if (provider === "Google Drive") return await openGoogleDrivePicker(multiselect);
  } catch (err) {
    return {
      files: [],
      error: err instanceof Error ? err.message : "Cloud picker failed",
    };
  }
  return { files: [], cancelled: true };
}
