import { useState, useEffect, useCallback } from 'react';

// Custom event so multiple useLocalStorage instances in the SAME tab stay in
// sync (the native 'storage' event only fires in *other* tabs).
const LS_EVENT = 'app-local-storage';

export function useLocalStorage<T>(key: string, initialValue: T) {
  const readValue = useCallback((): T => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.log('Error reading localStorage key "' + key + '":', error);
      return initialValue;
    }
    // initialValue intentionally excluded: a new object literal each render
    // would otherwise reset state on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const [storedValue, setStoredValue] = useState<T>(readValue);

  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      setStoredValue((current) => {
        const valueToStore = value instanceof Function ? value(current) : value;
        try {
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
          // Notify other hook instances (same tab) that this key changed.
          window.dispatchEvent(new CustomEvent(LS_EVENT, { detail: key }));
        } catch (error) {
          console.log('Error setting localStorage key "' + key + '":', error);
        }
        return valueToStore;
      });
    },
    [key]
  );

  useEffect(() => {
    // Re-read when this key changes — either in another tab ('storage') or in
    // this tab via another hook instance (custom LS_EVENT).
    const sync = (e: Event) => {
      if (e instanceof CustomEvent && e.detail !== key) return;
      if (e instanceof StorageEvent && e.key && e.key !== key) return;
      setStoredValue(readValue());
    };
    window.addEventListener(LS_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(LS_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, [key, readValue]);

  return [storedValue, setValue] as const;
}
