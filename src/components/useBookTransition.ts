import { useLayoutEffect, useRef } from 'react';

export const BOOK_TRANSITION_DURATION = 800;

export interface BookMotion {
  direction: 'opening' | 'closing';
  target: 'questions' | 'config';
  startTransform: string;
}

const EASING = 'cubic-bezier(0.4, 0, 0.2, 1)';
const REST_TRANSFORM = 'rotateX(4deg) rotateY(-10deg)';

/** Capa, enquadramento e conteúdo compartilham o mesmo relógio de animação. */
export function useBookTransition(motion: BookMotion | null, onComplete: () => void) {
  const completeRef = useRef(onComplete);
  completeRef.current = onComplete;

  useLayoutEffect(() => {
    if (!motion) return;
    const wrapper = document.querySelector<HTMLElement>('[data-book-transition]');
    const menu = wrapper?.querySelector<HTMLElement>('[data-book-menu]');
    const destination = wrapper?.querySelector<HTMLElement>('[data-book-destination]');
    const stage = menu?.querySelector<HTMLElement>('#bible-stage');
    const tilt = menu?.querySelector<HTMLElement>('#bible-tilt');
    const volume = menu?.querySelector<HTMLElement>('#bible-box');
    const cover = menu?.querySelector<HTMLElement>('#cover-flipper');
    const pages = destination?.querySelector<HTMLElement>('[data-book-pages]');
    let disposed = false;
    let completed = false;
    let frame = 0;
    const animations: Animation[] = [];
    const opening = motion.direction === 'opening';

    const complete = () => {
      if (disposed || completed) return;
      completed = true;
      if (wrapper) {
        wrapper.dataset.bookProgress = '1';
        wrapper.dataset.bookAngle = opening ? '-180' : '0';
      }
      completeRef.current();
    };

    // A navegação continua disponível mesmo se a cena ainda não tiver dimensões.
    if (!wrapper || !menu || !destination || !stage || !tilt || !volume || !cover || !pages) {
      queueMicrotask(complete);
      return () => { disposed = true; };
    }

    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (preference.matches || document.hidden) {
      complete();
      return () => { disposed = true; };
    }

    const measure = () => {
      const target = pages.getBoundingClientRect();
      const source = stage.getBoundingClientRect();
      const width = tilt.offsetWidth;
      const height = tilt.offsetHeight;
      if (width <= 0 || height <= 0 || target.width <= 0 || target.height <= 0) return null;
      const dx = target.x + target.width / 2 - (source.x + source.width / 2);
      const dy = target.y + target.height / 2 - (source.y + source.height / 2);
      const sx = target.width / (2 * width);
      const sy = target.height / height;
      wrapper.dataset.bookTargetX = String(target.x);
      wrapper.dataset.bookTargetY = String(target.y);
      wrapper.dataset.bookTargetWidth = String(target.width);
      wrapper.dataset.bookTargetHeight = String(target.height);
      return `translate3d(${dx}px, ${dy}px, 0) scale(${sx}, ${sy}) rotateX(0deg) rotateY(0deg)`;
    };

    const openTransform = measure();
    if (!openTransform) {
      queueMicrotask(complete);
      return () => { disposed = true; };
    }

    wrapper.dataset.bookDuration = String(BOOK_TRANSITION_DURATION);
    wrapper.dataset.bookStartTransform = motion.startTransform;
    wrapper.dataset.bookProgress = '0';
    wrapper.dataset.bookAngle = opening ? '0' : '-180';

    const orientFrames = (keyframes: Keyframe[]) => opening ? keyframes : [...keyframes].reverse().map((keyframe) => ({
        ...keyframe,
        ...(keyframe.offset !== undefined && keyframe.offset !== null ? { offset: 1 - keyframe.offset } : {}),
      }));
    const animate = (name: string, element: HTMLElement | null | undefined, keyframes: Keyframe[]) => {
      if (!element) return null;
      const animation = element.animate(orientFrames(keyframes), { duration: BOOK_TRANSITION_DURATION, fill: 'both', easing: EASING });
      animation.id = `book-transition-${name}`;
      animations.push(animation);
      return animation;
    };

    // Captura a matriz efetivamente desenhada antes de bloquear o acompanhamento
    // do mouse, preservando a pose do clique no primeiro quadro da abertura.
    const closedTransform = opening ? motion.startTransform : REST_TRANSFORM;
    const tiltAnimation = animate('tilt', tilt, [{ transform: closedTransform }, { transform: openTransform }]);
    animate('volume', volume, [{ transform: 'translateX(0)' }, { transform: 'translateX(50%)' }]);
    const coverAnimation = animate('cover', cover, [{ transform: 'rotateY(0deg)' }, { transform: 'rotateY(-180deg)' }]);
    animate('menu', menu, [{ opacity: 1, offset: 0 }, { opacity: 1, offset: 0.75 }, { opacity: 0, offset: 1 }]);
    animate('destination', destination, [{ opacity: 0, offset: 0 }, { opacity: 0, offset: 0.75 }, { opacity: 1, offset: 1 }]);
    animate('shadow', menu.querySelector<HTMLElement>('[data-book-cover-shadow]'), [
      { opacity: 0, offset: 0 }, { opacity: 0.48, offset: 0.3 }, { opacity: 0.3, offset: 0.65 }, { opacity: 0, offset: 1 },
    ]);
    const ribbon = menu.querySelector<HTMLElement>('[data-book-ribbon]');
    const destinationRibbon = destination.querySelector<HTMLElement>('[data-open-book] > [aria-hidden="true"]');
    const ribbonFrames = (): Keyframe[] => {
      let transform = 'translate3d(0, 0, 0) scale(1, 1)';
      if (ribbon && destinationRibbon && ribbon.offsetWidth && ribbon.offsetHeight) {
        const target = pages.getBoundingClientRect();
        const bookmark = destinationRibbon.getBoundingClientRect();
        const sx = target.width / (2 * tilt.offsetWidth);
        const sy = target.height / tilt.offsetHeight;
        // O fitilho do quadro fica acima da barra interna; compensa a escala
        // do livro para que as duas versões se encontrem no mesmo ponto.
        const dx = (bookmark.x + bookmark.width / 2 - (target.x + target.width / 2)) / sx;
        const dy = (bookmark.y - target.y) / sy - ribbon.offsetTop;
        transform = `translate3d(${dx}px, ${dy}px, 0) scale(${bookmark.width / (ribbon.offsetWidth * sx)}, ${bookmark.height / (ribbon.offsetHeight * sy)})`;
      }
      return [
        { opacity: 0, transform: 'translate3d(0, 0, 0) scale(1, 1)', offset: 0 },
        { opacity: 0.85, offset: 0.45 },
        { opacity: 1, transform, offset: 1 },
      ];
    };
    const ribbonAnimation = animate('ribbon', ribbon, ribbonFrames());
    animate('controls', menu.querySelector<HTMLElement>('[data-book-menu-controls]'), [
      { opacity: 1, offset: 0 }, { opacity: 0, offset: 0.18 }, { opacity: 0, offset: 1 },
    ]);
    animate('ground', menu.querySelector<HTMLElement>('.bible-ground-shadow'), [
      { opacity: 1, offset: 0 }, { opacity: 0.7, offset: 0.5 }, { opacity: 0, offset: 1 },
    ]);

    // Element.animate cria animações independentes, mas o início explícito
    // mantém todos os efeitos no mesmo instante da DocumentTimeline.
    const startTime = document.timeline.currentTime ?? performance.now();
    for (const animation of animations) animation.startTime = startTime;

    const paintProgress = () => {
      if (disposed || completed || !coverAnimation) return;
      const time = typeof coverAnimation.currentTime === 'number' ? coverAnimation.currentTime : 0;
      wrapper.dataset.bookProgress = String(Math.min(1, Math.max(0, time / BOOK_TRANSITION_DURATION)));
      const matrix = new DOMMatrixReadOnly(getComputedStyle(cover).transform);
      wrapper.dataset.bookAngle = String(Math.atan2(matrix.m31, matrix.m11) * 180 / Math.PI);
      frame = requestAnimationFrame(paintProgress);
    };
    frame = requestAnimationFrame(paintProgress);

    const observer = new ResizeObserver(() => {
      if (disposed || completed) return;
      const transform = measure();
      if (!transform || !tiltAnimation) return;
      const effect = tiltAnimation.effect;
      if (!(effect instanceof KeyframeEffect)) return;
      effect.setKeyframes(opening
        ? [{ transform: closedTransform }, { transform }]
        : [{ transform }, { transform: closedTransform }]);
      if (ribbonAnimation?.effect instanceof KeyframeEffect) {
        ribbonAnimation.effect.setKeyframes(orientFrames(ribbonFrames()));
      }
    });
    observer.observe(stage);
    observer.observe(pages);

    const finishDirect = () => {
      for (const animation of animations) animation.finish();
      complete();
    };
    const onPreference = () => { if (preference.matches) finishDirect(); };
    const onVisibility = () => { if (document.hidden) finishDirect(); };
    preference.addEventListener('change', onPreference);
    document.addEventListener('visibilitychange', onVisibility);

    // A troca de tela acompanha o fim real dos efeitos; não depende de um timer.
    void Promise.all(animations.map((animation) => animation.finished)).then(complete).catch(() => {
      // O cancelamento ao desmontar não confirma uma navegação antiga.
    });

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      preference.removeEventListener('change', onPreference);
      document.removeEventListener('visibilitychange', onVisibility);
      for (const animation of animations) animation.cancel();
    };
  }, [motion]);
}
