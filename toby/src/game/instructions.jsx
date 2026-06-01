//import React, { useState, useEffect } from 'react'
import './instructions.css'
import { useState, useEffect } from 'react'

function Instructions() {
  const [secondsReading, setSecondsReading] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setSecondsReading(s => s + 1), 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="instructions-root">
    <div className="instructions-container">
      <h1>Instrucciones — Entre ríos y vientos</h1>
      <p className="reading-time">Has leído estas instrucciones {secondsReading} segundos :O.</p>

      <section>
        <h2>Objetivo del juego</h2>
        <p>
          Sé el primero en llegar a la casilla número 100 del tablero. Lanza los dados, negocia
          con otros jugadores y supera los obstáculos del camino. No es necesario llegar exactamente
          a la casilla 100: si el dado te da más pasos de los que necesitas, igualmente ganas.
        </p>
      </section>

      <section>
        <h2>Jugadores</h2>
        <p>Pueden jugar entre 2 y 4 personas por partida.</p>
      </section>

      <section>
        <h2>Inicio de la partida</h2>
        <ul>
          <li>Todos los jugadores comienzan en la casilla 1.</li>
          <li>El juego elige al azar quién empieza.</li>
          <li>
            Después de unirte, si no hay cuatro jugadores la partida espera hasta 3 minutos. Si al
            menos hay 2 jugadores pasado ese tiempo, la partida comienza.
          </li>
          <li>El creador de la partida puede elegir si es pública o privada.</li>
        </ul>
      </section>

      <section>
        <h2>Turno de juego</h2>
        <p>En cada turno puedes hacer lo siguiente en este orden:</p>
        <ol>
          <li>
            <strong>Negociar</strong> (opcional, máximo 2 veces por turno): ofrece monedas a otro
            jugador para obtener una de sus cartas.
          </li>
          <li>
            <strong>Subir de nivel</strong> (opcional, solo antes de lanzar): cuesta $20 para pasar
            al nivel 2 y $30 adicionales para el nivel 3.
          </li>
          <li>
            <strong>Tirar los dados</strong>: el juego lanza el dado automáticamente y mueve tu
            personaje el número de casillas indicado.
          </li>
        </ol>
        <p>
          Tienes <strong>10 segundos</strong> para decidir tu acción al inicio del turno. Si no
          decides a tiempo, el dado se lanza automáticamente.
        </p>
      </section>

      <section>
        <h2>Tipos de casillas</h2>
        <ul>
          <li>
            <strong>Normal:</strong> no pasa nada especial.
          </li>
          <li>
            <strong>Río:</strong> te arrastra hacia abajo (retrocedes) a menos que tengas la carta
            salvavidas. Si usas el salvavidas, la carta vuelve a la baraja.
          </li>
          <li>
            <strong>Viento:</strong> te empuja hacia arriba (avanzas) a menos que tengas el paraguas.
            Si usas el paraguas, la carta vuelve a la baraja.
          </li>
          <li>
            <strong>Monstruo:</strong> pierdes un turno a menos que tengas la carta espada. Si usas
            la espada, la carta vuelve a la baraja.
          </li>
          <li>
            <strong>Sorpresa:</strong> recibes una carta al azar de la baraja (salvavidas, paraguas,
            espada, avanza X casillas o retrocede X casillas).
          </li>
          <li>
            <strong>Con monedas:</strong> al pasar por ella, el juego te asigna las monedas
            automáticamente. Las monedas reaparecen cada cierto tiempo.
          </li>
          <li>
            <strong>Casilla final (100):</strong> nunca tiene elemento sorpresa. El primero en llegar
            gana.
          </li>
        </ul>
      </section>

      <section>
        <h2>Monedas</h2>
        <ul>
          <li>Se recogen al pasar por casillas con monedas.</li>
          <li>Se usan para negociar cartas, apostar cuando dos jugadores coinciden en una casilla y subir de nivel.</li>
          <li>Nunca puedes quedar con monedas negativas.</li>
        </ul>
      </section>

      <section>
        <h2>Cartas</h2>
        <ul>
          <li>
            <strong>Salvavidas:</strong> evita que el río te arrastre.
          </li>
          <li>
            <strong>Paraguas:</strong> evita que el viento te empuje.
          </li>
          <li>
            <strong>Espada:</strong> derrota al monstruo y te permite seguir avanzando.
          </li>
          <li>
            <strong>Avanza X casillas / Retrocede X casillas:</strong> te mueve automáticamente.
          </li>
        </ul>
        <p>Cada vez que usas una carta, la pierdes y vuelve a la baraja de la partida.</p>
      </section>

      <section>
        <h2>Negociación</h2>
        <ol>
          <li>Elige qué carta quieres y cuántas monedas ofreces.</li>
          <li>Los demás jugadores ven tu oferta en su pantalla.</li>
          <li>El jugador que tiene la carta puede aceptar o ignorar la oferta.</li>
          <li>Si acepta, la carta y las monedas se transfieren automáticamente.</li>
          <li>Puedes negociar un máximo de 2 veces por turno.</li>
        </ol>
      </section>

      <section>
        <h2>Dos jugadores en la misma casilla</h2>
        <p>
          Cuando caes en una casilla ocupada por otro jugador, ambos deben apostar monedas. El que
          apueste menos retrocede 4 casillas. En caso de empate, ambos se quedan en la casilla.
        </p>
        <p>
          <strong>Excepción:</strong> si llegaste al nivel 3, nadie puede hacerte retroceder. En
          cambio, retrocede el jugador que estaba en la casilla (2 casillas). Si ambos son nivel 3,
          se quedan juntos.
        </p>
      </section>

      <section>
        <h2>Niveles</h2>
        <ul>
          <li>Todos empiezan en nivel 1.</li>
          <li>Subir al nivel 2 cuesta $20.</li>
          <li>Subir al nivel 3 cuesta $30 adicionales ($50 en total desde nivel 1).</li>
          <li>Solo puedes subir de nivel antes de lanzar el dado en tu turno.</li>
          <li>El nivel se reinicia al comenzar cada nueva partida.</li>
        </ul>
      </section>

      <section>
        <h2>Fin de la partida</h2>
        <ul>
          <li>Gana el primer jugador en llegar a la casilla 100.</li>
          <li>
            Si todos los jugadores excepto uno abandonan, ese jugador es declarado ganador
            automáticamente.
          </li>
          <li>Al terminar, todos regresan a la página de inicio.</li>
        </ul>
      </section>

      <section>
        <h2>Otras reglas</h2>
        <ul>
          <li>Puedes salir de la partida en cualquier momento usando el botón de salida.</li>
          <li>
            La partida continúa mientras haya al menos 2 jugadores activos. Si quedan menos de 2,
            termina.
          </li>
          <li>
            Solo el creador de la partida puede pausarla, por un máximo de 3 minutos.
          </li>
          <li>
            Si un jugador abandona, sus turnos se eliminan y los demás continúan jugando.
          </li>
        </ul>
      </section>
    </div>
    </div>
  );
}

export default Instructions;
