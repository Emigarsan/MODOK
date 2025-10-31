import { useEffect, useState } from 'react';

export default function FreeGamePage() {
  const [mode, setMode] = useState('create');
  const [mesaNumber, setMesaNumber] = useState('');
  const [mesaName, setMesaName] = useState('');
  const [players, setPlayers] = useState(4);
  const [notes, setNotes] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [existingRegister, setExistingRegister] = useState([]);
  const [existingFree, setExistingFree] = useState([]);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (mode === 'create') {
        // Validar número de mesa único entre Register y FreeGame
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
        const res = await fetch('/api/tables/freegame/create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tableNumber: num, name: mesaName, players, notes }) });
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
