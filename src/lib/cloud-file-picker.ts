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
  setCallback: (
    cb: (data: { action: string; docs?: GooglePickerDoc[] }) => void,
  ) => GooglePickerBuilder;
  setFeature?: (feature: unknown) => GooglePickerBuilder;
  setSelectableMimeTypes?: (types: string) => GooglePickerBuilder;
  build: () => { setVisible: (v: boolean) => void };
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
            callback: (response: { access_token?: string; error?: string }) => void;
          }) => { requestAccessToken: (opts?: { prompt?: string }) => void };
        };
      };
      picker?: {
        PickerBuilder: new () => GooglePickerBuilder;
        DocsView: new (viewId?: unknown) => GoogleDocsView;
        ViewId: { DOCS: unknown; DOCS_IMAGES: unknown; PDFS?: unknown };
        Action: { PICKED: string; CANCEL: string };
        Feature?: { MULTISELECT_ENABLED: unknown };
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

function readEnv(name: string): string {
  if (typeof process === "undefined") return "";
  return (process.env[name] ?? "").trim();
}

export function getCloudPickerConfig() {
  return {
    dropboxAppKey: readEnv("NEXT_PUBLIC_DROPBOX_APP_KEY"),
    googleApiKey: readEnv("NEXT_PUBLIC_GOOGLE_API_KEY"),
    googleClientId: readEnv("NEXT_PUBLIC_GOOGLE_CLIENT_ID"),
    oneDriveClientId: readEnv("NEXT_PUBLIC_ONEDRIVE_CLIENT_ID"),
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

function loadGooglePickerApi(win: Window): Promise<void> {
  return new Promise((resolve, reject) => {
    void loadScript(win, "https://apis.google.com/js/api.js", "google-api").then(() => {
      if (!win.gapi?.load) {
        reject(new Error("Google API unavailable"));
        return;
      }
      win.gapi.load("picker", () => resolve());
    }, reject);
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

  return fetchAsFile(url, name, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

async function openGoogleDrivePicker(multiselect: boolean): Promise<CloudPickerResult> {
  const { googleApiKey, googleClientId } = getCloudPickerConfig();
  if (!googleApiKey || !googleClientId) return { files: [], cancelled: true };

  const win = getPickerWindow();
  await loadScript(win, "https://accounts.google.com/gsi/client", "google-gsi");
  await loadGooglePickerApi(win);

  const accessToken = await new Promise<string>((resolve, reject) => {
    let settled = false;
    let triedConsent = false;

    const client = win.google?.accounts?.oauth2?.initTokenClient({
      client_id: googleClientId,
      scope: "https://www.googleapis.com/auth/drive.readonly",
      callback: (response) => {
        if (settled) return;
        if (response.access_token) {
          settled = true;
          resolve(response.access_token);
          return;
        }
        if (!triedConsent) {
          triedConsent = true;
          client?.requestAccessToken({ prompt: "consent" });
          return;
        }
        settled = true;
        reject(new Error(response.error || "Google auth failed"));
      },
    });
    if (!client) {
      reject(new Error("Google Identity Services unavailable"));
      return;
    }
    client.requestAccessToken({ prompt: "" });
  });

  return new Promise((resolve) => {
    const pickerNs = win.google?.picker;
    if (!pickerNs) {
      resolve({ files: [], error: "Google Picker unavailable" });
      return;
    }

    const view = new pickerNs.DocsView(pickerNs.ViewId.DOCS);
    view.setIncludeFolders?.(false);
    view.setSelectFolderEnabled?.(false);

    const builder = new pickerNs.PickerBuilder()
      .addView(view)
      .setOAuthToken(accessToken)
      .setDeveloperKey(googleApiKey)
      .setCallback((data) => {
        if (data.action === pickerNs.Action.CANCEL) {
          resolve({ files: [], cancelled: true });
          return;
        }
        if (data.action !== pickerNs.Action.PICKED || !data.docs?.length) {
          return;
        }
        const docs = multiselect ? data.docs : data.docs.slice(0, 1);
        void (async () => {
          try {
            const files = await Promise.all(
              docs.map((doc) => downloadGoogleDriveFile(doc, accessToken)),
            );
            resolve({ files: files.filter((file) => file.size > 0) });
          } catch (err) {
            resolve({
              files: [],
              error: err instanceof Error ? err.message : "Google Drive download failed",
            });
          }
        })();
      });

    if (multiselect && pickerNs.Feature?.MULTISELECT_ENABLED) {
      builder.setFeature?.(pickerNs.Feature.MULTISELECT_ENABLED);
    }

    builder.build().setVisible(true);
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
