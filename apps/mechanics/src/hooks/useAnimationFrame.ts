import { useEffect, useRef } from 'react';

export default function useAnimationFrame(
  callback: (timestamp: number, deltaSeconds: number) => void,
  active: boolean,
) {
  const callbackRef = useRef(callback);
  const frameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!active) {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
      lastTimeRef.current = null;
      return;
    }

    const tick = (time: number) => {
      const last = lastTimeRef.current;
      const deltaSeconds = last === null ? 0 : (time - last) / 1000;
      lastTimeRef.current = time;
      callbackRef.current(time, deltaSeconds);
      frameRef.current = requestAnimationFrame(tick);
    };

    frameRef.current = requestAnimationFrame(tick);

    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
      lastTimeRef.current = null;
    };
  }, [active]);
}
