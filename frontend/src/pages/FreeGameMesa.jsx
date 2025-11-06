import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export default function FreeGameMesa() {
  const { mesaId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [vpInput, setVpInput] = useState('0');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/tables/freegame/by-number/${encodeURIComponent(mesaId)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('No encontrada'))))
      .then((d) => {
        setData(d);
        setVpInput(String(d?.victoryPoints ?? 0));
        setError('');
      })
      .catch(() => setError('No se encontró la mesa'))
      .finally(() => setLoading(false));
  }, [mesaId]);

  const legacyCount = useMemo(() => {
    if (!data || !Array.isArray(data.playersInfo)) return 0;
    return data.playersInfo.filter(
      (p) => p && p.legacy && String(p.legacy) !== 'Ninguno'
    ).length;
  }, [data]);

  if (loading) return <div className="container overlay-card"><p>Cargando...</p></div>;
  if (error) return <div className="container overlay-card"><p className="error">{error}</p></div>;
  if (!data) return <div className="container overlay-card"><p>No hay datos</p></div>;

  const noChallenge = !data.inevitableChallenge || data.inevitableChallenge === '(Ninguno)';
  const base = noChallenge ? 0 : (data.difficulty === 'Experto' ? 5 : 3);
  const vp = noChallenge ? 0 : (parseInt(vpInput, 10) || 0);
  const total = noChallenge ? 0 : (base + legacyCount + vp);

  const saveVP = async () => {
    const n = Math.max(0, parseInt(vpInput, 10) || 0);
    try {
      const r = await fetch('/api/tables/freegame/victory-points', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: data.id, victoryPoints: n })
      });
      if (!r.ok) throw new Error('Error al guardar');
      setSaved(true);
    } catch (e) {
      alert('No se pudo guardar');
    }
  };

  return (
    <><div className="form" style={{ marginBottom: 12 }}>
      <button onClick={() => navigate('/freegame')}>Volver</button>
    </div><div className="container overlay-card">
        <h2>Retos Inevitables - Mesa {data.tableNumber}</h2>
        <div className="form" style={{ display: 'grid', gap: 8 }}>
          <div><strong>Nombre:</strong> {data.name || '-'}</div>
          <div><strong>Dificultad:</strong> {data.difficulty || 'Normal'}</div>
          <div><strong>Reto inevitable:</strong> {data.inevitableChallenge || '(Ninguno)'}</div>
          <div><strong>Jugadores:</strong> {data.players}</div>
          <div>
            <strong>Detalle jugadores:</strong>{' '}
            <div className="player-detail-list">
              {Array.isArray(data.playersInfo) && data.playersInfo.length > 0 ? (
                data.playersInfo.map((p, i) => (
                  <div key={`free-${i}`} className="player-detail-item">
                    {p.character || '-'}
                    {p.aspect ? ` (${p.aspect})` : ''}
                    {p.legacy && String(p.legacy) !== 'Ninguno' ? ` [${p.legacy}]` : ''}
                  </div>
                ))
              ) : (
                <span className="player-detail-empty">Sin jugadores</span>
              )}
            </div>
          </div>
        </div>

        <h3 style={{ marginTop: 16 }}>Puntuación por mesa (desglose)</h3>
        <div className="table-scroll">
          <table className="data-table data-table--compact">
            <thead>
              <tr>
                <th>Dificultad</th>
                <th>Puntos base</th>
                <th>Legados</th>
                <th>Victoria</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{data.difficulty || 'Normal'}</td>
                <td>{base}</td>
                <td>{legacyCount}</td>
                <td>
                  <input
                    className="vp-input"
                    type="number"
                    min={0}
                    value={vpInput}
                    disabled={noChallenge || saved}
                    onChange={(e) => setVpInput(e.target.value)} />
                </td>
                <td>{total}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="form" style={{ marginTop: 8 }}>
          <button disabled={noChallenge || saved} onClick={saveVP}>
            Enviar puntuación
          </button>
          {saved && <span style={{ marginLeft: 8 }}>Guardado como definitivo</span>}
        </div>
      </div></>
  );
}



