import { useEffect, useMemo, useState } from 'react';

export default function FreeGamePage() {
  const [mode, setMode] = useState('create');
  const [mesaNumber, setMesaNumber] = useState('');
  const [mesaName, setMesaName] = useState('');
  const [players, setPlayers] = useState(4);
  const [playersInfo, setPlayersInfo] = useState([]);
  const [notes, setNotes] = useState('');
  const [joinCode, setJoinCode] = useState('');

  const [existingRegister, setExistingRegister] = useState([]);
  const [existingFree, setExistingFree] = useState([]);

  const [characters, setCharacters] = useState([]);
  const [aspects, setAspects] = useState([]);
  const [swAspects, setSwAspects] = useState([]);

  const legacyOptions = useMemo(() => ([
    'Ninguno',
    'Vástago de M',
    'Mutante híbrido',
    'Equipo de dos',
    'Los más buscados',
    'Equipado para lo peor',
    'Guerreros araña',
    'Instruidas por Thanos',
    'Rabia irradiada',
    'Ronin',
    'Dama de la muerte',
    'Solo ante el peligro'
  ]), []);

  const normalize = (s) => (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const charMap = useMemo(() => {
    const m = new Map();
    characters.forEach((c) => m.set(normalize(c), c));
    return m;
  }, [characters]);

  useEffect(() => {
    fetch('/api/tables/register/list')
      .then(r => r.ok ? r.json() : [])
      .then(data => setExistingRegister(Array.isArray(data) ? data : []))
      .catch(() => setExistingRegister([]));
    fetch('/api/tables/freegame/list')
      .then(r => r.ok ? r.json() : [])
      .then(data => setExistingFree(Array.isArray(data) ? data : []))
      .catch(() => setExistingFree([]));
  }, []);

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

  useEffect(() => {
    const n = Math.max(0, parseInt(players, 10) || 0);
    setPlayersInfo((prev) => {
      const next = [...prev];
      if (next.length < n) {
        while (next.length < n) next.push({ character: '', aspect: '', legacy: 'Ninguno' });
      } else if (next.length > n) {
        next.length = n;
      }
      return next;
    });
  }, [players]);

  const handleCharacterChange = (idx, raw) => {
    let v = raw;
    const canon = charMap.get(normalize(v));
    if (canon) v = canon;
    setPlayersInfo(prev => prev.map((row, i) => {
      if (i !== idx) return row;
      if (v === 'Adam Warlock') return { ...row, character: v, aspect: '' };
      if (v === 'Spider-woman') {
        return (swAspects.includes(row.aspect)) ? { ...row, character: v } : { ...row, character: v, aspect: '' };
      }
      return (aspects.includes(row.aspect)) ? { ...row, character: v } : { ...row, character: v, aspect: '' };
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (mode === 'create') {
        if (!mesaNumber) {
          alert('Indica un número de mesa');
          return;
        }
        const num = parseInt(mesaNumber, 10) || 0;
        const usedInRegister = (existingRegister || []).some(t => Number(t.tableNumber) === num);
        const usedInFree = (existingFree || []).some(t => Number(t.tableNumber) === num);
        if (usedInRegister || usedInFree) {
          alert(`El número de mesa ${num} ya existe. Elige otro.`);
          return;
        }
        const res = await fetch('/api/tables/freegame/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tableNumber: num,
            name: mesaName,
            players,
            notes,
            playersInfo: playersInfo.map(p => ({ character: p.character || '', aspect: p.aspect || '', legacy: p.legacy || 'Ninguno' }))
          })
        });
        if (!res.ok) throw new Error('No se pudo registrar la mesa');
        const data = await res.json();
        alert(`Mesa libre registrada. Código: ${data.code}`);
      } else {
        const res = await fetch('/api/tables/freegame/join', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: joinCode }) });
        const data = await res.json();
        alert(data.ok ? 'Unido correctamente' : 'Código no encontrado');
      }
    } catch (e) {
      alert(e.message);
    }
  };

  return (
    <div className="container">
      <h2>Freegame</h2>
      <div className="tabs">
        <button className={mode === 'create' ? 'active' : ''} onClick={() => setMode('create')}>Registrar mesa</button>
        <button className={mode === 'join' ? 'active' : ''} onClick={() => setMode('join')}>Unirse</button>
      </div>
      <form onSubmit={handleSubmit} className="form">
        {mode === 'create' ? (
          <>
            <label>
              Número de mesa
              <input type="number" min={1} value={mesaNumber} onChange={(e) => setMesaNumber(e.target.value)} placeholder="Ej. 50" required />
            </label>
            <label>
              Nombre de mesa
              <input value={mesaName} onChange={(e) => setMesaName(e.target.value)} placeholder="Ej. Mesa Libre 1" />
            </label>
            <label>
              Nº jugadores previstos
              <input type="number" min={1} max={8} value={players} onChange={(e) => setPlayers(Number(e.target.value))} />
            </label>
            {playersInfo.map((p, idx) => (
              <div key={idx} className="player-row">
                <label>
                  Personaje
                  <input
                    list="character-list-free"
                    value={p.character}
                    onChange={(e) => handleCharacterChange(idx, e.target.value)}
                    placeholder="Busca personaje"
                  />
                  <datalist id="character-list-free">
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
                        const v = e.target.value; setPlayersInfo(prev => prev.map((row, i) => i===idx ? { ...row, aspect: v } : row));
                      }}>
                        <option value="" disabled>{isAdam ? 'No aplica' : 'Selecciona aspecto'}</option>
                        {opts.map(a => (<option key={a} value={a}>{a}</option>))}
                      </select>
                    );
                  })()}
                </label>
                <label>
                  Legado
                  <select value={p.legacy} onChange={(e) => {
                    const v = e.target.value; setPlayersInfo(prev => prev.map((row, i) => i===idx ? { ...row, legacy: v } : row));
                  }}>
                    {legacyOptions.map(l => (<option key={l} value={l}>{l}</option>))}
                  </select>
                </label>
              </div>
            ))}
            <label>
              Datos adicionales
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Cenit, dificultad, horario, etc." />
            </label>
          </>
        ) : (
          <label>
            Código de mesa libre
            <input value={joinCode} onChange={(e) => setJoinCode(e.target.value)} placeholder="Código" />
          </label>
        )}
        <button type="submit">Guardar</button>
      </form>
    </div>
  );
}

