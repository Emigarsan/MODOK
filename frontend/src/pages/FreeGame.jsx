import { useState } from 'react';

export default function FreeGamePage() {
  const [mode, setMode] = useState('create');
  const [mesaName, setMesaName] = useState('');
  const [players, setPlayers] = useState(4);
  const [notes, setNotes] = useState('');
  const [joinCode, setJoinCode] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (mode === 'create') {
      // TODO: enviar datos de freegame al backend
      alert(`Registrada mesa libre: ${mesaName} (${players} jugadores)`);
    } else {
      alert(`Unirse a mesa libre: ${joinCode}`);
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

