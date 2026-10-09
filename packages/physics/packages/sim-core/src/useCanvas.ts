import { useEffect, useRef } from "react";

export interface CanvasSize { width: number; height: number; dpr: number }

/**
 * DPR-aware 2D canvas. Handles sizing + ResizeObserver once, so labs only write
 * `draw(ctx, size)`. Call `redraw` from your own rAF loop, or pass `loop` to
 * have the hook drive drawing every frame.
 */
export function useCanvas2D(
  draw: (ctx: CanvasRenderingContext2D, size: CanvasSize, time: number) => void,
  options: { loop?: boolean } = {},
) {
  const ref = useRef<HTMLCanvasElement>(null);
  const drawRef = useRef(draw);
  drawRef.current = draw;
  const sizeRef = useRef<CanvasSize>({ width: 0, height: 0, dpr: 1 });

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let raf = 0;

    const fit = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, Math.round(rect.width * dpr));
      canvas.height = Math.max(1, Math.round(rect.height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      sizeRef.current = { width: rect.width, height: rect.height, dpr };
      if (!options.loop) drawRef.current(ctx, sizeRef.current, performance.now());
    };
    const ro = new ResizeObserver(fit);
    ro.observe(canvas);
    fit();

    const frame = (t: number) => {
      drawRef.current(ctx, sizeRef.current, t);
      raf = requestAnimationFrame(frame);
    };
    if (options.loop) raf = requestAnimationFrame(frame);

    return () => { ro.disconnect(); cancelAnimationFrame(raf); };
  }, [options.loop]);

  return ref;
}
