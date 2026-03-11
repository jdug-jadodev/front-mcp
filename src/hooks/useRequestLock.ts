import { useEffect, useRef, useState } from 'react';

export function useRequestLock() {
  const [locked, setLocked] = useState(false);
  const [remainingMs, setRemainingMs] = useState(0);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, []);

  function start(ms = 2000) {
    if (timerRef.current) window.clearInterval(timerRef.current);
    setLocked(true);
    setRemainingMs(ms);
    const start = Date.now();
    timerRef.current = window.setInterval(() => {
      const elapsed = Date.now() - start;
      const rem = Math.max(0, ms - elapsed);
      setRemainingMs(rem);
      if (rem <= 0) {
        setLocked(false);
        if (timerRef.current) window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }, 200);
  }

  return { locked, remainingMs, start } as const;
}

export default useRequestLock;
