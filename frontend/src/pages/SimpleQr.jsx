import { useMemo } from 'react';
import qrMorning from '../assets/qr-morning.svg';
import qrAfternoon from '../assets/qr-afternoon.svg';
import { useParams } from 'react-router-dom';

export default function SimpleQrPage() {
  const { type } = useParams();

  const cfg = useMemo(() => {
    if (String(type).toLowerCase() === 'freegame') {
      return { title: 'Retos Inevitables', img: qrMorning, alt: 'QR Retos Inevitables' };
    }
    return { title: 'Evento', img: qrAfternoon, alt: 'QR Evento' };
  }, [type]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ margin: '0 0 1rem', fontSize: 'clamp(1.6rem, 4vw, 2.6rem)' }}>{cfg.title}</h1>
        <img src={cfg.img} alt={cfg.alt} style={{ width: 'min(60vw, 420px)', height: 'auto', display: 'block', margin: '0 auto' }} />
      </div>
    </div>
  );
}
