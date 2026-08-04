import type { ToolModalTab } from "@/components/tool-modal/tool-modal-session-context";

type TabListener = (tab: ToolModalTab) => void;

type TabBusStore = {
  listeners: Set<TabListener>;
};

declare global {
  interface Window {
    __joinmypdfToolModalTabBus?: TabBusStore;
    __joinmypdfSetToolModalTab?: TabListener;
  }
}

/**
 * Window-singleton store so dynamically imported ToolModalProvider and the
 * main Header chunk share the same listener set (webpack can duplicate modules).
 */
function getStore(): TabBusStore {
  if (typeof window === "undefined") {
    return { listeners: new Set() };
  }
  if (!window.__joinmypdfToolModalTabBus) {
    window.__joinmypdfToolModalTabBus = { listeners: new Set() };
  }
  return window.__joinmypdfToolModalTabBus;
}

/**
 * Module-level bus for OPERATION / rating → ToolModalWrapper tab switches.
 */
export function subscribeToolModalTab(listener: TabListener): () => void {
  const { listeners } = getStore();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function requestToolModalTab(tab: ToolModalTab): boolean {
  if (tab !== "calc" && tab !== "doc" && tab !== "related" && tab !== "reviews") {
    return false;
  }
  let handled = false;
  if (typeof window !== "undefined" && typeof window.__joinmypdfSetToolModalTab === "function") {
    try {
      window.__joinmypdfSetToolModalTab(tab);
      handled = true;
    } catch {
      /* ignore */
    }
  }
  const { listeners } = getStore();
  for (const listener of listeners) {
    try {
      listener(tab);
      handled = true;
    } catch {
      /* ignore broken subscriber */
    }
  }
  return handled;
}

export function toolModalTabListenerCount(): number {
  return getStore().listeners.size;
}
