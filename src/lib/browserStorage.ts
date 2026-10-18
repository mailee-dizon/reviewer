// Saves data in the visitor's browser (localStorage), so it's still there after a refresh.
// There is no database yet, so each visitor's library and reviews live only on their
// own device. When we add a database, only this file needs to change.
"use client";

import { useSyncExternalStore } from "react";

// Components that are showing stored data, so they can update when it changes.
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  // The "storage" event fires when another browser tab changes the data.
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

// Reads the raw saved text. Returns null if nothing is saved or storage is blocked.
function readRaw(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

// React needs the same object back each time if nothing changed, so we remember
// the last text we read for each key and the value it turned into.
const parsedCache = new Map<string, { raw: string | null; value: unknown }>();

function readValue<T>(key: string, fallback: T): T {
  const raw = readRaw(key);
  const cached = parsedCache.get(key);
  if (cached && cached.raw === raw) {
    return cached.value as T;
  }

  let value: T = fallback;
  if (raw !== null) {
    try {
      value = JSON.parse(raw) as T;
    } catch {
      // Saved data was damaged; start over with the fallback.
    }
  }
  parsedCache.set(key, { raw, value });
  return value;
}

// Saves a value and tells every component using it to re-draw.
export function writeStored<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage is full or blocked (e.g. some private windows). Nothing we can do.
  }
  listeners.forEach((listener) => listener());
}

// A React hook that reads a stored value and re-draws when it changes.
// "fallback" is used before anything is saved, and while the page is first loading
// on the server (which can't see the browser's storage). Pass a value that never
// changes (e.g. a constant defined outside the component).
export function useStored<T>(key: string, fallback: T): T {
  return useSyncExternalStore(
    subscribe,
    () => readValue(key, fallback),
    () => fallback,
  );
}
