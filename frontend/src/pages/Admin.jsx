import { useCallback, useEffect, useState } from 'react';

const API_BASE = '/api/counter';

export default function AdminPage() {
  const [state, setState] = useState(null);
  const [error, setError] = useState(null);
  const [amount, setAmount] = useState(1);
  const [pVal, setPVal] = useState(0);
  const [sVal, setSVal] = useState(0);
  const [tVal, setTVal] = useState(0);
  const [imgIdx, setImgIdx] = useState(1); // 1..7 for UI
  const [adminKey, setAdminKey] = useState(localStorage.getItem('adminKey') || '');
  const [isAuthed, setIsAuthed] = useState(false);
  const [tables, setTables] = useState({ register: [], freegame: [] });

  const syncFromState = (data) => {
    setPVal(data.primary);
    setSVal(data.secondary);
    setTVal(data.tertiary);
    setImgIdx((data.secondaryImageIndex ?? 0) + 1);
  };

  const fetchState = useCallback(() => {
    fetch(API_BASE)
      .then((r) => r.ok ? r.json() : Promise.reject(new Error('Respuesta inválida')))
      .then((data) => { setState(data); setError(null); syncFromState(data); })
      .catch((e) => setError(e.message));
  }, []);

  useEffect(() => { fetchState(); const id = setInterval(fetchState, 3000); return () => clearInterval(id); }, [fetchState]);

  useEffect(() => {
    if (adminKey) {
      fetch('/api/admin/tables', { headers: { 'X-Admin-Secret': adminKey }})
        .then((r) => setIsAuthed(r.ok))
        .catch(() => setIsAuthed(false));
    }
  }, []);

  const fetchTables = useCallback(() => {
    if (!isAuthed) return;
    fetch('/api/admin/tables', { headers: { 'X-Admin-Secret': adminKey }})
      .then((r) => r.ok ? r.json() : Promise.reject(new Error('No autorizado')))
      .then((data) => setTables(data))
      .catch(() => {});
  }, [adminKey, isAuthed]);

  useEffect(() => { if (isAuthed) { fetchTables(); const id = setInterval(fetchTables, 3000); return () => clearInterval(id); }}, [isAuthed, fetchTables]);

  const update = (segment, sign) => () => {
    const endpoint = sign > 0 ? 'increment' : 'decrement';
    fetch(`${API_BASE}/${segment}/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: Math.max(0, amount|0) || 1 })
    }).then(fetchState);
  };

  const setExact = (segment, value) => () => {
    fetch(`${API_BASE}/${segment}/set`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Admin-Secret': adminKey },
      body: JSON.stringify({ value: Math.max(0, value|0) })
    }).then(fetchState);
  };

  const setImageIndex = () => {
    const index0 = Math.max(1, Math.min(7, imgIdx)) - 1;
    fetch(`${API_BASE}/secondary/imageIndex`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Admin-Secret': adminKey },
      body: JSON.stringify({ index: index0 })
    }).then(fetchState);
  };

  const download = (path, filename) => {
    fetch(path, { headers: { 'X-Admin-Secret': adminKey }})
      .then((r) => r.ok ? r.blob() : Promise.reject(new Error('No autorizado')))
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
      }).catch((e) => alert(e.message));
  };

  const tryAuth = (e) => {
    e.preventDefault();
    if (!adminKey) return;
    // Probe a protected endpoint to validate key
    fetch('/api/admin/tables', { headers: { 'X-Admin-Secret': adminKey }})
      .then((r) => {
        if (r.ok) {
          localStorage.setItem('adminKey', adminKey);
          setIsAuthed(true);
        } else {
          alert('Clave incorrecta');
        }
      })
      .catch(() => alert('Error de red'));
  };

  if (!isAuthed) {
    return (
      <div className="container">
        <h2>Admin</h2>
        <form className="form" onSubmit={tryAuth}>
          <label>
            Contraseña
            <input type="password" value={adminKey} onChange={(e) => setAdminKey(e.target.value)} />
          </label>
          <button type="submit">Entrar</button>
        </form>
      </div>
    );
  }

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
              Cantidad (±)
              <input type="number" value={amount} min={0} onChange={(e) => setAmount(Number(e.target.value))} />
            </label>
          </div>

          <div className="admin-grid">
            <section className="counter-card">
              <h3>Primary</h3>
              <div className="counter-value">{state.primary}</div>
              <div className="form">
                <label>
                  Fijar a
                  <input type="number" value={pVal} min={0} onChange={(e) => setPVal(Number(e.target.value))} />
                </label>
                <button onClick={setExact('primary', pVal)}>Guardar</button>
              </div>
              <div className="button-grid">
                <button onClick={update('primary', +1)}>+ Incrementar</button>
                <button onClick={update('primary', -1)}>- Decrementar</button>
              </div>
            </section>

            <section className="counter-card">
              <h3>Secondary</h3>
              <div className="counter-value">{state.secondary}</div>
              <div className="form">
                <label>
                  Fijar a
                  <input type="number" value={sVal} min={0} onChange={(e) => setSVal(Number(e.target.value))} />
                </label>
                <button onClick={setExact('secondary', sVal)}>Guardar</button>
              </div>
              <div className="form">
                <label>
                  Imagen secundaria (1..7)
                  <input type="number" min={1} max={7} value={imgIdx} onChange={(e) => setImgIdx(Number(e.target.value))} />
                </label>
                <button onClick={setImageIndex}>Guardar imagen</button>
              </div>
              <div className="button-grid">
                <button onClick={update('secondary', +1)}>+ Incrementar</button>
                <button onClick={update('secondary', -1)}>- Decrementar</button>
              </div>
            </section>

            <section className="counter-card">
              <h3>Tertiary</h3>
              <div className="counter-value">{state.tertiary}</div>
              <div className="form">
                <label>
                  Fijar a
                  <input type="number" value={tVal} min={0} onChange={(e) => setTVal(Number(e.target.value))} />
                </label>
                <button onClick={setExact('tertiary', tVal)}>Guardar</button>
              </div>
              <div className="button-grid">
                <button onClick={update('tertiary', +1)}>+ Incrementar</button>
                <button onClick={update('tertiary', -1)}>- Decrementar</button>
              </div>
            </section>
          </div>

          <h3>Mesas (vivo)</h3>
          <div className="admin-grid">
            <section className="counter-card">
              <h3>Register</h3>
              <ul>
                {tables.register.map((t) => (
                  <li key={t.id}>{t.name} — Código: {t.code}</li>
                ))}
              </ul>
            </section>
            <section className="counter-card">
              <h3>Freegame</h3>
              <ul>
                {tables.freegame.map((t) => (
                  <li key={t.id}>{t.name} — Jugadores: {t.players} — Código: {t.code}</li>
                ))}
              </ul>
            </section>
          </div>

          <div className="form" style={{ marginTop: 16, gap: 8, display: 'flex' }}>
            <button onClick={() => download('/api/admin/export/tables.csv', 'tables.csv')}>Exportar CSV (mesas)</button>
            <button onClick={() => download('/api/admin/export/counters.csv', 'counters.csv')}>Exportar CSV (contadores)</button>
          </div>
        </>
      )}
    </div>
  );
}
