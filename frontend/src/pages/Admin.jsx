import { useCallback, useEffect, useState } from 'react';

const API_BASE = '/api/counter';

export default function AdminPage() {
  const [state, setState] = useState(null);
  const [error, setError] = useState(null);
  const [amountPrimary, setAmountPrimary] = useState(1);
  const [amountSecondary, setAmountSecondary] = useState(1);
  const [amountTertiary, setAmountTertiary] = useState(1);
  const [pVal, setPVal] = useState('');
  const [sVal, setSVal] = useState('');
  const [tVal, setTVal] = useState('');
  const [imgIdx, setImgIdx] = useState(''); // 1..7 for UI
  const [adminKey, setAdminKey] = useState(localStorage.getItem('adminKey') || '');
  const [isAuthed, setIsAuthed] = useState(false);
  const [tables, setTables] = useState({ register: [], freegame: [] });
  const [tab, setTab] = useState('mod');

  // Campos de fijación permanecen vacíos hasta que el usuario escriba.
  const syncFromState = () => {};

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
    const amt = (() => {
      if (segment === 'primary') return Math.max(0, Number(amountPrimary) || 1);
      if (segment === 'secondary') return Math.max(0, Number(amountSecondary) || 1);
      return Math.max(0, Number(amountTertiary) || 1);
    })();
    fetch(`${API_BASE}/${segment}/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: amt })
    }).then(fetchState);
  };

  const setExact = (segment, value) => () => {
    const n = Math.max(0, parseInt(value, 10) || 0);
    fetch(`${API_BASE}/${segment}/set`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Admin-Secret': adminKey },
      body: JSON.stringify({ value: n })
    }).then(fetchState);
  };

  const setImageIndex = () => {
    const idx = Math.max(1, Math.min(7, parseInt(imgIdx, 10) || 1));
    const index0 = idx - 1;
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
          {false && (<div className="form">
            <label>
              Cantidad (±)
              <input type="number" value={amount} min={0} onChange={(e) => setAmount(Number(e.target.value))} />
            </label>
          </div>)}
          <div className="admin-tabs">
            <button className={tab === 'mod' ? 'active' : ''} onClick={() => setTab('mod')}>Modificar valores</button>
            <button className={tab === 'tables' ? 'active' : ''} onClick={() => setTab('tables')}>Ver mesas</button>
          </div>

          <div className="admin-grid" style={{ display: tab === 'mod' ? 'grid' : 'none' }}>
            <section className="counter-card">
              <h3>Vida M.O.D.O.K.</h3>
              <div className="counter-value">{state.primary}</div>
              <div className="form">
                <label>
                  Cantidad (±)
                  <input type="number" min={0} value={amountPrimary} onChange={(e) => setAmountPrimary(Number(e.target.value))} />
                </label>
              </div>
              <div className="form">
                <label>
                  Fijar a
                  <input type="number" inputMode="numeric" placeholder="0" value={pVal} min={0} onChange={(e) => setPVal(e.target.value)} />
                </label>
                <button onClick={setExact('primary', pVal)}>Guardar</button>
              </div>
              <div className="button-grid">
                <button onClick={update('primary', +1)}>+ Incrementar</button>
                <button onClick={update('primary', -1)}>- Decrementar</button>
              </div>
            </section>

            <section className="counter-card">
              <h3>Celdas de Contención</h3>
              <div className="counter-value">{state.secondary}</div>
              <div className="form">
                <label>
                  Cantidad (±)
                  <input type="number" min={0} value={amountSecondary} onChange={(e) => setAmountSecondary(Number(e.target.value))} />
                </label>
              </div>
              <div className="form">
                <label>
                  Fijar a
                  <input type="number" inputMode="numeric" placeholder="0" value={sVal} min={0} onChange={(e) => setSVal(e.target.value)} />
                </label>
                <button onClick={setExact('secondary', sVal)}>Guardar</button>
              </div>
              <div className="form">
                <label>
                  Imagen secundaria (1..7)
                  <input type="number" inputMode="numeric" placeholder="1..7" min={1} max={7} value={imgIdx} onChange={(e) => setImgIdx(e.target.value)} />
                </label>
                <button onClick={setImageIndex}>Guardar imagen</button>
              </div>
              <div className="button-grid">
                <button onClick={update('secondary', +1)}>+ Incrementar</button>
                <button onClick={update('secondary', -1)}>- Decrementar</button>
              </div>
            </section>

            <section className="counter-card">
              <h3>Entrenamiento especializado</h3>
              <div className="counter-value">{state.tertiary}</div>
              <div className="form">
                <label>
                  Cantidad (±)
                  <input type="number" min={0} value={amountTertiary} onChange={(e) => setAmountTertiary(Number(e.target.value))} />
                </label>
              </div>
              <div className="form">
                <label>
                  Fijar a
                  <input type="number" inputMode="numeric" placeholder="0" value={tVal} min={0} onChange={(e) => setTVal(e.target.value)} />
                </label>
                <button onClick={setExact('tertiary', tVal)}>Guardar</button>
              </div>
              <div className="button-grid">
                <button onClick={update('tertiary', +1)}>+ Incrementar</button>
                <button onClick={update('tertiary', -1)}>- Decrementar</button>
              </div>
            </section>
          </div>

          {tab === 'tables' && (<>
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
          <div className="form" style={{ marginTop: 16, gap: 8, display: 'flex', flexWrap: 'wrap' }}>
            <button onClick={() => download('/api/admin/export/event.csv', 'event.csv')}>Exportar CSV (Event)</button>
            <button onClick={() => download('/api/admin/export/freegame.csv', 'freegame.csv')}>Exportar CSV (Freegame)</button>
          </div>
          </>)}
        </>
      )}
    </div>
  );
}
