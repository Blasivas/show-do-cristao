import { useLayoutEffect, useRef, type ReactNode } from 'react';

export const PAGE_TURN_DURATION = 650;
const SEGMENTS = 8;

interface PageTurnLayerProps {
  direction: 'next' | 'prev';
  front: ReactNode;
  back: ReactNode;
  onComplete: () => void;
}

/** Uma folha de papel articulada; as páginas reais permanecem imóveis abaixo dela. */
export default function PageTurnLayer({ direction, front, back, onComplete }: PageTurnLayerProps) {
  const layerRef = useRef<HTMLDivElement>(null);
  const completeRef = useRef(onComplete);
  completeRef.current = onComplete;

  useLayoutEffect(() => {
    const layer = layerRef.current;
    if (!layer) return;
    const strips = [...layer.querySelectorAll<HTMLElement>('[data-turn-segment]')];
    const shadow = layer.querySelector<HTMLElement>('[data-turn-shadow]');
    const outward = direction === 'next' ? 1 : -1;
    let width = layer.clientWidth / 2;
    let frame = 0;
    let progress = 0;
    let disposed = false;

    const paint = (time: number) => {
      progress = time;
      // A folha ganha velocidade no centro e chega ao papel sem um salto final.
      const eased = time * time * (3 - 2 * time);
      const angle = -outward * Math.PI * eased;
      const bend = Math.sin(Math.PI * eased);
      const curl = -outward * (24 * Math.PI / 180) * bend;
      const stripWidth = width / SEGMENTS;
      let x = 0;
      let z = 0;
      let highest = 0;
      layer.style.setProperty('--turn-page-width', `${width}px`);
      layer.style.setProperty('--turn-bend', `${bend}`);
      layer.dataset.turnProgress = time.toFixed(4);
      layer.dataset.turnAngle = (angle * 180 / Math.PI).toFixed(3);

      for (const [index, strip] of strips.entries()) {
        // Cada tira começa exatamente onde a anterior termina. A variação de
        // ângulo cria a curvatura sem abrir frestas entre os pedaços de papel.
        const localAngle = angle + curl * ((index + 0.5) / SEGMENTS - 0.5);
        strip.style.transform = `translate3d(${x}px, 0, ${z}px) rotateY(${localAngle}rad)`;
        strip.style.setProperty('--turn-light', `${Math.abs(Math.sin(localAngle)) * 0.13}`);
        strip.dataset.turnSegmentAngle = (localAngle * 180 / Math.PI).toFixed(3);
        x += outward * stripWidth * Math.cos(localAngle);
        z -= outward * stripWidth * Math.sin(localAngle);
        highest = Math.max(highest, z);
      }

      if (shadow) {
        const spread = Math.max(1, Math.abs(x) + highest * 0.18);
        const left = Math.min(0, x) - highest * 0.09;
        shadow.style.width = `${spread}px`;
        shadow.style.transform = `translateX(${left}px)`;
        shadow.style.opacity = `${bend * 0.3}`;
        shadow.style.setProperty('--turn-shadow-blur', `${5 + highest * 0.025}px`);
      }
    };

    paint(0);
    const observer = new ResizeObserver(() => {
      width = layer.clientWidth / 2;
      paint(progress);
    });
    observer.observe(layer);
    const start = performance.now();
    const animate = (now: number) => {
      if (disposed) return;
      const time = Math.min(1, (now - start) / PAGE_TURN_DURATION);
      paint(time);
      if (time < 1) frame = requestAnimationFrame(animate);
      else completeRef.current();
    };
    frame = requestAnimationFrame(animate);

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [direction]);

  return (
    <div
      ref={layerRef}
      className="page-turn-layer"
      data-page-turn={direction}
      data-turn-progress="0"
      data-turn-angle="0"
      aria-hidden="true"
      {...{ inert: '' }}
    >
      <div className="page-turn-shadow" data-turn-shadow="true" />
      <div className="page-turn-leaf" data-turn-leaf="true">
        {Array.from({ length: SEGMENTS }, (_, index) => {
          const frontIndex = direction === 'next' ? index : SEGMENTS - 1 - index;
          const backIndex = SEGMENTS - 1 - frontIndex;
          return (
            <div key={index} className="page-turn-segment" data-turn-segment={index}>
              <div className="page-turn-face page-turn-front" data-turn-front="true">
                <div className="page-turn-print" style={{ left: `calc(var(--turn-face-bleed) + var(--turn-page-width) * ${-frontIndex / SEGMENTS})` }}>{front}</div>
                <div className="page-turn-light" />
              </div>
              <div className="page-turn-face page-turn-back" data-turn-back="true">
                <div className="page-turn-print" style={{ left: `calc(var(--turn-face-bleed) + var(--turn-page-width) * ${-backIndex / SEGMENTS})` }}>{back}</div>
                <div className="page-turn-light" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
