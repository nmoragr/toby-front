import './Board.css';
import monstruoImg from '../assets/monstruo.png';

const CONFIGS = {
  facil: {
    viento:   { 5: 18, 12: 24, 22: 37, 38: 53, 47: 61, 56: 69, 64: 78, 74: 88 },
    rio:      { 35: 22, 72: 55 },
    monstruo: new Set([]),
    sorpresa:  new Set([3, 8, 11, 14, 17, 20, 25, 28, 31, 40, 44, 49, 51, 57, 63, 67, 71, 76, 80, 84, 87, 91, 94, 97, 99]),
  },
  medio: {
    viento:   { 6: 22, 33: 48, 45: 72, 68: 85, 76: 92 },
    rio:      { 13: 3, 26: 10, 37: 15, 58: 44, 80: 65, 90: 70 },
    monstruo: new Set([25, 75]),
    sorpresa:  new Set([4, 9, 17, 20, 28, 31, 40, 51, 54, 62, 63, 64, 71, 78, 84, 87, 91, 93, 95, 99]),
  },
  dificil: {
    viento:   { 15: 24, 62: 73 },
    rio:      { 8: 2, 18: 5, 30: 12, 42: 23, 55: 35, 67: 49, 77: 58, 86: 65, 94: 80 },
    monstruo: new Set([20, 45, 70, 88]),
    sorpresa:  new Set([6, 11, 25, 33, 51, 63, 75, 83, 90, 95, 98, 99]),
  },
};

const CELL = 52;
const BOARD_PX = CELL * 10;

function getCellInfo(num, config) {
  if (config.viento[num]   !== undefined) return { label: `💨→${config.viento[num]}`, type: 'viento' };
  if (config.rio[num]      !== undefined) return { label: `🌊→${config.rio[num]}`, type: 'rio' };
  if (config.monstruo.has(num))           return { label: '👾', type: 'monstruo' };
  if (config.sorpresa.has(num))           return { label: '⭐', type: 'sorpresa' };
  return { label: null, type: null };
}

function cellCenter(num) {
  const actualRow = Math.floor((num - 1) / 10);
  const col = (num - 1) % 10;
  const displayRow = 9 - actualRow;
  return { x: col * CELL + CELL / 2, y: displayRow * CELL + CELL / 2 };
}

function riverPath(from, to, curl = 0.45) {
  const s = cellCenter(from);
  const e = cellCenter(to);
  const dx = e.x - s.x;
  const dy = e.y - s.y;
  // Dos puntos de control en lados opuestos → curva en S sinuosa
  const cp1x = s.x + dx * 0.25 + dy * curl;
  const cp1y = s.y + dy * 0.25 - dx * curl;
  const cp2x = s.x + dx * 0.75 - dy * curl;
  const cp2y = s.y + dy * 0.75 + dx * curl;
  return `M ${s.x} ${s.y} C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${e.x} ${e.y}`;
}

function spiralPath(from, to) {
  const s = cellCenter(from);
  const e = cellCenter(to);
  const dx = e.x - s.x;
  const dy = e.y - s.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  const nx = -dy / len;
  const ny =  dx / len;
  const amp = Math.min(len * 0.22, 36);
  const segs = 6;  // 3 oscilaciones completas

  let d = `M ${s.x} ${s.y}`;
  for (let i = 0; i < segs; i++) {
    const t1   = (i + 1) / segs;
    const tmid = (i + 0.5) / segs;
    const side = i % 2 === 0 ? 1 : -1;
    const cx = s.x + dx * tmid + nx * amp * side;
    const cy = s.y + dy * tmid + ny * amp * side;
    d += ` Q ${cx} ${cy} ${s.x + dx * t1} ${s.y + dy * t1}`;
  }
  return d;
}

function BoardOverlay({ config }) {
  return (
    <svg
      className="board-overlay"
      width={BOARD_PX}
      height={BOARD_PX}
      style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
    >
      <defs>
        <linearGradient id="grad-rio" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="#1e3a8a" />
          <stop offset="40%"  stopColor="#3b82f6" />
          <stop offset="60%"  stopColor="#60a5fa" />
          <stop offset="100%" stopColor="#1e3a8a" />
        </linearGradient>

        <filter id="wave-filter" x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="0.04 0.07" numOctaves="3" seed="5" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="4" xChannelSelector="R" yChannelSelector="G" />
        </filter>

        <marker id="arr-rio" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
          <polygon points="0 0, 8 3, 0 6" fill="#1e40af" />
        </marker>

        <marker id="arr-viento" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
          <polygon points="0 0, 8 3, 0 6" fill="#4b5563" />
        </marker>
      </defs>

      {/* ── Ríos ── */}
      {Object.entries(config.rio).map(([from, to]) => {
        const d = riverPath(Number(from), Number(to));
        const s = cellCenter(Number(from));
        const e = cellCenter(Number(to));
        return (
          <g key={`rio-${from}`}>
            {/* Orilla oscura exterior */}
            <path d={d} stroke="#1e3a8a" strokeWidth="20" fill="none" strokeLinecap="round" opacity="0.7" />
            {/* Cuerpo del agua */}
            <path d={d} stroke="#3b82f6" strokeWidth="14" fill="none" strokeLinecap="round" opacity="0.85" filter="url(#wave-filter)" />
            {/* Centro más claro */}
            <path d={d} stroke="#93c5fd" strokeWidth="7" fill="none" strokeLinecap="round" opacity="0.7" filter="url(#wave-filter)" />
            {/* Brillo/reflejo animado */}
            <path d={d} stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round"
              strokeDasharray="10 18" opacity="0.55"
              className="river-flow"
            />
            {/* Flecha destino */}
            <path d={d} stroke="none" strokeWidth="1" fill="none" markerEnd="url(#arr-rio)"
              style={{ stroke: 'transparent' }}
            />
            {/* Círculo origen */}
            <circle cx={s.x} cy={s.y} r="9" fill="#1e40af" opacity="0.9" stroke="white" strokeWidth="2" />
            {/* Círculo destino */}
            <circle cx={e.x} cy={e.y} r="9" fill="#1e40af" opacity="0.9" stroke="white" strokeWidth="2" />
            {/* Flecha real sobre cuerpo */}
            <path d={d} stroke="#1e40af" strokeWidth="1" fill="none" markerEnd="url(#arr-rio)" opacity="0" />
            <path d={`M ${e.x - 1} ${e.y - 1} L ${e.x} ${e.y}`} stroke="#1e40af" strokeWidth="1" fill="none" markerEnd="url(#arr-rio)" />
          </g>
        );
      })}

      {/* ── Viento ── */}
      {Object.entries(config.viento).map(([from, to]) => {
        const d = spiralPath(Number(from), Number(to));
        const s = cellCenter(Number(from));
        const e = cellCenter(Number(to));
        return (
          <g key={`viento-${from}`}>
            {/* Sombra exterior */}
            <path d={d} stroke="#1f2937" strokeWidth="7" fill="none" strokeLinecap="round" opacity="0.35" />
            {/* Cuerpo gris */}
            <path d={d} stroke="#9ca3af" strokeWidth="4.5" fill="none" strokeLinecap="round"
              strokeDasharray="10 5" opacity="0.95" className="wind-flow"
            />
            {/* Brillo blanco que fluye más rápido */}
            <path d={d} stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round"
              strokeDasharray="3 12" opacity="0.55" className="wind-flow-fast"
            />
            {/* Origen */}
            <circle cx={s.x} cy={s.y} r="7" fill="#6b7280" opacity="0.95" stroke="white" strokeWidth="2" />
            {/* Destino */}
            <circle cx={e.x} cy={e.y} r="7" fill="#6b7280" opacity="0.95" stroke="white" strokeWidth="2" />
            <path d={`M ${e.x - 1} ${e.y - 1} L ${e.x} ${e.y}`} stroke="#4b5563" strokeWidth="1" fill="none" markerEnd="url(#arr-viento)" />
          </g>
        );
      })}
    </svg>
  );
}

export default function Board({ jugadores = [], posicionesAnimadas = {}, dificultad = 'medio' }) {
  const config = CONFIGS[dificultad] ?? CONFIGS.medio;

  const rows = [];
  for (let displayRow = 0; displayRow < 10; displayRow++) {
    const actualRow = 9 - displayRow;
    const cells = [];
    for (let col = 0; col < 10; col++) {
      cells.push({ num: actualRow * 10 + col + 1, displayRow, col });
    }
    rows.push(cells);
  }

  const playersByCell = {};
  jugadores.forEach((j, i) => {
    const casilla = posicionesAnimadas[j.jugador_id] ?? j.casilla_actual ?? 1;
    const animando = j.jugador_id in posicionesAnimadas;
    if (!playersByCell[casilla]) playersByCell[casilla] = [];
    playersByCell[casilla].push({ ...j, colorIndex: i, animando });
  });

  return (
    <div className={`board-wrapper board-theme-${dificultad}`}>
      <div style={{ position: 'relative', display: 'inline-block' }}>
        <div className="board">
          {rows.map((cells) =>
            cells.map(({ num, displayRow, col }) => {
              const { label, type } = getCellInfo(num, config);
              const chessColor = (displayRow + col) % 2 === 0 ? 'green' : 'purple';
              const playersHere = playersByCell[num] || [];
              const hayAnimando = playersHere.some(p => p.animando);

              return (
                <div
                  key={num}
                  className={`cell ${chessColor}${hayAnimando ? ' cell--paso' : ''}`}
                >
                  <span className="cell-number">{num}</span>
                  {playersHere.length > 0 && (
                    <div className="cell-players">
                      {playersHere.map((p, idx) => (
                        <div
                          key={idx}
                          className={`player-token player-color-${p.colorIndex % 4}${p.animando ? ' player-token--animando' : ''}`}
                          title={p.nombre}
                        >
                          <svg viewBox="0 0 10 13" width="11" height="11" fill="white">
                            <circle cx="5" cy="3.5" r="2.6" />
                            <path d="M1 13 C1 7.5 9 7.5 9 13 Z" />
                          </svg>
                        </div>
                      ))}
                    </div>
                  )}
                  {type === 'monstruo'
                    ? <img src={monstruoImg} className="cell-monster-icon" alt="monstruo" />
                    : label && <span className="cell-label">{label}</span>
                  }
                </div>
              );
            }),
          )}
        </div>
        <BoardOverlay config={config} />
      </div>
    </div>
  );
}
