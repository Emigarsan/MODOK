import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function RegisterPage() {
  const [mode, setMode] = useState('create'); // 'create' | 'join'
  const [mesaNumber, setMesaNumber] = useState('');
  const [mesaName, setMesaName] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [playersCount, setPlayersCount] = useState('');
  const [players, setPlayers] = useState([]);
  const [joinCode, setJoinCode] = useState('');
  const [existing, setExisting] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetch('/api/tables/register/list')
      .then((r) => r.ok ? r.json() : [])
      .then((data) => setExisting(data || []))
      .catch(() => setExisting([]));
  }, []);

  useEffect(() => {
    const n = Math.max(0, parseInt(playersCount, 10) || 0);
    setPlayers((prev) => {
      const next = [...prev];
      if (next.length < n) {
        while (next.length < n) next.push({ character: '', aspect: '' });
      } else if (next.length > n) {
        next.length = n;
      }
      return next;
    });
  }, [playersCount]);

  const [characters, setCharacters] = useState([]);
  const [aspects, setAspects] = useState([]);
  const [swAspects, setSwAspects] = useState([]);
  useEffect(() => {
    fetch('/api/tables/register/characters')
      .then((r) => r.ok ? r.json() : [])
      .then((data) => setCharacters(Array.isArray(data) ? data : []))
      .catch(() => setCharacters([]));
    fetch('/api/tables/register/aspects')
      .then((r) => r.ok ? r.json() : [])
      .then((data) => setAspects(Array.isArray(data) ? data : []))
      .catch(() => setAspects([]));
    fetch('/api/tables/register/spiderwoman-aspects')
      .then((r) => r.ok ? r.json() : [])
      .then((data) => setSwAspects(Array.isArray(data) ? data : []))
      .catch(() => setSwAspects([]));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (mode === 'create') {
        if (!mesaNumber || !difficulty || !playersCount) {
          alert('Rellena nÃƒÂºmero de mesa, dificultad y nÃƒÂºmero de jugadores');
          return;
        }
        const body = {
          tableNumber: parseInt(mesaNumber, 10) || 0,
          tableName: mesaName,
          difficulty,
          players: parseInt(playersCount, 10) || 0,
          playersInfo: players.map(p => ({ character: p.character || '', aspect: p.aspect || '' }))
        };
        const res = await fetch('/api/tables/register/create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        if (!res.ok) throw new Error('No se pudo crear la mesa');
        await res.json();
        navigate('/event');
      } else {
        const res = await fetch('/api/tables/register/join', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: joinCode }) });
        const data = await res.json();
        if (data.ok) navigate('/event'); else alert('CÃƒÂ³digo no encontrado');
      }
    } catch (e) {
      alert(e.message);
    }
  };

  return (
    <div className="container">
      <h2>Registro de Mesa</h2>
      <div className="tabs">
        <button className={mode === 'create' ? 'active' : ''} onClick={() => setMode('create')}>Crear mesa</button>
        <button className={mode === 'join' ? 'active' : ''} onClick={() => setMode('join')}>Unirse a mesa</button>
      </div>
      <form onSubmit={handleSubmit} className="form" style={{ display: mode === 'create' ? 'grid' : 'none', gap: '0.75rem' }}>
        <label>
          NÃƒÂºmero de mesa
          <input type="number" min={1} value={mesaNumber} onChange={(e) => setMesaNumber(e.target.value)} placeholder="Ej. 12" required />
        </label>
        <label>
          Nombre de mesa (opcional)
          <input value={mesaName} onChange={(e) => setMesaName(e.target.value)} placeholder="Ej. Vengadores" />
        </label>
        <label>
          Dificultad
          <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} required>
            <option value="" disabled>Selecciona dificultad</option>
            <option value="FÃƒÂ¡cil">FÃƒÂ¡cil</option>
            <option value="Normal">Normal</option>
            <option value="DifÃƒÂ­cil">DifÃƒÂ­cil</option>
            <option value="Experto">Experto</option>
          </select>
        </label>
        <label>
          NÃƒÂºmero de jugadores
          <input type="number" min={1} max={8} value={playersCount} onChange={(e) => setPlayersCount(e.target.value)} required />
        </label>

        {players.map((p, idx) => (
          <div key={idx} className="player-row" style={{ display: 'grid', gap: '0.5rem' }}>
            <label>
              Personaje
              <input list="character-list" value={p.character} onChange={(e) => {
                const v = e.target.value;
                setPlayers(prev => prev.map((row, i) => {
                  if (i !== idx) return row;
                  if (v === 'Adam Warlock') return { ...row, character: v, aspect: '' };
                  if (v === 'Spider-woman') {
                    return (swAspects.includes(row.aspect)) ? { ...row, character: v } : { ...row, character: v, aspect: '' };
                  }
                  return (aspects.includes(row.aspect)) ? { ...row, character: v } : { ...row, character: v, aspect: '' };
                }));
              }} placeholder="Busca personaje" />
              <datalist id="character-list">
                {characters.map(c => (<option key={c} value={c} />))}
              </datalist>
            </label>
            <label>
              Aspecto
              {(() => {
                const isAdam = (p.character === 'Adam Warlock');
                const isSW = (p.character === 'Spider-woman');
                const opts = isSW ? swAspects : aspects;
                return (
                  <select value={p.aspect} disabled={isAdam} onChange={(e) => {
                    const v = e.target.value; setPlayers(prev => prev.map((row, i) => i===idx ? { ...row, aspect: v } : row));
                  }}>
                    <option value="" disabled>{isAdam ? 'No aplica' : 'Selecciona aspecto'}</option>
                    {opts.map(a => (<option key={a} value={a}>{a}</option>))}
                  </select>
                );
              })()}
            </label>
          </div>
        ))}

        <button type="submit">Crear y continuar</button>
      </form>

      <form onSubmit={handleSubmit} className="form" style={{ display: mode === 'join' ? 'grid' : 'none', gap: '0.75rem' }}>
        <label>
          Unirse a mesa existente
          <select value={joinCode} onChange={(e) => setJoinCode(e.target.value)} required>
            <option value="" disabled>Selecciona una mesa</option>
            {existing.map((t) => (
              <option key={t.id} value={t.code}>
                {t.tableNumber ? `Mesa ${t.tableNumber}` : (t.tableName || 'Mesa')} Ã¢â‚¬â€ CÃƒÂ³digo: {t.code}
              </option>
            ))}
          </select>
        </label>
        <button type="submit">Unirse y continuar</button>
      </form>
    </div>
  );
}




