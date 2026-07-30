/** Session handoff for Library → Resume when ?project= is stripped or delayed. */

export const PENDING_PROJECT_RESUME_KEY = "joinmypdf:pending-project-resume";

const RESUME_TTL_MS = 5 * 60 * 1000;

type PendingResume = {
  projectId: string;
  toolSlug: string;
  at: number;
};

export function markPendingProjectResume(projectId: string, toolSlug: string) {
  if (typeof window === "undefined") return;
  try {
    const payload: PendingResume = {
      projectId,
      toolSlug,
      at: Date.now(),
    };
    window.sessionStorage.setItem(PENDING_PROJECT_RESUME_KEY, JSON.stringify(payload));
  } catch {
    // Private mode / quota — ignore.
  }
}

export function peekPendingProjectResume(toolSlug: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(PENDING_PROJECT_RESUME_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PendingResume>;
    if (!parsed.projectId || parsed.toolSlug !== toolSlug) return null;
    if (typeof parsed.at === "number" && Date.now() - parsed.at > RESUME_TTL_MS) {
      window.sessionStorage.removeItem(PENDING_PROJECT_RESUME_KEY);
      return null;
    }
    return parsed.projectId;
  } catch {
    return null;
  }
}

export function clearPendingProjectResume() {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(PENDING_PROJECT_RESUME_KEY);
  } catch {
    // ignore
  }
}
