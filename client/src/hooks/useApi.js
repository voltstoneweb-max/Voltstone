import { useCallback, useEffect, useState } from 'react';

/** Carga datos y expone { data, loading, error, reload } para pintar estados de carga y error. */
export function useApi(fetcher, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: '' });

  const load = useCallback(() => {
    setState((s) => ({ ...s, loading: true, error: '' }));
    fetcher()
      .then((data) => setState({ data, loading: false, error: '' }))
      .catch((e) => setState({ data: null, loading: false, error: e.message }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(load, [load]);
  return { ...state, reload: load };
}
