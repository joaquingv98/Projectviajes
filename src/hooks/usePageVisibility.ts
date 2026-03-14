import { useState, useEffect } from 'react';

/**
 * Devuelve true si la pestaña está visible, false si está oculta.
 * Usa la Page Visibility API para polling adaptativo.
 */
export function usePageVisibility(): boolean {
  const [visible, setVisible] = useState(() => !document.hidden);

  useEffect(() => {
    const handleVisibilityChange = () => setVisible(!document.hidden);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  return visible;
}
