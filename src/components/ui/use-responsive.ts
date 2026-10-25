import { useState, useEffect } from 'react';

export interface ResponsiveProp<T> {
  sm?: T;
  md?: T;
  lg?: T;
  xl?: T;
}

export function useResponsive<T>(value: T | ResponsiveProp<T> | undefined, fallback?: T): T {
  if (value === undefined || value === null) {
    return fallback as T;
  }

  if (typeof value !== 'object' || Array.isArray(value)) {
    return value as T;
  }

  const obj = value as ResponsiveProp<T>;

  const getBreakpointValue = (): T => {
    if (typeof window === 'undefined') {
      return (obj.xl ?? obj.lg ?? obj.md ?? obj.sm ?? (obj as unknown as T)) as T;
    }
    const width = window.innerWidth;
    if (width >= 1280 && obj.xl !== undefined) return obj.xl;
    if (width >= 1024 && obj.lg !== undefined) return obj.lg;
    if (width >= 768 && obj.md !== undefined) return obj.md;
    if (width >= 640 && obj.sm !== undefined) return obj.sm;
    return (obj.sm ?? obj.md ?? obj.lg ?? obj.xl ?? (obj as unknown as T)) as T;
  };

  const [currentValue, setCurrentValue] = useState<T>(getBreakpointValue);

  useEffect(() => {
    const handleResize = () => {
      setCurrentValue(getBreakpointValue());
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [value]);

  return currentValue;
}
