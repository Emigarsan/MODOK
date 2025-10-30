import { useCallback, useEffect, useState } from 'react';

const API_BASE = '/api/counter';

export default function AdminPage() {
  const [state, setState] = useState(null);
  const [error, setError] = useState(null);
  const [amount, setAmount] = useState(1);

  const fetchState = useCallback(() => {
    fetch(API_BASE)
      .then((r) => r.ok ? r.json() : Promise.reject(new Error('Respuesta inválida')))
      .then((data) => { setState(data); setError(null); })
      .catch((e) => setError(e.message));
  }, []);

  useEffect(() => { fetchState(); const id = setInterval(fetchState, 3000); return () => clearInterval(id); }, [fetchState]);

  const update = (segment, sign) => () => {
    const endpoint = sign > 0 ? 'increment' : 'decrement';
    fetch(`${API_BASE}/${segment}/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: Math.max(0, amount|0) || 1 })
    }).then(fetchState);
  };

  const exportData = () => {
    fetch(API_BASE)
      .then((r) => r.ok ? r.json() : Promise.reject(new Error('No se pudo exportar')))
      .then((data) => {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'event_state.json';
        a.click();
        URL.revokeObjectURL(url);
      }).catch((e) => alert(e.message));
  };

  return (
    <div className="container">
      <h2>Admin</h2>
      {error && <p className="error">{error}</p>}
      {!state ? (
        <p>Cargando…</p>
      ) : (
        <>
          <div className="form">
            <label>
              Cantidad
              <input type="number" value={amount} min={0} onChange={(e) => setAmount(Number(e.target.value))} />
            </label>
          </div>
          <div className="admin-grid">
            <section className="counter-card">
              <h3>Primary</h3>
              <div className="counter-value">{state.primary}</div>
              <div className="button-grid">
                <button onClick={update('primary', +1)}>+ Incrementar</button>
                <button onClick={update('primary', -1)}>- Decrementar</button>
              </div>
            </section>

            <section className="counter-card">
              <h3>Secondary</h3>
              <div className="counter-value">{state.secondary} (img {state.secondaryImageIndex + 1})</div>
              <div className="button-grid">
                <button onClick={update('secondary', +1)}>+ Incrementar</button>
                <button onClick={update('secondary', -1)}>- Decrementar</button>
              </div>
            </section>

            <section className="counter-card">
              <h3>Tertiary</h3>
              <div className="counter-value">{state.tertiary}</div>
              <div className="button-grid">
                <button onClick={update('tertiary', +1)}>+ Incrementar</button>
                <button onClick={update('tertiary', -1)}>- Decrementar</button>
              </div>
            </section>
          </div>

          <div className="form" style={{ marginTop: 16 }}>
            <button onClick={exportData}>Exportar datos</button>
          </div>
        </>
      )}
    </div>
  );
}

