import { useEffect, useLayoutEffect, useRef, useState, type PointerEvent } from 'react';

const LIMIT = 5;

/** Inclinação amortecida em uma área estável; o movimento não dispara renders do React. */
export function useBibleTilt(blocked: boolean, freezePose = false) {
  const stageRef = useRef<HTMLDivElement>(null);
  const frame = useRef<number | null>(null);
  const movement = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });
  const [keyboard, setKeyboard] = useState(false);
  const [preferences, setPreferences] = useState(() => ({
    reduced: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    coarse: window.matchMedia('(pointer: coarse)').matches,
  }));
  const motionRestricted = preferences.reduced || preferences.coarse;
  const disabled = blocked || keyboard || motionRestricted;

  const paint = () => {
    const stage = stageRef.current;
    const { x, y } = movement.current;
    if (!stage) return;
    stage.style.setProperty('--bible-tilt-x', `${x.toFixed(3)}deg`);
    stage.style.setProperty('--bible-tilt-y', `${y.toFixed(3)}deg`);
    stage.style.setProperty('--bible-light-x', `${40 + y * 5}%`);
    stage.style.setProperty('--bible-light-y', `${28 - x * 4}%`);
    stage.style.setProperty('--bible-shadow-x', `${-y * 2}px`);
  };

  const cancelFrame = () => {
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    frame.current = null;
  };

  const reset = () => {
    cancelFrame();
    movement.current = { x: 0, y: 0, targetX: 0, targetY: 0 };
    paint();
  };

  const animate = () => {
    const value = movement.current;
    value.x += (value.targetX - value.x) * 0.16;
    value.y += (value.targetY - value.y) * 0.16;
    if (Math.abs(value.targetX - value.x) + Math.abs(value.targetY - value.y) < 0.015) {
      value.x = value.targetX;
      value.y = value.targetY;
      frame.current = null;
      paint();
      return;
    }
    paint();
    frame.current = requestAnimationFrame(animate);
  };

  const schedule = () => {
    if (frame.current === null) frame.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const coarse = window.matchMedia('(pointer: coarse)');
    const update = () => setPreferences({ reduced: reduced.matches, coarse: coarse.matches });
    const onVisibility = () => { if (document.hidden) reset(); };
    const onKeyboard = (event: KeyboardEvent) => {
      if (['Tab', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) setKeyboard(true);
    };
    reduced.addEventListener('change', update);
    coarse.addEventListener('change', update);
    window.addEventListener('keydown', onKeyboard);
    window.addEventListener('blur', reset);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      reduced.removeEventListener('change', update);
      coarse.removeEventListener('change', update);
      window.removeEventListener('keydown', onKeyboard);
      window.removeEventListener('blur', reset);
      document.removeEventListener('visibilitychange', onVisibility);
      cancelFrame();
    };
  }, []);

  useLayoutEffect(() => {
    if (disabled) {
      if (freezePose) cancelFrame();
      else reset();
    }
  }, [disabled, freezePose]);

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== 'mouse' || blocked || motionRestricted) return;
    if (keyboard) {
      setKeyboard(false);
    }
    const bounds = event.currentTarget.getBoundingClientRect();
    const horizontal = Math.max(-1, Math.min(1, ((event.clientX - bounds.left) / bounds.width - 0.5) * 2));
    const vertical = Math.max(-1, Math.min(1, ((event.clientY - bounds.top) / bounds.height - 0.5) * 2));
    movement.current.targetX = -vertical * LIMIT;
    movement.current.targetY = horizontal * LIMIT;
    schedule();
  };

  const onPointerLeave = () => {
    movement.current.targetX = 0;
    movement.current.targetY = 0;
    if (!disabled) schedule();
  };

  return { stageRef, disabled, reducedMotion: preferences.reduced, reset, onPointerMove, onPointerLeave };
}
