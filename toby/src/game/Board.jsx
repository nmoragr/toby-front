import './Board.css'


const VIENTO = { 6:22, 33:48, 45:72, 68:85, 76:92 }
const RIO    = { 13:3, 26:10, 37:15, 58:44, 80:65, 90:70 }
const MONSTRUO = new Set([25, 75])
const SORPRESA = new Set([4,9,17,20,28,31,40,51,54,62,63,64,71,78,84,87,91,93,95,99])

function getCellInfo(num) {
  if (VIENTO[num])        return { type: 'viento',   label: `💨 → ${VIENTO[num]}` }
  if (RIO[num])           return { type: 'rio',      label: `🌊 → ${RIO[num]}` }
  if (MONSTRUO.has(num)) return { type: 'monstruo', label: '👾 espada' }
  if (SORPRESA.has(num)) return { type: 'sorpresa', label: '⭐' }
  return { type: 'normal', label: null }
}

export default function Board({ jugadores = [] }) {
  // Construir grilla: 10 filas de arriba a abajo
  const rows = []
  for (let displayRow = 0; displayRow < 10; displayRow++) {
    const actualRow = 9 - displayRow
    const cells = []
    for (let col = 0; col < 10; col++) {
      cells.push({ num: actualRow * 10 + col + 1, displayRow, col })
    }
    rows.push(cells)
  }

  // Jugadores agrupados por casilla
  const playersByCell = {}
  jugadores.forEach((j, i) => {
    const casilla = j.casilla_actual || 1
    if (!playersByCell[casilla]) playersByCell[casilla] = []
    playersByCell[casilla].push({ ...j, colorIndex: i })
  })

  return (
    <div className="board-wrapper">
      <div className="board">
        {rows.map((cells) =>
          cells.map(({ num, displayRow, col }) => {
            const { label } = getCellInfo(num)
            const chessColor = (displayRow + col) % 2 === 0 ? 'green' : 'purple'
            const playersHere = playersByCell[num] || []

            return (
              <div key={num} className={`cell ${chessColor}`}>
                <span className="cell-number">{num}</span>
                {playersHere.length > 0 && (
                  <div className="cell-players">
                    {playersHere.map((p, i) => (
                      <div
                        key={i}
                        className={`player-token player-color-${p.colorIndex % 4}`}
                        title={p.nombre}
                      >
                        {p.nombre?.[0]?.toUpperCase()}
                      </div>
                    ))}
                  </div>
                )}
                {label && <span className="cell-label">{label}</span>}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
