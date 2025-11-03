import { useParams } from 'react-router-dom';
import { useCallback, useState } from 'react';

export default function MesaPage() {
  const { mesaId } = useParams();
  const [status, setStatus] = useState('');

  const send = useCallback(async (contador, delta) => {
    setStatus('');
    const payload = { delta, uuid: crypto.randomUUID(), ts: Date.now() };
    try {
      const res = await fetch(`/api/mesas/${mesaId}/contador/${contador}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Error de red');
      setStatus('Enviado');
      setTimeout(() => setStatus(''), 1000);
    } catch (e) {
      setStatus('Error al enviar');
    }
  }, [mesaId]);

  const Btn = ({ c, d, label }) => (
    <button onClick={() => send(c, d)}>{label}</button>
  );

  return (
    <div className="container">
      <h2>Mesa {mesaId}</h2>
      <p>Registra las acciones por contador. Usa +1/-1 según corresponda.</p>
      <div className="admin-grid" style={{ gridTemplateColumns: '1fr', gap: 16 }}>
        <section className="counter-card">
          <h3>Contador 1</h3>
          <div className="button-grid">
            <Btn c={1} d={+1} label={'+1'} />
            <Btn c={1} d={-1} label={'-1'} />
          </div>
        </section>
        <section className="counter-card">
          <h3>Contador 2</h3>
          <div className="button-grid">
            <Btn c={2} d={+1} label={'+1'} />
            <Btn c={2} d={-1} label={'-1'} />
          </div>
        </section>
        <section className="counter-card">
          <h3>Contador 3</h3>
          <div className="button-grid">
            <Btn c={3} d={+1} label={'+1'} />
            <Btn c={3} d={-1} label={'-1'} />
          </div>
        </section>
      </div>
      {status && <p>{status}</p>}
    </div>
  );
}

