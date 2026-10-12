import { useEffect, useRef } from "react";

/** Calls `callback(timestamp, deltaSeconds)` every frame while `active`. */
export function useAnimationFrame(callback: (timestamp: number, deltaSeconds: number) => void, active: boolean) {
  const callbackRef = useRef(callback);
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!active) return;
    let frame = 0;
    let last: number | null = null;
    const tick = (time: number) => {
      const dt = last === null ? 0 : (time - last) / 1000;
      last = time;
      callbackRef.current(time, dt);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [active]);
}
export default useAnimationFrame;
