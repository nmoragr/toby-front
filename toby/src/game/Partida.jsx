import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getSocket, connectSocket } from '../common/socket'
import Board from './Board'
import './partida.css'


const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

function getUserIdFromToken() {
  const t = localStorage.getItem('token')
  if (!t) return null
  try {
    const payload = JSON.parse(atob(t.split('.')[1]))
    return payload.sub || payload.userId || null
  } catch {
    return null
  }
}

export default function Partida(){
  const { id } = useParams()
  const [partida, setPartida] = useState(null)
  const [jugadores, setJugadores] = useState([])
  const [jugador, setJugador] = useState(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [lastRoll, setLastRoll] = useState(null)
  //const [polling, setPolling] = useState(false)
  const [turnoActual, setTurnoActual] = useState(null)

  function handleActualizada(payload = {}){
    try{
      if (payload.partida) setPartida(payload.partida)
      if (payload.jugadores) setJugadores(payload.jugadores)
      if (payload.turno_actual) setTurnoActual(payload.turno_actual)
      const userSub = Number(getUserIdFromToken())
      const currentStored = Number(localStorage.getItem('currentJugadorId'))
      const found = (payload.jugadores || jugadores || []).find(j => Number(j.usuario_id) === userSub || Number(j.jugador_id) === currentStored)
      setJugador(found || null)
      if (found && found.jugador_id) localStorage.setItem('currentJugadorId', String(found.jugador_id))
    }catch { /* ignore */ }
  }

  useEffect(() => {
    async function fetchEstado(){
      setLoading(true)
      try{
        const token = localStorage.getItem('token')
        const res = await fetch(`${BASE_URL}/partidas/${id}/estado`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        setPartida(data.partida || null)
        setJugadores(data.jugadores || [])
        setTurnoActual(data.turno_actual || null)
        const userSub = Number(getUserIdFromToken())
        const currentStored = Number(localStorage.getItem('currentJugadorId'))
        const found = (data.jugadores || []).find(j => Number(j.usuario_id) === userSub || Number(j.jugador_id) === currentStored)
        setJugador(found || null)
        if (found && found.jugador_id) localStorage.setItem('currentJugadorId', String(found.jugador_id))
      } catch(err){
        setMessage(err.message || 'Error al cargar partida')
      } finally{
        setLoading(false)
      }
    }
    fetchEstado()
  }, [id])
  // polling effect: 
  useEffect(() => {
    let timer = null
    if (partida && partida.estado === 'en_espera') {
      //setPolling(true)
      timer = setInterval(() => {
        fetch(`${BASE_URL}/partidas/${id}/estado`, { headers: localStorage.getItem('token') ? { Authorization: `Bearer ${localStorage.getItem('token')}` } : {} })
          .then(r => r.ok ? r.json() : Promise.reject(r.status))
          .then(data => {
            setPartida(data.partida || null)
            setJugadores(data.jugadores || [])
            setTurnoActual(data.turno_actual || null)
            const userSub = Number(getUserIdFromToken())
            const currentStored = Number(localStorage.getItem('currentJugadorId'))
            const found = (data.jugadores || []).find(j => Number(j.usuario_id) === userSub || Number(j.jugador_id) === currentStored)
            setJugador(found || null)
            if (found && found.jugador_id) localStorage.setItem('currentJugadorId', String(found.jugador_id))
          }).catch(() => {})
      }, 2500)
    } else {
      //setPolling(false)
    }

    return () => {
      if (timer) clearInterval(timer)
    }
  }, [id, partida])

  useEffect(() => {
    let s = getSocket()
    if (!s || !s.connected) {
      connectSocket()
      s = getSocket()
    }
    if (!s) return

    s.emit('partida:unirse', { partidaId: id })

    s.on('partida:actualizada', handleActualizada)

    return () => {
      s.off('partida:actualizada', handleActualizada)
      s.emit('partida:salir', { partidaId: id })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  async function handleTirar(){
    setMessage('')
    if (partida && partida.estado !== 'en_juego') { setMessage('La partida no está en curso'); return }
    const jugadorId = Number(localStorage.getItem('currentJugadorId')) || (jugador && jugador.jugador_id)
    if (!jugadorId) { setMessage('No se encontró jugador asociado.'); return }
    // comprobar turno en cliente: sólo permitir si el turnoActual pertenece a este jugador
    if (turnoActual && Number(turnoActual.jugador_id) !== Number(jugadorId)) {
      setMessage('No es tu turno')
      return
    }
    try{
      const token = localStorage.getItem('token')
      const res = await fetch(`${BASE_URL}/partidas/${id}/tirar-dado`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        // enviar tanto jugadorId (PK) como usuarioId para mayor tolerancia en backend
        body: JSON.stringify({ jugadorId, usuarioId: Number(localStorage.getItem('userId') || getUserIdFromToken()) })
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        setMessage(body.error || 'Error al tirar dado')
        return
      }
      // actualizar UI con resultado
      setLastRoll(body)
      if (body.jugador_actual) {
        setJugador(prev => ({ ...(prev||{}), casilla_actual: body.jugador_actual.casilla, nivel: body.jugador_actual.nivel, monedas: body.jugador_actual.monedas }))
      }
      // actualizar turno actual si el backend lo devuelve (fallback si el socket no lo incluye)
      if (body.turno_actual) {
        setTurnoActual(body.turno_actual)
      } else if (body.siguiente_turno) {
        setTurnoActual({ jugador_id: body.siguiente_turno.jugador_id, orden_juego: body.siguiente_turno.orden_juego, numero_turno: body.siguiente_turno.numero_turno })
      }
      if (body.victoria) {
        setMessage(`Has ganado! Felicitaciones ${body.ganador.nombre}`)
      }
    } catch(err){
      setMessage(err.message || 'Error al tirar dado')
    }
  }

  async function handleIniciar(){
    setMessage('')
    const usuarioId = Number(getUserIdFromToken())
    if (!usuarioId) { setMessage('Usuario no identificado.'); return }
    try{
      const token = localStorage.getItem('token')
      const res = await fetch(`${BASE_URL}/partidas/${id}/iniciar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ usuarioId })
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) { setMessage(body.error || 'No se pudo iniciar la partida'); return }
      const st = await fetch(`${BASE_URL}/partidas/${id}/estado`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      if (st.ok) {
        const data = await st.json()
        setPartida(data.partida || null)
        setJugadores(data.jugadores || [])
        const userSub = Number(getUserIdFromToken())
        const currentStored = Number(localStorage.getItem('currentJugadorId'))
        const found = (data.jugadores || []).find(j => Number(j.usuario_id) === userSub || Number(j.jugador_id) === currentStored)
        setJugador(found || null)
      }
    } catch(err){ setMessage(err.message || 'Error al iniciar partida') }
  }

  const enCurso = partida?.estado === 'en_juego'
  const esCreador = jugador?.es_creador === true

  return (
    <section className="partida-root">
      <h2>Partida #{id}</h2>
      {loading && <p>Cargando partida...</p>}
      {message && <div className="partida-message">{message}</div>}

      <section className="players-section">
        <h3>Jugadores</h3>
        <ul className="players-list">
          {jugadores.map(p => (
            <li key={p.jugador_id || p.usuario_id} className="player-item">{p.nombre}</li>
          ))}
        </ul>
      </section>

      {jugador ? (
        <article className="player-box">
          <h3>Tu jugador</h3>
          <p>Casilla: {jugador.casilla_actual}</p>
          <p>Nivel: {jugador.nivel}</p>
          <p>Monedas: {jugador.monedas}</p>
          {partida && partida.estado === 'en_juego' ? (
            (() => {
              const isMyTurn = turnoActual && Number(turnoActual.jugador_id) === Number(jugador.jugador_id)
              return (
                <button onClick={handleTirar} disabled={!isMyTurn}>{isMyTurn ? 'Tirar dado' : 'Esperando tu turno'}</button>
              )
            })()
          ) : (
            partida && partida.estado === 'en_espera' && Number(jugador.orden_juego) === 1 ? (
              <button className="start-button" onClick={handleIniciar}>Iniciar partida</button>
            ) : (
              <button disabled>Esperando inicio</button>
            )
          )}
        </article>
      ) : null}

      <div className="partida-layout">

        {/* fila principal */}
        <div className="partida-main">

          {/* sidebar */}
          <aside className="partida-sidebar">
            <p className="sidebar-title">Partida #{id}</p>
            {loading && <p className="waiting-msg">Cargando...</p>}
            {message && <div className="partida-message">{message}</div>}

            <p className="sidebar-title">Jugadores</p>
            <ul className="players-list">
              {jugadores.map((p, i) => (
                <li key={p.jugador_id || p.usuario_id} className="player-item">
                  <span className={`player-dot player-color-${i % 4}`} />
                  {p.nombre}
                </li>
              ))}
            </ul>

            {partida?.estado === 'en_espera' && (
              <p className="waiting-msg">Esperando jugadores...</p>
            )}

            {jugador && (
              <div>
                <p className="waiting-msg">Casilla: {jugador.casilla_actual}</p>
                <p className="waiting-msg">Monedas: {jugador.monedas}</p>
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
          </aside>

          {/* tablero */}
          <div className="partida-board-area">
            <Board jugadores={jugadores} />
          </div>
        </div>

        {/* barra inferior */}
        <div className="partida-bottom">
          <div className="bottom-cards">
            {[0,1,2].map(i => <div key={i} className="card-placeholder" />)}
          </div>

          <div className="bottom-coins">
            💰 {jugador?.monedas ?? 0} monedas
          </div>

          {jugador ? (
            enCurso ? (
              <button className="dice-btn" onClick={handleTirar}>
                Es hora<br/>de lanzar
              </button>
            ) : esCreador ? (
              <button className="start-btn" onClick={handleIniciar}>
                Iniciar partida
              </button>
            ) : (
              <button className="dice-btn" disabled>
                Esperando<br/>inicio
              </button>
            )
          ) : (
            !loading && <p className="partida-not-found">No estás en esta partida.</p>
          )}
        </div>

      </div>
    </section>
  )
}
