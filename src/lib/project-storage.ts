export const PROJECTS_CHANGE_EVENT = "joinmypdf-projects-change";

const DB_NAME = "joinmypdf-projects";
const DB_VERSION = 1;
const PROJECTS_STORE = "projects";
const FILES_STORE = "files";

export type StoredProjectFileRef = {
  id: string;
  name: string;
  type: string;
  size: number;
  lastModified: number;
  order: number;
};

export type SavedProjectRecord = {
  id: string;
  name: string;
  toolSlug: string;
  operation: string;
  settings: Record<string, unknown>;
  fileRefs: StoredProjectFileRef[];
  createdAt: number;
  updatedAt: number;
};

export type SavedProjectWithFiles = {
  project: SavedProjectRecord;
  files: File[];
};

function fileStoreKey(projectId: string, fileId: string) {
  return `${projectId}:${fileId}`;
}

function notifyProjectsChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(PROJECTS_CHANGE_EVENT));
  }
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB is not available"));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(PROJECTS_STORE)) {
        db.createObjectStore(PROJECTS_STORE, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(FILES_STORE)) {
        db.createObjectStore(FILES_STORE);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Failed to open IndexedDB"));
  });
}

function runTransaction<T>(
  storeNames: string | string[],
  mode: IDBTransactionMode,
  fn: (stores: Record<string, IDBObjectStore>) => Promise<T> | T,
): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const names = Array.isArray(storeNames) ? storeNames : [storeNames];
        const tx = db.transaction(names, mode);
        const stores: Record<string, IDBObjectStore> = {};
        for (const name of names) stores[name] = tx.objectStore(name);

        Promise.resolve(fn(stores))
          .then((result) => {
            tx.oncomplete = () => {
              db.close();
              resolve(result);
            };
            tx.onerror = () => {
              db.close();
              reject(tx.error ?? new Error("IndexedDB transaction failed"));
            };
          })
          .catch((error) => {
            try {
              tx.abort();
            } catch {
              // ignore
            }
            db.close();
            reject(error);
          });
      }),
  );
}

export async function listSavedProjects(): Promise<SavedProjectRecord[]> {
  return runTransaction(PROJECTS_STORE, "readonly", (stores) => {
    return new Promise<SavedProjectRecord[]>((resolve, reject) => {
      const request = stores[PROJECTS_STORE].getAll();
      request.onsuccess = () => {
        const rows = (request.result as SavedProjectRecord[]).slice();
        rows.sort((a, b) => b.updatedAt - a.updatedAt);
        resolve(rows);
      };
      request.onerror = () => reject(request.error ?? new Error("Failed to list projects"));
    });
  });
}

export async function getSavedProject(projectId: string): Promise<SavedProjectWithFiles | null> {
  const project = await runTransaction(PROJECTS_STORE, "readonly", (stores) => {
    return new Promise<SavedProjectRecord | null>((resolve, reject) => {
      const request = stores[PROJECTS_STORE].get(projectId);
      request.onsuccess = () => resolve((request.result as SavedProjectRecord | undefined) ?? null);
      request.onerror = () => reject(request.error ?? new Error("Failed to read project"));
    });
  });

  if (!project) return null;

  const files = await runTransaction(FILES_STORE, "readonly", (stores) => {
    return Promise.all(
      project.fileRefs
        .slice()
        .sort((a, b) => a.order - b.order)
        .map(
          (ref) =>
            new Promise<File>((resolve, reject) => {
              const request = stores[FILES_STORE].get(fileStoreKey(projectId, ref.id));
              request.onsuccess = () => {
                const blob = request.result as Blob | undefined;
                if (!blob) {
                  resolve(new File([], ref.name, { type: ref.type, lastModified: ref.lastModified }));
                  return;
                }
                resolve(new File([blob], ref.name, { type: ref.type, lastModified: ref.lastModified }));
              };
              request.onerror = () => reject(request.error ?? new Error("Failed to read project file"));
            }),
        ),
    );
  });

  return { project, files };
}

export async function saveProject(input: {
  name: string;
  toolSlug: string;
  operation: string;
  files: File[];
  settings?: Record<string, unknown>;
  existingId?: string;
}): Promise<SavedProjectRecord> {
  const now = Date.now();
  const id = input.existingId ?? crypto.randomUUID();
  const trimmedName = input.name.trim() || "Untitled project";

  const fileRefs: StoredProjectFileRef[] = input.files.map((file, order) => ({
    id: crypto.randomUUID(),
    name: file.name,
    type: file.type || "application/octet-stream",
    size: file.size,
    lastModified: file.lastModified,
    order,
  }));

  const record: SavedProjectRecord = {
    id,
    name: trimmedName,
    toolSlug: input.toolSlug,
    operation: input.operation,
    settings: input.settings ?? {},
    fileRefs,
    createdAt: now,
    updatedAt: now,
  };

  if (input.existingId) {
    const existing = await runTransaction(PROJECTS_STORE, "readonly", (stores) => {
      return new Promise<SavedProjectRecord | null>((resolve, reject) => {
        const request = stores[PROJECTS_STORE].get(input.existingId!);
        request.onsuccess = () => resolve((request.result as SavedProjectRecord | undefined) ?? null);
        request.onerror = () => reject(request.error ?? new Error("Failed to read existing project"));
      });
    });
    if (existing) record.createdAt = existing.createdAt;
  }

  await runTransaction([PROJECTS_STORE, FILES_STORE], "readwrite", async (stores) => {
    if (input.existingId) {
      await new Promise<void>((resolve, reject) => {
        const cursorReq = stores[FILES_STORE].openCursor();
        cursorReq.onsuccess = () => {
          const cursor = cursorReq.result;
          if (!cursor) {
            resolve();
            return;
          }
          const key = String(cursor.key);
          if (key.startsWith(`${input.existingId}:`)) {
            cursor.delete();
          }
          cursor.continue();
        };
        cursorReq.onerror = () => reject(cursorReq.error ?? new Error("Failed to clear old files"));
      });
    }

    await new Promise<void>((resolve, reject) => {
      const request = stores[PROJECTS_STORE].put(record);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error ?? new Error("Failed to save project"));
    });

    await Promise.all(
      input.files.map((file, index) => {
        const ref = fileRefs[index];
        return new Promise<void>((resolve, reject) => {
          const request = stores[FILES_STORE].put(file, fileStoreKey(id, ref.id));
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error ?? new Error("Failed to save project file"));
        });
      }),
    );
  });

  notifyProjectsChanged();
  return record;
}

export async function deleteSavedProject(projectId: string): Promise<void> {
  await runTransaction([PROJECTS_STORE, FILES_STORE], "readwrite", async (stores) => {
    await new Promise<void>((resolve, reject) => {
      const request = stores[PROJECTS_STORE].delete(projectId);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error ?? new Error("Failed to delete project"));
    });

    await new Promise<void>((resolve, reject) => {
      const cursorReq = stores[FILES_STORE].openCursor();
      cursorReq.onsuccess = () => {
        const cursor = cursorReq.result;
        if (!cursor) {
          resolve();
          return;
        }
        const key = String(cursor.key);
        if (key.startsWith(`${projectId}:`)) {
          cursor.delete();
        }
        cursor.continue();
      };
      cursorReq.onerror = () => reject(cursorReq.error ?? new Error("Failed to delete project files"));
    });
  });

  notifyProjectsChanged();
}
