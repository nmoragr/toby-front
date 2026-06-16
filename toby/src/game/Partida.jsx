import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getSocket, connectSocket } from '../common/socket';
import Board from './Board';
import Negociacion from './Negociacion';
import './partida.css';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const CARD_ICONS = {
  salvavidas: '🛟',
  paraguas: '☂️',
  espada: '⚔️',
  avanza: '⏩',
  retrocede: '⏪',
  movimiento: '🎯',
  moneda: '💰',
  especial: '⭐',
};

const LEVEL_COSTS = { 1: 20, 2: 30 };

function cardLabel(carta) {
  if (carta.tipo === 'moneda') {
    return carta.valor >= 0 ? `+${carta.valor} 💰` : `${carta.valor} 💰`;
  }
  if (carta.tipo === 'movimiento') {
    return carta.valor >= 0 ? `+${carta.valor} cas.` : `${carta.valor} cas.`;
  }
  if (carta.tipo === 'avanza') return `+${carta.valor} cas.`;
  if (carta.tipo === 'retrocede') return `-${Math.abs(carta.valor)} cas.`;
  return carta.tipo;
}

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

function authHeaders() {
  const token = localStorage.getItem('token');
  return token ? { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } : { 'Content-Type': 'application/json' };
}

function resolverGanador(jugadoresList) {
  return jugadoresList.find(j => j.gano === true) || null;
}

export default function Partida() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [partida, setPartida] = useState(null);
  const [jugadores, setJugadores] = useState([]);
  const [jugador, setJugador] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [lastRoll, setLastRoll] = useState(null);
  const [turnoActual, setTurnoActual] = useState(null);
  const [cartas, setCartas] = useState([]);
  const [usingCard, setUsingCard] = useState(false);
  const [levelingUp, setLevelingUp] = useState(false);
  const [mostrarNegociacion, setMostrarNegociacion] = useState(false);
  const [negociacionesUsadas, setNegociacionesUsadas] = useState(0);
  const [ofertasEntrantes, setOfertasEntrantes] = useState([]);
  const [ganador, setGanador] = useState(null);
  const [decisionPendiente, setDecisionPendiente] = useState(null);
  const [faseDecision, setFaseDecision] = useState('evento');
  const [posicionesAnimadas, setPosicionesAnimadas] = useState({});
  const [rolando, setRolando] = useState(false);
  const [dadoDisplay, setDadoDisplay] = useState(null);
  const animacionActiva = useRef(false);

  const fetchCartas = useCallback(async (jugadorId) => {
    if (!jugadorId) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${BASE_URL}/partidas/${id}/jugador/${jugadorId}/cartas`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) return;
      const data = await res.json();
      setCartas(Array.isArray(data) ? data : []);
    } catch {
      // silently ignore
    }
  }, [id]);

  const reconcileJugador = useCallback((jugadoresList) => {
    const userSub = Number(getUserIdFromToken());
    const currentStored = Number(localStorage.getItem('currentJugadorId'));
    const found = jugadoresList.find(
      j => Number(j.usuario_id) === userSub || Number(j.jugador_id) === currentStored,
    );
    setJugador(found || null);
    if (found?.jugador_id) {
      localStorage.setItem('currentJugadorId', String(found.jugador_id));
      fetchCartas(found.jugador_id);
    }
  }, [fetchCartas]);

  const fetchEstado = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${BASE_URL}/partidas/${id}/estado`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setPartida(data.partida || null);
      setJugadores(data.jugadores || []);
      setTurnoActual(data.turno_actual || null);
      reconcileJugador(data.jugadores || []);
    } catch (err) {
      setMessage(err.message || 'Error al cargar partida');
    } finally {
      setLoading(false);
    }
  }, [id, reconcileJugador]);

  useEffect(() => {
    let cancelled = false;
    const token = localStorage.getItem('token');
    fetch(`${BASE_URL}/partidas/${id}/estado`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => {
        if (cancelled) return;
        const nuevaPartida = data.partida || null;
        const nuevosJugadores = data.jugadores || [];
        setPartida(nuevaPartida);
        setJugadores(nuevosJugadores);
        setTurnoActual(data.turno_actual || null);
        reconcileJugador(nuevosJugadores);
        if (nuevaPartida?.estado === 'finalizada') {
          setGanador(resolverGanador(nuevosJugadores));
        }
      })
      .catch(err => { if (!cancelled) setMessage(err.message || 'Error al cargar partida'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id, reconcileJugador]);

  useEffect(() => {
    const socket = getSocket() || connectSocket();
    if (!socket) return;

    socket.emit('partida:unirse', { partidaId: id });

    function handleActualizada(data) {
      const nuevaPartida = data.partida || null;
      const nuevosJugadores = data.jugadores || [];
      setPartida(nuevaPartida);
      setJugadores(nuevosJugadores);
      reconcileJugador(nuevosJugadores);
      if (nuevaPartida?.estado === 'finalizada') {
        setGanador(resolverGanador(nuevosJugadores));
      } else if (nuevaPartida?.estado === 'en_juego' && nuevosJugadores.length > 0) {
        const indice = (nuevaPartida.numero_turno - 1) % nuevosJugadores.length;
        setTurnoActual({ jugador_id: nuevosJugadores[indice].jugador_id });
      }
    }

    function handleNegociacionNueva(data) {
      const miJugadorId = Number(localStorage.getItem('currentJugadorId'));
      if (data.destino?.jugador_id === miJugadorId) {
        setOfertasEntrantes(prev => [...prev, data]);
      }
    }

    function handleNegociacionRespondida(data) {
      setOfertasEntrantes(prev => prev.filter(o => o.negociacion_id !== data.negociacion_id));
      if (data.estado === 'aceptada') {
        const miJugadorId = Number(localStorage.getItem('currentJugadorId'));
        if (data.origen_id === miJugadorId || data.destino_id === miJugadorId) {
          fetchCartas(miJugadorId);
        }
      }
    }

    socket.on('partida:actualizada', handleActualizada);
    socket.on('negociacion:nueva', handleNegociacionNueva);
    socket.on('negociacion:respondida', handleNegociacionRespondida);

    return () => {
      socket.off('partida:actualizada', handleActualizada);
      socket.off('negociacion:nueva', handleNegociacionNueva);
      socket.off('negociacion:respondida', handleNegociacionRespondida);
      socket.emit('partida:salir', { partidaId: id });
    };
  }, [id, reconcileJugador, fetchCartas]);

  async function animarMovimiento(jugadorId, desde, hasta) {
    animacionActiva.current = true;
    const paso = hasta >= desde ? 1 : -1;
    for (let pos = desde + paso; paso > 0 ? pos <= hasta : pos >= hasta; pos += paso) {
      if (!animacionActiva.current) break;
      setPosicionesAnimadas(prev => ({ ...prev, [jugadorId]: pos }));
      await new Promise(resolve => setTimeout(resolve, 110));
    }
    setPosicionesAnimadas(prev => {
      const next = { ...prev };
      delete next[jugadorId];
      return next;
    });
    animacionActiva.current = false;
  }

  async function handleTirar() {
    setMessage('');
    setDadoDisplay(null);
    if (partida?.estado !== 'en_juego') { setMessage('La partida no está en curso'); return; }
    const jugadorId = jugador?.jugador_id;
    const casillaAnterior = jugador?.casilla_actual ?? 1;
    if (!jugadorId) { setMessage('No se encontró jugador asociado.'); return; }
    setRolando(true);
    try {
      const res = await fetch(`${BASE_URL}/partidas/${id}/tirar-dado`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ jugadorId }),
      });
      const body = await res.json().catch(() => ({}));
      setRolando(false);
      if (!res.ok) { setMessage(body.error || 'Error al tirar dado'); return; }

      if (body.dado) setDadoDisplay(body.dado);
      setNegociacionesUsadas(0);

      // Animación de turno perdido por monstruo (no hay movimiento)
      if (body.dado === null) {
        setLastRoll(body);
        setMessage(body.evento || 'Turno perdido.');
        if (body.siguiente_turno) setTurnoActual({ jugador_id: body.siguiente_turno.jugador_id });
        return;
      }

      setLastRoll(body);
      const casillaNueva = body.jugador_actual?.casilla ?? casillaAnterior;

      if (body.victoria) {
        await animarMovimiento(jugadorId, casillaAnterior, casillaNueva);
        setJugador(prev => ({ ...(prev || {}), casilla_actual: casillaNueva, nivel: body.jugador_actual.nivel, monedas: body.jugador_actual.monedas }));
        setGanador(body.ganador || null);
      } else if (body.decision_requerida) {
        const casillaEspecial = body.decision_requerida.casilla_actual;
        await animarMovimiento(jugadorId, casillaAnterior, casillaEspecial);
        setJugadores(prev => prev.map(j =>
          Number(j.jugador_id) === Number(jugadorId) ? { ...j, casilla_actual: casillaEspecial } : j,
        ));
        setJugador(prev => ({ ...(prev || {}), casilla_actual: casillaEspecial }));
        setFaseDecision('evento');
        setTimeout(() => setDecisionPendiente({ ...body.decision_requerida, jugadorId }), 300);
      } else {
        await animarMovimiento(jugadorId, casillaAnterior, casillaNueva);
        setJugador(prev => ({ ...(prev || {}), casilla_actual: casillaNueva, nivel: body.jugador_actual?.nivel ?? prev?.nivel, monedas: body.jugador_actual?.monedas ?? prev?.monedas }));
        if (body.siguiente_turno) setTurnoActual({ jugador_id: body.siguiente_turno.jugador_id });
        if (body.evento) setMessage(body.evento);
      }

      if (jugadorId) fetchCartas(jugadorId);
    } catch (err) {
      setRolando(false);
      setMessage(err.message || 'Error al tirar dado');
    }
  }

  async function handleResolverCasilla(usarCarta) {
    if (!decisionPendiente) return;
    const { jugadorId, tipo, carta, casilla_actual: casillaEspecial } = decisionPendiente;
    setDecisionPendiente(null);
    setMessage('');
    try {
      const res = await fetch(`${BASE_URL}/partidas/${id}/resolver-casilla`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ jugadorId, usarCarta, participacionCartaId: carta.participacion_id, tipo }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) { setMessage(body.error || 'Error al resolver casilla'); return; }

      if (!usarCarta && body.jugador_actual) {
        await animarMovimiento(jugadorId, casillaEspecial, body.jugador_actual.casilla);
      }

      if (body.jugador_actual) {
        setJugadores(prev => prev.map(j =>
          Number(j.jugador_id) === Number(body.jugador_actual.jugador_id)
            ? { ...j, casilla_actual: body.jugador_actual.casilla }
            : j,
        ));
        setJugador(prev => ({ ...(prev || {}), casilla_actual: body.jugador_actual.casilla, nivel: body.jugador_actual.nivel, monedas: body.jugador_actual.monedas }));
      }
      if (body.siguiente_turno) setTurnoActual({ jugador_id: body.siguiente_turno.jugador_id });
      if (body.evento) setMessage(body.evento);
      if (jugadorId) fetchCartas(jugadorId);
    } catch (err) {
      setMessage(err.message || 'Error al resolver casilla');
    }
  }

  async function handleAceptarOferta(negociacionId) {
    const jugadorId = jugador?.jugador_id;
    if (!jugadorId) return;
    try {
      const res = await fetch(`${BASE_URL}/partidas/${id}/negociaciones/${negociacionId}/aceptar`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ jugadorId }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) { setMessage(body.error || 'No se pudo aceptar'); return; }
      setMessage(body.mensaje || 'Oferta aceptada');
      setOfertasEntrantes(prev => prev.filter(o => o.negociacion_id !== negociacionId));
      fetchCartas(jugadorId);
    } catch (err) {
      setMessage(err.message || 'Error al aceptar oferta');
    }
  }

  async function handleRechazarOferta(negociacionId) {
    const jugadorId = jugador?.jugador_id;
    if (!jugadorId) return;
    try {
      const res = await fetch(`${BASE_URL}/partidas/${id}/negociaciones/${negociacionId}/rechazar`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ jugadorId }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) { setMessage(body.error || 'No se pudo rechazar'); return; }
      setOfertasEntrantes(prev => prev.filter(o => o.negociacion_id !== negociacionId));
    } catch (err) {
      setMessage(err.message || 'Error al rechazar oferta');
    }
  }

  async function handleIniciar() {
    setMessage('');
    const usuarioId = Number(getUserIdFromToken());
    if (!usuarioId) { setMessage('Usuario no identificado.'); return; }
    try {
      const res = await fetch(`${BASE_URL}/partidas/${id}/iniciar`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ usuarioId }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) { setMessage(body.error || 'No se pudo iniciar la partida'); return; }
      await fetchEstado();
    } catch (err) {
      setMessage(err.message || 'Error al iniciar partida');
    }
  }

  async function handleUsarCarta(participacionCartaId, tipo) {
    if (usingCard) return;
    setUsingCard(true);
    setMessage('');
    const jugadorId = jugador?.jugador_id;
    if (!jugadorId) { setMessage('No se encontró jugador.'); setUsingCard(false); return; }
    try {
      const res = await fetch(`${BASE_URL}/partidas/${id}/usar-carta`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ jugadorId, participacionCartaId }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) { setMessage(body.error || 'No se pudo usar la carta'); return; }
      if (body.jugador_actual) {
        setJugador(prev => ({
          ...(prev || {}),
          casilla_actual: body.jugador_actual.casilla ?? prev?.casilla_actual,
          nivel: body.jugador_actual.nivel ?? prev?.nivel,
          monedas: body.jugador_actual.monedas ?? prev?.monedas,
        }));
      }
      setMessage(body.mensaje || `Carta ${tipo} usada.`);
      fetchCartas(jugadorId);
    } catch (err) {
      setMessage(err.message || 'Error al usar carta');
    } finally {
      setUsingCard(false);
    }
  }

  async function handleSubirNivel() {
    if (levelingUp) return;
    setLevelingUp(true);
    setMessage('');
    const jugadorId = jugador?.jugador_id;
    if (!jugadorId) { setMessage('No se encontró jugador.'); setLevelingUp(false); return; }
    try {
      const res = await fetch(`${BASE_URL}/partidas/${id}/subir-nivel`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ jugadorId }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) { setMessage(body.error || 'No se pudo subir de nivel'); return; }
      if (body.jugador_actual) {
        setJugador(prev => ({
          ...(prev || {}),
          nivel: body.jugador_actual.nivel ?? prev?.nivel,
          monedas: body.jugador_actual.monedas ?? prev?.monedas,
        }));
        setMessage(`¡Subiste al nivel ${body.jugador_actual.nivel}! 🌟`);
      }
    } catch (err) {
      setMessage(err.message || 'Error al subir nivel');
    } finally {
      setLevelingUp(false);
    }
  }

  const enCurso = partida?.estado === 'en_juego';
  const esCreador = jugador?.es_creador === true;
  const nivelActual = jugador?.nivel || 1;
  const costeSiguienteNivel = LEVEL_COSTS[nivelActual];
  const puedeSubirNivel = enCurso && nivelActual < 3 && (jugador?.monedas ?? 0) >= costeSiguienteNivel;

  const jugadorTurnoId = turnoActual?.jugador_id;
  const esMiTurno = jugadorTurnoId
    ? Number(jugadorTurnoId) === Number(jugador?.jugador_id)
    : true;

  const jugadorEnTurno = jugadorTurnoId
    ? jugadores.find(j => Number(j.jugador_id) === Number(jugadorTurnoId))
    : null;

  return (
    <div className="partida-layout">
      <div className="partida-main">
        <aside className="partida-sidebar">
          <p className="sidebar-title">Partida #{id}</p>
          {loading && <p className="waiting-msg">Cargando...</p>}
          {message && <div className="partida-message">{message}</div>}

          <p className="sidebar-title">Jugadores</p>
          <ul className="players-list">
            {jugadores.map((p, i) => (
              <li
                key={p.jugador_id || p.usuario_id}
                className={`player-item ${Number(p.jugador_id) === Number(jugadorTurnoId) ? 'player-item--turno' : ''}`}
              >
                <span className={`player-dot player-color-${i % 4}`} />
                <span>{p.nombre}</span>
                {Number(p.jugador_id) === Number(jugadorTurnoId) && (
                  <span className="turno-badge">🎲</span>
                )}
              </li>
            ))}
          </ul>

          {partida?.estado === 'en_espera' && (
            <p className="waiting-msg">Esperando jugadores...</p>
          )}

          {enCurso && jugadorEnTurno && (
            <p className="turno-info">
              Turno de <strong>{jugadorEnTurno.nombre}</strong>
            </p>
          )}

          {jugador && (
            <div className="sidebar-stats">
              <p className="waiting-msg">Casilla: {jugador.casilla_actual}</p>
              <p className="waiting-msg">Monedas: 💰 {jugador.monedas}</p>
              <p className="waiting-msg">Nivel: {'⭐'.repeat(nivelActual)}</p>
              {puedeSubirNivel && (
                <button
                  className="levelup-btn"
                  onClick={handleSubirNivel}
                  disabled={levelingUp}
                >
                  {levelingUp ? 'Subiendo...' : `Subir a Nv.${nivelActual + 1} ($${costeSiguienteNivel})`}
                </button>
              )}
            </div>
          )}

          {lastRoll && (
            <div className="roll-result">
              <p>Dado: {lastRoll.dado}</p>
              {lastRoll.movimiento && (
                <p>{lastRoll.movimiento.casilla_anterior} → {lastRoll.movimiento.casilla_nueva}</p>
              )}
            </div>
          )}

          {ofertasEntrantes.length > 0 && (
            <div className="ofertas-entrantes">
              <p className="ofertas-title">Ofertas recibidas</p>
              {ofertasEntrantes.map(oferta => (
                <div key={oferta.negociacion_id} className="oferta-item">
                  <p className="oferta-de">{oferta.origen?.nombre} te ofrece</p>
                  <p className="oferta-carta">
                    {oferta.carta?.tipo} por 💰 {oferta.monto_ofrecido}
                  </p>
                  <div className="oferta-acciones">
                    <button className="oferta-aceptar" onClick={() => handleAceptarOferta(oferta.negociacion_id)}>
                      Aceptar
                    </button>
                    <button className="oferta-rechazar" onClick={() => handleRechazarOferta(oferta.negociacion_id)}>
                      Rechazar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </aside>

        <div className="partida-board-area">
          <Board jugadores={jugadores} posicionesAnimadas={posicionesAnimadas} dificultad={partida?.dificultad ?? 'medio'} />
        </div>
      </div>

      <div className="partida-bottom">
        <div className="bottom-cards">
          {cartas.length === 0 ? (
            [0, 1, 2].map(i => <div key={i} className="card-placeholder" />)
          ) : (
            cartas.map(carta => (
              <button
                key={carta.participacion_id}
                className="card-item"
                title={carta.descripcion || carta.tipo}
                onClick={() => handleUsarCarta(carta.participacion_id, carta.tipo)}
                disabled={usingCard}
              >
                <span className="card-icon">{CARD_ICONS[carta.tipo] || '🃏'}</span>
                <span className="card-label">{cardLabel(carta)}</span>
              </button>
            ))
          )}
        </div>

        <div className="bottom-coins">
          💰 {jugador?.monedas ?? 0} monedas
        </div>

        {jugador ? (
          enCurso ? (
            <div className="bottom-actions">
              {esMiTurno && negociacionesUsadas < 2 && (
                <button
                  className="negociar-btn"
                  onClick={() => setMostrarNegociacion(true)}
                >
                  🤝 Negociar ({2 - negociacionesUsadas})
                </button>
              )}
              <button
                className={`dice-btn${rolando ? ' dice-btn--rolando' : ''}`}
                onClick={handleTirar}
                disabled={!esMiTurno || rolando}
                title={!esMiTurno ? 'No es tu turno' : ''}
              >
                {rolando
                  ? <span className="dado-rolling">🎲</span>
                  : dadoDisplay && esMiTurno === false
                    ? <><span style={{fontSize:'1.4rem'}}>{['⚀','⚁','⚂','⚃','⚄','⚅'][dadoDisplay-1]}</span><br/>{dadoDisplay}</>
                    : esMiTurno ? <>Es hora<br />de lanzar</> : <>Esperando<br />turno</>
                }
              </button>
            </div>
          ) : esCreador ? (
            <button className="start-btn" onClick={handleIniciar}>
              Iniciar partida
            </button>
          ) : (
            <div className="waiting-start">
              Esperando inicio
            </div>
          )
        ) : (
          !loading && <p className="partida-not-found">No estás en esta partida.</p>
        )}
      </div>

      {decisionPendiente && faseDecision === 'evento' && (
        <div className="decision-panel">
          <div className="decision-panel-inner">
            <div className="decision-panel-left">
              <span className="decision-panel-emoji">
                {decisionPendiente.tipo === 'viento' ? '💨' : '🌊'}
              </span>
              <div>
                <p className="decision-panel-titulo">
                  {decisionPendiente.tipo === 'viento' ? '¡Casilla de viento!' : '¡Casilla de río!'}
                </p>
                <p className="decision-panel-subtitulo">
                  Avanzaste a la casilla{' '}
                  <strong>{decisionPendiente.casilla_actual}</strong>
                  {' '}→{' '}
                  {decisionPendiente.tipo === 'viento' ? 'te empujará' : 'te arrastrará'} a la{' '}
                  <strong>{decisionPendiente.casilla_destino}</strong>
                </p>
              </div>
            </div>
            <button className="decision-panel-btn" onClick={() => setFaseDecision('decision')}>
              ¿Qué haces?
            </button>
          </div>
        </div>
      )}

      {decisionPendiente && faseDecision === 'decision' && (
        <div className="decision-overlay">
          <div className="decision-modal">
            <div className="decision-emoji-grande">
              {decisionPendiente.tipo === 'viento' ? '💨' : '🌊'}
            </div>
            <h2 className="decision-titulo-grande">
              {decisionPendiente.tipo === 'viento' ? '¡Viento!' : '¡Río!'}
            </h2>
            <div className="decision-flecha-bloque">
              <div className="decision-casilla-box">
                <span className="decision-casilla-label">Estás aquí</span>
                <span className="decision-casilla-num">{decisionPendiente.casilla_actual}</span>
              </div>
              <span className="decision-flecha">→</span>
              <div className="decision-casilla-box decision-casilla-box--destino">
                <span className="decision-casilla-label">
                  {decisionPendiente.tipo === 'viento' ? 'Te empuja a' : 'Te arrastra a'}
                </span>
                <span className="decision-casilla-num">{decisionPendiente.casilla_destino}</span>
              </div>
            </div>
            <div className="decision-carta-aviso">
              <span className="decision-carta-icon">{CARD_ICONS[decisionPendiente.carta.tipo]}</span>
              <span>Tienes una carta <strong>{decisionPendiente.carta.tipo}</strong> que puede protegerte</span>
            </div>
            <p className="decision-texto-decision">
              Si usas la carta te quedas en la{' '}
              <strong>{decisionPendiente.casilla_actual}</strong>. Si no,{' '}
              {decisionPendiente.tipo === 'viento' ? 'el viento te empuja' : 'el río te arrastra'} a la{' '}
              <strong>{decisionPendiente.casilla_destino}</strong>.
            </p>
            <div className="decision-acciones">
              <button
                className="decision-btn decision-btn--usar"
                onClick={() => handleResolverCasilla(true)}
              >
                {CARD_ICONS[decisionPendiente.carta.tipo]} Usar {decisionPendiente.carta.tipo}
              </button>
              <button
                className="decision-btn decision-btn--no"
                onClick={() => handleResolverCasilla(false)}
              >
                Continuar sin carta
              </button>
            </div>
          </div>
        </div>
      )}

      {mostrarNegociacion && jugador && (
        <Negociacion
          partidaId={id}
          jugadorId={jugador.jugador_id}
          onClose={() => setMostrarNegociacion(false)}
          negociacionesUsadas={negociacionesUsadas}
          onNegociacionEnviada={() => {
            setNegociacionesUsadas(prev => prev + 1);
            setMostrarNegociacion(false);
          }}
        />
      )}

      {ganador && (
        <div className="victoria-overlay">
          <div className="victoria-modal">
            <div className="victoria-trophy">🏆</div>
            <h2 className="victoria-titulo">¡Partida finalizada!</h2>
            <p className="victoria-ganador">{ganador.nombre} ha ganado</p>
            {Number(ganador.jugador_id) === Number(jugador?.jugador_id) ? (
              <p className="victoria-yo">¡Eres el ganador! 🎉</p>
            ) : (
              <p className="victoria-derrota">Mejor suerte la próxima vez</p>
            )}
            <button className="victoria-btn" onClick={() => navigate('/lobby')}>
              Volver al lobby
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
