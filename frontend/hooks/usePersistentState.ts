"use client";

import { useCallback, useSyncExternalStore } from "react";

const storageListeners = new Map<string, Set<() => void>>();
const parsedCache = new Map<string, { raw: string | null; value: unknown }>();

function getListeners(key: string): Set<() => void> {
  let set = storageListeners.get(key);
  if (!set) {
    set = new Set();
    storageListeners.set(key, set);
  }
  return set;
}

function notifyKey(key: string) {
  const set = storageListeners.get(key);
  if (set) {
    set.forEach((listener) => listener());
  }
}

/**
 * Custom hook that syncs state with localStorage using `useSyncExternalStore`,
 * avoiding SSR hydration mismatches and cascading effect renders.
 */
export function usePersistentState<T>(
  storageKey: string,
  initialValue: T
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const subscribe = useCallback(
    (callback: () => void) => {
      const listeners = getListeners(storageKey);
      listeners.add(callback);

      const handleStorage = (e: StorageEvent) => {
        if (e.key === storageKey) {
          callback();
        }
      };
      window.addEventListener("storage", handleStorage);

      return () => {
        listeners.delete(callback);
        window.removeEventListener("storage", handleStorage);
      };
    },
    [storageKey]
  );

  const getSnapshot = useCallback((): T => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw === null) {
        return initialValue;
      }
      const cached = parsedCache.get(storageKey);
      if (cached && cached.raw === raw) {
        return cached.value as T;
      }
      const parsed = JSON.parse(raw) as T;
      parsedCache.set(storageKey, { raw, value: parsed });
      return parsed;
    } catch {
      return initialValue;
    }
  }, [storageKey, initialValue]);

  const getServerSnapshot = useCallback((): T => initialValue, [initialValue]);

  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setState: React.Dispatch<React.SetStateAction<T>> = useCallback(
    (updater) => {
      try {
        const current = getSnapshot();
        const nextValue =
          typeof updater === "function"
            ? (updater as (prev: T) => T)(current)
            : updater;
        const serialized = JSON.stringify(nextValue);
        parsedCache.set(storageKey, { raw: serialized, value: nextValue });
        window.localStorage.setItem(storageKey, serialized);
        notifyKey(storageKey);
      } catch {
        // Ignore quota or storage write errors
      }
    },
    [storageKey, getSnapshot]
  );

  return [state, setState];
}
