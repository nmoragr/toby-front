import { useState, useEffect } from 'react';
import './Negociacion.css';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const CARD_ICONS = {
  salvavidas: '🛟', paraguas: '☂️', espada: '⚔️',
  avanza: '⏩', retrocede: '⏪', movimiento: '🎯', moneda: '💰', especial: '⭐',
};

function authHeaders() {
  const token = localStorage.getItem('token');
  return token ? { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } : { 'Content-Type': 'application/json' };
}

export default function Negociacion({ partidaId, jugadorId, onClose, negociacionesUsadas, onNegociacionEnviada }) {
  const [otrosJugadores, setOtrosJugadores] = useState([]);
  const [jugadorSeleccionado, setJugadorSeleccionado] = useState(null);
  const [cartaSeleccionada, setCartaSeleccionada] = useState(null);
  const [monto, setMonto] = useState(0);
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');

  useEffect(() => {
    let cancelled = false;
    const token = localStorage.getItem('token');
    fetch(`${BASE_URL}/partidas/${partidaId}/jugador/${jugadorId}/cartas-otros`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(r => r.json())
      .then(data => { if (!cancelled) { setOtrosJugadores(Array.isArray(data) ? data : []); setLoading(false); } })
      .catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [partidaId, jugadorId]);

  async function handleEnviar() {
    if (!jugadorSeleccionado || !cartaSeleccionada) { setError('Selecciona un jugador y una carta'); return; }
    if (monto < 0) { setError('El monto no puede ser negativo'); return; }
    setEnviando(true);
    setError('');
    try {
      const res = await fetch(`${BASE_URL}/partidas/${partidaId}/negociar`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          origenId: jugadorId,
          destinoId: jugadorSeleccionado.jugador_id,
          cartaId: cartaSeleccionada.carta_id,
          montoOfrecido: monto,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) { setError(body.error || 'No se pudo enviar la oferta'); return; }
      setExito('¡Oferta enviada! Esperando respuesta...');
      onNegociacionEnviada();
    } catch (err) {
      setError(err.message || 'Error de red');
    } finally {
      setEnviando(false);
    }
  }

  const restantes = 2 - negociacionesUsadas;

  return (
    <div className="negociacion-overlay">
      <div className="negociacion-modal">
        <div className="negociacion-header">
          <h2>Negociar carta</h2>
          <span className="negociacion-restantes">{restantes} oferta{restantes !== 1 ? 's' : ''} restante{restantes !== 1 ? 's' : ''}</span>
          <button className="negociacion-close" onClick={onClose}>✕</button>
        </div>

        {exito ? (
          <div className="negociacion-exito">
            <p>{exito}</p>
            <button onClick={onClose}>Cerrar</button>
          </div>
        ) : (
          <>
            {error && <div className="negociacion-error">{error}</div>}

            {loading ? (
              <p className="negociacion-info">Cargando jugadores...</p>
            ) : otrosJugadores.length === 0 ? (
              <p className="negociacion-info">No hay otros jugadores con cartas.</p>
            ) : (
              <>
                <div className="negociacion-jugadores">
                  {otrosJugadores.map(j => (
                    <button
                      key={j.jugador_id}
                      className={`jugador-btn ${jugadorSeleccionado?.jugador_id === j.jugador_id ? 'selected' : ''}`}
                      onClick={() => { setJugadorSeleccionado(j); setCartaSeleccionada(null); }}
                    >
                      {j.nombre}
                      <span className="jugador-cartas-count">{j.cartas.length} carta{j.cartas.length !== 1 ? 's' : ''}</span>
                    </button>
                  ))}
                </div>

                {jugadorSeleccionado && (
                  <div className="negociacion-cartas">
                    <p className="negociacion-label">Cartas de {jugadorSeleccionado.nombre}:</p>
                    {jugadorSeleccionado.cartas.length === 0 ? (
                      <p className="negociacion-info">No tiene cartas.</p>
                    ) : (
                      <div className="cartas-lista">
                        {jugadorSeleccionado.cartas.map(c => (
                          <button
                            key={c.participacion_id}
                            className={`carta-opcion ${cartaSeleccionada?.carta_id === c.carta_id ? 'selected' : ''}`}
                            onClick={() => setCartaSeleccionada(c)}
                            title={c.descripcion}
                          >
                            <span>{CARD_ICONS[c.tipo] || '🃏'}</span>
                            <span>{c.tipo}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {cartaSeleccionada && (
                  <div className="negociacion-oferta">
                    <label className="negociacion-label">Ofreces (monedas):</label>
                    <input
                      type="number"
                      min="0"
                      value={monto}
                      onChange={e => setMonto(Number(e.target.value))}
                      className="negociacion-input"
                    />
                    <button
                      className="negociacion-enviar"
                      onClick={handleEnviar}
                      disabled={enviando || restantes <= 0}
                    >
                      {enviando ? 'Enviando...' : 'Enviar oferta'}
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
