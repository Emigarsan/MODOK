import { useState } from 'react';

export default function RegisterPage() {
  const [mode, setMode] = useState('create'); // 'create' | 'join'
  const [mesaName, setMesaName] = useState('');
  const [joinCode, setJoinCode] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (mode === 'create') {
      // TODO: implementar creación de mesa (backend)
      alert(`Mesa creada: ${mesaName}`);
    } else {
      // TODO: implementar unión a mesa existente (backend)
      alert(`Unirse a mesa: ${joinCode}`);
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

