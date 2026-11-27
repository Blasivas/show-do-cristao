import { useCallback, useEffect, useState } from 'react';

interface Clock {
  deadline: number | null;
  remaining: number;
}

export function useQuestionTimer(seconds: number | null, ready: boolean) {
  const duration = (seconds ?? 0) * 1000;
  const [clock, setClock] = useState<Clock>({ deadline: null, remaining: duration });
  const running = clock.deadline !== null;

  const start = useCallback(() => {
    if (duration === 0) return;
    setClock({ deadline: performance.now() + duration, remaining: duration });
  }, [duration]);

  useEffect(() => {
    if (ready) start();
  }, [ready, start]);

  useEffect(() => {
    const deadline = clock.deadline;
    if (deadline === null) return;

    const interval = window.setInterval(() => {
      const remaining = Math.max(0, deadline - performance.now());
      setClock(current => current.deadline !== deadline ? current : {
        deadline: remaining === 0 ? null : deadline,
        remaining,
      });
    }, 100);
    return () => window.clearInterval(interval);
  }, [clock.deadline]);

  function stop() {
    const now = performance.now();
    setClock(current => current.deadline === null ? current : {
      deadline: null,
      remaining: Math.max(0, current.deadline - now),
    });
  }

  return { duration, remaining: clock.remaining, running, start, stop };
}

const GLASS_SHAPE = 'polygon(0 0, 100% 0, 91% 24%, 58% 48%, 58% 52%, 91% 76%, 100% 100%, 0 100%, 9% 76%, 42% 52%, 42% 48%, 9% 24%)';

interface TimerProps {
  duration: number;
  remaining: number;
  running: boolean;
}

export default function Timer({ duration, remaining, running }: TimerProps) {
  const seconds = Math.ceil(remaining / 1000);
  const sand = remaining / duration;
  const expired = seconds === 0;
  const urgent = seconds <= 5 && (running || expired);

  return (
    <div className={`flex shrink-0 items-center gap-3 font-sans ${urgent ? 'text-[#9a2631] dark:text-rose-300' : 'text-[#735019] dark:text-[#f1d293]'}`}>
      <div aria-hidden="true" data-hourglass className={`relative h-12 w-9 shrink-0 ${urgent && running ? 'motion-safe:animate-pulse' : ''}`}>
        <div className="absolute inset-x-[5px] inset-y-1 bg-current" style={{ clipPath: GLASS_SHAPE }}>
          <div className="absolute inset-[2px] bg-[#f5e6c7] dark:bg-[#39281a]" style={{ clipPath: GLASS_SHAPE }}>
            <span data-hourglass-sand className="absolute inset-x-0 bottom-1/2 bg-[#b97a20] dark:bg-[#e7b85c]" style={{ height: `${sand * 50}%` }} />
            <span className="absolute inset-x-0 bottom-0 bg-[#b97a20] dark:bg-[#e7b85c]" style={{ height: `${(1 - sand) * 50}%` }} />
            {running && <span className="absolute left-1/2 top-1/2 w-px bg-[#b97a20] dark:bg-[#e7b85c]" style={{ bottom: `${(1 - sand) * 50}%` }} />}
          </div>
        </div>
        <span className="absolute inset-x-0 top-0 h-1.5 rounded-sm bg-current" />
        <span className="absolute inset-x-0 bottom-0 h-1.5 rounded-sm bg-current" />
      </div>
      <div className="min-w-[7.75rem]">
        <div role="timer" aria-label="Tempo restante" className="text-3xl font-extrabold leading-none tabular-nums sm:text-4xl">
          {seconds}<span className="ml-1 text-base font-bold" aria-label="segundos">s</span>
        </div>
        <div role="status" className="min-h-5 text-xs font-bold leading-5">{expired && 'Tempo esgotado'}</div>
      </div>
    </div>
  );
}
