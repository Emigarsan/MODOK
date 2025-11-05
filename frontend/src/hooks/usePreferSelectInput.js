import { useEffect, useState } from 'react';

export function usePreferSelectInput() {
  const [preferSelect, setPreferSelect] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return;
    }

    const query = window.matchMedia('(pointer: coarse)');
    const update = () => setPreferSelect(query.matches);
    update();

    if (typeof query.addEventListener === 'function') {
      query.addEventListener('change', update);
      return () => query.removeEventListener('change', update);
    }

    if (typeof query.addListener === 'function') {
      query.addListener(update);
      return () => query.removeListener(update);
    }
  }, []);

  return preferSelect;
}
