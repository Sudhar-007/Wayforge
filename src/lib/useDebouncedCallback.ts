import { useCallback, useEffect, useRef } from "react";

/**
 * Returns a debounced version of `callback` that delays invocation until
 * `delay` ms have elapsed since the last call. The latest callback is always
 * used, and any pending timer is cleared on unmount.
 *
 * No external dependency — just a ref + setTimeout.
 */
export function useDebouncedCallback<Args extends unknown[]>(
  callback: (...args: Args) => void,
  delay: number,
): (...args: Args) => void {
  const callbackRef = useRef(callback);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep the ref pointing at the freshest callback without resetting timers.
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Clear any pending timer when the component using the hook unmounts.
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return useCallback(
    (...args: Args) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    },
    [delay],
  );
}
