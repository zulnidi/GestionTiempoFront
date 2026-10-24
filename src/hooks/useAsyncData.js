import { useCallback, useEffect, useState } from 'react';

/** Carga datos al montar y expone { data, loading, error, reload, setData }. */
export function useAsyncData(loader, initialValue = null) {
  const [state, setState] = useState({ data: initialValue, loading: true, error: '' });

  const reload = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: '' }));
    try {
      const data = await loader();
      setState({ data, loading: false, error: '' });
    } catch (err) {
      setState((s) => ({ ...s, loading: false, error: err.message || 'Error inesperado' }));
    }
  }, [loader]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { ...state, reload };
}
