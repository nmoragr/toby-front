import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './lobby.css'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

function getToken() {
  return localStorage.getItem('token')
}

function getAuthHeaders() {
  const token = getToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

function getUserIdFromToken() {
  const token = getToken()
  if (!token) return null

  try {
    const payload = JSON.parse(atob(token.split('.')[1] || ''))
    return payload.sub || payload.userId || null
  } catch {
    return null
  }
}

function getUsuarioId() {
  return Number(localStorage.getItem('userId') || getUserIdFromToken())
}

function getPartidaId(partida) {
  return partida.id || partida.partida_id || partida.partidaId
}

function getJugadorId(jugador) {
  return jugador?.jugador_id || jugador?.jugadorId || jugador?.id
}

export default function Lobby() {
  const [partidas, setPartidas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  async function fetchPartidas() {
    setLoading(true)
    setError('')

    try {
      const res = await fetch(`${BASE_URL}/partidas/en-espera`, {
        headers: getAuthHeaders()
      })
      const body = await res.json().catch(() => [])

      if (!res.ok) {
        setError(body.error || 'Error al cargar partidas')
        return
      }

      setPartidas(Array.isArray(body) ? body : [])
    } catch (err) {
      setError(err.message || 'Error al cargar partidas')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchPartidas()
  }, [])

  async function handleUnirse(partidaId) {
    setError('')
    const usuarioId = getUsuarioId()

    if (!usuarioId) {
      setError('Usuario no identificado. Inicia sesion.')
      return
    }

    try {
      const res = await fetch(`${BASE_URL}/partidas/${partidaId}/unirse`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({ usuarioId })
      })
      const body = await res.json().catch(() => ({}))

      if (!res.ok) {
        setError(body.error || 'No se pudo unir a la partida')
        return
      }

      const jugadorId = getJugadorId(body.jugador)
      if (jugadorId) {
        localStorage.setItem('currentJugadorId', String(jugadorId))
      }
      localStorage.setItem('currentPartidaId', String(partidaId))

      navigate(`/partida/${partidaId}`)
    } catch (err) {
      setError(err.message || 'Error al unirse')
    }
  }

  async function handleCrearPartida() {
    setError('')
    const usuarioId = getUsuarioId()

    if (!usuarioId) {
      setError('Usuario no identificado. Inicia sesion.')
      return
    }

    try {
      const res = await fetch(`${BASE_URL}/partidas/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({ usuarioId, tipo: 'publica' })
      })
      const body = await res.json().catch(() => ({}))

      if (!res.ok) {
        setError(body.error || 'No se pudo crear la partida')
        return
      }

      await fetchPartidas()

      const nuevaPartidaId = getPartidaId(body.partida || {})
      if (nuevaPartidaId) {
        localStorage.setItem('currentPartidaId', String(nuevaPartidaId))
        navigate(`/partida/${nuevaPartidaId}`)
      }
    } catch (err) {
      setError(err.message || 'Error al crear partida')
    }
  }

  const jugadoresTexto = (n) => {
    if (n === 1) return 'Un jugador en línea'
    if (n === 2) return 'Dos jugadores en línea'
    if (n === 3) return 'Tres jugadores en línea'
    return `${n} jugadores en línea`
  }

  return (
    <section className="lobby-root">
      <header className="lobby-header">
        <h2>Lobby - Partidas en espera</h2>
        <button className="create-button" onClick={handleCrearPartida}>Crear partida</button>
      </header>

      {loading && <p>Cargando partidas...</p>}
      {error && <div className="lobby-error" role="alert">{error}</div>}
      {!loading && partidas.length === 0 && <p>No hay partidas en espera.</p>}

      <ul className="partida-list">
        {partidas.map((partida) => {
          const partidaId = getPartidaId(partida)

          return (
            <li key={partidaId} className="partida-item">
              <div className="partida-info">
                <strong>Partida #{partidaId}</strong>
                <span>Tipo: {partida.tipo || '-'}</span>
                <span>Estado: {partida.estado}</span>
              </div>
              <div className="partida-actions">
                <button onClick={() => handleUnirse(partidaId)}>Unirse</button>
              </div>
            </li>
          )
        })}
      </ul>
      <h2 className="lobby-title">¡Es hora de unirte a una partida!</h2>
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
  )
}
