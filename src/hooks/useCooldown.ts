import { useState, useRef, useEffect } from 'react';

export function useCooldown(ms = 2000) {
  const [cooldown, setCooldown] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  function trigger() {
    if (cooldown) return false;
    setCooldown(true);
    timer.current = window.setTimeout(() => setCooldown(false), ms) as unknown as number;
    return true;
  }

  useEffect(() => {
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, []);

  return { cooldown, trigger } as const;
}
