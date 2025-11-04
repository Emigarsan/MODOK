import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const LEGACY_OPTIONS = [
  'Ninguno',
  'Vastago de M',
  'Mutante hibrido',
  'Equipo de dos',
  'Los mas buscados',
  'Equipado para lo peor',
  'Guerreros arana',
  'Instruidas por Thanos',
  'Rabia irradiada',
  'Ronin',
  'Dama de la muerte',
  'Solo ante el peligro'
];

export default function FreeGamePage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState('create');
  const [mesaNumber, setMesaNumber] = useState('');
  const [mesaName, setMesaName] = useState('');
  const [difficulty, setDifficulty] = useState('Normal');
  const [inevitableChallenge, setInevitableChallenge] = useState('(Ninguno)');
  const [players, setPlayers] = useState('');
  const [playersInfo, setPlayersInfo] = useState([]);
  const [joinCode, setJoinCode] = useState('');
  const [existingFree, setExistingFree] = useState([]);
  const [characters, setCharacters] = useState([]);
  const [aspects, setAspects] = useState([]);
  const [swAspects, setSwAspects] = useState([]);

  const legacyOptions = useMemo(() => LEGACY_OPTIONS, []);

  const normalize = (s) => (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

  const charMap = useMemo(() => {
    const map = new Map();
    characters.forEach((c) => map.set(normalize(c), c));
    return map;
  }, [characters]);

  useEffect(() => {
    fetch('/api/tables/freegame/list')
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setExistingFree(Array.isArray(data) ? data : []))
      .catch(() => setExistingFree([]));
  }, []);

  useEffect(() => {
    fetch('/api/tables/register/characters')
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setCharacters(Array.isArray(data) ? data : []))
      .catch(() => setCharacters([]));
    fetch('/api/tables/register/aspects')
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setAspects(Array.isArray(data) ? data : []))
      .catch(() => setAspects([]));
    fetch('/api/tables/register/spiderwoman-aspects')
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setSwAspects(Array.isArray(data) ? data : []))
      .catch(() => setSwAspects([]));
  }, []);

  useEffect(() => {
    const n = Math.max(0, parseInt(players, 10) || 0);
    setPlayersInfo((prev) => {
      const next = [...prev];
      if (next.length < n) {
        while (next.length < n) {
          next.push({ character: '', aspect: '', legacy: 'Ninguno' });
        }
      } else if (next.length > n) {
        next.length = n;
      }
      return next;
    });
  }, [players]);

  const handleCharacterChange = (idx, value) => {
    let v = value;
    const canon = charMap.get(normalize(v));
    if (canon) v = canon;
    setPlayersInfo((prev) =>
      prev.map((row, i) => {
        if (i !== idx) return row;
        if (v === 'Adam Warlock') {
          return { ...row, character: v, aspect: '' };
        }
        if (v === 'Spider-woman') {
          return swAspects.includes(row.aspect)
            ? { ...row, character: v }
            : { ...row, character: v, aspect: '' };
        }
        return aspects.includes(row.aspect)
          ? { ...row, character: v }
          : { ...row, character: v, aspect: '' };
      })
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (mode === 'create') {
        if (!mesaNumber) {
          alert('Indica un numero de mesa');
          return;
        }
        const num = parseInt(mesaNumber, 10) || 0;
        const used = (existingFree || []).some((t) => Number(t.tableNumber) === num);
        if (used) {
          alert(`El numero de mesa ${num} ya existe. Elige otro.`);
          return;
        }
        const totalPlayers = parseInt(players, 10) || 0;
        if (totalPlayers <= 0) {
          alert('Indica numero de jugadores');
          return;
        }
        if (totalPlayers > 4) {
          alert('Maximo 4 jugadores');
          return;
        }
        const res = await fetch('/api/tables/freegame/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tableNumber: num,
            name: mesaName,
            difficulty,
            inevitableChallenge,
            players: totalPlayers,
            playersInfo: playersInfo.map((p) => ({
              character: p.character || '',
              aspect: p.aspect || '',
              legacy: p.legacy || 'Ninguno'
            }))
          })
        });
        if (!res.ok) throw new Error('No se pudo registrar la mesa');
        const data = await res.json();
        const numCreated =
          data && typeof data.tableNumber === 'number' ? data.tableNumber : num;
        navigate(`/freegame/${numCreated}`);
      } else {
        const res = await fetch('/api/tables/freegame/join', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: joinCode })
        });
        const data = await res.json();
        if (data.ok) {
          const found = (existingFree || []).find(
            (t) => String(t.code) === String(joinCode)
          );
          const mesa = found ? found.tableNumber : '';
          if (mesa !== '') {
            navigate(`/freegame/${mesa}`);
          } else {
            navigate('/freegame');
          }
        } else {
          alert('Codigo no encontrado');
        }
      }
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="container overlay-card">
      <h2>Retos inevitables</h2>
      <div className="tabs">
        <button
          className={mode === 'create' ? 'active' : ''}
          onClick={() => setMode('create')}
        >
          Registrar mesa
        </button>
        <button
          className={mode === 'join' ? 'active' : ''}
          onClick={() => setMode('join')}
        >
          Unirse
        </button>
      </div>
      <form onSubmit={handleSubmit} className="form">
        {mode === 'create' ? (
          <>
            <label>
              Numero de mesa
              <input
                type="number"
                min={1}
                value={mesaNumber}
                onChange={(e) => setMesaNumber(e.target.value)}
                placeholder="Ej. 50"
                required
              />
            </label>
            <label>
              Nombre de mesa
              <input
                value={mesaName}
                onChange={(e) => setMesaName(e.target.value)}
                placeholder="Ej. Mesa Libre 1"
              />
            </label>
            <label>
              Dificultad
              <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
                <option value="Normal">Normal</option>
                <option value="Experto">Experto</option>
              </select>
            </label>
            <label>
              Reto inevitable
              <select
                value={inevitableChallenge}
                onChange={(e) => setInevitableChallenge(e.target.value)}
              >
                <option value="(Ninguno)">(Ninguno)</option>
                <option value="Celdas falsas">Celdas falsas</option>
                <option value="Hail H.Y.D.R.A.">Hail H.Y.D.R.A.</option>
                <option value="La Sala Roja">La Sala Roja</option>
                <option value="Thunder Force">Thunder Force</option>
                <option value="Ultron Infinito">Ultron Infinito</option>
              </select>
            </label>
            <label>
              Numero de jugadores
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="Ej. 4"
                value={players}
                onChange={(e) => {
                  const v = e.target.value;
                  if (/^\d*$/.test(v) && (v === '' || parseInt(v, 10) <= 4)) {
                    setPlayers(v);
                  }
                }}
                required
              />
            </label>
            {playersInfo.map((p, idx) => (
              <div key={idx} className="player-row freegame-row">
                <label>
                  Personaje
                  <input
                    list="character-list-free"
                    value={p.character}
                    onChange={(e) => handleCharacterChange(idx, e.target.value)}
                    placeholder="Busca personaje"
                  />
                  <datalist id="character-list-free">
                    {characters.map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </label>
                <label>
                  Aspecto
                  {(() => {
                    const isAdam = p.character === 'Adam Warlock';
                    const isSW = p.character === 'Spider-woman';
                    const opts = isSW ? swAspects : aspects;
                    return (
                      <select
                        value={p.aspect}
                        disabled={isAdam}
                        onChange={(e) => {
                          const v = e.target.value;
                          setPlayersInfo((prev) =>
                            prev.map((row, i) =>
                              i === idx ? { ...row, aspect: v } : row
                            )
                          );
                        }}
                      >
                        <option value="" disabled>
                          {isAdam ? 'No aplica' : 'Selecciona aspecto'}
                        </option>
                        {opts.map((a) => (
                          <option key={a} value={a}>
                            {a}
                          </option>
                        ))}
                      </select>
                    );
                  })()}
                </label>
                <label>
                  Legado
                  <select
                    value={p.legacy}
                    onChange={(e) => {
                      const v = e.target.value;
                      setPlayersInfo((prev) =>
                        prev.map((row, i) =>
                          i === idx ? { ...row, legacy: v } : row
                        )
                      );
                    }}
                  >
                    {legacyOptions.map((l) => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            ))}
          </>
        ) : (
          <>
            <label>
              Unirse a mesa existente
              <select
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                required
              >
                <option value="" disabled>
                  Selecciona una mesa
                </option>
                {existingFree.map((t) => (
                  <option key={t.id} value={t.code}>
                    {(() => {
                      const base = t.tableNumber ? `Mesa ${t.tableNumber}` : 'Mesa';
                      const name =
                        t.name && String(t.name).trim().length > 0
                          ? `${base} - ${t.name}`
                          : base;
                      return `${name} - Codigo: ${t.code}`;
                    })()}
                  </option>
                ))}
              </select>
            </label>
          </>
        )}
        <button type="submit">Guardar</button>
      </form>
    </div>
  );
}

