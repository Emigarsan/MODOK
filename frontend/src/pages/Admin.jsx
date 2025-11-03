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
  const [adminKey, setAdminKey] = useState('');
  const [isAuthed, setIsAuthed] = useState(false);
  const [tables, setTables] = useState({ register: [], freegame: [] });
  const [mesaSummary, setMesaSummary] = useState({});
  const [tab, setTab] = useState('mod');
  const [tablesTab, setTablesTab] = useState('event');

  // Campos de fijación permanecen vacÃƒ­os hasta que el usuario escriba.
  const syncFromState = () => {};

  const fetchState = useCallback(() => {
    fetch(API_BASE)
      .then((r) => r.ok ? r.json() : Promise.reject(new Error('Respuesta invÃ¡lida')))
      .then((data) => { setState(data); setError(null); syncFromState(data); })
      .catch((e) => setError(e.message));
  }, []);

  useEffect(() => { fetchState(); const id = setInterval(fetchState, 3000); return () => clearInterval(id); }, [fetchState]);

  // No auto-login: siempre pedimos Contraseña hasta pulsar "Entrar".

  const fetchTables = useCallback(() => {
    if (!isAuthed) return;
    fetch('/api/admin/tables', { headers: { 'X-Admin-Secret': adminKey }})
      .then((r) => r.ok ? r.json() : Promise.reject(new Error('No autorizado')))
      .then((data) => setTables(data))
      .catch(() => {});
  }, [adminKey, isAuthed]);

  useEffect(() => { if (isAuthed) { fetchTables(); const id = setInterval(fetchTables, 3000); return () => clearInterval(id); }}, [isAuthed, fetchTables]);

  useEffect(() => {
    if (!isAuthed) return;
    const load = () => {
      fetch('/api/mesas/summary').then(r => r.ok ? r.json() : {}).then(setMesaSummary).catch(() => {});
    };
    load();
    const id = setInterval(load, 3000);
    return () => clearInterval(id);
  }, [isAuthed]);

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
          setIsAuthed(true);
        } else {
          alert('Clave incorrecta');
        }
      })
      .catch(() => alert('Error de red'));
  };

  const logout = () => {
    setIsAuthed(false);
    setAdminKey('');
    setTables({ register: [], freegame: [] });
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
      {isAuthed && (
        <div className="form" style={{ alignSelf: 'flex-end' }}>
          <button onClick={logout}>Cerrar sesión</button>
        </div>
      )}
      {error && <p className="error">{error}</p>}
      {!state ? (
        <p>Cargando</p>
      ) : (
        <>
          {false && (<div className="form">
            <label>
                ntidad (±)
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
          <div className="admin-tabs" style={{ marginBottom: 8 }}>
            <button className={tablesTab === 'event' ? 'active' : ''} onClick={() => setTablesTab('event')}>Event</button>
            <button className={tablesTab === 'freegame' ? 'active' : ''} onClick={() => setTablesTab('freegame')}>Freegame</button>
          </div>
          <div className="admin-grid" style={{ marginBottom: 12, gridTemplateColumns: '1fr' }}>
            <section className="counter-card" style={{ overflowX: 'auto', display: tablesTab === 'event' ? 'block' : 'none' }}>
              <h3>Event</h3>
              <table className="data-table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>Mesa</th>
                    <th>Nombre</th>
                    <th>Dificultad</th>
                    <th>Jugadores</th>
                    <th>Detalle jugadores</th>
                    <th>Código</th>
                  </tr>
                </thead>
                <tbody>
                  {(tables.register || []).map((t) => {
                    const mesa = t.tableNumber ?? '';
                    const nombre = t.tableName ?? '';
                    const dif = t.difficulty ?? '';
                    const players = t.players ?? '';
                    const detalle = Array.isArray(t.playersInfo)
                      ? t.playersInfo.map((p) => `${p.character}${p.aspect ? ` (${p.aspect})` : ''}`).join(', ')
                      : '';
                    return (
                      <tr key={t.id}>
                        <td>{mesa}</td>
                        <td>{nombre}</td>
                        <td>{dif}</td>
                        <td>{players}</td>
                        <td>{detalle}</td>
                        <td>{t.code}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </section>
            <section className="counter-card" style={{ overflowX: 'auto', display: tablesTab === 'freegame' ? 'block' : 'none' }}>
              <h3>Freegame</h3>
              <table className="data-table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>Mesa</th>\n                    <th>Nombre</th>\n                    <th>Jugadores</th>\n                    <th>Detalle jugadores</th>\n                    <th>Código</th>
                  </tr>
                </thead>
                <tbody>
                  {(tables.freegame || []).map((t) => (
                    <tr key={t.id}>
                      <td>{t.name}</td>
                      <td>{t.players}</td>
                      <td>{t.notes}</td>
                      <td>{t.code}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
            <section className="counter-card" style={{ overflowX: 'auto' }}>
              <h3>Mesas - Totales por contador</h3>
              <table className="data-table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>Mesa</th>
                    <th>Contador 1</th>
                    <th>Contador 2</th>
                    <th>Contador 3</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(mesaSummary || {}).sort((a,b) => Number(a[0]) - Number(b[0])).map(([mesa, t]) => (
                    <tr key={mesa}>
                      <td>{mesa}</td>
                      <td>{t?.c1 ?? 0}</td>
                      <td>{t?.c2 ?? 0}</td>
                      <td>{t?.c3 ?? 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
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



