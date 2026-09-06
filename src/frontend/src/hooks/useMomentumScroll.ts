import { useEffect, useRef } from "react";

/**
 * Attaches momentum/inertia horizontal scroll to a container element.
 * After finger lift, continues scrolling with velocity decaying at 0.92 per frame.
 */
export function useMomentumScroll<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let startX = 0;
    let startY = 0;
    let scrollStart = 0;
    let isHoriz = false;
    let lastX = 0;
    let lastTime = 0;
    let velocity = 0;
    let rafId: number | null = null;

    const cancelMomentum = () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    };

    const onTouchStart = (e: TouchEvent) => {
      cancelMomentum();
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      lastX = startX;
      lastTime = Date.now();
      scrollStart = el.scrollLeft;
      isHoriz = false;
      velocity = 0;
    };

    const onTouchMove = (e: TouchEvent) => {
      const dx = e.touches[0].clientX - startX;
      const dy = Math.abs(e.touches[0].clientY - startY);
      if (!isHoriz && Math.abs(dx) > dy + 5) isHoriz = true;

      if (isHoriz) {
        e.preventDefault();
        const now = Date.now();
        const dt = Math.max(now - lastTime, 1);
        velocity = (e.touches[0].clientX - lastX) / dt;
        lastX = e.touches[0].clientX;
        lastTime = now;
        el.scrollLeft = scrollStart - dx;
      }
    };

    const onTouchEnd = () => {
      if (!isHoriz) return;
      isHoriz = false;

      // velocity in px/ms → px/frame at 60fps (~16ms)
      let v = -velocity * 16;

      const step = () => {
        if (Math.abs(v) < 0.5) {
          rafId = null;
          return;
        }
        el.scrollLeft += v;
        v *= 0.92; // friction
        rafId = requestAnimationFrame(step);
      };

      rafId = requestAnimationFrame(step);
    };

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd, { passive: true });

    return () => {
      cancelMomentum();
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
    };
  }, []);

  return ref;
}
