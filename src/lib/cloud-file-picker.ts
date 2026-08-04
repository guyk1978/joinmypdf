export type CloudProvider = "Dropbox" | "Google Drive" | "OneDrive";

type CloudPickerResult = {
  files: File[];
  cancelled?: boolean;
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
      client?: { init: (opts: Record<string, unknown>) => Promise<void> };
    };
    google?: {
      picker?: {
        PickerBuilder: new () => {
          addView: (view: unknown) => unknown;
          setOAuthToken: (token: string) => unknown;
          setDeveloperKey: (key: string) => unknown;
          setCallback: (cb: (data: { action: string; docs?: Array<{ id: string; name: string; url?: string; mimeType?: string }> }) => void) => unknown;
          build: () => { setVisible: (v: boolean) => void };
        };
        ViewId: { DOCS: unknown };
        Action: { PICKED: string; CANCEL: string };
      };
    };
    OneDrive?: {
      open: (options: {
        clientId: string;
        action: "download" | "query";
        multiSelect?: boolean;
        openInNewWindow?: boolean;
        success?: (response: { value?: Array<{ name?: string; "@microsoft.graph.downloadUrl"?: string; file?: unknown }> }) => void;
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
  // Google Picker requires a live OAuth token; until that flow ships, use the
  // fallback modal (open Drive → download → choose from device).
  if (provider === "Google Drive") return false;
  return Boolean(cfg.oneDriveClientId);
}

export function cloudProviderHomeUrl(provider: CloudProvider): string {
  if (provider === "Dropbox") return "https://www.dropbox.com/home";
  if (provider === "Google Drive") return "https://drive.google.com/drive/my-drive";
  return "https://onedrive.live.com/";
}

function loadScript(
  src: string,
  id: string,
  attrs?: Record<string, string>,
): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof document === "undefined") {
      reject(new Error("No document"));
      return;
    }
    const existing = document.getElementById(id) as HTMLScriptElement | null;
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
      existing.addEventListener("error", () => reject(new Error(`Failed to load ${src}`)), {
        once: true,
      });
      return;
    }
    const script = document.createElement("script");
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
    document.body.appendChild(script);
  });
}

async function fetchAsFile(url: string, name: string): Promise<File> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Download failed (${response.status})`);
  const blob = await response.blob();
  return new File([blob], name || "download", {
    type: blob.type || "application/octet-stream",
  });
}

async function openDropboxChooser(multiselect: boolean): Promise<CloudPickerResult> {
  const { dropboxAppKey } = getCloudPickerConfig();
  if (!dropboxAppKey) return { files: [], cancelled: true };

  // Dropbox requires data-app-key on the script tag before it initializes.
  await loadScript("https://www.dropbox.com/static/api/2/dropins.js", "dropboxjs", {
    "data-app-key": dropboxAppKey,
  });

  return new Promise((resolve) => {
    if (!window.Dropbox?.choose) {
      resolve({ files: [], cancelled: true });
      return;
    }
    window.Dropbox.choose({
      linkType: "direct",
      multiselect,
      success: (entries) => {
        void (async () => {
          try {
            const files = await Promise.all(
              entries.map((entry) => fetchAsFile(entry.link, entry.name)),
            );
            resolve({ files });
          } catch {
            resolve({ files: [] });
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

  await loadScript(
    "https://js.live.net/v7.2/OneDrive.js",
    "onedrive-sdk",
  );

  return new Promise((resolve) => {
    if (!window.OneDrive?.open) {
      resolve({ files: [], cancelled: true });
      return;
    }
    window.OneDrive.open({
      clientId: oneDriveClientId,
      action: "download",
      multiSelect: multiselect,
      openInNewWindow: true,
      success: (response) => {
        void (async () => {
          try {
            const items = response.value ?? [];
            const files = await Promise.all(
              items
                .map((item) => {
                  const url = item["@microsoft.graph.downloadUrl"];
                  if (!url) return null;
                  return fetchAsFile(url, item.name || "onedrive-file");
                })
                .filter(Boolean) as Promise<File>[],
            );
            resolve({ files });
          } catch {
            resolve({ files: [] });
          }
        })();
      },
      cancel: () => resolve({ files: [], cancelled: true }),
      error: () => resolve({ files: [] }),
    });
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
  if (provider === "Dropbox") return openDropboxChooser(multiselect);
  if (provider === "OneDrive") return openOneDrivePicker(multiselect);
  // Google Picker needs OAuth token dance — handled via modal fallback UX.
  return { files: [], cancelled: true };
}
