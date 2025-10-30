import { useState } from 'react';

export default function RegisterPage() {
  const [mode, setMode] = useState('create'); // 'create' | 'join'
  const [mesaName, setMesaName] = useState('');
  const [joinCode, setJoinCode] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (mode === 'create') {
        const res = await fetch('/api/tables/register/create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: mesaName }) });
        if (!res.ok) throw new Error('No se pudo crear la mesa');
        const data = await res.json();
        alert(`Mesa creada. Código: ${data.code}`);
      } else {
        const res = await fetch('/api/tables/register/join', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: joinCode }) });
        const data = await res.json();
        alert(data.ok ? 'Unido correctamente' : 'Código no encontrado');
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
      <form onSubmit={handleSubmit} className="form">
        {mode === 'create' ? (
          <label>
            Nombre de mesa
            <input value={mesaName} onChange={(e) => setMesaName(e.target.value)} placeholder="Ej. Mesa 1" />
          </label>
        ) : (
          <label>
            Código de mesa
            <input value={joinCode} onChange={(e) => setJoinCode(e.target.value)} placeholder="Código" />
          </label>
        )}
        <button type="submit">Continuar</button>
      </form>
    </div>
  );
}
