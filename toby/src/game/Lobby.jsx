import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './lobby.css';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function getUserIdFromToken() {
  const t = localStorage.getItem('token');
  if (!t) return null;
  try {
    const payload = JSON.parse(atob(t.split('.')[1]));
    return payload.sub || payload.userId || null;
  } catch {
    return null;
  }
}

const TABLEROS = [
  { dificultad: 'facil',   label: 'Fácil',   emoji: '🌿', desc: 'Muchos vientos, pocos ríos, sin monstruos' },
  { dificultad: 'medio',   label: 'Clásico', emoji: '🌊', desc: 'El tablero original del juego' },
  { dificultad: 'dificil', label: 'Difícil',  emoji: '🔥', desc: 'Pocos vientos, muchos ríos, más monstruos' },
];

export default function Lobby(){
  const [partidas, setPartidas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dificultad, setDificultad] = useState('medio');
  const navigate = useNavigate();
  async function fetchPartidas(){
    setLoading(true);
    setError('');
    try{
      const token = localStorage.getItem('token');
      const res = await fetch(`${BASE_URL}/partidas/en-espera`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setPartidas(data || []);
    } catch(err){
      setError(err.message || 'Error al cargar partidas');
    } finally{
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${BASE_URL}/partidas/en-espera`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!cancelled) setPartidas(data || []);
      } catch (err) {
        if (!cancelled) setError(err.message || 'Error al cargar partidas');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  async function handleUnirse(partidaId){
    setError('');
    const usuarioId = Number(getUserIdFromToken());
    if (!usuarioId) {
      setError('Usuario no identificado. Iniciá sesión.');
      return;
    }
    try{
      const token = localStorage.getItem('token');
      const res = await fetch(`${BASE_URL}/partidas/${partidaId}/unirse`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ usuarioId }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body.error || 'No se pudo unir a la partida');
        return;
      }
      // guardar ids para la vista de partida
      if (body.jugador && body.jugador.id) {
        localStorage.setItem('currentJugadorId', String(body.jugador.id));
        localStorage.setItem('currentPartidaId', String(partidaId));
      }
      navigate(`/partida/${partidaId}`);
    } catch(err){
      setError(err.message || 'Error al unirse');
    }
  }

  async function handleCrearPartida(){
    setError('');
    // preferir userId guardado en localStorage
    const stored = localStorage.getItem('userId');
    const usuarioId = Number(stored || getUserIdFromToken());
    if (!usuarioId) {
      setError('Usuario no identificado. Iniciá sesión.');
      return;
    }
    try{
      const token = localStorage.getItem('token');
      const res = await fetch(`${BASE_URL}/partidas/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ usuarioId, tipo: 'publica', dificultad }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body.error || 'No se pudo crear la partida');
        return;
      }
      // recargar lista para que aparezca la nueva partida
      await fetchPartidas();
      // intentar obtener estado de la nueva partida para identificar al jugador creado
      const nuevaPartidaId = body.partida && body.partida.id;
      if (nuevaPartidaId) {
        try{
          const token = localStorage.getItem('token');
          const st = await fetch(`${BASE_URL}/partidas/${nuevaPartidaId}/estado`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });
          if (st.ok) {
            const estado = await st.json();
            const jugadores = estado.jugadores || [];
            const miJugador = jugadores.find(j => Number(j.usuario_id) === Number(usuarioId));
            if (miJugador && miJugador.jugador_id) {
              localStorage.setItem('currentJugadorId', String(miJugador.jugador_id));
              localStorage.setItem('currentPartidaId', String(nuevaPartidaId));
              navigate(`/partida/${nuevaPartidaId}`);
              return;
            }
          }
        } catch {
          // ignore
        }
        // si no encontramos jugador, navegar igual a la partida
        navigate(`/partida/${nuevaPartidaId}`);
        return;
      }
    } catch(err){
      setError(err.message || 'Error al crear partida');
    }
  }

  const jugadoresTexto = (n) => {
    if (n === 1) return 'Un jugador en línea';
    if (n === 2) return 'Dos jugadores en línea';
    if (n === 3) return 'Tres jugadores en línea';
    return `${n} jugadores en línea`;
  };

  return (
    <section className="lobby-root">
      <h2 className="lobby-title">¡Es hora de unirte a una partida!</h2>

      <div className="tablero-selector">
        <p className="tablero-selector-label">Elige el tipo de tablero:</p>
        <div className="tablero-opciones">
          {TABLEROS.map(t => (
            <button
              key={t.dificultad}
              className={`tablero-opcion tablero-opcion--${t.dificultad}${dificultad === t.dificultad ? ' tablero-opcion--activo' : ''}`}
              onClick={() => setDificultad(t.dificultad)}
            >
              <span className="tablero-emoji">{t.emoji}</span>
              <span className="tablero-nombre">{t.label}</span>
              <span className="tablero-desc">{t.desc}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="lobby-actions">
        <button className="create-button" onClick={handleCrearPartida}>Crear partida</button>
      </div>
      {error && <div className="lobby-error">{error}</div>}
      {loading && <p className="lobby-info">Cargando partidas...</p>}
      {!loading && partidas.length === 0 && (
        <p className="lobby-info">No hay partidas en espera. ¡Crea una!</p>
      )}
      <div className="partida-grid">
        {partidas.map(p => (
          <button key={p.id} className="partida-card" onClick={() => handleUnirse(p.id)}>
            <h3>Partida {p.id}</h3>
            <ul>
              <li>{jugadoresTexto(p.jugadores_count ?? 1)}</li>
              <li>Esperando a más jugadores</li>
            </ul>
          </button>
        ))}
      </div>
    </section>
  );
}
